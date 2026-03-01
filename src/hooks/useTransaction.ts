import { useEffect, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useTransactionStore } from '@/store/transactionStore';

export const useTransaction = () => {
  const queryClient = useQueryClient();
  const {
    products,
    cart,
    searchTerm,
    paymentAmount,
    showPayment,
    modal,
    setProducts,
    setSearchTerm,
    setPaymentAmount,
    setShowPayment,
    showModal,
    addToCart,
    updateQuantity,
    removeFromCart,
    closeModal,
    reset,
  } = useTransactionStore();

  const loadProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');

    if (!error && data) {
      setProducts(data);
    }
  }, [setProducts]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const calculateTotal = useCallback(() => {
    return cart.reduce((sum, item) => sum + item.product.selling_price * item.quantity, 0);
  }, [cart]);

  const handleCheckout = async () => {
    const total = calculateTotal();
    const payment = parseFloat(paymentAmount);

    if (isNaN(payment) || payment < total) {
      showModal('error', 'Pembayaran Tidak Valid', 'Jumlah pembayaran tidak valid atau kurang!');
      return;
    }

    const transactionNumber = `TRX-${Date.now()}`;
    const change = payment - total;

    const { data: transaction, error: transError } = await supabase
      .from('transactions')
      .insert({
        transaction_number: transactionNumber,
        total_amount: total,
        payment_amount: payment,
        change_amount: change,
      })
      .select()
      .single();

    if (transError || !transaction) {
      showModal('error', 'Gagal Membuat Transaksi', 'Terjadi kesalahan saat membuat transaksi. Silakan coba lagi.');
      return;
    }

    const transactionItems = cart.map((item) => ({
      transaction_id: transaction.id,
      product_id: item.product.id,
      product_name: item.product.name,
      price: item.product.selling_price,
      purchase_price: item.product.purchase_price,
      quantity: item.quantity,
      subtotal: item.product.selling_price * item.quantity,
      profit: (item.product.selling_price - item.product.purchase_price) * item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from('transaction_items')
      .insert(transactionItems);

    if (itemsError) {
      showModal('error', 'Gagal Menyimpan Item', 'Terjadi kesalahan saat menyimpan item transaksi. Silakan coba lagi.');
      return;
    }

    for (const item of cart) {
      await supabase
        .from('products')
        .update({ stock: item.product.stock - item.quantity })
        .eq('id', item.product.id);
    }

    showModal('success', 'Transaksi Berhasil', 'Transaksi telah berhasil disimpan.', {
      transactionNumber,
      total,
      payment,
      change,
    });

    queryClient.invalidateQueries({ queryKey: ['transactions-history'] });
    reset();
    loadProducts();
  };

  return {
    products,
    cart,
    searchTerm,
    paymentAmount,
    showPayment,
    filteredProducts,
    addToCart,
    updateQuantity,
    removeFromCart,
    calculateTotal,
    handleCheckout,
    clearCart: reset,
    setSearchTerm,
    setPaymentAmount,
    setShowPayment,
    modal,
    closeModal,
  };
};
