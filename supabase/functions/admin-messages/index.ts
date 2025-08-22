import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Log audit action helper
const logAuditAction = async (supabase: any, user_id: string, action: string, entity: string, entity_id: string | null, meta: any = {}) => {
  await supabase
    .from('audit_logs')
    .insert({
      user_id,
      action,
      entity,
      entity_id,
      meta
    });
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

    const { action, message_id, approved } = await req.json();

    console.log('Admin Messages Action:', { action, message_id, approved });

    switch (action) {
      case 'toggle_approval': {
        if (!message_id || typeof approved !== 'boolean') {
          return new Response(
            JSON.stringify({ error: 'Message ID and approved status are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data, error } = await supabase
          .from('guestbook_messages')
          .update({ approved })
          .eq('id', message_id)
          .select()
          .single();

        if (error) throw error;

        await logAuditAction(supabase, user.id, approved ? 'approve_message' : 'reject_message', 'guestbook_messages', message_id, {
          author_name: data.author_name,
          approved
        });

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete': {
        if (!message_id) {
          return new Response(
            JSON.stringify({ error: 'Message ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get message info before deleting for audit log
        const { data: messageData, error: getError } = await supabase
          .from('guestbook_messages')
          .select('author_name, message')
          .eq('id', message_id)
          .single();

        if (getError) throw getError;

        const { error } = await supabase
          .from('guestbook_messages')
          .delete()
          .eq('id', message_id);

        if (error) throw error;

        await logAuditAction(supabase, user.id, 'delete_message', 'guestbook_messages', message_id, {
          author_name: messageData.author_name,
          message: messageData.message
        });

        return new Response(JSON.stringify({ success: true }), {
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
    console.error('Error in admin-messages function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});