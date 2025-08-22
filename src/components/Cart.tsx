import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface CartProps {
  onBack: () => void;
  onProceedToCheckout: () => void;
}

export const Cart = ({ onBack, onProceedToCheckout }: CartProps) => {
  const { state, removeFromCart, updateQuantity } = useCart();

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  if (state.items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
        <ShoppingBag className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-semibold text-foreground">Carrinho vazio</h2>
        <p className="text-muted-foreground max-w-md">
          Seu carrinho está vazio. Adicione alguns produtos para continuar com a compra.
        </p>
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Enxoval
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button onClick={onBack} variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-foreground leading-tight mb-1">Carrinho de Compras</h1>
          <p className="text-xs text-muted-foreground">
            {state.items.length} {state.items.length === 1 ? 'item' : 'itens'} selecionados
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {state.items.map((item) => (
            <Card key={item.id} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm sm:text-base font-semibold text-foreground leading-tight line-clamp-2 break-words">
                          {item.name}
                        </h3>
                        <Badge variant="secondary" className="mt-1">
                          {item.categories.name}
                        </Badge>
                        {item.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        
                        <Input
                          type="number"
                          min="1"
                          max={item.target_qty - item.purchased_qty}
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                          className="w-16 text-center"
                        />
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          disabled={item.quantity >= (item.target_qty - item.purchased_qty)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="w-26 text-right flex-shrink-0">
                        <div className="font-bold text-base text-foreground">
                          {formatCurrency(item.price_cents * item.quantity)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(item.price_cents)} cada
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal ({state.items.length} {state.items.length === 1 ? 'item' : 'itens'})</span>
                  <span>{formatCurrency(state.total)}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(state.total)}</span>
                </div>
              </div>
              
              <Button
                className="w-full"
                size="lg"
                onClick={onProceedToCheckout}
                disabled={state.items.length === 0}
              >
                Finalizar Compra
              </Button>
              
              <div className="text-xs text-muted-foreground text-center">
                Processamento seguro via Stripe
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};