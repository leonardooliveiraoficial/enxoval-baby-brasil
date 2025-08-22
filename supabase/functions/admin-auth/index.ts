import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseServiceRole = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: { user } } = await supabaseUser.auth.getUser(authHeader.replace('Bearer ', ''));

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if user is admin
    const { data: profile } = await supabaseServiceRole
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Access denied. Admin role required.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { action, data } = await req.json();

    switch (action) {
      case 'get_stats':
        const { data: stats } = await supabaseServiceRole
          .from('v_admin_stats')
          .select('*')
          .single();
        
        const { data: dailySales } = await supabaseServiceRole
          .from('v_daily_sales')
          .select('*');
        
        return new Response(JSON.stringify({ stats, dailySales }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'get_audit_logs':
        const { page = 1, limit = 10 } = data || {};
        const offset = (page - 1) * limit;
        
        const { data: auditLogs, count } = await supabaseServiceRole
          .from('audit_logs')
          .select(`
            *,
            profiles:user_id (email)
          `, { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        return new Response(JSON.stringify({ 
          logs: auditLogs || [], 
          total: count || 0,
          page,
          limit
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('Error in admin-auth function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});