import { useState, useEffect } from 'react';
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
  const [products, setProducts] = useState<Product[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    purchase_price: '',
    selling_price: '',
    stock: '',
    sku: '',
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProducts(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      const { error } = await supabase
        .from('products')
        .update({
          name: formData.name,
          purchase_price: parseFloat(formData.purchase_price),
          selling_price: parseFloat(formData.selling_price),
          stock: parseInt(formData.stock),
          sku: formData.sku,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingId);

      if (!error) {
        setEditingId(null);
        resetForm();
        loadProducts();
      }
    } else {
      const { error } = await supabase
        .from('products')
        .insert({
          name: formData.name,
          purchase_price: parseFloat(formData.purchase_price),
          selling_price: parseFloat(formData.selling_price),
          stock: parseInt(formData.stock),
          sku: formData.sku,
        });

      if (!error) {
        setIsAdding(false);
        resetForm();
        loadProducts();
      }
    }
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
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (!error) {
        loadProducts();
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', purchase_price: '', selling_price: '', stock: '', sku: '' });
    setIsAdding(false);
    setEditingId(null);
  };

  return {
    products,
    isAdding,
    editingId,
    formData,
    setIsAdding,
    setFormData,
    handleSubmit,
    handleEdit,
    handleDelete,
    resetForm,
  };
};
