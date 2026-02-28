import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Product, CartItem } from '../types';

interface ModalState {
  visible: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  data?: Record<string, any>;
}

export const useTransaction = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [modal, setModal] = useState<ModalState>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');

    if (!error && data) {
      setProducts(data);
    }
  };

  const showModal = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
    data?: Record<string, any>
  ) => {
    setModal({ visible: true, type, title, message, data });
  };

  const closeModal = () => {
    setModal({ ...modal, visible: false });
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: Product) => {
    if (product.stock < 1) {
      showModal('error', 'Stok Tidak Tersedia', 'Stok produk ini tidak tersedia saat ini.');
      return;
    }

    const existingItem = cart.find((item) => item.product.id === product.id);

    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        showModal('error', 'Stok Tidak Mencukupi', `Stok hanya tersedia ${product.stock} unit.`);
        return;
      }
      setCart(
        cart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    const item = cart.find((i) => i.product.id === productId);
    if (!item) return;

    if (newQuantity > item.product.stock) {
      showModal('error', 'Stok Tidak Mencukupi', `Stok hanya tersedia ${item.product.stock} unit.`);
      return;
    }

    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }

    setCart(
      cart.map((item) =>
        item.product.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.product.selling_price * item.quantity, 0);
  };

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

    setCart([]);
    setPaymentAmount('');
    setShowPayment(false);
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
    setSearchTerm,
    setPaymentAmount,
    setShowPayment,
    modal,
    closeModal,
  };
};
