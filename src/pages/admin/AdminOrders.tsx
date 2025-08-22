import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Eye, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';
import { OrderDetailsDialog } from '@/components/admin/OrderDetailsDialog';
import { ExportFilters } from '@/components/admin/ExportFilters';

interface Order {
  id: string;
  purchaser_name: string;
  purchaser_email: string;
  payment_method: string;
  amount_cents: number;
  status: string;
  infinitepay_payment_id: string | null;
  created_at: string;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid' | 'failed'>('all');
  const { toast } = useToast();

  const fetchOrders = async () => {
    try {
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar pedidos",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  // Set up realtime subscription for order status changes
  useEffect(() => {
    const channel = supabase
      .channel('order-status-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: 'status=eq.paid'
        },
        (payload) => {
          console.log('Order status changed to paid:', payload);
          fetchOrders(); // Refresh the list
          toast({
            title: "Pedido atualizado",
            description: "Um pedido foi pago e a lista foi atualizada",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const handleViewDetails = (orderId: string) => {
    setSelectedOrder(orderId);
    setOrderDetailsOpen(true);
  };

  const handleReprocessOrder = async (orderId: string, paymentId: string | null) => {
    if (!paymentId) {
      toast({
        title: "Erro",
        description: "Pedido não possui ID de pagamento para reprocessar",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('admin-orders', {
        body: {
          action: 'reconcile',
          order_id: orderId,
          payment_id: paymentId
        }
      });

      if (error) throw error;

      toast({
        title: "Reprocessamento iniciado",
        description: "O pedido está sendo reconciliado com o pagamento"
      });

      // Refresh the orders list after a short delay
      setTimeout(() => {
        fetchOrders();
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Erro ao reprocessar",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleExportCSV = async (filters?: {
    startDate?: Date;
    endDate?: Date;
    status?: string;
    paymentMethod?: string;
  }) => {
    try {
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
      }
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters?.paymentMethod && filters.paymentMethod !== 'all') {
        query = query.eq('payment_method', filters.paymentMethod);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Create CSV content
      const headers = ['Data', 'Comprador', 'Email', 'Método', 'Valor', 'Status', 'ID Pagamento'];
      const csvContent = [
        headers.join(','),
        ...(data || []).map(order => [
          format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
          `"${order.purchaser_name.replace(/"/g, '""')}"`,
          `"${order.purchaser_email.replace(/"/g, '""')}"`,
          order.payment_method,
          formatCurrency(order.amount_cents).replace(',', '.'),
          order.status === 'paid' ? 'Pago' : order.status === 'failed' ? 'Falhou' : 'Pendente',
          order.infinitepay_payment_id || ''
        ].join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `pedidos_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Exportação concluída",
        description: "Arquivo CSV baixado com sucesso"
      });
    } catch (error: any) {
      toast({
        title: "Erro na exportação",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: "created_at",
      header: "Data",
      cell: ({ row }) => format(new Date(row.original.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
    },
    {
      accessorKey: "purchaser_name",
      header: "Comprador",
    },
    {
      accessorKey: "purchaser_email",
      header: "Email",
    },
    {
      accessorKey: "payment_method",
      header: "Método",
      cell: ({ row }) => {
        const method = row.original.payment_method;
        const methodMap: Record<string, string> = {
          'pix': 'PIX',
          'credit_card': 'Crédito',
          'debit_card': 'Débito'
        };
        return methodMap[method] || method;
      },
    },
    {
      accessorKey: "amount_cents",
      header: "Valor",
      cell: ({ row }) => formatCurrency(row.original.amount_cents),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const variant = status === 'paid' ? 'default' : status === 'failed' ? 'destructive' : 'secondary';
        const label = status === 'paid' ? 'Pago' : status === 'failed' ? 'Falhou' : 'Pendente';
        
        return <Badge variant={variant}>{label}</Badge>;
      },
    },
    {
      accessorKey: "infinitepay_payment_id",
      header: "ID Pagamento",
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {row.original.infinitepay_payment_id || '-'}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewDetails(row.original.id)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          {row.original.status === 'pending' && row.original.infinitepay_payment_id && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReprocessOrder(row.original.id, row.original.infinitepay_payment_id)}
              title="Reprocessar confirmação de pagamento"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return <div>Carregando pedidos...</div>;
  }

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const paidCount = orders.filter(o => o.status === 'paid').length;
  const failedCount = orders.filter(o => o.status === 'failed').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pedidos</h1>
          <p className="text-muted-foreground">Todos os pedidos (pendentes, pagos e falhos)</p>
        </div>
        <ExportFilters onExport={handleExportCSV} includePending={true} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{paidCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Falhos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{failedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Status Filters */}
      <div className="flex gap-2">
        <Button
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('all')}
        >
          Todos
        </Button>
        <Button
          variant={statusFilter === 'pending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('pending')}
        >
          Pendentes
        </Button>
        <Button
          variant={statusFilter === 'paid' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('paid')}
        >
          Pagos
        </Button>
        <Button
          variant={statusFilter === 'failed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('failed')}
        >
          Falhos
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Pedidos</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={orders}
            searchKey="purchaser_name"
            searchPlaceholder="Buscar por comprador..."
          />
        </CardContent>
      </Card>

      <OrderDetailsDialog
        orderId={selectedOrder}
        open={orderDetailsOpen}
        onOpenChange={setOrderDetailsOpen}
      />
    </div>
  );
}