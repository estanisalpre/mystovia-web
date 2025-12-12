import { useState, useEffect } from 'react';
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

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/70 z-60"
        onClick={handleCancel}
      ></div>

      {/* Modal */}
      <div className="fixed left-1/2 top-100 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl bg-gray-900 rounded-xl shadow-2xl z-70 border border-gray-800 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
          <h2 className="text-2xl font-bold text-white">
            {showPaymentForm ? t('cart.completePayment') : t('cart.checkout')}
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{t('cart.paymentSuccessful')}</h3>
              <p className="text-gray-400">
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
              <div className="mb-6">
                <label className="block text-white font-semibold mb-3">
                  {t('cart.selectCharacter')}
                </label>

                {characters.length === 0 ? (
                  <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 text-yellow-500">
                    <p className="text-sm">
                      {t('cart.noCharacters')}
                    </p>
                  </div>
                ) : (
                  <select
                    value={selectedCharacter || ''}
                    onChange={(e) => setSelectedCharacter(Number(e.target.value))}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
                  >
                    {characters.map((char) => (
                      <option key={char.id} value={char.id}>
                        {char.name} (Level {char.level} {char.vocation})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="bg-gray-800 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">{t('cart.totalAmount')}</span>
                  <span className="text-white text-2xl font-bold">${total.toFixed(2)}</span>
                </div>
                <p className="text-gray-500 text-sm">
                  {t('cart.itemsDeliveryNote')}
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6 flex items-start gap-3">
                  <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-red-500 text-sm">{error}</p>
                </div>
              )}

              <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4 mb-6">
                <p className="text-blue-400 text-sm">
                  {t('cart.paymentNote')}
                </p>
              </div>

              <button
                onClick={handleProceedToPayment}
                disabled={characters.length === 0}
                className="w-full bg-linear-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-bold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('cart.proceedToPayment')}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
