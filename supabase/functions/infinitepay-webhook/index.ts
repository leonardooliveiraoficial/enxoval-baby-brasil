import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const webhookSecret = Deno.env.get("INFINITEPAY_WEBHOOK_SECRET") || "";
const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";

const resend = new Resend(resendApiKey);

interface WebhookPayload {
  id: string;
  event: string;
  data: {
    id: string;
    status: 'pending' | 'paid' | 'failed' | 'refunded';
    reference: string;
    amount: number;
    customer: {
      name: string;
      email: string;
    };
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('x-infinitepay-signature');
    const payload = await req.text();

    // Verify webhook signature
    if (!signature || !verifyWebhookSignature(payload, signature, webhookSecret)) {
      console.error('Invalid webhook signature');
      return new Response('Unauthorized', { status: 401 });
    }

    const webhookData: WebhookPayload = JSON.parse(payload);
    console.log('Webhook received:', webhookData);

    // Only process payment status updates
    if (!webhookData.event.includes('payment')) {
      return new Response('OK', { status: 200 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          quantity,
          product_id,
          products (
            id,
            name,
            purchased_qty,
            target_qty
          )
        )
      `)
      .eq('id', webhookData.data.reference)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', webhookData.data.reference);
      return new Response('Order not found', { status: 404 });
    }

    // Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: webhookData.data.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id);

    if (updateError) {
      console.error('Error updating order:', updateError);
      return new Response('Error updating order', { status: 500 });
    }

    // If payment is confirmed, update product quantities and send thank you email
    if (webhookData.data.status === 'paid') {
      try {
        // Update product purchased quantities
        for (const item of order.order_items) {
          await supabase
            .from('products')
            .update({ 
              purchased_qty: item.products.purchased_qty + item.quantity 
            })
            .eq('id', item.product_id);
        }

        // Send thank you email
        await sendThankYouEmail(order.purchaser_name, order.purchaser_email, supabase);

      } catch (error) {
        console.error('Error processing successful payment:', error);
        // Don't return error as the payment was processed successfully
      }
    }

    return new Response('OK', {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  // Implement your InfinitePay webhook signature verification logic here
  // This is a placeholder - check InfinitePay documentation for the exact method
  try {
    const crypto = globalThis.crypto.subtle;
    // Add proper signature verification logic
    return true; // Placeholder
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

async function sendThankYouEmail(name: string, email: string, supabase: any) {
  try {
    // Get thank you template
    const { data: template } = await supabase
      .from('thankyou_template')
      .select('*')
      .eq('id', 1)
      .single();

    if (!template) {
      console.error('Thank you template not found');
      return;
    }

    // Replace template variables
    const subject = template.subject;
    const body = template.body_markdown.replace(/{{name}}/g, name);

    // Send email
    await resend.emails.send({
      from: 'Lilian e Vinicius <noreply@resend.dev>',
      to: [email],
      subject: subject,
      html: convertMarkdownToHtml(body)
    });

    console.log(`Thank you email sent to ${email}`);
  } catch (error) {
    console.error('Error sending thank you email:', error);
  }
}

function convertMarkdownToHtml(markdown: string): string {
  // Simple markdown to HTML conversion
  return markdown
    .replace(/# (.+)/g, '<h1>$1</h1>')
    .replace(/## (.+)/g, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^(.+)$/, '<p>$1</p>');
}