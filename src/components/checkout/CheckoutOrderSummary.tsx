import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price_cents: number;
  target_qty: number;
  purchased_qty: number;
  quantity?: number;
}

interface CheckoutOrderSummaryProps {
  products: Product[];
  quantities: Record<string, number>;
  onQuantityChange: (productId: string, quantity: number) => void;
  className?: string;
}

export const CheckoutOrderSummary = ({ 
  products, 
  quantities, 
  onQuantityChange, 
  className = "" 
}: CheckoutOrderSummaryProps) => {
  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(cents / 100);
  };

  const updateQuantity = (productId: string, change: number) => {
    const currentQty = quantities[productId] || 1;
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const remaining = product.target_qty - product.purchased_qty;
    const maxQuantity = Math.min(remaining, 5);
    const newQuantity = Math.max(1, Math.min(maxQuantity, currentQty + change));
    
    if (newQuantity !== currentQty) {
      onQuantityChange(productId, newQuantity);
    }
  };

  const totalAmount = products.reduce((sum, product) => {
    const qty = quantities[product.id] || 1;
    return sum + (product.price_cents * qty);
  }, 0);

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="font-semibold text-foreground text-xl text-center">Resumo do Pedido</h3>
      <div className="bg-gray-50 rounded-lg p-4 sm:p-6 space-y-4">
        {products.map((product) => {
          const quantity = quantities[product.id] || 1;
          const remaining = product.target_qty - product.purchased_qty;
          const maxQuantity = Math.min(remaining, 5);
          
          return (
            <div key={product.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-gray-200 last:border-0 space-y-3 sm:space-y-0">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm sm:text-base">{product.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatPrice(product.price_cents)} cada
                </p>
              </div>
              
              <div className="flex items-center justify-between sm:justify-end sm:space-x-4">
                {/* Quantity controls */}
                <div className="flex items-center space-x-2 bg-white rounded-md border p-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-gray-100"
                    onClick={() => updateQuantity(product.id, -1)}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  
                  <span className="w-8 text-center text-sm font-medium">
                    {quantity}
                  </span>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-gray-100"
                    onClick={() => updateQuantity(product.id, 1)}
                    disabled={quantity >= maxQuantity}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                
                {/* Subtotal */}
                <div className="text-right">
                  <p className="font-semibold text-foreground text-sm sm:text-base">
                    {formatPrice(product.price_cents * quantity)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {quantity} unidade{quantity > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        
        <div className="border-t pt-4">
          <div className="flex justify-between text-lg sm:text-2xl font-bold text-foreground">
            <span>Total:</span>
            <span className="text-primary">{formatPrice(totalAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};