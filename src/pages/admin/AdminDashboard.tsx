import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp, 
  Target, 
  CheckCircle, 
  ShoppingCart,
  AlertCircle,
  Clock,
  Edit3
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';


interface AdminStats {
  total_raised_cents: number;
  total_goal_cents: number;
  completed_products: number;
  paid_orders: number;
  failed_orders: number;
  pending_orders: number;
  total_products: number;
}

interface DailySale {
  sale_date: string;
  orders_count: number;
  total_cents: number;
}

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entity_id?: string;
  created_at: string;
  profiles?: { email: string } | null;
}

export default function AdminDashboard() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [dailySales, setDailySales] = useState<DailySale[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editGoalDialog, setEditGoalDialog] = useState(false);
  const [newGoal, setNewGoal] = useState('');
  const [savingGoal, setSavingGoal] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [session]);

  const fetchDashboardData = async () => {
    if (!session) return;

    try {
      const response = await supabase.functions.invoke('admin-auth', {
        body: { action: 'get_stats' },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) throw response.error;

      setStats(response.data.stats);
      setDailySales(response.data.dailySales || []);

      // Fetch recent audit logs
      const auditResponse = await supabase.functions.invoke('admin-auth', {
        body: { action: 'get_audit_logs', data: { page: 1, limit: 10 } },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!auditResponse.error) {
        setAuditLogs(auditResponse.data.logs || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditGoal = () => {
    setNewGoal(((stats?.total_goal_cents || 0) / 100).toFixed(2));
    setEditGoalDialog(true);
  };

  const handleSaveGoal = async () => {
    const goalCents = Math.round(parseFloat(newGoal) * 100);
    
    if (!goalCents || goalCents <= 0) {
      toast({
        title: "Valor inválido",
        description: "Digite um valor válido maior que zero",
        variant: "destructive"
      });
      return;
    }

    setSavingGoal(true);
    try {
      const { error } = await supabase.functions.invoke('admin-settings', {
        body: {
          action: 'update_goal',
          goal_cents: goalCents
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: "Meta atualizada",
        description: `Nova meta: ${formatCurrency(goalCents)}`
      });

      setEditGoalDialog(false);
      fetchDashboardData(); // Refresh data
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar meta",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSavingGoal(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-screen-lg mx-auto pt-4 pb-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-muted-foreground">
            Visão geral do seu chá de bebê
          </p>
        </div>
      
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const progressPercentage = stats?.total_goal_cents 
    ? Math.min((stats.total_raised_cents / stats.total_goal_cents) * 100, 100)
    : 0;

  return (
    <div className="max-w-screen-lg mx-auto pt-4 pb-6 space-y-6">
    <div>
      <h2 className="text-2xl font-bold">Dashboard</h2>
      <p className="text-muted-foreground">
        Visão geral do seu chá de bebê
      </p>
    </div>
    
    {/* Stats Cards */}
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Arrecadado
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(stats?.total_raised_cents || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats?.paid_orders || 0} pedidos pagos
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Meta Total
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEditGoal}
              className="p-1 h-6 w-6"
            >
              <Edit3 className="h-3 w-3" />
            </Button>
            <Target className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(stats?.total_goal_cents || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            {progressPercentage.toFixed(1)}% atingido
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Produtos Completos
          </CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats?.completed_products || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            de {stats?.total_products || 0} produtos
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Status dos Pedidos
          </CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-2">
            <Badge variant="default" className="text-xs">
              {stats?.paid_orders || 0} Pagos
            </Badge>
            {(stats?.failed_orders || 0) > 0 && (
              <Badge variant="destructive" className="text-xs">
                {stats.failed_orders} Falhas
              </Badge>
            )}
          </div>
          {(stats?.pending_orders || 0) > 0 && (
            <p className="text-xs text-muted-foreground flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {stats.pending_orders} pendentes
            </p>
          )}
        </CardContent>
      </Card>
    </div>
    
    {/* Recent Activity */}
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Vendas dos Últimos 7 Dias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dailySales.slice(0, 7).map((sale, index) => (
              <div key={sale.sale_date} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {new Date(sale.sale_date).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {sale.orders_count} pedido{sale.orders_count !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {formatCurrency(sale.total_cents)}
                  </p>
                </div>
              </div>
            ))}
            
            {dailySales.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma venda registrada
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div key={log.id} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{log.action}</span>{' '}
                    em <span className="font-medium">{log.entity}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {log.profiles?.email} •{' '}
                    {new Date(log.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
            
            {auditLogs.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma atividade registrada
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Edit Goal Dialog */}
    <Dialog open={editGoalDialog} onOpenChange={setEditGoalDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Meta Total</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="new-goal">Nova Meta (R$)</Label>
            <Input
              id="new-goal"
              type="number"
              step="0.01"
              min="0"
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setEditGoalDialog(false)}
              disabled={savingGoal}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveGoal} disabled={savingGoal}>
              {savingGoal ? 'Salvando...' : 'Salvar Meta'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </div>
  );
}