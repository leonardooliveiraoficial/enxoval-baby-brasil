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

    const { action, category_id, name, sort_order, direction } = await req.json();

    console.log('Admin Categories Action:', { action, category_id, name, sort_order, direction });

    switch (action) {
      case 'create': {
        if (!name) {
          return new Response(
            JSON.stringify({ error: 'Name is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data, error } = await supabase
          .from('categories')
          .insert({
            name: name.trim(),
            sort_order: sort_order || 0
          })
          .select()
          .single();

        if (error) throw error;

        await logAuditAction(supabase, user.id, 'create_category', 'categories', data.id, { name: data.name });

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update': {
        if (!category_id || !name) {
          return new Response(
            JSON.stringify({ error: 'Category ID and name are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data, error } = await supabase
          .from('categories')
          .update({
            name: name.trim(),
            sort_order: sort_order || 0
          })
          .eq('id', category_id)
          .select()
          .single();

        if (error) throw error;

        await logAuditAction(supabase, user.id, 'update_category', 'categories', category_id, { 
          name: data.name,
          sort_order: data.sort_order
        });

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete': {
        if (!category_id) {
          return new Response(
            JSON.stringify({ error: 'Category ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check if category has products
        const { count, error: countError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', category_id);

        if (countError) throw countError;

        if (count && count > 0) {
          return new Response(
            JSON.stringify({ error: `Cannot delete category with ${count} products` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', category_id);

        if (error) throw error;

        await logAuditAction(supabase, user.id, 'delete_category', 'categories', category_id);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'reorder': {
        if (!category_id || !direction) {
          return new Response(
            JSON.stringify({ error: 'Category ID and direction are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get current category
        const { data: currentCategory, error: getCategoryError } = await supabase
          .from('categories')
          .select('sort_order')
          .eq('id', category_id)
          .single();

        if (getCategoryError) throw getCategoryError;

        const currentOrder = currentCategory.sort_order;
        
        if (direction === 'up') {
          // Find category with the highest sort_order that's less than current
          const { data: targetCategory, error: targetError } = await supabase
            .from('categories')
            .select('id, sort_order')
            .lt('sort_order', currentOrder)
            .order('sort_order', { ascending: false })
            .limit(1)
            .single();

          if (targetError) {
            return new Response(JSON.stringify({ error: 'Cannot move up' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          // Swap sort orders
          await supabase.from('categories').update({ sort_order: targetCategory.sort_order }).eq('id', category_id);
          await supabase.from('categories').update({ sort_order: currentOrder }).eq('id', targetCategory.id);
        } else {
          // Find category with the lowest sort_order that's greater than current
          const { data: targetCategory, error: targetError } = await supabase
            .from('categories')
            .select('id, sort_order')
            .gt('sort_order', currentOrder)
            .order('sort_order', { ascending: true })
            .limit(1)
            .single();

          if (targetError) {
            return new Response(JSON.stringify({ error: 'Cannot move down' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          // Swap sort orders
          await supabase.from('categories').update({ sort_order: targetCategory.sort_order }).eq('id', category_id);
          await supabase.from('categories').update({ sort_order: currentOrder }).eq('id', targetCategory.id);
        }

        await logAuditAction(supabase, user.id, 'reorder_category', 'categories', category_id, { direction });

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
    console.error('Error in admin-categories function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});