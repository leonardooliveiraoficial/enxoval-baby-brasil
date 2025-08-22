import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Tables } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Eye, Edit, Copy, Trash2, Plus, Upload } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { ProductDialog } from '@/components/admin/ProductDialog';

type Product = Tables<'products'>;

interface ProductWithCategory extends Product {
  category_name?: string;
}

export default function AdminProducts() {
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithCategory | null>(null);
  const { toast } = useToast();

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories!inner(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const productsWithCategory = data?.map(product => ({
        ...product,
        category_name: (product.categories as any)?.name || 'Sem categoria'
      })) || [];

      setProducts(productsWithCategory);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar produtos",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar categorias",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchProducts(), fetchCategories()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleToggleActive = async (productId: string, isActive: boolean) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-products', {
        body: {
          action: 'toggle_active',
          data: { id: productId }
        }
      });

      if (error) throw error;

      toast({
        title: "Produto atualizado",
        description: `Produto ${!isActive ? 'ativado' : 'desativado'} com sucesso`
      });

      fetchProducts();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar produto",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      const { error } = await supabase.functions.invoke('admin-products', {
        body: {
          action: 'delete',
          data: { id: productId }
        }
      });

      if (error) throw error;

      toast({
        title: "Produto excluído",
        description: "Produto excluído com sucesso"
      });

      fetchProducts();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir produto",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDuplicate = async (product: ProductWithCategory) => {
    const duplicatedProduct = {
      ...product,
      name: `${product.name} (Cópia)`
    };
    // Remove id so it creates a new product instead of updating
    delete (duplicatedProduct as any).id;
    
    setEditingProduct(duplicatedProduct);
    setDialogOpen(true);
  };

  const columns: ColumnDef<ProductWithCategory>[] = [
    {
      accessorKey: "image_url",
      header: "Imagem",
      cell: ({ row }) => (
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
          {row.original.image_url ? (
            <img 
              src={row.original.image_url} 
              alt={row.original.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Upload className="w-4 h-4 text-gray-400" />
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "name",
      header: "Nome",
    },
    {
      accessorKey: "category_name",
      header: "Categoria",
    },
    {
      accessorKey: "price_cents",
      header: "Preço",
      cell: ({ row }) => formatCurrency(row.original.price_cents),
    },
    {
      accessorKey: "target_qty",
      header: "Meta",
    },
    {
      accessorKey: "purchased_qty",
      header: "Comprados",
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? "default" : "secondary"}>
          {row.original.is_active ? "Ativo" : "Inativo"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditingProduct(row.original);
              setDialogOpen(true);
            }}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDuplicate(row.original)}
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleActive(row.original.id, row.original.is_active)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.original.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  const handleSaveProduct = async () => {
    await fetchProducts();
    setDialogOpen(false);
    setEditingProduct(null);
  };

  if (loading) {
    return <div>Carregando produtos...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Produtos</h1>
          <p className="text-muted-foreground">Gerencie os produtos do enxoval</p>
        </div>
        <Button onClick={() => {
          setEditingProduct(null);
          setDialogOpen(true);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Produtos</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={products}
            searchKey="name"
            searchPlaceholder="Buscar produtos..."
          />
        </CardContent>
      </Card>

      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editingProduct}
        categories={categories}
        onSave={handleSaveProduct}
      />
    </div>
  );
}