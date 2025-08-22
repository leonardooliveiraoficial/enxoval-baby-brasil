import { Heart, Baby, Menu, X, Settings, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { babyButtonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useCart } from "@/contexts/CartContext";

interface HeaderProps {
  className?: string;
}

export const Header = ({ className = "" }: HeaderProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Check if we're on an admin route
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  // Use cart context if available and not on admin route
  let cartState = null;
  try {
    cartState = !isAdminRoute ? useCart().state : null;
  } catch {
    // Cart context not available, ignore
  }
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };
  
  return (
    <header className={cn("sticky top-0 z-50 w-full border-b bg-soft-white/95 backdrop-blur supports-[backdrop-filter]:bg-soft-white/80 shadow-sm", className)}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <Baby className="h-8 w-8 text-primary animate-gentle-pulse" />
            <div>
              <h1 className="text-lg font-bold text-foreground">Enxoval do Bebê</h1>
              <p className="text-xs text-muted-foreground">Lilian & Vinicius</p>
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-1">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className={cn(babyButtonVariants({ 
                variant: isActive('/') ? "tender" : "ghost" 
              }))}
            >
              <Link to="/">Início</Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className={cn(babyButtonVariants({ 
                variant: isActive('/enxoval') ? "tender" : "ghost" 
              }))}
            >
              <Link to="/enxoval">Enxoval</Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className={cn(babyButtonVariants({ 
                variant: isActive('/nossa-historia') ? "tender" : "ghost" 
              }))}
            >
              <Link to="/nossa-historia">Nossa História</Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className={cn(babyButtonVariants({ 
                variant: isActive('/mensagens') ? "tender" : "ghost" 
              }))}
            >
              <Link to="/mensagens">Mensagens</Link>
            </Button>
          </nav>
          
          <div className="flex items-center space-x-2">
            {/* Cart Button - Always visible on public pages */}
            {!isAdminRoute && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (location.pathname === '/enxoval') {
                    // If on Enxoval page, navigate to show cart
                    navigate('/enxoval?cart=true');
                  } else {
                    // If on other page, go to Enxoval
                    navigate('/enxoval');
                  }
                }}
                className="relative p-2 hover:bg-primary/10"
                title="Ver carrinho"
              >
                <ShoppingCart className="h-4 w-4" />
                {cartState && cartState.items.length > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {cartState.items.length}
                  </Badge>
                )}
                <span className="sr-only">Carrinho</span>
              </Button>
            )}
            
            {/* Admin Portal Button - Discreto */}
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="p-2 opacity-30 hover:opacity-60 transition-opacity"
              title="Portal Administrativo"
            >
              <Link to="/auth">
                <Settings className="h-4 w-4" />
                <span className="sr-only">Portal Admin</span>
              </Link>
            </Button>
            
            <Heart className="h-5 w-5 text-primary animate-gentle-pulse hidden sm:block" />
            <Button 
              variant="ghost" 
              size="sm" 
              className="md:hidden" 
              onClick={toggleMobileMenu}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
              <span className="sr-only">Menu</span>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-soft-white/95 backdrop-blur">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <nav className="flex flex-col space-y-2">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className={cn(
                  "justify-start w-full",
                  babyButtonVariants({ 
                    variant: isActive('/') ? "tender" : "ghost" 
                  })
                )}
                onClick={closeMobileMenu}
              >
                <Link to="/">Início</Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className={cn(
                  "justify-start w-full",
                  babyButtonVariants({ 
                    variant: isActive('/enxoval') ? "tender" : "ghost" 
                  })
                )}
                onClick={closeMobileMenu}
              >
                <Link to="/enxoval">Enxoval</Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className={cn(
                  "justify-start w-full",
                  babyButtonVariants({ 
                    variant: isActive('/nossa-historia') ? "tender" : "ghost" 
                  })
                )}
                onClick={closeMobileMenu}
              >
                <Link to="/nossa-historia">Nossa História</Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className={cn(
                  "justify-start w-full",
                  babyButtonVariants({ 
                    variant: isActive('/mensagens') ? "tender" : "ghost" 
                  })
                )}
                onClick={closeMobileMenu}
              >
                <Link to="/mensagens">Mensagens</Link>
              </Button>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};