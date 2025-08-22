import { useState, useEffect } from 'react';
import { ProductCard } from './ProductCard';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { babyButtonVariants } from "@/components/ui/button-variants";
import { supabase } from "@/integrations/supabase/client";
import { Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";

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

interface Category {
  id: string;
  name: string;
  sort_order: number;
}

interface ProductListProps {
  onProductSelect: (product: Product) => void;
}

export const ProductList = ({ onProductSelect }: ProductListProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { addToCart } = useCart();

  const handleAddToCart = (product: Product) => {
    addToCart(product);
  };

  useEffect(() => {
    fetchData();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('products-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        () => {
          fetchProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      await Promise.all([fetchCategories(), fetchProducts()]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar produtos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order');

    if (error) throw error;
    setCategories(data || []);
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories (
          id,
          name
        )
      `)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    setProducts(data || []);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchTerm || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
      product.category_id === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-baby-blue/20 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-96 bg-baby-blue/20 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">Lista do Enxoval</h2>
        <p className="text-muted-foreground">Escolha um presente especial para o nosso bebê ❤️</p>
      </div>

      {/* Search and Filter */}
      <div className="mb-8 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setSelectedCategory('all')}
            className={cn(babyButtonVariants({ 
              variant: selectedCategory === 'all' ? "default" : "outline",
              size: "sm"
            }))}
          >
            <Filter className="w-4 h-4 mr-1" />
            Todas as Categorias
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={cn(babyButtonVariants({ 
                variant: selectedCategory === category.id ? "default" : "outline",
                size: "sm"
              }))}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum produto encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onGift={onProductSelect}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      )}
    </section>
  );
};