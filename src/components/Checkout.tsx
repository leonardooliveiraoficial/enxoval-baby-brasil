import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { babyButtonVariants } from "@/components/ui/button-variants";
import { CheckoutOrderSummary } from "./checkout/CheckoutOrderSummary";
import { CheckoutForm } from "./checkout/CheckoutForm";
import { CheckoutPayment } from "./checkout/CheckoutPayment";

interface Product {
  id: string;
  name: string;
  price_cents: number;
  target_qty: number;
  purchased_qty: number;
  quantity?: number;
}

interface CheckoutProps {
  product?: Product;
  products?: Product[];
  quantities?: Record<string, number>;
  onBack: () => void;
  onSuccess: () => void;
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

export const Checkout = ({ product, products, quantities: initialQuantities, onBack, onSuccess }: CheckoutProps) => {
  // State for quantities - use localStorage for persistence
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const stored = localStorage.getItem('checkout-quantities');
    if (stored && !product) { // Only use stored quantities for multi-product checkout
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.warn('Invalid stored quantities:', e);
      }
    }
    // Initialize quantities
    if (initialQuantities) return initialQuantities;
    if (products) {
      const initialQty: Record<string, number> = {};
      products.forEach(p => {
        initialQty[p.id] = 1;
      });
      return initialQty;
    }
    return {};
  });

  const [formData, setFormData] = useState({
    purchaser_name: '',
    purchaser_email: '',
    payment_method: 'pix' as 'pix' | 'credit' | 'debit',
    quantity: 1,
    installments: 1
  });
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [preloadedInitPoint, setPreloadedInitPoint] = useState<string | null>(null);
  const [preloading, setPreloading] = useState(false);
  const { toast } = useToast();

  // Save quantities to localStorage when changed (for multi-product only)
  useEffect(() => {
    if (!product && products) { // Only persist for multi-product checkout
      localStorage.setItem('checkout-quantities', JSON.stringify(quantities));
    }
  }, [quantities, product, products]);

  // Handle quantity changes
  const handleQuantityChange = (productId: string, quantity: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: quantity
    }));
    // Clear preloaded init point when quantities change
    setPreloadedInitPoint(null);
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(cents / 100);
  };

  // Calculate order details - use individual quantities for multi-product or form quantity for single product
  const orderItems = products 
    ? products.map(p => ({ ...p, quantity: quantities[p.id] || 1 }))
    : product 
    ? [{ ...product, quantity: formData.quantity }]
    : [];
  
  const totalAmount = orderItems.reduce((sum, item) => sum + (item.price_cents * item.quantity), 0);
  
  // For single product compatibility - ensure we have the right structure
  const remaining = product ? product.target_qty - product.purchased_qty : 0;
  const maxQuantity = product ? Math.min(remaining, 5) : 5; // Max 5 units per order

  // Enhanced iOS-compatible navigation function - WEB ONLY (no deeplinks)
  const goToMP = useCallback((url: string) => {
    console.log("Navegando para MercadoPago:", url);
    
    // Ensure URL is always HTTPS web version (no mercadopago:// schemes)
    let finalUrl = url;
    if (url.startsWith('mercadopago://')) {
      // Convert app scheme to web version
      finalUrl = url.replace('mercadopago://', 'https://www.mercadopago.com.br/');
      console.log("Convertido para versão web:", finalUrl);
    }
    
    // Ensure it's HTTPS
    if (!finalUrl.startsWith('https://')) {
      console.error("URL must be HTTPS:", finalUrl);
      return;
    }
    
    // 1st attempt: direct navigation (same tab, same gesture)
    try { 
      window.location.assign(finalUrl); 
      return; 
    } catch (e) {
      console.warn("Direct navigation failed:", e);
    }
    
    // 2nd fallback: programmatically clicked anchor (same tab)
    try {
      const a = document.createElement('a');
      a.href = finalUrl; 
      a.target = '_self'; // Force same tab
      a.rel = 'noopener external';
      document.body.appendChild(a); 
      a.click(); 
      a.remove();
      return;
    } catch (e) {
      console.warn("Anchor navigation failed:", e);
    }
    
    // 3rd fallback: GET form submission (iOS compatibility)
    try {
      const f = document.createElement('form');
      f.method = 'GET'; 
      f.action = finalUrl; 
      f.target = '_self'; // Same tab
      document.body.appendChild(f); 
      f.submit();
      f.remove();
      return;
    } catch (e) {
      console.error("All navigation methods failed:", e);
      // Last resort: try window.location.href
      try {
        window.location.href = finalUrl;
      } catch (finalError) {
        console.error("Final fallback failed:", finalError);
        toast({
          title: "Erro de navegação",
          description: "Não foi possível abrir o checkout. Tente novamente.",
          variant: "destructive",
        });
      }
    }
  }, [toast]);

  // Pre-load checkout preference to preserve click gesture
  const preloadCheckoutPreference = useCallback(async () => {
    if (preloading || preloadedInitPoint) return;

    // Only preload if we have valid form data
    if (!formData.purchaser_name.trim() || !formData.purchaser_email.trim()) return;

    setPreloading(true);
    try {
      // Preparar dados do produto para Checkout Pro
      const productData = orderItems.length === 1 
        ? {
            title: `Presente para o bebê: ${orderItems[0].name}`,
            quantity: orderItems[0].quantity,
            amount: orderItems[0].price_cents / 100 // Converter para reais
          }
        : {
            title: `Presentes para o bebê (${orderItems.length} itens)`,
            quantity: 1,
            amount: totalAmount / 100 // Converter para reais
          };

      console.log("Precarregando checkout preference:", productData);

      const { data, error } = await supabase.functions.invoke('mp-checkout', {
        body: productData
      });

      if (error) throw error;

      // Se retornou erro do Mercado Pago
      if (data.error === 'MP_FAIL') {
        console.error("Erro MP no preload:", data.detail);
        return; // Don't show error toast for preload, just fail silently
      }

      if (data.error) {
        console.error("Erro no preload:", data.detail || data.error);
        return;
      }

      // Store the init_point for immediate use
      if (data.init_point) {
        console.log("Checkout preference precarregado:", data.init_point);
        setPreloadedInitPoint(data.init_point);
      }

    } catch (error: any) {
      console.error('Preload error:', error);
      // Fail silently for preload
    } finally {
      setPreloading(false);
    }
  }, [formData.purchaser_name, formData.purchaser_email, orderItems, totalAmount, preloading, preloadedInitPoint, supabase.functions]);

  // Preload when form becomes valid
  useEffect(() => {
    if (formData.purchaser_name.trim() && formData.purchaser_email.trim() && !preloadedInitPoint) {
      // Debounce the preload
      const timer = setTimeout(() => {
        preloadCheckoutPreference();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [formData.purchaser_name, formData.purchaser_email, preloadCheckoutPreference, preloadedInitPoint, totalAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.purchaser_name.trim() || !formData.purchaser_email.trim()) {
        throw new Error('Nome e email são obrigatórios');
      }

      let initPoint = preloadedInitPoint;

      // If we don't have a preloaded init_point, create one now
      if (!initPoint) {
        console.log("Criando checkout preference em tempo real...");
        
        // Preparar dados do produto para Checkout Pro
        const productData = orderItems.length === 1 
          ? {
              title: `Presente para o bebê: ${orderItems[0].name}`,
              quantity: orderItems[0].quantity,
              amount: orderItems[0].price_cents / 100 // Converter para reais
            }
          : {
              title: `Presentes para o bebê (${orderItems.length} itens)`,
              quantity: 1,
              amount: totalAmount / 100 // Converter para reais
            };

        console.log("Chamando mp-checkout com:", productData);

        const { data, error } = await supabase.functions.invoke('mp-checkout', {
          body: productData
        });

        if (error) throw error;

        console.log("Resposta mp-checkout:", data);

        // Se retornou erro do Mercado Pago
        if (data.error === 'MP_FAIL') {
          console.error("Erro detalhado do MP:", data.detail);
          throw new Error(`Erro na configuração do Mercado Pago: ${data.detail.message || 'Verifique as credenciais'}`);
        }

        if (data.error) {
          throw new Error(`Erro: ${data.detail || data.error}`);
        }

        initPoint = data.init_point;
      } else {
        console.log("Usando checkout preference precarregado");
      }

      // Redirecionar para o Checkout Pro usando navegação iOS-compatível
      if (initPoint) {
        console.log("Redirecionando para:", initPoint);
        goToMP(initPoint);
      } else {
        throw new Error('Link de pagamento não recebido');
      }

    } catch (error: any) {
      console.error('Checkout error:', error);
      
      let errorMessage = "Erro ao processar pagamento";
      
      if (error.message?.includes('MP_FAIL')) {
        errorMessage = "Erro na configuração do Mercado Pago. Contate o administrador.";
      } else if (error.message?.includes('MISSING_CONFIG')) {
        errorMessage = "Configuração do pagamento não encontrada. Contate o administrador.";
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      toast({
        title: "Erro no checkout",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyPixCode = async () => {
    if (paymentData?.pix_qr_code) {
      await navigator.clipboard.writeText(paymentData.pix_qr_code);
      toast({
        title: "Código copiado!",
        description: "Cole no seu app bancário para pagar",
      });
    }
  };

  if (paymentData) {
    return (
      <CheckoutPayment
        paymentData={paymentData}
        orderItems={orderItems}
        totalAmount={totalAmount}
        paymentMethod={formData.payment_method}
        onBack={onBack}
        onSuccess={onSuccess}
        copyPixCode={copyPixCode}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8 max-w-4xl">
      <div className="mb-4 sm:mb-6">
        <Button 
          onClick={onBack} 
          variant="ghost" 
          className="p-0 h-auto font-normal text-muted-foreground hover:text-foreground text-sm sm:text-base"
        >
          <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
          Voltar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl text-center text-foreground">
            Finalizar Presente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8">
            {/* Order Summary with individual quantities - only for multi-product */}
            {!product && (
              <CheckoutOrderSummary
                products={orderItems}
                quantities={quantities}
                onQuantityChange={handleQuantityChange}
              />
            )}

            {/* Single product summary */}
            {product && (
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground text-xl text-center">Resumo do Pedido</h3>
                <div className="bg-gray-50 rounded-lg p-4 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 space-y-3 sm:space-y-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm sm:text-base">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatPrice(product.price_cents)} cada
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground text-sm sm:text-base">
                        {formatPrice(product.price_cents * formData.quantity)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formData.quantity} unidade{formData.quantity > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg sm:text-2xl font-bold text-foreground">
                      <span>Total:</span>
                      <span className="text-primary">{formatPrice(totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Checkout Form */}
            <CheckoutForm
              formData={formData}
              setFormData={setFormData}
              loading={loading}
              preloading={preloading}
              totalAmount={totalAmount}
              preloadedInitPoint={preloadedInitPoint}
              onSubmit={handleSubmit}
              showQuantitySelect={!!product}
              maxQuantity={maxQuantity}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};