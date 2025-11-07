import { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import ShoppingCartSidebar from './marketplace/ShoppingCartSidebar';

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3001';

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

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);

    if (token) {
      loadCart();

      // Refresh cart every 10 seconds
      const interval = setInterval(loadCart, 10000);
      return () => clearInterval(interval);
    }
  }, []);

  // Listen for custom cart update events
  useEffect(() => {
    const handleCartUpdate = () => {
      loadCart();
    };

    window.addEventListener('cart-updated', handleCartUpdate);
    return () => window.removeEventListener('cart-updated', handleCartUpdate);
  }, []);

  const loadCart = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setCart([]);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/marketplace/cart`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (data.success) {
        setCart(data.cart);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
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

  if (!isLoggedIn) {
    return null; // Don't show cart button if not logged in
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
