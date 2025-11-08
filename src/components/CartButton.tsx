import { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import ShoppingCartSidebar from './marketplace/ShoppingCartSidebar';
import { verifyAuth, getCart } from '../utils/api';

interface CartItem {
  id: number;
  account_id: number;
  market_item_id: number;
  quantity: number;
  created_at: string;
  name: string;
  price: number;
  image_url: string | null;
  subtotal: number;
}

export default function CartButton() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthAndLoadCart();

    // Refresh cart every 10 seconds if logged in
    const interval = setInterval(() => {
      if (isLoggedIn) {
        loadCart();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // Listen for custom cart update events
  useEffect(() => {
    const handleCartUpdate = () => {
      loadCart();
    };

    window.addEventListener('cart-updated', handleCartUpdate);
    return () => window.removeEventListener('cart-updated', handleCartUpdate);
  }, []);

  const checkAuthAndLoadCart = async () => {
    try {
      // Check if user is authenticated using cookie-based auth with auto-refresh
      const result = await verifyAuth();

      if (result.success) {
        setIsLoggedIn(true);
        await loadCart();
      } else {
        setIsLoggedIn(false);
        setCart([]);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsLoggedIn(false);
      setCart([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCart = async () => {
    try {
      const result = await getCart();

      if (result.success && result.data?.cart) {
        setCart(result.data.cart || []);
      } else {
        setCart([]);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      setCart([]);
    }
  };

  const handleCartClick = () => {
    if (!isLoggedIn) {
      window.location.href = '/login';
      return;
    }
    setCartOpen(true);
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);

  // Don't show anything while loading
  if (isLoading) {
    return null;
  }

  // Don't show cart button if not logged in
  if (!isLoggedIn) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleCartClick}
        className="relative cursor-pointer p-2 bg-green-500 hover:bg-green-700 rounded-full transition text-sm font-medium flex items-center gap-2"
        title="Ver mi carrito"
      >
        <ShoppingCart size={18} />
        {cartItemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {cartItemCount}
          </span>
        )}
      </button>

      <ShoppingCartSidebar
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        total={cartTotal}
        onCartUpdate={loadCart}
      />
    </>
  );
}
