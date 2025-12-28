import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { X, AlertCircle, Check } from 'lucide-react';
import { getCharacters } from '../../utils/api';
import MercadoPagoCardForm from './MercadoPagoCardForm';
import '../../i18n';
import { DiamondPattern, GoldenLine, CornerOrnaments } from '../ui';

interface Character {
  id: number;
  name: string;
  level: number;
  vocation: string;
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onSuccess?: () => void;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  total,
  onSuccess
}: CheckoutModalProps) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
      loadCharacters();
      setError('');
      setSuccess(false);
      setShowPaymentForm(false);
    } else {
      dialogRef.current?.close();
    }
  }, [isOpen]);

  const loadCharacters = async () => {
    try {
      const result = await getCharacters();

      if (result.success && result.data?.characters) {
        setCharacters(result.data.characters);
        if (result.data.characters.length > 0) {
          setSelectedCharacter(result.data.characters[0].id);
        }
      } else {
        console.error('Failed to load characters:', result.error);
      }
    } catch (error) {
      console.error('Error loading characters:', error);
    }
  };

  const handleProceedToPayment = () => {
    if (!selectedCharacter) {
      setError(t('cart.pleaseSelectCharacter'));
      return;
    }

    setError('');
    setShowPaymentForm(true);
  };

  const handlePaymentSuccess = (paymentData: any) => {
    //console.log('Payment successful:', paymentData);
    setSuccess(true);

    window.dispatchEvent(new Event('cart-updated'));

    setTimeout(() => {
      onSuccess?.();
      onClose();
    }, 2000);
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    setError(error);
    setShowPaymentForm(false);
  };

  const handleCancel = () => {
    if (showPaymentForm) {
      setShowPaymentForm(false);
      setError('');
    } else {
      onClose();
    }
  };

  const modalContent = (
    <dialog
      ref={dialogRef}
      className="fixed rounded-xl shadow-2xl border border-yellow-600/30 overflow-y-auto p-0 m-4 inset-0 w-auto h-auto max-h-[calc(100vh-32px)] backdrop:bg-black/80"
      style={{
        background: 'linear-gradient(to bottom, rgb(17 24 39), rgb(17 24 39), rgb(0 0 0))',
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) handleCancel();
      }}
      aria-labelledby="checkout-modal-title"
    >
      {/* Diamond pattern overlay */}
      <DiamondPattern opacity={0.03} rounded />

      {/* Top golden line */}
      <GoldenLine position="top" opacity={0.6} />

      {/* Corner ornaments - hidden on mobile */}
      <span className="hidden sm:block">
        <CornerOrnaments variant="curve" size="lg" opacity={0.2} />
      </span>

      {/* Header */}
      <header
        className="relative flex items-center justify-between p-4 sm:p-6 border-b border-yellow-600/20 sticky top-0 z-10"
        style={{ background: 'linear-gradient(to bottom, rgb(17 24 39 / 0.98), rgb(17 24 39))' }}
      >
        <h2 id="checkout-modal-title" className="text-lg sm:text-2xl font-bold text-white medieval-font">
          {showPaymentForm ? t('cart.completePayment') : t('cart.checkout')}
        </h2>
        <button
          onClick={handleCancel}
          className="text-gray-400 hover:text-yellow-500 transition-colors p-1"
          type="button"
          aria-label="Cerrar"
        >
          <X size={22} aria-hidden="true" />
        </button>
      </header>

      {/* Content */}
      <article className="relative p-4 sm:p-6">
        {success ? (
          <section className="text-center py-6 sm:py-8">
            <figure className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-green-500 to-green-400 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 border border-green-400/30">
              <Check size={28} className="text-white" aria-hidden="true" />
            </figure>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2 medieval-font">{t('cart.paymentSuccessful')}</h3>
            <p className="text-gray-400 text-sm sm:text-base">
              {t('cart.paymentSuccessMessage')}
            </p>
          </section>
        ) : showPaymentForm ? (
          <MercadoPagoCardForm
            amount={total}
            playerId={selectedCharacter!}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
            onCancel={handleCancel}
          />
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); handleProceedToPayment(); }}>
            <fieldset className="mb-4 sm:mb-6 border-0 p-0">
              <legend className="block text-white font-semibold text-sm sm:text-base mb-2 sm:mb-3">
                {t('cart.selectCharacter')}
              </legend>

              {characters.length === 0 ? (
                <aside className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 sm:p-4 text-yellow-500">
                  <p className="text-xs sm:text-sm">
                    {t('cart.noCharacters')}
                  </p>
                </aside>
              ) : (
                <select
                  value={selectedCharacter || ''}
                  onChange={(e) => setSelectedCharacter(Number(e.target.value))}
                  className="w-full bg-gray-800/80 text-white border border-yellow-600/20 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 focus:outline-none focus:border-yellow-500/50 transition-colors text-sm sm:text-base"
                  aria-label={t('cart.selectCharacter')}
                >
                  {characters.map((char) => (
                    <option key={char.id} value={char.id}>
                      {char.name} (Lvl {char.level} {char.vocation})
                    </option>
                  ))}
                </select>
              )}
            </fieldset>

            <section
              className="relative rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 border border-yellow-600/20 overflow-hidden"
              style={{ background: 'linear-gradient(to bottom, rgb(31 41 55 / 0.6), rgb(17 24 39 / 0.8))' }}
            >
              <span className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" aria-hidden="true" />
              <dl className="flex items-center justify-between mb-1 sm:mb-2">
                <dt className="text-gray-400 text-sm sm:text-base">{t('cart.totalAmount')}</dt>
                <dd className="text-yellow-500 text-xl sm:text-2xl font-bold m-0">${total.toFixed(2)}</dd>
              </dl>
              <p className="text-gray-500 text-xs sm:text-sm">
                {t('cart.itemsDeliveryNote')}
              </p>
            </section>

            {error && (
              <aside className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 flex items-start gap-2 sm:gap-3" role="alert">
                <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-red-500 text-xs sm:text-sm">{error}</p>
              </aside>
            )}

            <aside className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <p className="text-yellow-500/80 text-xs sm:text-sm">
                {t('cart.paymentNote')}
              </p>
            </aside>

            <button
              type="submit"
              disabled={characters.length === 0}
              className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black py-3 sm:py-4 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-yellow-400/30 text-sm sm:text-base"
            >
              {t('cart.proceedToPayment')}
            </button>
          </form>
        )}
      </article>
    </dialog>
  );

  return createPortal(modalContent, document.body);
}
