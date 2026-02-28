import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Product } from '../types';

interface FormData {
  name: string;
  purchase_price: number | undefined;
  selling_price: number | undefined;
  stock: number | undefined;
  sku: string;
  purchase_quantity?: number | undefined;
}

export const useStockManagement = () => {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previousStock, setPreviousStock] = useState<number>(0);
  const {
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      purchase_price: undefined,
      selling_price: undefined,
      stock: undefined,
      sku: '',
      purchase_quantity: undefined,
    },
  });

  // Fetch products query
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Upsert (add/update) mutation
  const upsertMutation = useMutation({
    mutationFn: async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'> & { purchase_quantity?: number }) => {
      const purchase_quantity = productData.purchase_quantity || 0;
      const cleanData = {
        name: productData.name,
        purchase_price: productData.purchase_price ?? 0,
        selling_price: productData.selling_price ?? 0,
        stock: productData.stock ?? 0,
        sku: productData.sku,
      };

      if (editingId) {
        // Update product
        const { error } = await supabase
          .from('products')
          .update({
            ...cleanData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId);

        if (error) throw error;

        // Record purchase if stock was added
        if (purchase_quantity > 0) {
          const { error: purchaseError } = await supabase
            .from('stock_purchases')
            .insert({
              product_id: editingId,
              product_name: cleanData.name,
              sku: cleanData.sku,
              quantity: purchase_quantity,
              cost_per_unit: cleanData.purchase_price,
              total_cost: cleanData.purchase_price * purchase_quantity,
            });

          if (purchaseError) throw purchaseError;
        }
      } else {
        // Create new product
        const { data: newProduct, error: insertError } = await supabase
          .from('products')
          .insert(cleanData)
          .select()
          .single();

        if (insertError) throw insertError;

        // Record initial purchase if stock was added
        if (purchase_quantity > 0 && newProduct) {
          const { error: purchaseError } = await supabase
            .from('stock_purchases')
            .insert({
              product_id: newProduct.id,
              product_name: cleanData.name,
              sku: cleanData.sku,
              quantity: purchase_quantity,
              cost_per_unit: cleanData.purchase_price,
              total_cost: cleanData.purchase_price * purchase_quantity,
            });

          if (purchaseError) throw purchaseError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseReport'] });
      resetFormData();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const onSubmit = async (data: FormData) => {
    await upsertMutation.mutateAsync({
      name: data.name,
      purchase_price: data.purchase_price ?? 0,
      selling_price: data.selling_price ?? 0,
      stock: data.stock ?? 0,
      sku: data.sku,
      purchase_quantity: data.purchase_quantity || 0,
    });
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setPreviousStock(product.stock);
    setValue('name', product.name);
    setValue('purchase_price', product.purchase_price);
    setValue('selling_price', product.selling_price);
    setValue('stock', product.stock);
    setValue('sku', product.sku);
    setValue('purchase_quantity', 0);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus produk ini?')) {
      deleteMutation.mutate(id);
    }
  };

  const resetFormData = () => {
    reset();
    setEditingId(null);
    setPreviousStock(0);
  };

  return {
    products,
    isLoading,
    editingId,
    control,
    handleSubmit: handleSubmit(onSubmit),
    handleEdit,
    handleDelete,
    resetForm: resetFormData,
    errors,
    watch,
    isSubmitting: upsertMutation.isPending,
  };
};
