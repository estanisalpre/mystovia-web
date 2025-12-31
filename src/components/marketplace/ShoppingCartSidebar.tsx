import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ShoppingCart, Trash2, CreditCard, Star } from 'lucide-react';
import CheckoutModal from './CheckoutModal';
import { DiamondPattern, GoldenLine, CornerOrnaments } from '../ui';
import '../../i18n';

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3301';

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
        credentials: 'include',
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
        credentials: 'include',
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
      <aside
        className="fixed inset-0 bg-black/70"
        style={{ zIndex: 10000 }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className="fixed right-0 top-0 bottom-0 h-screen w-full sm:max-w-md shadow-2xl flex flex-col border-l border-yellow-600/30"
        style={{ zIndex: 10001, background: 'linear-gradient(to bottom, rgb(17 24 39 / 0.98), rgb(17 24 39), rgb(0 0 0 / 0.98))' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
      >
        {/* Diamond pattern overlay */}
        <DiamondPattern opacity={0.03} />

        {/* Top golden line */}
        <GoldenLine position="top" opacity={0.6} />

        {/* Corner ornaments - hidden on mobile */}
        <span className="hidden sm:block">
          <CornerOrnaments variant="curve" size="sm" opacity={0.2} offset={2} />
        </span>

        {/* Header */}
        <header className="relative flex items-center justify-between p-4 sm:p-6 border-b border-yellow-600/20">
          <hgroup className="flex items-center gap-2 sm:gap-3">
            <ShoppingCart size={20} className="text-yellow-500 sm:w-6 sm:h-6" aria-hidden="true" />
            <h2 id="cart-title" className="text-lg sm:text-2xl font-bold text-white medieval-font">{t('cart.title')}</h2>
          </hgroup>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-yellow-500 transition-colors p-1"
            type="button"
            aria-label="Cerrar carrito"
          >
            <X size={22} aria-hidden="true" />
          </button>
        </header>

        {/* Cart Items */}
        <section className="relative flex-1 overflow-y-auto p-4 sm:p-6" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d4af37 #1F2937' }}>
          {cart.length === 0 ? (
            <figure className="text-center py-12 sm:py-20">
              <figcaption className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                <ShoppingCart size={32} className="text-yellow-500/40 sm:w-10 sm:h-10" aria-hidden="true" />
              </figcaption>
              <p className="text-gray-400 text-base sm:text-lg">{t('cart.empty')}</p>
            </figure>
          ) : (
            <ul className="space-y-3 sm:space-y-4 list-none p-0">
              {cart.map((item) => (
                <li
                  key={item.id}
                  className="relative rounded-lg p-3 sm:p-4 border border-yellow-600/20 overflow-hidden"
                  style={{ background: 'linear-gradient(to bottom, rgb(31 41 55 / 0.8), rgb(17 24 39 / 0.9))' }}
                >
                  {/* Item golden top line */}
                  <span className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" aria-hidden="true" />

                  <article className="flex gap-3 sm:gap-4">
                    {/* Image */}
                    <figure className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-800/50 rounded-lg shrink-0 overflow-hidden border border-yellow-600/10 m-0">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <figcaption className="w-full h-full flex items-center justify-center">
                          <ShoppingCart size={24} className="text-yellow-500/30 sm:w-8 sm:h-8" aria-hidden="true" />
                        </figcaption>
                      )}
                    </figure>

                    {/* Details */}
                    <section className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-sm sm:text-base mb-0.5 sm:mb-1 truncate">{item.name}</h3>
                      <p className="text-yellow-500/70 text-xs sm:text-sm mb-1.5 sm:mb-2">
                        AR$ {item.price.toFixed(2)}
                      </p>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-400 transition-colors"
                        title={t('cart.remove')}
                        type="button"
                        aria-label={`Eliminar ${item.name} del carrito`}
                      >
                        <Trash2 size={14} className="sm:w-4 sm:h-4" aria-hidden="true" />
                      </button>
                    </section>

                    {/* Subtotal */}
                    <data className="text-right shrink-0 text-yellow-500 font-bold text-sm sm:text-base" value={item.subtotal}>
                      AR$ {item.subtotal.toFixed(2)}
                    </data>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Footer */}
        {cart.length > 0 && (
          <footer className="relative border-t border-yellow-600/20 p-4 sm:p-6 space-y-3 sm:space-y-4 shrink-0">
            {/* Footer top golden line */}
            <span className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" aria-hidden="true" />

            <button
              onClick={clearCart}
              className="w-full text-red-500 hover:text-red-400 text-xs sm:text-sm transition-colors"
              type="button"
            >
              {t('cart.clearCart')}
            </button>

            {/* Decorative divider */}
            <figure className="flex items-center gap-3" aria-hidden="true">
              <span className="flex-1 h-px bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent" />
              <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500/40" fill="currentColor" />
              <span className="flex-1 h-px bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent" />
            </figure>

            <dl className="flex items-center justify-between">
              <dt className="text-gray-400 text-sm sm:text-lg">{t('common.total')}:</dt>
              <dd className="text-yellow-500 font-bold text-xl sm:text-2xl m-0">
                AR$ {total.toFixed(2)}
              </dd>
            </dl>

            <button
              onClick={() => setCheckoutOpen(true)}
              className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black py-3 sm:py-4 rounded-lg font-bold transition-all flex items-center justify-center gap-2 border border-yellow-400/30 text-sm sm:text-base"
              type="button"
            >
              <CreditCard size={18} className="sm:w-5 sm:h-5" aria-hidden="true" />
              {t('cart.proceedToCheckout')}
            </button>
          </footer>
        )}
      </aside>

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
