import { useState, useEffect, useRef } from 'react';
import { AlertCircle, CreditCard } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const cardFormInitialized = useRef(false);

  const PUBLIC_KEY = import.meta.env.PUBLIC_MP_PUBLIC_KEY || 'TEST-663376ac-4d90-4b2c-b4bf-940a1e966185';

  useEffect(() => {
    // Load MercadoPago SDK
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
      // Cleanup
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
          },
          expirationDate: {
            id: "form-checkout__expirationDate",
            placeholder: "MM/AA",
          },
          securityCode: {
            id: "form-checkout__securityCode",
            placeholder: "CVV",
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
            console.log("MercadoPago CardForm mounted successfully");
            setLoading(false);
          },
          onSubmit: async (event: Event) => {
            event.preventDefault();
            setProcessing(true);
            setError('');

            try {
              const cardFormData = cardForm.getCardFormData();

              console.log('Card form data:', cardFormData);

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
              const response = await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:3001'}/api/marketplace/process-payment`, {
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
            console.log("Fetching resource:", resource);

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
    <div className="w-full max-w-2xl mt-32 border-2 border-white mx-auto">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4">
          <CreditCard className="text-blue-500" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Pago con Tarjeta</h2>
        <p className="text-gray-400">
          Total a pagar: <span className="text-2xl font-bold text-green-500">${amount.toFixed(2)}</span>
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400">Cargando formulario de pago...</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}

      {/* Payment Form */}
      <form
        id="mercadopago-card-form"
        ref={formRef}
        className={`space-y-4 ${loading ? 'hidden' : ''}`}
      >
        <style>{`
          .mp-container {
            height: 48px;
            border: 1px solid #374151;
            border-radius: 0.5rem;
            padding: 0.75rem;
            background-color: #1f2937;
            transition: border-color 0.2s;
          }
          .mp-container:focus-within {
            border-color: #3b82f6;
            outline: none;
          }
          #form-checkout__cardholderName,
          #form-checkout__identificationNumber,
          #form-checkout__cardholderEmail,
          #form-checkout__issuer,
          #form-checkout__installments,
          #form-checkout__identificationType {
            width: 100%;
            height: 48px;
            border: 1px solid #374151;
            border-radius: 0.5rem;
            padding: 0.75rem;
            background-color: #1f2937;
            color: #fff;
            font-size: 1rem;
            transition: border-color 0.2s;
          }
          #form-checkout__cardholderName:focus,
          #form-checkout__identificationNumber:focus,
          #form-checkout__cardholderEmail:focus,
          #form-checkout__issuer:focus,
          #form-checkout__installments:focus,
          #form-checkout__identificationType:focus {
            border-color: #3b82f6;
            outline: none;
          }
          .progress-bar {
            width: 100%;
            height: 4px;
            background-color: #1f2937;
            border-radius: 2px;
            overflow: hidden;
          }
          .progress-bar[value] {
            appearance: none;
            border: none;
          }
          .progress-bar[value]::-webkit-progress-bar {
            background-color: #1f2937;
          }
          .progress-bar[value]::-webkit-progress-value {
            background-color: #3b82f6;
          }
        `}</style>

        {/* Card Number */}
        <div>
          <label className="block text-white font-semibold mb-2">Número de Tarjeta</label>
          <div id="form-checkout__cardNumber" className="mp-container"></div>
        </div>

        {/* Expiration & CVV */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-white font-semibold mb-2">Vencimiento</label>
            <div id="form-checkout__expirationDate" className="mp-container"></div>
          </div>
          <div>
            <label className="block text-white font-semibold mb-2">CVV</label>
            <div id="form-checkout__securityCode" className="mp-container"></div>
          </div>
        </div>

        {/* Cardholder Name */}
        <div>
          <label className="block text-white font-semibold mb-2">Titular de la Tarjeta</label>
          <input type="text" id="form-checkout__cardholderName" />
        </div>

        {/* Email */}
        <div>
          <label className="block text-white font-semibold mb-2">Email</label>
          <input type="email" id="form-checkout__cardholderEmail" />
        </div>

        {/* Identification Type & Number */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-white font-semibold mb-2">Tipo de Documento</label>
            <select id="form-checkout__identificationType"></select>
          </div>
          <div>
            <label className="block text-white font-semibold mb-2">Número de Documento</label>
            <input type="text" id="form-checkout__identificationNumber" />
          </div>
        </div>

        {/* Issuer */}
        <div>
          <label className="block text-white font-semibold mb-2">Banco Emisor</label>
          <select id="form-checkout__issuer"></select>
        </div>

        {/* Installments */}
        <div>
          <label className="block text-white font-semibold mb-2">Cuotas</label>
          <select id="form-checkout__installments"></select>
        </div>

        {/* Progress Bar */}
        <progress value="0" className="progress-bar">Cargando...</progress>

        {/* Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={processing}
            className="flex-1 bg-gray-700 text-white py-3 rounded-lg font-bold hover:bg-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={processing}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-bold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? 'Procesando...' : `Pagar $${amount.toFixed(2)}`}
          </button>
        </div>
      </form>

      {/* Security Notice */}
      <div className="mt-6 text-center">
        <p className="text-gray-500 text-sm">
          Pago seguro procesado por MercadoPago
        </p>
      </div>
    </div>
  );
}
