import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Product, CartItem } from '../types';

export const useTransaction = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [showPayment, setShowPayment] = useState(false);

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

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: Product) => {
    if (product.stock < 1) {
      alert('Stok tidak tersedia!');
      return;
    }

    const existingItem = cart.find((item) => item.product.id === product.id);

    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        alert('Stok tidak mencukupi!');
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
      alert('Stok tidak mencukupi!');
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
      alert('Jumlah pembayaran tidak valid atau kurang!');
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
      alert('Gagal membuat transaksi!');
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
      alert('Gagal menyimpan item transaksi!');
      return;
    }

    for (const item of cart) {
      await supabase
        .from('products')
        .update({ stock: item.product.stock - item.quantity })
        .eq('id', item.product.id);
    }

    alert(`Transaksi berhasil!\n\nTotal: Rp ${total.toLocaleString('id-ID')}\nBayar: Rp ${payment.toLocaleString('id-ID')}\nKembali: Rp ${change.toLocaleString('id-ID')}`);

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
  };
};
