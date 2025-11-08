import { useState, useEffect } from 'react';
import { X, ShoppingCart, Trash2, Plus, Minus, CreditCard } from 'lucide-react';
import CheckoutModal from './CheckoutModal';

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

interface ShoppingCartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  total: number;
  onCartUpdate: () => void;
}

export default function ShoppingCartSidebar({
  isOpen,
  onClose,
  cart,
  total,
  onCartUpdate
}: ShoppingCartSidebarProps) {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [updating, setUpdating] = useState<number | null>(null);

  const updateQuantity = async (cartItemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    setUpdating(cartItemId);

    try {
      const response = await fetch(`${API_URL}/api/marketplace/cart/${cartItemId}`, {
        method: 'PUT',
        credentials: 'include', // Use cookies instead of Authorization header
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity: newQuantity })
      });

      const data = await response.json();

      if (data.success) {
        onCartUpdate();
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (cartItemId: number) => {
    try {
      const response = await fetch(`${API_URL}/api/marketplace/cart/${cartItemId}`, {
        method: 'DELETE',
        credentials: 'include', // Use cookies instead of Authorization header
      });

      const data = await response.json();

      if (data.success) {
        onCartUpdate();
      }
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const clearCart = async () => {
    try {
      const response = await fetch(`${API_URL}/api/marketplace/cart`, {
        method: 'DELETE',
        credentials: 'include', // Use cookies instead of Authorization header
      });

      const data = await response.json();

      if (data.success) {
        onCartUpdate();
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/70 z-40"
        onClick={onClose}
      ></div>

      {/* Sidebar */}
      <div className="fixed right-0 top-0 bottom-0 h-screen w-full max-w-md bg-gray-900 shadow-2xl z-50 flex flex-col border-l border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <ShoppingCart size={24} className="text-blue-500" />
            <h2 className="text-2xl font-bold text-white">Carrito de compras</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-900" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4B5563 #1F2937' }}>
          {cart.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingCart size={64} className="mx-auto text-gray-700 mb-4" />
              <p className="text-gray-500 text-lg">Your cart is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                >
                  <div className="flex gap-4">
                    {/* Image */}
                    <div className="w-20 h-20 bg-gray-700 rounded-lg shrink-0 overflow-hidden">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingCart size={32} className="text-gray-600" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-1">{item.name}</h3>
                      <p className="text-gray-400 text-sm mb-2">
                        ${item.price.toFixed(2)} each
                      </p>

                      {/* Quantity controls */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-gray-700 rounded-lg">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={updating === item.id || item.quantity <= 1}
                            className="p-2 hover:bg-gray-600 rounded-l-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Minus size={16} className="text-white" />
                          </button>
                          <span className="px-3 text-white font-semibold min-w-8 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={updating === item.id}
                            className="p-2 hover:bg-gray-600 rounded-r-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus size={16} className="text-white" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right">
                      <p className="text-white font-bold">
                        ${item.subtotal.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t border-gray-800 p-6 space-y-4 bg-gray-900 shrink-0">
            <button
              onClick={clearCart}
              className="w-full text-red-500 hover:text-red-400 text-sm transition-colors"
            >
              Clear Cart
            </button>

            <div className="flex items-center justify-between text-lg">
              <span className="text-gray-400">Total:</span>
              <span className="text-white font-bold text-2xl">
                ${total.toFixed(2)}
              </span>
            </div>

            <button
              onClick={() => setCheckoutOpen(true)}
              className="w-full bg-linear-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-bold hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
            >
              <CreditCard size={20} />
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        total={total}
        onSuccess={() => {
          setCheckoutOpen(false);
          onCartUpdate();
          onClose();
        }}
      />
    </>
  );
}
