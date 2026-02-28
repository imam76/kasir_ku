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
}

export const useStockManagement = () => {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
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
    mutationFn: async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
      if (editingId) {
        const { error } = await supabase
          .from('products')
          .update({
            ...productData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
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
    });
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setValue('name', product.name);
    setValue('purchase_price', product.purchase_price);
    setValue('selling_price', product.selling_price);
    setValue('stock', product.stock);
    setValue('sku', product.sku);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus produk ini?')) {
      deleteMutation.mutate(id);
    }
  };

  const resetFormData = () => {
    reset();
    setEditingId(null);
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
