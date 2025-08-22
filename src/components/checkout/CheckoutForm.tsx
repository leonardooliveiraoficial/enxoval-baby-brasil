import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { babyButtonVariants } from "@/components/ui/button-variants";

interface CheckoutFormData {
  purchaser_name: string;
  purchaser_email: string;
  payment_method: 'pix' | 'credit' | 'debit';
  quantity: number;
  installments: number;
}

interface CheckoutFormProps {
  formData: CheckoutFormData;
  setFormData: (data: CheckoutFormData) => void;
  loading: boolean;
  preloading: boolean;
  totalAmount: number;
  preloadedInitPoint: string | null;
  onSubmit: (e: React.FormEvent) => void;
  showQuantitySelect?: boolean;
  maxQuantity?: number;
  className?: string;
}

export const CheckoutForm = ({
  formData,
  setFormData,
  loading,
  preloading,
  totalAmount,
  preloadedInitPoint,
  onSubmit,
  showQuantitySelect = false,
  maxQuantity = 5,
  className = ""
}: CheckoutFormProps) => {
  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(cents / 100);
  };

  return (
    <form onSubmit={onSubmit} className={`space-y-6 ${className}`}>
      <h3 className="font-semibold text-foreground text-xl text-center">Seus Dados</h3>
      
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-foreground">Nome completo *</Label>
          <Input
            id="name"
            value={formData.purchaser_name}
            onChange={(e) => setFormData({ ...formData, purchaser_name: e.target.value })}
            placeholder="Seu nome completo"
            required
            className="text-sm sm:text-base"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-foreground">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.purchaser_email}
            onChange={(e) => setFormData({ ...formData, purchaser_email: e.target.value })}
            placeholder="seu@email.com"
            required
            className="text-sm sm:text-base"
          />
        </div>
      </div>

      {showQuantitySelect && (
        <div className="space-y-2">
          <Label htmlFor="quantity" className="text-foreground">Quantidade</Label>
          <Select 
            value={formData.quantity.toString()}
            onValueChange={(value) => setFormData({ ...formData, quantity: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[...Array(maxQuantity)].map((_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>
                  {i + 1} unidade{i > 0 ? 's' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-4 text-center">
        <p className="text-xs sm:text-sm text-muted-foreground">
          O pagamento será processado através do Mercado Pago com total segurança.
        </p>
        
        <Button
          type="submit"
          disabled={loading || (!preloadedInitPoint && !formData.purchaser_name.trim())}
          className={cn(
            babyButtonVariants({ variant: "heart", size: "lg" }), 
            "w-full max-w-md mx-auto text-sm sm:text-lg py-4 sm:py-6"
          )}
        >
          {loading ? "Processando..." : preloading ? "Preparando..." : `Finalizar Presente - ${formatPrice(totalAmount)}`}
        </Button>
      </div>
    </form>
  );
};