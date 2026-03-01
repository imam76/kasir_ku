import { create } from 'zustand';
import { Product, CartItem } from '@/types';

export interface ModalState {
  visible: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  data?: {
    transactionNumber?: string;
    total?: number;
    payment?: number;
    change?: number;
  } & Record<string, unknown>;
}

interface TransactionState {
  products: Product[];
  cart: CartItem[];
  searchTerm: string;
  paymentAmount: string;
  showPayment: boolean;
  modal: ModalState;

  // Actions
  setProducts: (products: Product[]) => void;
  setCart: (cart: CartItem[] | ((prev: CartItem[]) => CartItem[])) => void;
  setSearchTerm: (term: string) => void;
  setPaymentAmount: (amount: string) => void;
  setShowPayment: (show: boolean) => void;
  setModal: (modal: ModalState) => void;

  // Logical State Actions (Non-DB)
  showModal: (
    type: ModalState['type'],
    title: string,
    message: string,
    data?: ModalState['data']
  ) => void;
  closeModal: () => void;
  addToCart: (product: Product) => void;
  updateQuantity: (productId: string, newQuantity: number) => void;
  removeFromCart: (productId: string) => void;
  reset: () => void;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  products: [],
  cart: [],
  searchTerm: '',
  paymentAmount: '',
  showPayment: false,
  modal: {
    visible: false,
    type: 'info',
    title: '',
    message: '',
  },

  setProducts: (products) => set({ products }),
  setCart: (cart) => set((state) => ({
    cart: typeof cart === 'function' ? cart(state.cart) : cart
  })),
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setPaymentAmount: (paymentAmount) => set({ paymentAmount }),
  setShowPayment: (showPayment) => set({ showPayment }),
  setModal: (modal) => set({ modal }),

  showModal: (type, title, message, data) => {
    set({ modal: { visible: true, type, title, message, data: data || {} } });
  },

  closeModal: () => {
    set((state) => ({ modal: { ...state.modal, visible: false } }));
  },

  addToCart: (product) => {
    const { cart, showModal } = get();
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
      set({
        cart: cart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      });
    } else {
      set({ cart: [...cart, { product, quantity: 1 }] });
    }
  },

  updateQuantity: (productId, newQuantity) => {
    const { cart, removeFromCart, showModal } = get();
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

    set({
      cart: cart.map((item) =>
        item.product.id === productId ? { ...item, quantity: newQuantity } : item
      )
    });
  },

  removeFromCart: (productId) => {
    set((state) => ({
      cart: state.cart.filter((item) => item.product.id !== productId)
    }));
  },

  reset: () => {
    set({
      cart: [],
      paymentAmount: '',
      showPayment: false,
    });
  }
}));
