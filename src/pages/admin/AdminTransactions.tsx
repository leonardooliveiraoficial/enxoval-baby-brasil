import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Download, Eye, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';
import { OrderDetailsDialog } from '@/components/admin/OrderDetailsDialog';
import { ExportFilters } from '@/components/admin/ExportFilters';

interface Transaction {
  id: string;
  purchaser_name: string;
  purchaser_email: string;
  payment_method: string;
  amount_cents: number;
  status: string;
  infinitepay_payment_id: string | null;
  created_at: string;
}

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'failed'>('all');
  const { toast } = useToast();

  const fetchTransactions = async () => {
    try {
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      // Only show paid and failed transactions (not pending)
      if (statusFilter === 'paid') {
        query = query.eq('status', 'paid');
      } else if (statusFilter === 'failed') {
        query = query.eq('status', 'failed');
      } else {
        query = query.in('status', ['paid', 'failed']);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar transações",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [statusFilter]);

  const handleViewDetails = (orderId: string) => {
    setSelectedOrder(orderId);
    setOrderDetailsOpen(true);
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
      } else {
        query = query.in('status', ['paid', 'failed']);
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
        ...(data || []).map(transaction => [
          format(new Date(transaction.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
          `"${transaction.purchaser_name.replace(/"/g, '""')}"`,
          `"${transaction.purchaser_email.replace(/"/g, '""')}"`,
          transaction.payment_method,
          formatCurrency(transaction.amount_cents).replace(',', '.'),
          transaction.status === 'paid' ? 'Pago' : 'Falhou',
          transaction.infinitepay_payment_id || ''
        ].join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `transacoes_${format(new Date(), 'yyyy-MM-dd')}.csv`);
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

  const columns: ColumnDef<Transaction>[] = [
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
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'paid' ? "default" : "destructive"}>
          {row.original.status === 'paid' ? 'Pago' : 'Falhou'}
        </Badge>
      ),
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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleViewDetails(row.original.id)}
        >
          <Eye className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  if (loading) {
    return <div>Carregando transações...</div>;
  }

  const paidCount = transactions.filter(t => t.status === 'paid').length;
  const failedCount = transactions.filter(t => t.status === 'failed').length;
  const totalValue = transactions
    .filter(t => t.status === 'paid')
    .reduce((sum, t) => sum + t.amount_cents, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Transações</h1>
          <p className="text-muted-foreground">Pagamentos processados (pagos e falhos)</p>
        </div>
        <ExportFilters onExport={handleExportCSV} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Processado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos Aprovados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{paidCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
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
          <CardTitle>Lista de Transações</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={transactions}
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