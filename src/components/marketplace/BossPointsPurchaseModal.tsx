import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Skull, AlertCircle, Check } from 'lucide-react';
import '../../i18n';

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3301';

interface Character {
  id: number;
  name: string;
  level: number;
  vocation: number;
}

interface BossPointsPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: number;
  itemName: string;
  itemImage: string | null;
  bpPrice: number;
  currentBalance: number;
  onSuccess: (newBalance: number) => void;
}

const VOCATION_NAMES: Record<number, string> = {
  0: 'None',
  1: 'Sorcerer',
  2: 'Druid',
  3: 'Paladin',
  4: 'Knight',
  5: 'Master Sorcerer',
  6: 'Elder Druid',
  7: 'Royal Paladin',
  8: 'Elite Knight'
};

export default function BossPointsPurchaseModal({
  isOpen,
  onClose,
  itemId,
  itemName,
  itemImage,
  bpPrice,
  currentBalance,
  onSuccess
}: BossPointsPurchaseModalProps) {
  const { t } = useTranslation();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingChars, setLoadingChars] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCharacters();
      setError('');
      setSuccess(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const loadCharacters = async () => {
    setLoadingChars(true);
    try {
      const response = await fetch(`${API_URL}/api/boss-points/characters`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success && data.characters.length > 0) {
        setCharacters(data.characters);
        setSelectedCharacter(data.characters[0].id);
      }
    } catch (error) {
      console.error('Error loading characters:', error);
      setError(t('bossPoints.errorLoadingCharacters'));
    } finally {
      setLoadingChars(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedCharacter) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/boss-points/purchase`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: itemId,
          player_id: selectedCharacter
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess(data.newBalance);
        }, 1500);
      } else {
        setError(data.error || t('bossPoints.purchaseError'));
      }
    } catch (error) {
      setError(t('bossPoints.purchaseError'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const canAfford = currentBalance >= bpPrice;

  return (
    <div
      className="fixed top-0 left-0 right-0 bottom-0 z-[9999] flex items-center justify-center p-4"
      style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-gray-900 border border-yellow-600/30 rounded-xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
            <Skull size={24} />
            {t('bossPoints.purchaseWithBP')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Item Preview */}
        <div className="flex items-center gap-4 mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          {itemImage ? (
            <img src={itemImage} alt={itemName} className="w-16 h-16 object-contain rounded" />
          ) : (
            <div className="w-16 h-16 bg-gray-700 rounded flex items-center justify-center">
              <Skull size={24} className="text-gray-500" />
            </div>
          )}
          <div className="flex-1">
            <p className="font-bold text-white">{itemName}</p>
            <p className="text-yellow-400 flex items-center gap-1 text-lg font-bold">
              <Skull size={16} />
              {bpPrice} BP
            </p>
          </div>
        </div>

        {/* Balance Info */}
        <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">{t('bossPoints.yourBalance')}</span>
            <span className={`font-bold text-lg ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
              {currentBalance} BP
            </span>
          </div>
          {!canAfford && (
            <p className="text-red-400 text-sm mt-2 flex items-center gap-2">
              <AlertCircle size={16} />
              {t('bossPoints.insufficientPoints')}
            </p>
          )}
        </div>

        {/* Success Message */}
        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-green-400" />
            </div>
            <p className="text-green-400 font-bold text-lg">{t('bossPoints.purchaseSuccess', { item: itemName })}</p>
            <p className="text-gray-400 text-sm mt-2">{t('bossPoints.itemDelivered')}</p>
          </div>
        ) : (
          <>
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-600/30 rounded-lg text-red-400 flex items-center gap-2">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* Character Selection */}
            {loadingChars ? (
              <div className="text-center py-4">
                <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : characters.length === 0 ? (
              <p className="text-gray-400 text-center py-4">{t('bossPoints.noCharacters')}</p>
            ) : (
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">{t('bossPoints.selectCharacter')}</label>
                <select
                  value={selectedCharacter || ''}
                  onChange={(e) => setSelectedCharacter(Number(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-yellow-500 focus:outline-none"
                >
                  {characters.map(char => (
                    <option key={char.id} value={char.id}>
                      {char.name} - Level {char.level} {VOCATION_NAMES[char.vocation] || ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handlePurchase}
                disabled={loading || !canAfford || !selectedCharacter}
                className="flex-1 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-black rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Skull size={18} />
                    {t('bossPoints.confirmBuy')}
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
