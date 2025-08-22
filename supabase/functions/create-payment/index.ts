import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const infinitePayApiKey = Deno.env.get("INFINITEPAY_API_KEY") || "";

interface CreatePaymentRequest {
  purchaser_name: string;
  purchaser_email: string;
  payment_method: 'pix' | 'credit' | 'debit';
  product_id: string;
  quantity: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const { purchaser_name, purchaser_email, payment_method, product_id, quantity }: CreatePaymentRequest = await req.json();

    // Validate required fields
    if (!purchaser_name || !purchaser_email || !payment_method || !product_id || !quantity) {
      throw new Error("Todos os campos são obrigatórios");
    }

    // Get product details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', product_id)
      .eq('is_active', true)
      .single();

    if (productError || !product) {
      throw new Error("Produto não encontrado ou inativo");
    }

    // Check if product still has availability
    if (product.purchased_qty >= product.target_qty) {
      throw new Error("Este produto já atingiu a meta de presentes!");
    }

    // Check if quantity exceeds remaining availability
    const remaining = product.target_qty - product.purchased_qty;
    if (quantity > remaining) {
      throw new Error(`Apenas ${remaining} unidade(s) disponível(is) para este produto`);
    }

    const total_amount_cents = product.price_cents * quantity;

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

    // Create order item
    await supabase
      .from('order_items')
      .insert({
        order_id: order.id,
        product_id,
        quantity,
        unit_price_cents: product.price_cents
      });

    // Create payment with InfinitePay
    let paymentResponse;
    try {
      const infinitePayPayload = {
        amount: total_amount_cents,
        currency: "BRL",
        description: `Presente para o bebê: ${product.name}`,
        customer: {
          name: purchaser_name,
          email: purchaser_email
        },
        payment_method: payment_method,
        reference: order.id
      };

      paymentResponse = await fetch('https://api.infinitepay.io/v2/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${infinitePayApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(infinitePayPayload)
      });

      const paymentData = await paymentResponse.json();

      if (!paymentResponse.ok) {
        throw new Error(`InfinitePay error: ${paymentData.message || 'Payment creation failed'}`);
      }

      // Update order with payment ID
      await supabase
        .from('orders')
        .update({ infinitepay_payment_id: paymentData.id })
        .eq('id', order.id);

      // Return payment details based on method
      let response_data = {
        order_id: order.id,
        payment_id: paymentData.id,
        amount: total_amount_cents,
        status: paymentData.status
      };

      if (payment_method === 'pix') {
        response_data = {
          ...response_data,
          pix_qr_code: paymentData.pix?.qr_code,
          pix_code: paymentData.pix?.code,
          expires_at: paymentData.pix?.expires_at
        };
      } else {
        response_data = {
          ...response_data,
          checkout_url: paymentData.checkout_url
        };
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
    console.error('Create payment error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});