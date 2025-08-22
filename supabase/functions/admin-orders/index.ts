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
        const { 
          page = 1, 
          limit = 10, 
          search = '', 
          status = null,
          payment_method = null,
          date_from = null,
          date_to = null
        } = data || {};
        const offset = (page - 1) * limit;
        
        let query = supabaseServiceRole
          .from('orders')
          .select(`
            *,
            order_items (
              id,
              quantity,
              unit_price_cents,
              products (name, image_url)
            )
          `, { count: 'exact' });

        if (search) {
          query = query.or(`purchaser_name.ilike.%${search}%,purchaser_email.ilike.%${search}%,infinitepay_payment_id.ilike.%${search}%`);
        }
        if (status) {
          query = query.eq('status', status);
        }
        if (payment_method) {
          query = query.eq('payment_method', payment_method);
        }
        if (date_from) {
          query = query.gte('created_at', date_from);
        }
        if (date_to) {
          query = query.lte('created_at', date_to);
        }

        const { data: orders, count } = await query
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        return new Response(JSON.stringify({ 
          orders: orders || [], 
          total: count || 0,
          page,
          limit
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'reconcile':
        const { order_id } = data;
        const infinitepayApiKey = Deno.env.get('INFINITEPAY_API_KEY');
        
        // Get order details
        const { data: order } = await supabaseServiceRole
          .from('orders')
          .select('infinitepay_payment_id, status')
          .eq('id', order_id)
          .single();

        if (!order || !order.infinitepay_payment_id) {
          return new Response(JSON.stringify({ error: 'Order not found or no payment ID' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Query InfinitePay API for payment status
        const paymentResponse = await fetch(`https://api.infinitepay.io/v2/transactions/${order.infinitepay_payment_id}`, {
          headers: {
            'Authorization': `Bearer ${infinitepayApiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (!paymentResponse.ok) {
          return new Response(JSON.stringify({ error: 'Failed to query payment status' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const paymentData = await paymentResponse.json();
        const newStatus = paymentData.status === 'approved' ? 'paid' : 
                         paymentData.status === 'declined' ? 'failed' : 'pending';

        // Update order if status changed
        if (newStatus !== order.status) {
          await supabaseServiceRole
            .from('orders')
            .update({ status: newStatus })
            .eq('id', order_id);

          // If payment is now confirmed, update product quantities
          if (newStatus === 'paid' && order.status !== 'paid') {
            const { data: orderItems } = await supabaseServiceRole
              .from('order_items')
              .select('product_id, quantity')
              .eq('order_id', order_id);

            for (const item of orderItems || []) {
              await supabaseServiceRole.rpc('increment_purchased_qty', {
                product_id: item.product_id,
                qty: item.quantity
              });
            }
          }

          await logAuditAction(supabaseServiceRole, user.id, 'reconcile', 'order', order_id, { 
            old_status: order.status, 
            new_status: newStatus,
            infinitepay_status: paymentData.status
          });
        }

        return new Response(JSON.stringify({ 
          success: true, 
          old_status: order.status,
          new_status: newStatus,
          payment_data: paymentData
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'export_csv':
        const { filters } = data || {};
        
        let csvQuery = supabaseServiceRole
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        // Apply filters
        if (filters?.search) {
          csvQuery = csvQuery.or(`purchaser_name.ilike.%${filters.search}%,purchaser_email.ilike.%${filters.search}%`);
        }
        if (filters?.status) {
          csvQuery = csvQuery.eq('status', filters.status);
        }
        if (filters?.payment_method) {
          csvQuery = csvQuery.eq('payment_method', filters.payment_method);
        }
        if (filters?.date_from) {
          csvQuery = csvQuery.gte('created_at', filters.date_from);
        }
        if (filters?.date_to) {
          csvQuery = csvQuery.lte('created_at', filters.date_to);
        }

        const { data: csvOrders } = await csvQuery;

        // Generate CSV
        const csvHeaders = ['Data', 'Comprador', 'Email', 'Método', 'Valor (R$)', 'Status', 'ID Pagamento'];
        const csvRows = (csvOrders || []).map(order => [
          new Date(order.created_at).toLocaleString('pt-BR'),
          order.purchaser_name,
          order.purchaser_email,
          order.payment_method,
          (order.amount_cents / 100).toFixed(2).replace('.', ','),
          order.status,
          order.infinitepay_payment_id || ''
        ]);

        const csv = [csvHeaders, ...csvRows].map(row => row.join(';')).join('\n');

        await logAuditAction(supabaseServiceRole, user.id, 'export_csv', 'orders', null, { 
          filters,
          count: csvRows.length
        });

        return new Response(csv, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="pedidos_${new Date().toISOString().split('T')[0]}.csv"`
          }
        });

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('Error in admin-orders function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});