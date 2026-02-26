import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product, CartItem } from '../types';

export default function Transaction() {
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
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
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
      price: item.product.price,
      quantity: item.quantity,
      subtotal: item.product.price * item.quantity,
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

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Transaksi</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-4 mb-4 border border-gray-200">
            <input
              type="text"
              placeholder="Cari produk (nama atau SKU)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-white p-4 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow border border-gray-200"
              >
                <div className="flex items-center justify-center h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg mb-3">
                  <ShoppingCart size={40} className="text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">{product.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{product.sku}</p>
                <p className="text-lg font-bold text-blue-600">
                  Rp {product.price.toLocaleString('id-ID')}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Stok: {product.stock}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 sticky top-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Keranjang</h3>

            <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{item.product.name}</p>
                    <p className="text-sm text-gray-600">
                      Rp {item.product.price.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="p-1 bg-gray-300 hover:bg-gray-400 rounded transition-colors"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-8 text-center font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="p-1 bg-gray-300 hover:bg-gray-400 rounded transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors ml-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {cart.length === 0 && (
                <p className="text-center text-gray-500 py-8">Keranjang kosong</p>
              )}
            </div>

            {cart.length > 0 && (
              <>
                <div className="border-t pt-4 mb-4">
                  <div className="flex justify-between text-xl font-bold text-gray-800">
                    <span>Total:</span>
                    <span>Rp {calculateTotal().toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {!showPayment ? (
                  <button
                    onClick={() => setShowPayment(true)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <DollarSign size={20} />
                    Bayar
                  </button>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="number"
                      placeholder="Jumlah pembayaran"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    {paymentAmount && parseFloat(paymentAmount) >= calculateTotal() && (
                      <p className="text-sm text-gray-700">
                        Kembalian: <span className="font-bold">Rp {(parseFloat(paymentAmount) - calculateTotal()).toLocaleString('id-ID')}</span>
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={handleCheckout}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition-colors"
                      >
                        Konfirmasi
                      </button>
                      <button
                        onClick={() => {
                          setShowPayment(false);
                          setPaymentAmount('');
                        }}
                        className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg font-semibold transition-colors"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
