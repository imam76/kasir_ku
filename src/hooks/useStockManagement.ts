import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Product } from '../types';

interface FormData {
  name: string;
  purchase_price: string;
  selling_price: string;
  stock: string;
  sku: string;
}

export const useStockManagement = () => {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    purchase_price: '',
    selling_price: '',
    stock: '',
    sku: '',
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
      resetForm();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    upsertMutation.mutate({
      name: formData.name,
      purchase_price: parseFloat(formData.purchase_price),
      selling_price: parseFloat(formData.selling_price),
      stock: parseInt(formData.stock),
      sku: formData.sku,
    });
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      purchase_price: product.purchase_price.toString(),
      selling_price: product.selling_price.toString(),
      stock: product.stock.toString(),
      sku: product.sku,
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus produk ini?')) {
      deleteMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', purchase_price: '', selling_price: '', stock: '', sku: '' });
    setIsAdding(false);
    setEditingId(null);
  };

  return {
    products,
    isLoading,
    isAdding,
    editingId,
    formData,
    setIsAdding,
    setFormData,
    handleSubmit,
    handleEdit,
    handleDelete,
    resetForm,
    isSubmitting: upsertMutation.isPending,
  };
};
