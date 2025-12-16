import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { X, AlertCircle, Check } from 'lucide-react';
import { getCharacters } from '../../utils/api';
import MercadoPagoCardForm from './MercadoPagoCardForm';
import '../../i18n';

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
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCharacters();
      setError('');
      setSuccess(false);
      setShowPaymentForm(false);
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
    console.log('Payment successful:', paymentData);
    setSuccess(true);

    // Dispatch cart update event
    window.dispatchEvent(new Event('cart-updated'));

    // Close modal after showing success message
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

  if (!isOpen) return null;

  const modalContent = (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/80"
        style={{ zIndex: 10002 }}
        onClick={handleCancel}
      ></div>

      {/* Modal */}
      <div
        className="fixed rounded-xl shadow-2xl border border-yellow-600/30 overflow-y-auto"
        style={{
          background: 'linear-gradient(to bottom, rgb(17 24 39), rgb(17 24 39), rgb(0 0 0))',
          zIndex: 10003,
          top: '16px',
          left: '16px',
          right: '16px',
          bottom: '16px',
          maxHeight: 'calc(100vh - 32px)'
        }}
      >
        {/* Diamond pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none rounded-xl" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cpath d=\"M30 0L60 30L30 60L0 30z\" fill=\"%23d4af37\" fill-opacity=\"0.4\"/%3E%3C/svg%3E')", backgroundSize: '30px 30px' }}></div>

        {/* Top golden line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-yellow-500/60 to-transparent rounded-t-xl"></div>

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
        <div className="hidden sm:block absolute bottom-2 left-2 w-6 h-6 opacity-20 pointer-events-none" style={{ transform: 'scaleY(-1)' }}>
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full text-yellow-500">
            <path d="M0 0 L40 0 Q0 0 0 40 Z" fill="currentColor"/>
          </svg>
        </div>
        <div className="hidden sm:block absolute bottom-2 right-2 w-6 h-6 opacity-20 pointer-events-none" style={{ transform: 'scale(-1)' }}>
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full text-yellow-500">
            <path d="M0 0 L40 0 Q0 0 0 40 Z" fill="currentColor"/>
          </svg>
        </div>

        {/* Header */}
        <div className="relative flex items-center justify-between p-4 sm:p-6 border-b border-yellow-600/20 sticky top-0 z-10"
             style={{ background: 'linear-gradient(to bottom, rgb(17 24 39 / 0.98), rgb(17 24 39))' }}>
          <h2 className="text-lg sm:text-2xl font-bold text-white medieval-font">
            {showPaymentForm ? t('cart.completePayment') : t('cart.checkout')}
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-yellow-500 transition-colors p-1"
          >
            <X size={22} />
          </button>
        </div>

        {/* Content */}
        <div className="relative p-4 sm:p-6">
          {success ? (
            <div className="text-center py-6 sm:py-8">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-green-500 to-green-400 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 border border-green-400/30">
                <Check size={28} className="text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 medieval-font">{t('cart.paymentSuccessful')}</h3>
              <p className="text-gray-400 text-sm sm:text-base">
                {t('cart.paymentSuccessMessage')}
              </p>
            </div>
          ) : showPaymentForm ? (
            <MercadoPagoCardForm
              amount={total}
              playerId={selectedCharacter!}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
              onCancel={handleCancel}
            />
          ) : (
            <>
              <div className="mb-4 sm:mb-6">
                <label className="block text-white font-semibold text-sm sm:text-base mb-2 sm:mb-3">
                  {t('cart.selectCharacter')}
                </label>

                {characters.length === 0 ? (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 sm:p-4 text-yellow-500">
                    <p className="text-xs sm:text-sm">
                      {t('cart.noCharacters')}
                    </p>
                  </div>
                ) : (
                  <select
                    value={selectedCharacter || ''}
                    onChange={(e) => setSelectedCharacter(Number(e.target.value))}
                    className="w-full bg-gray-800/80 text-white border border-yellow-600/20 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 focus:outline-none focus:border-yellow-500/50 transition-colors text-sm sm:text-base"
                  >
                    {characters.map((char) => (
                      <option key={char.id} value={char.id}>
                        {char.name} (Lvl {char.level} {char.vocation})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="relative rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 border border-yellow-600/20 overflow-hidden"
                   style={{ background: 'linear-gradient(to bottom, rgb(31 41 55 / 0.6), rgb(17 24 39 / 0.8))' }}>
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent"></div>
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <span className="text-gray-400 text-sm sm:text-base">{t('cart.totalAmount')}</span>
                  <span className="text-yellow-500 text-xl sm:text-2xl font-bold">${total.toFixed(2)}</span>
                </div>
                <p className="text-gray-500 text-xs sm:text-sm">
                  {t('cart.itemsDeliveryNote')}
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 flex items-start gap-2 sm:gap-3">
                  <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-red-500 text-xs sm:text-sm">{error}</p>
                </div>
              )}

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                <p className="text-yellow-500/80 text-xs sm:text-sm">
                  {t('cart.paymentNote')}
                </p>
              </div>

              <button
                onClick={handleProceedToPayment}
                disabled={characters.length === 0}
                className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black py-3 sm:py-4 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-yellow-400/30 text-sm sm:text-base"
              >
                {t('cart.proceedToPayment')}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );

  // Use portal to render modal at document.body level, outside of any overflow:hidden containers
  return createPortal(modalContent, document.body);
}
