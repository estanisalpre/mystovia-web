import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, CreditCard } from 'lucide-react';
import '../../i18n';

interface MercadoPagoCardFormProps {
  amount: number;
  playerId: number;
  onPaymentSuccess: (paymentData: any) => void;
  onPaymentError: (error: string) => void;
  onCancel: () => void;
}

declare global {
  interface Window {
    MercadoPago: any;
    cardForm: any;
  }
}

export default function MercadoPagoCardForm({
  amount,
  playerId,
  onPaymentSuccess,
  onPaymentError,
  onCancel
}: MercadoPagoCardFormProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const cardFormInitialized = useRef(false);

  const PUBLIC_KEY = import.meta.env.PUBLIC_MP_PUBLIC_KEY || 'TEST-663376ac-4d90-4b2c-b4bf-940a1e966185';

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.async = true;

    script.onload = () => {
      initializeMercadoPago();
    };

    script.onerror = () => {
      setError('Failed to load MercadoPago SDK. Please refresh the page.');
      setLoading(false);
    };

    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      if (window.cardForm) {
        window.cardForm = null;
      }
    };
  }, []);

  const initializeMercadoPago = () => {
    try {
      const mp = new window.MercadoPago(PUBLIC_KEY, {
        locale: 'es-AR'
      });

      if (cardFormInitialized.current) {
        return;
      }

      cardFormInitialized.current = true;

      const cardForm = mp.cardForm({
        amount: amount.toString(),
        iframe: true,
        form: {
          id: "mercadopago-card-form",
          cardNumber: {
            id: "form-checkout__cardNumber",
            placeholder: "Número de tarjeta",
            style: {
              color: "#ffffff",
              placeholderColor: "#9ca3af",
              fontSize: "16px",
            },
          },
          expirationDate: {
            id: "form-checkout__expirationDate",
            placeholder: "MM/AA",
            style: {
              color: "#ffffff",
              placeholderColor: "#9ca3af",
              fontSize: "16px",
            },
          },
          securityCode: {
            id: "form-checkout__securityCode",
            placeholder: "CVV",
            style: {
              color: "#ffffff",
              placeholderColor: "#9ca3af",
              fontSize: "16px",
            },
          },
          cardholderName: {
            id: "form-checkout__cardholderName",
            placeholder: "Titular de la tarjeta",
          },
          issuer: {
            id: "form-checkout__issuer",
            placeholder: "Banco emisor",
          },
          installments: {
            id: "form-checkout__installments",
            placeholder: "Cuotas",
          },
          identificationType: {
            id: "form-checkout__identificationType",
            placeholder: "Tipo de documento",
          },
          identificationNumber: {
            id: "form-checkout__identificationNumber",
            placeholder: "Número del documento",
          },
          cardholderEmail: {
            id: "form-checkout__cardholderEmail",
            placeholder: "E-mail",
          },
        },
        callbacks: {
          onFormMounted: (error: any) => {
            if (error) {
              console.error("Form Mounted handling error:", error);
              setError('Error initializing payment form. Please refresh the page.');
              setLoading(false);
              return;
            }
            //console.log("MercadoPago CardForm mounted successfully");
            setLoading(false);
          },
          onSubmit: async (event: Event) => {
            event.preventDefault();
            setProcessing(true);
            setError('');

            try {
              const cardFormData = cardForm.getCardFormData();

              //console.log('Card form data:', cardFormData);

              const {
                paymentMethodId: payment_method_id,
                issuerId: issuer_id,
                cardholderEmail: email,
                token,
                installments,
                identificationNumber,
                identificationType,
              } = cardFormData;

              // Send payment to backend
              const response = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:3301'}/api/marketplace/process-payment`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  token,
                  issuer_id,
                  payment_method_id,
                  transaction_amount: Number(amount),
                  installments: Number(installments),
                  description: 'Marketplace Purchase',
                  player_id: playerId,
                  payer: {
                    email,
                    identification: {
                      type: identificationType,
                      number: identificationNumber,
                    },
                  },
                }),
              });

              const result = await response.json();

              if (result.success && result.payment) {
                onPaymentSuccess(result.payment);
              } else {
                setError(result.error || 'Payment failed. Please try again.');
                onPaymentError(result.error || 'Payment failed');
              }
            } catch (error) {
              console.error('Error processing payment:', error);
              setError('Error processing payment. Please try again.');
              onPaymentError('Error processing payment');
            } finally {
              setProcessing(false);
            }
          },
          onFetching: (resource: string) => {
            //console.log("Fetching resource:", resource);

            const progressBar = document.querySelector(".progress-bar");
            if (progressBar) {
              progressBar.removeAttribute("value");
            }

            return () => {
              if (progressBar) {
                progressBar.setAttribute("value", "0");
              }
            };
          },
        },
      });

      window.cardForm = cardForm;
    } catch (error) {
      console.error('Error initializing MercadoPago:', error);
      setError('Failed to initialize payment form. Please refresh the page.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full mx-auto">
      {/* Header */}
      <div className="mb-4 sm:mb-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-yellow-500/20 rounded-full mb-3 sm:mb-4 border border-yellow-500/30">
          <CreditCard className="text-yellow-500" size={24} />
        </div>
        <h2 className="text-lg sm:text-2xl font-bold text-white mb-2 medieval-font">{t('paymentForm.cardPayment')}</h2>
        <p className="text-gray-400 text-sm sm:text-base">
          {t('paymentForm.totalToPay')}: <span className="text-xl sm:text-2xl font-bold text-yellow-500">AR$ {amount.toFixed(2)}</span>
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8 sm:py-12">
          <div className="inline-block w-10 h-10 sm:w-12 sm:h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400 text-sm sm:text-base">{t('paymentForm.loadingForm')}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 flex items-start gap-2 sm:gap-3">
          <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-red-500 text-xs sm:text-sm">{error}</p>
        </div>
      )}

      {/* Payment Form */}
      <form
        id="mercadopago-card-form"
        ref={formRef}
        className={`space-y-3 sm:space-y-4 ${loading ? 'hidden' : ''}`}
      >
        <style>{`
          /* MercadoPago iframe containers - card number, expiration, CVV */
          .mp-container {
            height: 44px;
            border: 1px solid rgb(202 138 4 / 0.3);
            border-radius: 0.5rem;
            padding: 0.625rem;
            background: linear-gradient(to bottom, rgb(17 24 39 / 0.95), rgb(31 41 55 / 0.9));
            transition: all 0.3s ease;
          }
          @media (min-width: 640px) {
            .mp-container {
              height: 48px;
              padding: 0.75rem;
            }
          }
          .mp-container:focus-within {
            border-color: rgb(234 179 8 / 0.6);
            box-shadow: 0 0 15px rgba(234, 179, 8, 0.15), 0 0 0 2px rgb(234 179 8 / 0.1);
            outline: none;
          }

          /* All form inputs - consistent medieval style */
          #form-checkout__cardholderName,
          #form-checkout__identificationNumber,
          #form-checkout__cardholderEmail,
          #form-checkout__issuer,
          #form-checkout__installments,
          #form-checkout__identificationType {
            width: 100%;
            height: 44px;
            border: 1px solid rgb(202 138 4 / 0.3);
            border-radius: 0.5rem;
            padding: 0.625rem 0.75rem;
            background: linear-gradient(to bottom, rgb(17 24 39 / 0.95), rgb(31 41 55 / 0.9));
            color: #ffffff;
            font-size: 0.875rem;
            transition: all 0.3s ease;
          }
          @media (min-width: 640px) {
            #form-checkout__cardholderName,
            #form-checkout__identificationNumber,
            #form-checkout__cardholderEmail,
            #form-checkout__issuer,
            #form-checkout__installments,
            #form-checkout__identificationType {
              height: 48px;
              padding: 0.75rem 1rem;
              font-size: 1rem;
            }
          }

          /* Placeholder styling */
          #form-checkout__cardholderName::placeholder,
          #form-checkout__identificationNumber::placeholder,
          #form-checkout__cardholderEmail::placeholder {
            color: rgb(156 163 175);
          }

          /* Focus state - medieval golden glow */
          #form-checkout__cardholderName:focus,
          #form-checkout__identificationNumber:focus,
          #form-checkout__cardholderEmail:focus,
          #form-checkout__issuer:focus,
          #form-checkout__installments:focus,
          #form-checkout__identificationType:focus {
            border-color: rgb(234 179 8 / 0.6);
            box-shadow: 0 0 15px rgba(234, 179, 8, 0.15), 0 0 0 2px rgb(234 179 8 / 0.1);
            outline: none;
          }

          /* Select dropdown options */
          #form-checkout__issuer option,
          #form-checkout__installments option,
          #form-checkout__identificationType option {
            background-color: rgb(17 24 39);
            color: white;
          }

          /* Progress bar - medieval styled */
          .progress-bar {
            width: 100%;
            height: 6px;
            background: linear-gradient(to right, rgb(31 41 55), rgb(55 65 81));
            border-radius: 3px;
            overflow: hidden;
            border: 1px solid rgb(202 138 4 / 0.2);
            box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3);
          }
          .progress-bar[value] {
            appearance: none;
            border: none;
          }
          .progress-bar[value]::-webkit-progress-bar {
            background: linear-gradient(to right, rgb(31 41 55), rgb(55 65 81));
            border-radius: 3px;
          }
          .progress-bar[value]::-webkit-progress-value {
            background: linear-gradient(to right, rgb(202 138 4), rgb(234 179 8));
            border-radius: 3px;
            box-shadow: 0 0 10px rgba(234, 179, 8, 0.5);
            transition: width 0.3s ease;
          }
          .progress-bar::-moz-progress-bar {
            background: linear-gradient(to right, rgb(202 138 4), rgb(234 179 8));
            border-radius: 3px;
            box-shadow: 0 0 10px rgba(234, 179, 8, 0.5);
          }

          /* MercadoPago iframe text color override */
          .mp-container iframe {
            color: #ffffff !important;
          }

          /* Shimmer animation for progress bar */
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>

        {/* Card Number */}
        <div className='text-white'>
          <label className="block text-white font-semibold text-sm sm:text-base mb-1.5 sm:mb-2">{t('paymentForm.cardNumber')}</label>
          <div id="form-checkout__cardNumber" className="mp-container"></div>
        </div>

        {/* Expiration & CVV */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          <div>
            <label className="block text-white font-semibold text-sm sm:text-base mb-1.5 sm:mb-2">{t('paymentForm.expiration')}</label>
            <div id="form-checkout__expirationDate" className="mp-container"></div>
          </div>
          <div>
            <label className="block text-white font-semibold text-sm sm:text-base mb-1.5 sm:mb-2">CVV</label>
            <div id="form-checkout__securityCode" className="mp-container"></div>
          </div>
        </div>

        {/* Cardholder Name */}
        <div>
          <label className="block text-white font-semibold text-sm sm:text-base mb-1.5 sm:mb-2">{t('paymentForm.cardholderName')}</label>
          <input type="text" id="form-checkout__cardholderName" />
        </div>

        {/* Email */}
        <div>
          <label className="block text-white font-semibold text-sm sm:text-base mb-1.5 sm:mb-2">Email</label>
          <input type="email" id="form-checkout__cardholderEmail" />
        </div>

        {/* Identification Type & Number */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
          <div>
            <label className="block text-white font-semibold text-sm sm:text-base mb-1.5 sm:mb-2">{t('paymentForm.documentType')}</label>
            <select id="form-checkout__identificationType"></select>
          </div>
          <div>
            <label className="block text-white font-semibold text-sm sm:text-base mb-1.5 sm:mb-2">{t('paymentForm.documentNumber')}</label>
            <input type="text" id="form-checkout__identificationNumber" />
          </div>
        </div>

        {/* Issuer */}
        <div>
          <label className="block text-white font-semibold text-sm sm:text-base mb-1.5 sm:mb-2">{t('paymentForm.issuerBank')}</label>
          <select id="form-checkout__issuer"></select>
        </div>

        {/* Installments */}
        <div>
          <label className="block text-white font-semibold text-sm sm:text-base mb-1.5 sm:mb-2">{t('paymentForm.installments')}</label>
          <select id="form-checkout__installments"></select>
        </div>

        {/* Progress Bar */}
        <div className="relative py-2">
          <progress value="0" className="progress-bar">Cargando...</progress>
          <div className="absolute inset-0 pointer-events-none opacity-30"
               style={{
                 background: 'linear-gradient(90deg, transparent 0%, rgba(234, 179, 8, 0.3) 50%, transparent 100%)',
                 animation: 'shimmer 2s infinite'
               }}
          />
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-3 sm:pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={processing}
            className="flex-1 order-2 sm:order-1 bg-gray-800/80 text-gray-300 py-2.5 sm:py-3 rounded-lg font-bold hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-yellow-600/20 text-sm sm:text-base"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={processing}
            className="flex-1 order-1 sm:order-2 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black py-2.5 sm:py-3 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-yellow-400/30 text-sm sm:text-base"
          >
            {processing ? t('paymentForm.processing') : `${t('paymentForm.pay')} AR$ ${amount.toFixed(2)}`}
          </button>
        </div>
      </form>

      {/* Security Notice */}
      <div className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
        <div className="flex items-center justify-center gap-2 mb-2">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="text-blue-400 font-semibold text-sm">{t('paymentForm.securePayment')}</span>
        </div>
        <p className="text-gray-400 text-xs sm:text-sm text-center mb-2">
          {t('paymentForm.securePaymentDescription')}{' '}
          <a
            href="https://www.mercadopago.com.ar/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline font-semibold"
          >
            MercadoPago
          </a>
        </p>
        <p className="text-gray-500 text-xs text-center">
          {t('paymentForm.pciCertification')}
        </p>
      </div>
    </div>
  );
}
