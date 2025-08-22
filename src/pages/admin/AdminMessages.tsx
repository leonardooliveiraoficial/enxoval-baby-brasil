import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Trash2, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GuestbookMessage {
  id: string;
  author_name: string;
  message: string;
  approved: boolean;
  created_at: string;
}

export default function AdminMessages() {
  const [messages, setMessages] = useState<GuestbookMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const { toast } = useToast();

  const fetchMessages = async () => {
    try {
      let query = supabase
        .from('guestbook_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter === 'approved') {
        query = query.eq('approved', true);
      } else if (filter === 'pending') {
        query = query.eq('approved', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar mensagens",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [filter]);

  const handleToggleApproval = async (messageId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.functions.invoke('admin-messages', {
        body: {
          action: 'toggle_approval',
          message_id: messageId,
          approved: !currentStatus
        }
      });

      if (error) throw error;

      toast({
        title: "Mensagem atualizada",
        description: `Mensagem ${!currentStatus ? 'aprovada' : 'rejeitada'} com sucesso`
      });

      fetchMessages();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar mensagem",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta mensagem?')) return;

    try {
      const { error } = await supabase.functions.invoke('admin-messages', {
        body: {
          action: 'delete',
          message_id: messageId
        }
      });

      if (error) throw error;

      toast({
        title: "Mensagem excluída",
        description: "Mensagem excluída com sucesso"
      });

      fetchMessages();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir mensagem",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleExportCSV = async () => {
    try {
      // Get all messages with current filters
      let query = supabase
        .from('guestbook_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter === 'approved') {
        query = query.eq('approved', true);
      } else if (filter === 'pending') {
        query = query.eq('approved', false);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Create CSV content
      const headers = ['Data', 'Autor', 'Mensagem', 'Status'];
      const csvContent = [
        headers.join(','),
        ...(data || []).map(msg => [
          format(new Date(msg.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
          `"${msg.author_name.replace(/"/g, '""')}"`,
          `"${msg.message.replace(/"/g, '""')}"`,
          msg.approved ? 'Aprovada' : 'Pendente'
        ].join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `mensagens_${format(new Date(), 'yyyy-MM-dd')}.csv`);
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

  const columns: ColumnDef<GuestbookMessage>[] = [
    {
      accessorKey: "created_at",
      header: "Data",
      cell: ({ row }) => format(new Date(row.original.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
    },
    {
      accessorKey: "author_name",
      header: "Autor",
    },
    {
      accessorKey: "message",
      header: "Mensagem",
      cell: ({ row }) => (
        <div className="max-w-md truncate" title={row.original.message}>
          {row.original.message}
        </div>
      ),
    },
    {
      accessorKey: "approved",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.approved ? "default" : "secondary"}>
          {row.original.approved ? "Aprovada" : "Pendente"}
        </Badge>
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
            onClick={() => handleToggleApproval(row.original.id, row.original.approved)}
            title={row.original.approved ? "Rejeitar" : "Aprovar"}
          >
            {row.original.approved ? (
              <X className="w-4 h-4" />
            ) : (
              <Check className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.original.id)}
            title="Excluir"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return <div>Carregando mensagens...</div>;
  }

  const approvedCount = messages.filter(m => m.approved).length;
  const pendingCount = messages.filter(m => !m.approved).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Mensagens</h1>
          <p className="text-muted-foreground">Gerencie as mensagens dos visitantes</p>
        </div>
        <Button onClick={handleExportCSV}>
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{messages.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
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
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          Todas
        </Button>
        <Button
          variant={filter === 'approved' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('approved')}
        >
          Aprovadas
        </Button>
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('pending')}
        >
          Pendentes
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Mensagens</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={messages}
            searchKey="author_name"
            searchPlaceholder="Buscar por autor..."
          />
        </CardContent>
      </Card>
    </div>
  );
}