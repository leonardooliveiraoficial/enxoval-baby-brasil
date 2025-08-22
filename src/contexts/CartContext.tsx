import { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  id: string;
  name: string;
  description?: string;
  price_cents: number;
  quantity: number;
  image_url?: string;
  category_id: string;
  target_qty: number;
  purchased_qty: number;
  categories: {
    id: string;
    name: string;
  };
}

interface CartState {
  items: CartItem[];
  total: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'quantity'> & { quantity?: number } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartState };

// Load cart from localStorage
const loadCartFromStorage = (): CartState => {
  try {
    const savedCart = localStorage.getItem('enxoval-cart');
    if (savedCart) {
      return JSON.parse(savedCart);
    }
  } catch (error) {
    console.error('Error loading cart from localStorage:', error);
  }
  return {
    items: [],
    total: 0,
  };
};

// Save cart to localStorage
const saveCartToStorage = (state: CartState) => {
  try {
    localStorage.setItem('enxoval-cart', JSON.stringify(state));
  } catch (error) {
    console.error('Error saving cart to localStorage:', error);
  }
};

const initialState: CartState = {
  items: [],
  total: 0,
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  let newState: CartState;
  
  switch (action.type) {
    case 'LOAD_CART':
      return action.payload;
      
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      const quantity = action.payload.quantity || 1;
      
      let newItems;
      if (existingItem) {
        newItems = state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        newItems = [...state.items, { ...action.payload, quantity }];
      }
      
      const total = newItems.reduce((sum, item) => sum + (item.price_cents * item.quantity), 0);
      newState = { items: newItems, total };
      saveCartToStorage(newState);
      return newState;
    }
    
    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.id !== action.payload);
      const total = newItems.reduce((sum, item) => sum + (item.price_cents * item.quantity), 0);
      newState = { items: newItems, total };
      saveCartToStorage(newState);
      return newState;
    }
    
    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        const newItems = state.items.filter(item => item.id !== action.payload.id);
        const total = newItems.reduce((sum, item) => sum + (item.price_cents * item.quantity), 0);
        newState = { items: newItems, total };
      } else {
        const newItems = state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        );
        const total = newItems.reduce((sum, item) => sum + (item.price_cents * item.quantity), 0);
        newState = { items: newItems, total };
      }
      saveCartToStorage(newState);
      return newState;
    }
    
    case 'CLEAR_CART':
      newState = initialState;
      saveCartToStorage(newState);
      return newState;
    
    default:
      return state;
  }
};

const CartContext = createContext<{
  state: CartState;
  addToCart: (product: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
} | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { toast } = useToast();

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = loadCartFromStorage();
    if (savedCart.items.length > 0) {
      dispatch({ type: 'LOAD_CART', payload: savedCart });
    }
  }, []);

  const addToCart = (product: Omit<CartItem, 'quantity'>, quantity = 1) => {
    // Check if product is still available
    const availableQuantity = product.target_qty - product.purchased_qty;
    const currentInCart = state.items.find(item => item.id === product.id)?.quantity || 0;
    
    if (currentInCart + quantity > availableQuantity) {
      toast({
        title: "Quantidade indisponível",
        description: `Só restam ${availableQuantity - currentInCart} unidades disponíveis deste produto.`,
        variant: "destructive",
      });
      return;
    }

    dispatch({ type: 'ADD_ITEM', payload: { ...product, quantity } });
    toast({
      title: "Produto adicionado ao carrinho! 🛒",
      description: `${product.name} foi adicionado ao carrinho.`,
    });
  };

  const removeFromCart = (productId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: productId });
    toast({
      title: "Produto removido",
      description: "Produto foi removido do carrinho.",
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    const product = state.items.find(item => item.id === productId);
    if (product) {
      const availableQuantity = product.target_qty - product.purchased_qty;
      if (quantity > availableQuantity) {
        toast({
          title: "Quantidade indisponível",
          description: `Só restam ${availableQuantity} unidades disponíveis deste produto.`,
          variant: "destructive",
        });
        return;
      }
    }
    
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id: productId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  return (
    <CartContext.Provider value={{ state, addToCart, removeFromCart, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};