import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckoutRequest {
  title: string;
  quantity: number;
  amount: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const mpAccessToken = Deno.env.get("MP_ACCESS_TOKEN");
    
    if (!mpAccessToken) {
      console.error("MP_ACCESS_TOKEN não configurado");
      return new Response(
        JSON.stringify({ error: "MISSING_CONFIG", detail: "Token do Mercado Pago não configurado" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 502,
        }
      );
    }

    const { title, quantity, amount }: CheckoutRequest = await req.json();

    // Validar campos
    if (!title || !quantity || !amount || quantity <= 0 || amount <= 0) {
      return new Response(
        JSON.stringify({ 
          error: "INVALID_PAYLOAD", 
          detail: "Todos os campos são obrigatórios e devem ser válidos (quantity > 0, amount > 0)" 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    console.log("Criando preferência MP para:", { title, quantity, amount });

    const preferencePayload = {
      items: [{
        title: title,
        quantity: quantity,
        unit_price: amount,
        currency_id: "BRL"
      }],
      back_urls: {
        success: "https://baby-vivi-lili.lovable.app/sucesso",
        failure: "https://baby-vivi-lili.lovable.app/erro",
        pending: "https://baby-vivi-lili.lovable.app/pendente"
      },
      auto_return: "approved",
      notification_url: "https://baby-vivi-lili.lovable.app/api/mp/webhook"
    };

    console.log("Payload para MP:", JSON.stringify(preferencePayload, null, 2));

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${mpAccessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(preferencePayload)
    });

    const responseData = await response.json();

    console.log("Resposta MP Status:", response.status);
    console.log("Resposta MP Body:", JSON.stringify(responseData, null, 2));

    if (!response.ok) {
      console.error("Erro do Mercado Pago:", responseData);
      return new Response(
        JSON.stringify({ 
          error: "MP_FAIL", 
          detail: responseData,
          status: response.status
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 502,
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        init_point: responseData.init_point,
        preference_id: responseData.id
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Erro geral na criação de preferência:", error);
    return new Response(
      JSON.stringify({ error: "INTERNAL_ERROR", detail: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});