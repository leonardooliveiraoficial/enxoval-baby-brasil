import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, X } from 'lucide-react';

const productSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  price_cents: z.number().min(0, 'Preço deve ser maior que zero'),
  target_qty: z.number().min(1, 'Meta deve ser pelo menos 1'),
  category_id: z.string().min(1, 'Categoria é obrigatória'),
});

type ProductForm = z.infer<typeof productSchema>;

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: any;
  categories: any[];
  onSave: () => void;
}

export const ProductDialog = ({ open, onOpenChange, product, categories, onSave }: ProductDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price_cents: 0,
      target_qty: 1,
      category_id: '',
    }
  });

  // Reset form when product changes or dialog opens
  useEffect(() => {
    if (open) {
      if (product) {
        // Editing existing product - populate form with product data
        reset({
          name: product.name || '',
          description: product.description || '',
          price_cents: product.price_cents ? product.price_cents / 100 : 0,
          target_qty: product.target_qty || 1,
          category_id: product.category_id || '',
        });
        setImagePreview(product.image_url || null);
      } else {
        // Creating new product - reset form to defaults
        reset({
          name: '',
          description: '',
          price_cents: 0,
          target_qty: 1,
          category_id: '',
        });
        setImagePreview(null);
      }
      setImageFile(null);
    }
  }, [open, product, reset]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "A imagem deve ter no máximo 5MB",
          variant: "destructive"
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Tipo de arquivo inválido",
          description: "Apenas imagens são permitidas",
          variant: "destructive"
        });
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return product?.image_url || null;

    try {
      const fileName = `${Date.now()}-${imageFile.name}`;
      const { data, error } = await supabase.storage
        .from('products')
        .upload(fileName, imageFile);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('products')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error: any) {
      toast({
        title: "Erro ao fazer upload da imagem",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  const onSubmit = async (data: ProductForm) => {
    setLoading(true);

    try {
      const imageUrl = await uploadImage();

      const productData = {
        ...data,
        price_cents: Math.round(data.price_cents * 100),
        image_url: imageUrl,
      };

      const requestBody = {
        action: product?.id ? 'update' : 'create',
        data: {
          product: product?.id ? { id: product.id, ...productData } : productData
        }
      };

      const { error } = await supabase.functions.invoke('admin-products', {
        body: requestBody
      });

      if (error) throw error;

      toast({
        title: product?.id ? "Produto atualizado" : "Produto criado",
        description: product?.id ? "Produto atualizado com sucesso" : "Produto criado com sucesso"
      });

      reset();
      setImageFile(null);
      setImagePreview(null);
      onSave();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar produto",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setImageFile(null);
    setImagePreview(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product?.id ? 'Editar Produto' : 'Novo Produto'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Imagem do Produto</Label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center relative overflow-hidden">
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setImageFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <Upload className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Escolher Imagem
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Produto *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Digite o nome do produto"
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Descrição do produto (opcional)"
              rows={3}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Categoria *</Label>
            <Select
              value={watch('category_id')}
              onValueChange={(value) => setValue('category_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category_id && (
              <p className="text-sm text-red-600">{errors.category_id.message}</p>
            )}
          </div>

          {/* Price and Target Quantity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price_cents">Preço (R$) *</Label>
              <Input
                id="price_cents"
                type="number"
                step="0.01"
                min="0"
                {...register('price_cents', { valueAsNumber: true })}
                placeholder="0,00"
              />
              {errors.price_cents && (
                <p className="text-sm text-red-600">{errors.price_cents.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_qty">Quantidade Meta *</Label>
              <Input
                id="target_qty"
                type="number"
                min="1"
                {...register('target_qty', { valueAsNumber: true })}
                placeholder="1"
              />
              {errors.target_qty && (
                <p className="text-sm text-red-600">{errors.target_qty.message}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : (product?.id ? 'Atualizar' : 'Criar')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};