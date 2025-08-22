import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the JWT from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the JWT and get user info
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestBody = await req.json();
    const { action } = requestBody;

    switch (action) {
      case 'update_goal': {
        const { goal_cents } = requestBody;
        
        if (!goal_cents || goal_cents < 0) {
          return new Response(
            JSON.stringify({ error: 'Valid goal amount is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // First try to update, if no rows affected, insert
        const { data: updateData, error: updateError } = await supabase
          .from('campaign_settings')
          .update({ 
            goal_cents: parseInt(goal_cents),
            updated_at: new Date().toISOString()
          })
          .eq('id', 1)
          .select()
          .maybeSingle();

        let data = updateData;
        let error = updateError;

        if (!updateData && !updateError) {
          // No rows were updated, try to insert
          const { data: insertData, error: insertError } = await supabase
            .from('campaign_settings')
            .insert({ 
              id: 1,
              goal_cents: parseInt(goal_cents),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();
          
          data = insertData;
          error = insertError;
        }

        if (error) throw error;

        // Log audit action
        await supabase
          .from('audit_logs')
          .insert({
            user_id: user.id,
            action: 'update_goal',
            entity: 'campaign_settings',
            entity_id: '1',
            meta: { goal_cents: parseInt(goal_cents) }
          });

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_goal': {
        const { data, error } = await supabase
          .from('campaign_settings')
          .select('*')
          .eq('id', 1)
          .maybeSingle();

        if (error) throw error;

        return new Response(JSON.stringify(data || {
          id: 1,
          goal_cents: 115500, // Default R$ 1.155,00
          updated_at: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error: any) {
    console.error('Error in admin-settings function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});