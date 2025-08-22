import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';

interface OrderDetails {
  id: string;
  purchaser_name: string;
  purchaser_email: string;
  payment_method: string;
  amount_cents: number;
  status: string;
  infinitepay_payment_id: string | null;
  created_at: string;
  updated_at: string;
  items: Array<{
    id: string;
    product_name: string;
    quantity: number;
    unit_price_cents: number;
  }>;
}

interface OrderDetailsDialogProps {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OrderDetailsDialog = ({ orderId, open, onOpenChange }: OrderDetailsDialogProps) => {
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchOrderDetails = async (id: string) => {
    setLoading(true);
    try {
      // Get order details
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      if (orderError) throw orderError;

      // Get order items with product names
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          products(name)
        `)
        .eq('order_id', id);

      if (itemsError) throw itemsError;

      const details: OrderDetails = {
        ...orderData,
        items: (itemsData || []).map(item => ({
          id: item.id,
          product_name: (item.products as any)?.name || 'Produto removido',
          quantity: item.quantity,
          unit_price_cents: item.unit_price_cents
        }))
      };

      setOrderDetails(details);
    } catch (error: any) {
      console.error('Error fetching order details:', error);
      setOrderDetails(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && orderId) {
      fetchOrderDetails(orderId);
    }
  }, [open, orderId]);

  const handleClose = () => {
    onOpenChange(false);
    setOrderDetails(null);
  };

  if (!orderId) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Pedido</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : orderDetails ? (
          <div className="space-y-6">
            {/* Order Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informações do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">ID do Pedido</label>
                    <p className="font-mono text-sm">{orderDetails.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="mt-1">
                      <Badge variant={
                        orderDetails.status === 'paid' ? 'default' : 
                        orderDetails.status === 'failed' ? 'destructive' : 
                        'secondary'
                      }>
                        {orderDetails.status === 'paid' ? 'Pago' : 
                         orderDetails.status === 'failed' ? 'Falhou' : 
                         'Pendente'}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Data do Pedido</label>
                    <p>{format(new Date(orderDetails.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Última Atualização</label>
                    <p>{format(new Date(orderDetails.updated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Valor Total</label>
                    <p className="text-lg font-semibold">{formatCurrency(orderDetails.amount_cents)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Método de Pagamento</label>
                    <p>{
                      orderDetails.payment_method === 'pix' ? 'PIX' :
                      orderDetails.payment_method === 'credit_card' ? 'Cartão de Crédito' :
                      orderDetails.payment_method === 'debit_card' ? 'Cartão de Débito' :
                      orderDetails.payment_method
                    }</p>
                  </div>
                </div>

                {orderDetails.infinitepay_payment_id && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">ID do Pagamento</label>
                    <p className="font-mono text-sm">{orderDetails.infinitepay_payment_id}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informações do Comprador</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nome</label>
                  <p>{orderDetails.purchaser_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p>{orderDetails.purchaser_email}</p>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Itens do Pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {orderDetails.items.map((item, index) => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                      <div className="flex-1">
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Quantidade: {item.quantity} × {formatCurrency(item.unit_price_cents)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatCurrency(item.quantity * item.unit_price_cents)}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  <div className="flex justify-between items-center pt-3 border-t font-semibold">
                    <span>Total</span>
                    <span>{formatCurrency(orderDetails.amount_cents)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            Não foi possível carregar os detalhes do pedido.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};