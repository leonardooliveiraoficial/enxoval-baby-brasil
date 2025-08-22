import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const mpAccessToken = Deno.env.get("MP_ACCESS_TOKEN");
    
    console.log("=== MP HEALTH CHECK ===");
    console.log("Token configurado:", mpAccessToken ? "SIM (****)" : "NÃO");
    
    if (!mpAccessToken) {
      return new Response(
        JSON.stringify({ 
          status: "ERROR",
          error: "MP_ACCESS_TOKEN não configurado",
          statusHTTP: null,
          responseBody: null
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const testPreference = {
      items: [{
        title: "Teste Health",
        quantity: 1,
        unit_price: 1.00,
        currency_id: "BRL"
      }],
      back_urls: {
        success: "https://baby-vivi-lili.lovable.app/sucesso",
        failure: "https://baby-vivi-lili.lovable.app/erro",
        pending: "https://baby-vivi-lili.lovable.app/pendente"
      },
      auto_return: "approved"
    };

    console.log("Testando criação de preferência...");

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${mpAccessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(testPreference)
    });

    const responseBody = await response.json();

    console.log("Status HTTP:", response.status);
    console.log("Response:", JSON.stringify(responseBody, null, 2));

    const result = {
      status: response.ok ? "SUCCESS" : "ERROR",
      statusHTTP: response.status,
      responseBody: responseBody,
      init_point: responseBody.init_point || null,
      preference_id: responseBody.id || null
    };

    console.log("Resultado final:", result);
    console.log("==================");

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Erro no health check:", error);
    return new Response(
      JSON.stringify({ 
        status: "ERROR",
        error: error.message,
        statusHTTP: null,
        responseBody: null
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  }
});