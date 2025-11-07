import { useState, useEffect } from 'react';
import { X, AlertCircle, Check } from 'lucide-react';

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3001';

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
  onSuccess: () => void;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  total,
  onSuccess
}: CheckoutModalProps) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCharacters();
      setError('');
      setSuccess(false);
    }
  }, [isOpen]);

  const loadCharacters = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/characters`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setCharacters(data.characters);
        if (data.characters.length > 0) {
          setSelectedCharacter(data.characters[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading characters:', error);
    }
  };

  const handleCheckout = async () => {
    if (!selectedCharacter) {
      setError('Please select a character to receive the items');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/marketplace/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          player_id: selectedCharacter
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        setError(data.error || 'Failed to create order');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      setError('Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/70 z-60"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-gray-900 rounded-xl shadow-2xl z-70 border border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold text-white">Checkout</h2>
          <button
            onClick={onClose}
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
              <h3 className="text-xl font-bold text-white mb-2">Order Created!</h3>
              <p className="text-gray-400">
                Your order has been created successfully. Complete the payment to receive your items.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <label className="block text-white font-semibold mb-3">
                  Select Character to Receive Items
                </label>

                {characters.length === 0 ? (
                  <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 text-yellow-500">
                    <p className="text-sm">
                      You don't have any characters. Please create a character first.
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
                  <span className="text-gray-400">Total Amount:</span>
                  <span className="text-white text-2xl font-bold">${total.toFixed(2)}</span>
                </div>
                <p className="text-gray-500 text-sm">
                  Items will be delivered to your character's depot/mailbox after payment confirmation.
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
                  <strong>Note:</strong> This will create a pending order. Payment integration with MercadoPago will be added soon. For now, contact an administrator to complete the payment.
                </p>
              </div>

              <button
                onClick={handleCheckout}
                disabled={loading || characters.length === 0}
                className="w-full bg-linear-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-bold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Order...' : 'Create Order'}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
