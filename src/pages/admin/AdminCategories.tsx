import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Edit, Trash2, Plus, ArrowUp, ArrowDown } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const categorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  sort_order: z.number().min(0, 'Ordem deve ser um número positivo'),
});

type CategoryForm = z.infer<typeof categorySchema>;

interface Category {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
  product_count?: number;
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
  });

  const fetchCategories = async () => {
    try {
      // Get categories with product count
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order');

      if (categoriesError) throw categoriesError;

      // Get product counts for each category
      const categoriesWithCount = await Promise.all(
        (categoriesData || []).map(async (category) => {
          const { count, error } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id);

          return {
            ...category,
            product_count: error ? 0 : (count || 0)
          };
        })
      );

      setCategories(categoriesWithCount);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar categorias",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSave = async (data: CategoryForm) => {
    try {
      const { error } = await supabase.functions.invoke('admin-categories', {
        body: {
          action: editingCategory ? 'update' : 'create',
          category_id: editingCategory?.id,
          ...data
        }
      });

      if (error) throw error;

      toast({
        title: editingCategory ? "Categoria atualizada" : "Categoria criada",
        description: editingCategory ? "Categoria atualizada com sucesso" : "Categoria criada com sucesso"
      });

      setDialogOpen(false);
      setEditingCategory(null);
      reset();
      fetchCategories();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar categoria",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (category: Category) => {
    if (category.product_count && category.product_count > 0) {
      toast({
        title: "Não é possível excluir",
        description: `Esta categoria possui ${category.product_count} produto(s) vinculado(s)`,
        variant: "destructive"
      });
      return;
    }

    if (!confirm(`Tem certeza que deseja excluir a categoria "${category.name}"?`)) return;

    try {
      const { error } = await supabase.functions.invoke('admin-categories', {
        body: {
          action: 'delete',
          category_id: category.id
        }
      });

      if (error) throw error;

      toast({
        title: "Categoria excluída",
        description: "Categoria excluída com sucesso"
      });

      fetchCategories();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir categoria",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleMoveCategory = async (categoryId: string, direction: 'up' | 'down') => {
    try {
      const { error } = await supabase.functions.invoke('admin-categories', {
        body: {
          action: 'reorder',
          category_id: categoryId,
          direction
        }
      });

      if (error) throw error;

      fetchCategories();
    } catch (error: any) {
      toast({
        title: "Erro ao reordenar categoria",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setValue('name', category.name);
    setValue('sort_order', category.sort_order);
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingCategory(null);
    reset();
    setValue('sort_order', categories.length);
    setDialogOpen(true);
  };

  const columns: ColumnDef<Category>[] = [
    {
      accessorKey: "sort_order",
      header: "Ordem",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <span>{row.original.sort_order}</span>
          <div className="flex flex-col">
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0"
              onClick={() => handleMoveCategory(row.original.id, 'up')}
              disabled={row.index === 0}
            >
              <ArrowUp className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0"
              onClick={() => handleMoveCategory(row.original.id, 'down')}
              disabled={row.index === categories.length - 1}
            >
              <ArrowDown className="w-3 h-3" />
            </Button>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "name",
      header: "Nome",
    },
    {
      accessorKey: "product_count",
      header: "Produtos",
      cell: ({ row }) => row.original.product_count || 0,
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditDialog(row.original)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.original)}
            disabled={(row.original.product_count || 0) > 0}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return <div>Carregando categorias...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Categorias</h1>
          <p className="text-muted-foreground">Organize os produtos em categorias</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Categorias</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={categories}
            searchKey="name"
            searchPlaceholder="Buscar categorias..."
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) {
          setEditingCategory(null);
          reset();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Categoria *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Digite o nome da categoria"
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sort_order">Ordem de Exibição *</Label>
              <Input
                id="sort_order"
                type="number"
                min="0"
                {...register('sort_order', { valueAsNumber: true })}
                placeholder="0"
              />
              {errors.sort_order && (
                <p className="text-sm text-red-600">{errors.sort_order.message}</p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editingCategory ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}