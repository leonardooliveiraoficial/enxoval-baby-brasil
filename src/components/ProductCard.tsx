import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { babyButtonVariants } from "@/components/ui/button-variants";
import { Heart, Gift, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  description?: string;
  price_cents: number;
  target_qty: number;
  purchased_qty: number;
  image_url?: string;
}

interface ProductCardProps {
  product: Product;
  onGift: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  className?: string;
}

export const ProductCard = ({ product, onGift, onAddToCart, className = "" }: ProductCardProps) => {
  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(cents / 100);
  };

  const percentage = Math.min((product.purchased_qty / product.target_qty) * 100, 100);
  const isComplete = product.purchased_qty >= product.target_qty;
  const remaining = product.target_qty - product.purchased_qty;

  return (
    <Card className={cn("overflow-hidden shadow-card hover:shadow-button transition-gentle h-full flex flex-col", className)}>
      <CardHeader className="pb-3 flex-shrink-0">
      <div className="aspect-[4/3] w-full bg-baby-blue/20 rounded-md mb-3 flex items-center justify-center">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name}
            className="w-full h-full object-cover rounded-md"
          />
        ) : (
          <Gift className="w-8 h-8 sm:w-12 sm:h-12 text-primary/60" />
        )}
      </div>
      <div className="min-h-[4rem] flex flex-col justify-start">
        <CardTitle className="text-base sm:text-lg text-foreground line-clamp-2 leading-tight">{product.name}</CardTitle>
        <div className="min-h-[3rem] mt-1">
          {product.description && (
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3">{product.description}</p>
          )}
        </div>
      </div>
      </CardHeader>
      
      <CardContent className="pt-0 flex-grow flex flex-col justify-start">
        <div className="min-h-[6rem] flex flex-col justify-between">
        <div className="flex justify-between items-baseline mb-4">
          <span className="text-base sm:text-lg font-semibold text-primary">{formatPrice(product.price_cents)}</span>
          <span className="text-xs sm:text-sm text-muted-foreground">
            {product.purchased_qty}/{product.target_qty} presentes
          </span>
        </div>
          
          <div className="space-y-2">
            <Progress 
              value={percentage} 
              className="h-2 bg-baby-blue/30"
              aria-label={`${Math.round(percentage)}% dos presentes já foram dados`}
            />
          <div className="flex justify-between text-xs text-muted-foreground min-h-[1rem]">
            <span>{Math.round(percentage)}% completo</span>
            {!isComplete && (
              <span>{remaining} restante{remaining > 1 ? 's' : ''}</span>
            )}
          </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-3 mt-auto flex-shrink-0">
        {isComplete ? (
          <Button
            disabled
            className={cn(babyButtonVariants({ 
              variant: "secondary",
              size: "default"
            }), "w-full")}
          >
            <Heart className="w-4 h-4 mr-2" />
            Meta Atingida!
          </Button>
        ) : (
          <div className="w-full space-y-2">
            <Button
              onClick={() => onGift(product)}
              className={cn(babyButtonVariants({ 
                variant: "heart",
                size: "default"
              }), "w-full text-sm sm:text-base")}
            >
              <Gift className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Presentear Agora
            </Button>
            {onAddToCart && (
              <Button
                onClick={() => onAddToCart(product)}
                variant="outline"
                className="w-full text-xs sm:text-sm"
                size="sm"
              >
                <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Adicionar ao Carrinho
              </Button>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};