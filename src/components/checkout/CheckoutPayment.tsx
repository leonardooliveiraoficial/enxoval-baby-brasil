import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Copy, CreditCard, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";
import { babyButtonVariants } from "@/components/ui/button-variants";

interface Product {
  id: string;
  name: string;
  price_cents: number;
  target_qty: number;
  purchased_qty: number;
  quantity?: number;
}

interface PaymentData {
  payment_id: string;
  order_id: string;
  amount: number;
  status: string;
  pix_qr_code?: string;
  pix_code?: string;
  payment_url?: string;
  expires_at?: string;
}

interface CheckoutPaymentProps {
  paymentData: PaymentData;
  orderItems: Product[];
  totalAmount: number;
  paymentMethod: 'pix' | 'credit' | 'debit';
  onBack: () => void;
  onSuccess: () => void;
  copyPixCode: () => void;
}

export const CheckoutPayment = ({
  paymentData,
  orderItems,
  totalAmount,
  paymentMethod,
  onBack,
  onSuccess,
  copyPixCode
}: CheckoutPaymentProps) => {
  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(cents / 100);
  };

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8 max-w-2xl">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl sm:text-2xl text-foreground">
            {paymentMethod === 'pix' ? 'Pagamento PIX' : 'Finalize o Pagamento'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {paymentMethod === 'pix' ? (
            <>
              <div className="text-center space-y-4">
                <div className="bg-white p-3 sm:p-4 rounded-lg border shadow-sm">
                  {paymentData.pix_qr_code && (
                    <div className="flex flex-col items-center gap-3 sm:gap-4">
                      <QrCode className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                      <img 
                        src={`data:image/png;base64,${paymentData.pix_code}`} 
                        alt="QR Code PIX"
                        className="w-48 h-48 sm:w-64 sm:h-64 border rounded"
                      />
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Escaneie o QR Code com o app do seu banco
                      </p>
                    </div>
                  )}
                </div>
                
                {paymentData.pix_qr_code && (
                  <div className="space-y-2">
                    <p className="text-xs sm:text-sm font-medium text-foreground">
                      Ou copie e cole o código PIX:
                    </p>
                    <div className="flex gap-2">
                      <Input 
                        value={paymentData.pix_qr_code}
                        readOnly
                        className="font-mono text-xs flex-1"
                      />
                      <Button 
                        onClick={copyPixCode}
                        variant="outline" 
                        size="sm"
                        className="shrink-0 px-2 sm:px-3"
                      >
                        <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {paymentData.expires_at && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-xs sm:text-sm text-yellow-800">
                      ⏰ Este PIX expira em 30 minutos
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
                <CreditCard className="w-8 h-8 sm:w-12 sm:h-12 text-blue-600 mx-auto mb-3 sm:mb-4" />
                <h3 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">
                  Complete o pagamento
                </h3>
                <p className="text-xs sm:text-sm text-blue-700 mb-3 sm:mb-4">
                  Uma nova aba foi aberta para finalizar seu pagamento
                </p>
                {paymentData.payment_url && (
                  <Button
                    asChild
                    className={cn(babyButtonVariants({ variant: "heart", size: "sm" }))}
                  >
                    <a href={paymentData.payment_url} target="_blank" rel="noopener noreferrer">
                      Abrir Pagamento
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
            <h4 className="font-semibold text-foreground mb-3 text-sm sm:text-base">Resumo do Pedido</h4>
            <div className="space-y-2">
              {orderItems.map((item) => (
                <div key={item.id} className="flex justify-between text-xs sm:text-sm">
                  <span className="truncate pr-2">{item.name} x{item.quantity}</span>
                  <span className="shrink-0">{formatPrice(item.price_cents * (item.quantity || 1))}</span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-semibold text-sm sm:text-base">
                <span>Total:</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={onBack} 
              variant="outline"
              className={cn(babyButtonVariants({ variant: "outline" }), "text-sm sm:text-base")}
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Voltar
            </Button>
            <Button 
              onClick={onSuccess}
              className={cn(babyButtonVariants({ variant: "heart" }), "text-sm sm:text-base")}
            >
              Concluir
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};