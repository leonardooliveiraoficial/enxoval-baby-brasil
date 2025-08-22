import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! }
        }
      }
    );

    // Get the user from the JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const { access_token } = await req.json();

    if (!access_token) {
      return new Response(
        JSON.stringify({ error: 'Access token is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log('Testing MercadoPago connection...');

    // Test the connection to MercadoPago API
    const response = await fetch('https://api.mercadopago.com/v1/account/settings', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      }
    });

    const responseData = await response.json();

    if (response.ok) {
      console.log('MercadoPago connection successful');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Connection successful',
          data: responseData 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    } else {
      console.error('MercadoPago connection failed:', response.status, responseData);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `API Error: ${response.status} - ${responseData.message || response.statusText}`,
          details: responseData
        }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

  } catch (error: any) {
    console.error('Error testing MercadoPago connection:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Internal server error' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});