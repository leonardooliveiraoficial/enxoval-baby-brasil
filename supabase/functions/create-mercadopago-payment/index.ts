import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  // Security headers
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY", 
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin"
};

interface CreatePaymentRequest {
  purchaser_name: string;
  purchaser_email: string;
  payment_method: 'pix' | 'credit' | 'debit';
  products: Array<{
    id: string;
    quantity: number;
  }>;
  installments?: number; // For credit card
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const { purchaser_name, purchaser_email, payment_method, products, installments }: CreatePaymentRequest = await req.json();

    // Validate required fields
    if (!purchaser_name || !purchaser_email || !payment_method || !products || products.length === 0) {
      throw new Error("Todos os campos são obrigatórios");
    }

    // Get MercadoPago settings using secure function
    const { data: mpConfigResult, error: mpConfigError } = await supabase
      .rpc('get_mercadopago_config_status');

    if (mpConfigError || !mpConfigResult?.has_access_token) {
      throw new Error("Configurações do Mercado Pago não encontradas ou incompletas. Configure no painel administrativo.");
    }

    // For payment processing, we need the actual access token
    // This is a controlled access through service role
    const { data: mpSettings, error: mpError } = await supabase
      .from('mercadopago_settings')
      .select('access_token')
      .eq('id', 1)
      .single();

    if (mpError || !mpSettings?.access_token) {
      throw new Error("Não foi possível acessar as configurações do Mercado Pago.");
    }

    // Get product details and calculate total
    let total_amount_cents = 0;
    const orderItems = [];

    for (const item of products) {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', item.id)
        .eq('is_active', true)
        .single();

      if (productError || !product) {
        throw new Error(`Produto ${item.id} não encontrado ou inativo`);
      }

      // Check availability
      if (product.purchased_qty >= product.target_qty) {
        throw new Error(`O produto "${product.name}" já atingiu a meta de presentes!`);
      }

      const remaining = product.target_qty - product.purchased_qty;
      if (item.quantity > remaining) {
        throw new Error(`Apenas ${remaining} unidade(s) disponível(is) para o produto "${product.name}"`);
      }

      const item_total = product.price_cents * item.quantity;
      total_amount_cents += item_total;

      orderItems.push({
        product_id: item.id,
        quantity: item.quantity,
        unit_price_cents: product.price_cents,
        product: product
      });
    }

    // Create order record
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        purchaser_name,
        purchaser_email,
        payment_method,
        amount_cents: total_amount_cents,
        status: 'pending'
      })
      .select()
      .single();

    if (orderError || !order) {
      throw new Error("Erro ao criar pedido");
    }

    // Create order items
    for (const item of orderItems) {
      await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price_cents: item.unit_price_cents
        });
    }

    // Create payment with MercadoPago
    let paymentResponse;
    try {
      // Build product description
      const description = orderItems.length === 1 
        ? `Presente para o bebê: ${orderItems[0].product.name}`
        : `Presentes para o bebê (${orderItems.length} itens)`;

      const mercadoPagoPayload: any = {
        transaction_amount: total_amount_cents / 100, // MercadoPago uses currency units, not cents
        description,
        payer: {
          first_name: purchaser_name.split(' ')[0],
          last_name: purchaser_name.split(' ').slice(1).join(' ') || purchaser_name.split(' ')[0],
          email: purchaser_email,
        },
        external_reference: order.id,
        notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
        metadata: {
          order_id: order.id
        }
      };

      // Configure payment method specific settings
      if (payment_method === 'pix') {
        mercadoPagoPayload.payment_method_id = 'pix';
        mercadoPagoPayload.date_of_expiration = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes
      } else if (payment_method === 'credit') {
        // For credit cards, don't specify payment_method_id - let user choose the card brand
        if (installments) {
          mercadoPagoPayload.installments = installments;
        }
      } else if (payment_method === 'debit') {
        // For debit cards, don't specify payment_method_id - let user choose the card brand
      }

      console.log('Creating MercadoPago payment:', mercadoPagoPayload);

      paymentResponse = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mpSettings.access_token}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': `${order.id}-${Date.now()}`
        },
        body: JSON.stringify(mercadoPagoPayload)
      });

      const paymentData = await paymentResponse.json();

      if (!paymentResponse.ok) {
        console.error('MercadoPago error:', paymentData);
        throw new Error(`MercadoPago error: ${paymentData.message || JSON.stringify(paymentData)}`);
      }

      console.log('MercadoPago payment created:', paymentData);

      // Update order with payment ID
      await supabase
        .from('orders')
        .update({ 
          infinitepay_payment_id: paymentData.id.toString() // Keep same column name for now to avoid breaking changes
        })
        .eq('id', order.id);

      // Return payment details based on method
      let response_data: any = {
        order_id: order.id,
        payment_id: paymentData.id,
        amount: total_amount_cents,
        status: paymentData.status
      };

      if (payment_method === 'pix') {
        response_data = {
          ...response_data,
          pix_qr_code: paymentData.point_of_interaction?.transaction_data?.qr_code,
          pix_code: paymentData.point_of_interaction?.transaction_data?.qr_code_base64,
          expires_at: paymentData.date_of_expiration
        };
      } else {
        // For credit/debit cards, we might need to handle 3DS or other flows
        if (paymentData.status === 'pending' && paymentData.status_detail === 'pending_waiting_transfer') {
          response_data.action_required = true;
          response_data.action_url = paymentData.transaction_details?.external_resource_url;
        }
        
        response_data.payment_url = paymentData.transaction_details?.external_resource_url;
      }

      return new Response(JSON.stringify(response_data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } catch (paymentError) {
      console.error('Payment creation error:', paymentError);
      
      // Mark order as failed
      await supabase
        .from('orders')
        .update({ status: 'failed' })
        .eq('id', order.id);

      throw new Error(`Erro ao processar pagamento: ${paymentError.message}`);
    }

  } catch (error) {
    console.error('Create MercadoPago payment error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});