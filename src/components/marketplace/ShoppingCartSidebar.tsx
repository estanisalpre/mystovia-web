import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ShoppingCart, Trash2, CreditCard } from 'lucide-react';
import CheckoutModal from './CheckoutModal';
import '../../i18n';

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
  const { t } = useTranslation();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

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
        className="fixed inset-0 bg-black/70"
        style={{ zIndex: 10000 }}
        onClick={onClose}
      ></div>

      {/* Sidebar */}
      <div className="fixed right-0 top-0 bottom-0 h-screen w-full sm:max-w-md shadow-2xl flex flex-col border-l border-yellow-600/30"
           style={{ zIndex: 10001, background: 'linear-gradient(to bottom, rgb(17 24 39 / 0.98), rgb(17 24 39), rgb(0 0 0 / 0.98))' }}>
        {/* Diamond pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cpath d=\"M30 0L60 30L30 60L0 30z\" fill=\"%23d4af37\" fill-opacity=\"0.4\"/%3E%3C/svg%3E')", backgroundSize: '30px 30px' }}></div>

        {/* Top golden line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-yellow-500/60 to-transparent"></div>

        {/* Corner ornaments - hidden on mobile */}
        <div className="hidden sm:block absolute top-2 left-2 w-6 h-6 opacity-20 pointer-events-none">
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full text-yellow-500">
            <path d="M0 0 L40 0 Q0 0 0 40 Z" fill="currentColor"/>
          </svg>
        </div>
        <div className="hidden sm:block absolute top-2 right-2 w-6 h-6 opacity-20 pointer-events-none" style={{ transform: 'scaleX(-1)' }}>
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full text-yellow-500">
            <path d="M0 0 L40 0 Q0 0 0 40 Z" fill="currentColor"/>
          </svg>
        </div>

        {/* Header */}
        <div className="relative flex items-center justify-between p-4 sm:p-6 border-b border-yellow-600/20">
          <div className="flex items-center gap-2 sm:gap-3">
            <ShoppingCart size={20} className="text-yellow-500 sm:w-6 sm:h-6" />
            <h2 className="text-lg sm:text-2xl font-bold text-white medieval-font">{t('cart.title')}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-yellow-500 transition-colors p-1"
          >
            <X size={22} />
          </button>
        </div>

        {/* Cart Items */}
        <div className="relative flex-1 overflow-y-auto p-4 sm:p-6" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d4af37 #1F2937' }}>
          {cart.length === 0 ? (
            <div className="text-center py-12 sm:py-20">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                <ShoppingCart size={32} className="text-yellow-500/40 sm:w-10 sm:h-10" />
              </div>
              <p className="text-gray-400 text-base sm:text-lg">{t('cart.empty')}</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="relative rounded-lg p-3 sm:p-4 border border-yellow-600/20 overflow-hidden"
                  style={{ background: 'linear-gradient(to bottom, rgb(31 41 55 / 0.8), rgb(17 24 39 / 0.9))' }}
                >
                  {/* Item golden top line */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent"></div>

                  <div className="flex gap-3 sm:gap-4">
                    {/* Image */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-800/50 rounded-lg shrink-0 overflow-hidden border border-yellow-600/10">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingCart size={24} className="text-yellow-500/30 sm:w-8 sm:h-8" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-sm sm:text-base mb-0.5 sm:mb-1 truncate">{item.name}</h3>
                      <p className="text-yellow-500/70 text-xs sm:text-sm mb-1.5 sm:mb-2">
                        ${item.price.toFixed(2)}
                      </p>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-400 transition-colors"
                        title={t('cart.remove')}
                      >
                        <Trash2 size={14} className="sm:w-4 sm:h-4" />
                      </button>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right shrink-0">
                      <p className="text-yellow-500 font-bold text-sm sm:text-base">
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
          <div className="relative border-t border-yellow-600/20 p-4 sm:p-6 space-y-3 sm:space-y-4 shrink-0">
            {/* Footer top golden line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent"></div>

            <button
              onClick={clearCart}
              className="w-full text-red-500 hover:text-red-400 text-xs sm:text-sm transition-colors"
            >
              {t('cart.clearCart')}
            </button>

            {/* Decorative divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent"></div>
              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500/40" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent"></div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm sm:text-lg">{t('common.total')}:</span>
              <span className="text-yellow-500 font-bold text-xl sm:text-2xl">
                ${total.toFixed(2)}
              </span>
            </div>

            <button
              onClick={() => setCheckoutOpen(true)}
              className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black py-3 sm:py-4 rounded-lg font-bold transition-all flex items-center justify-center gap-2 border border-yellow-400/30 text-sm sm:text-base"
            >
              <CreditCard size={18} className="sm:w-5 sm:h-5" />
              {t('cart.proceedToCheckout')}
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
