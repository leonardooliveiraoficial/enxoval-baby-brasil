import { useState, useEffect } from 'react';
import { Header } from "@/components/Header";
import { ProductList } from "@/components/ProductList";
import { Checkout } from "@/components/Checkout";
import { Cart } from "@/components/Cart";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useNavigate } from "react-router-dom";

interface Product {
  id: string;
  name: string;
  description?: string;
  price_cents: number;
  target_qty: number;
  purchased_qty: number;
  image_url?: string;
  category_id: string;
  categories: {
    id: string;
    name: string;
  };
}

export default function Enxoval() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // Check if we should show cart based on URL parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('cart') === 'true') {
      setShowCart(true);
      setShowCheckout(false);
      setSelectedProduct(null);
      // Clean the URL
      navigate('/enxoval', { replace: true });
    }
  }, [location.search, navigate]);

  const handleProductSelect = (product: Product) => {
    // Check if product is still available
    if (product.purchased_qty >= product.target_qty) {
      toast({
        title: "Produto indisponível",
        description: "Este produto já atingiu a meta de presentes!",
        variant: "destructive",
      });
      return;
    }

    setSelectedProduct(product);
    setShowCheckout(true);
  };

  const handleCheckoutBack = () => {
    if (showCart) {
      setShowCheckout(false);
      setShowCart(true);
    } else {
      setShowCheckout(false);
      setSelectedProduct(null);
    }
  };

  const handleCheckoutSuccess = () => {
    setShowCheckout(false);
    setShowCart(false);
    setSelectedProduct(null);
    toast({
      title: "Muito obrigado! ❤️",
      description: "Seu presente foi processado com sucesso!",
    });
  };

  const handleCartBack = () => {
    setShowCart(false);
  };

  const handleCartProceedToCheckout = () => {
    setShowCart(false);
    setShowCheckout(true);
  };

  const EnxovalContent = () => {
    const { state, clearCart } = useCart();

    const handleCheckoutSuccessWithCart = () => {
      clearCart(); // Clear cart after successful purchase
      handleCheckoutSuccess();
    };

    return (
      <>
        {showCheckout ? (
          <Checkout
            product={selectedProduct || undefined}
            products={state.items.length > 0 ? state.items : undefined}
            quantities={state.items.reduce((acc, item) => ({ ...acc, [item.id]: item.quantity }), {})}
            onBack={handleCheckoutBack}
            onSuccess={state.items.length > 0 ? handleCheckoutSuccessWithCart : handleCheckoutSuccess}
          />
        ) : showCart ? (
          <div className="container mx-auto px-4 py-8">
            <Cart
              onBack={handleCartBack}
              onProceedToCheckout={handleCartProceedToCheckout}
            />
          </div>
        ) : (
          <ProductList onProductSelect={handleProductSelect} />
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <EnxovalContent />
    </div>
  );
}