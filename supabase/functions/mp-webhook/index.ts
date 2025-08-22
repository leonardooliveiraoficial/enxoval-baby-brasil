import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-signature",
  // Security headers
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin"
};

// Secure webhook signature validation
async function verifyMercadoPagoSignature(
  body: string, 
  signature: string, 
  secret: string
): Promise<boolean> {
  try {
    // MercadoPago sends signature in format like "v1=hash"
    const sigParts = signature.split(',');
    for (const part of sigParts) {
      const [version, hash] = part.split('=');
      if (version === 'v1') {
        const encoder = new TextEncoder();
        const keyData = encoder.encode(secret);
        const msgData = encoder.encode(body);
        
        const key = await crypto.subtle.importKey(
          'raw',
          keyData,
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign', 'verify']
        );
        
        const expectedHash = await crypto.subtle.sign('HMAC', key, msgData);
        const expectedHashHex = Array.from(new Uint8Array(expectedHash))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        
        return hash === expectedHashHex;
      }
    }
    return false;
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookSecret = Deno.env.get("MP_WEBHOOK_SECRET");
    const signature = req.headers.get("x-signature");
    
    const body = await req.text();
    let payload;
    
    try {
      payload = JSON.parse(body);
    } catch {
      payload = body;
    }

    console.log("=== WEBHOOK MERCADOPAGO ===");
    console.log("Método:", req.method);
    console.log("Headers:", Object.fromEntries(req.headers.entries()));
    console.log("Payload type:", payload?.type);
    console.log("Action:", payload?.action);
    console.log("========================");

    // Enhanced security validation
    if (!webhookSecret) {
      console.error("MP_WEBHOOK_SECRET não configurado - rejeitando webhook");
      return new Response("Unauthorized", {
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
        status: 401,
      });
    }

    if (!signature) {
      console.error("Assinatura ausente - rejeitando webhook");
      return new Response("Missing signature", {
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
        status: 401,
      });
    }

    // Verify webhook signature
    const isValidSignature = await verifyMercadoPagoSignature(body, signature, webhookSecret);
    if (!isValidSignature) {
      console.error("Assinatura inválida - rejeitando webhook");
      return new Response("Invalid signature", {
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
        status: 401,
      });
    }

    console.log("✅ Webhook signature verified successfully");

    // TODO: Process webhook payload
    // This would include updating order status, sending emails, etc.
    if (payload?.type === 'payment') {
      console.log("Processing payment webhook:", payload?.action);
      // Add payment processing logic here
    }

    return new Response("OK", {
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
      status: 200,
    });

  } catch (error) {
    console.error("Erro no webhook:", error);
    
    // Return error status for security issues, success for processing errors
    return new Response("Internal Server Error", {
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
      status: 500,
    });
  }
});