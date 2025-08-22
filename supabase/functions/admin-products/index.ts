import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function logAuditAction(supabase: any, userId: string, action: string, entity: string, entityId?: string, meta?: any) {
  await supabase.from('audit_logs').insert({
    user_id: userId,
    action,
    entity,
    entity_id: entityId,
    meta: meta || {}
  });
}

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
      case 'list':
        const { page = 1, limit = 10, search = '', category_id = null, is_active = null } = data || {};
        const offset = (page - 1) * limit;
        
        let query = supabaseServiceRole
          .from('products')
          .select(`
            *,
            categories:category_id (name)
          `, { count: 'exact' });

        if (search) {
          query = query.ilike('name', `%${search}%`);
        }
        if (category_id) {
          query = query.eq('category_id', category_id);
        }
        if (is_active !== null) {
          query = query.eq('is_active', is_active);
        }

        const { data: products, count } = await query
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        return new Response(JSON.stringify({ 
          products: products || [], 
          total: count || 0,
          page,
          limit
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'create':
        const { data: newProduct } = await supabaseServiceRole
          .from('products')
          .insert(data.product)
          .select()
          .single();

        await logAuditAction(supabaseServiceRole, user.id, 'create', 'product', newProduct?.id, data.product);

        return new Response(JSON.stringify({ product: newProduct }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'update':
        const { id, ...updateData } = data.product;
        const { data: updatedProduct } = await supabaseServiceRole
          .from('products')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        await logAuditAction(supabaseServiceRole, user.id, 'update', 'product', id, updateData);

        return new Response(JSON.stringify({ product: updatedProduct }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'delete':
        await supabaseServiceRole
          .from('products')
          .delete()
          .eq('id', data.id);

        await logAuditAction(supabaseServiceRole, user.id, 'delete', 'product', data.id);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'toggle_active':
        const { data: product } = await supabaseServiceRole
          .from('products')
          .select('is_active')
          .eq('id', data.id)
          .single();

        const newStatus = !product.is_active;
        await supabaseServiceRole
          .from('products')
          .update({ is_active: newStatus })
          .eq('id', data.id);

        await logAuditAction(supabaseServiceRole, user.id, 'toggle_active', 'product', data.id, { is_active: newStatus });

        return new Response(JSON.stringify({ success: true, is_active: newStatus }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'bulk_toggle':
        const { ids, active } = data;
        await supabaseServiceRole
          .from('products')
          .update({ is_active: active })
          .in('id', ids);

        await logAuditAction(supabaseServiceRole, user.id, 'bulk_toggle', 'product', null, { ids, active });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('Error in admin-products function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});