import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Skull, ShoppingBag, History, Swords, Package, AlertCircle, Check, X } from 'lucide-react';
import '../../i18n';

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3301';

interface ShopItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  item_id: number;
  item_count: number;
  stock: number;
}

interface Character {
  id: number;
  name: string;
  level: number;
  vocation: number;
}

interface Purchase {
  id: number;
  player_name: string;
  item_name: string;
  points_spent: number;
  timestamp: string;
}

interface Kill {
  id: number;
  player_name: string;
  boss_name: string;
  points_awarded: number;
  timestamp: string;
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

export default function BossPointsShop() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'shop' | 'purchases' | 'kills'>('shop');
  const [bossPoints, setBossPoints] = useState(0);
  const [items, setItems] = useState<ShopItem[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [kills, setKills] = useState<Kill[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<number | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'purchases' && isLoggedIn) {
      loadPurchases();
    } else if (activeTab === 'kills' && isLoggedIn) {
      loadKills();
    }
  }, [activeTab, isLoggedIn]);

  const loadInitialData = async () => {
    try {
      // Load shop items (public)
      const itemsRes = await fetch(`${API_URL}/api/boss-points/shop`);
      const itemsData = await itemsRes.json();
      if (itemsData.success) {
        setItems(itemsData.items);
      }

      // Check if logged in and load balance
      const balanceRes = await fetch(`${API_URL}/api/boss-points/balance`, {
        credentials: 'include'
      });

      if (balanceRes.ok) {
        const balanceData = await balanceRes.json();
        if (balanceData.success) {
          setIsLoggedIn(true);
          setBossPoints(balanceData.bossPoints);

          // Load characters
          const charsRes = await fetch(`${API_URL}/api/boss-points/characters`, {
            credentials: 'include'
          });
          const charsData = await charsRes.json();
          if (charsData.success) {
            setCharacters(charsData.characters);
            if (charsData.characters.length > 0) {
              setSelectedCharacter(charsData.characters[0].id);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPurchases = async () => {
    try {
      const res = await fetch(`${API_URL}/api/boss-points/purchases`, {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setPurchases(data.purchases);
      }
    } catch (error) {
      console.error('Error loading purchases:', error);
    }
  };

  const loadKills = async () => {
    try {
      const res = await fetch(`${API_URL}/api/boss-points/kills`, {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setKills(data.kills);
      }
    } catch (error) {
      console.error('Error loading kills:', error);
    }
  };

  const handlePurchase = async () => {
    if (!selectedItem || !selectedCharacter) return;

    setPurchasing(true);
    setMessage(null);

    try {
      const res = await fetch(`${API_URL}/api/boss-points/purchase`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: selectedItem.id,
          player_id: selectedCharacter
        })
      });

      const data = await res.json();

      if (data.success) {
        setBossPoints(data.newBalance);
        setMessage({ type: 'success', text: t('bossPoints.purchaseSuccess', { item: data.item }) });
        setSelectedItem(null);
        // Dispatch event to update header
        window.dispatchEvent(new Event('bosspoints-updated'));
      } else {
        setMessage({ type: 'error', text: data.error || t('bossPoints.purchaseError') });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('bossPoints.purchaseError') });
    } finally {
      setPurchasing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getItemImageUrl = (item: ShopItem) => {
    if (item.image_url) return item.image_url;
    return `https://item-images.ots.me/12102/${item.item_id}.gif`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="medieval-container top-16 md:top-20 relative z-10 mx-4 sm:mx-8 md:mx-16 lg:mx-auto lg:max-w-6xl py-6 md:py-8 mb-16 md:mb-32">
      {/* Header with Balance */}
      <header className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Skull className="text-red-500" size={32} />
              {t('bossPoints.title')}
            </h1>
            <p className="text-sm md:text-base text-gray-400">{t('bossPoints.subtitle')}</p>
          </div>

          {isLoggedIn && (
            <div className="flex items-center gap-3 bg-gradient-to-r from-yellow-900/40 to-yellow-800/20 border border-yellow-600/30 rounded-lg px-5 py-3">
              <Skull className="text-yellow-500" size={24} />
              <div>
                <p className="text-xs text-yellow-400/80 uppercase tracking-wide">{t('bossPoints.balance')}</p>
                <p className="text-2xl font-bold text-yellow-400">{bossPoints.toLocaleString()} BP</p>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success'
            ? 'bg-green-900/30 border border-green-600/30 text-green-400'
            : 'bg-red-900/30 border border-red-600/30 text-red-400'
        }`}>
          {message.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-auto hover:opacity-70">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Tabs */}
      <nav className="flex gap-2 mb-6 border-b border-gray-700 pb-2">
        <button
          onClick={() => setActiveTab('shop')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition ${
            activeTab === 'shop'
              ? 'bg-yellow-600/20 text-yellow-400 border-b-2 border-yellow-500'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <ShoppingBag size={18} />
          {t('bossPoints.shop')}
        </button>
        {isLoggedIn && (
          <>
            <button
              onClick={() => setActiveTab('purchases')}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition ${
                activeTab === 'purchases'
                  ? 'bg-yellow-600/20 text-yellow-400 border-b-2 border-yellow-500'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <History size={18} />
              {t('bossPoints.purchaseHistory')}
            </button>
            <button
              onClick={() => setActiveTab('kills')}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition ${
                activeTab === 'kills'
                  ? 'bg-yellow-600/20 text-yellow-400 border-b-2 border-yellow-500'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Swords size={18} />
              {t('bossPoints.killHistory')}
            </button>
          </>
        )}
      </nav>

      {/* Shop Tab */}
      {activeTab === 'shop' && (
        <section>
          {items.length === 0 ? (
            <div className="text-center py-16">
              <Package size={64} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400 text-xl">{t('bossPoints.noItems')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {items.map(item => (
                <article
                  key={item.id}
                  className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden hover:border-yellow-600/50 transition group"
                >
                  <div className="aspect-square bg-gray-900/50 flex items-center justify-center p-4">
                    <img
                      src={getItemImageUrl(item)}
                      alt={item.name}
                      className="max-w-full max-h-full object-contain group-hover:scale-110 transition"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-item.png';
                      }}
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-white mb-1">{item.name}</h3>
                    {item.description && (
                      <p className="text-sm text-gray-400 mb-3 line-clamp-2">{item.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-yellow-400 font-bold">
                        <Skull size={16} />
                        <span>{item.price} BP</span>
                      </div>
                      {item.stock !== -1 && (
                        <span className="text-xs text-gray-500">Stock: {item.stock}</span>
                      )}
                    </div>
                    {isLoggedIn ? (
                      <button
                        onClick={() => setSelectedItem(item)}
                        disabled={bossPoints < item.price}
                        className={`w-full mt-3 py-2 rounded font-semibold transition ${
                          bossPoints >= item.price
                            ? 'bg-yellow-600 hover:bg-yellow-500 text-black'
                            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {bossPoints >= item.price ? t('bossPoints.buy') : t('bossPoints.insufficientPoints')}
                      </button>
                    ) : (
                      <a
                        href="/login"
                        className="block w-full mt-3 py-2 text-center bg-gray-700 hover:bg-gray-600 text-white rounded font-semibold transition"
                      >
                        {t('bossPoints.loginToBuy')}
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Purchase History Tab */}
      {activeTab === 'purchases' && isLoggedIn && (
        <section>
          {purchases.length === 0 ? (
            <div className="text-center py-16">
              <History size={64} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400 text-xl">{t('bossPoints.noPurchases')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700 text-left">
                    <th className="py-3 px-4 text-gray-400 font-medium">{t('bossPoints.date')}</th>
                    <th className="py-3 px-4 text-gray-400 font-medium">{t('bossPoints.character')}</th>
                    <th className="py-3 px-4 text-gray-400 font-medium">{t('bossPoints.item')}</th>
                    <th className="py-3 px-4 text-gray-400 font-medium text-right">{t('bossPoints.cost')}</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map(purchase => (
                    <tr key={purchase.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="py-3 px-4 text-gray-300">{formatDate(purchase.timestamp)}</td>
                      <td className="py-3 px-4 text-white">{purchase.player_name}</td>
                      <td className="py-3 px-4 text-white">{purchase.item_name}</td>
                      <td className="py-3 px-4 text-yellow-400 text-right font-medium">
                        -{purchase.points_spent} BP
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Kill History Tab */}
      {activeTab === 'kills' && isLoggedIn && (
        <section>
          {kills.length === 0 ? (
            <div className="text-center py-16">
              <Swords size={64} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400 text-xl">{t('bossPoints.noKills')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700 text-left">
                    <th className="py-3 px-4 text-gray-400 font-medium">{t('bossPoints.date')}</th>
                    <th className="py-3 px-4 text-gray-400 font-medium">{t('bossPoints.character')}</th>
                    <th className="py-3 px-4 text-gray-400 font-medium">{t('bossPoints.boss')}</th>
                    <th className="py-3 px-4 text-gray-400 font-medium text-right">{t('bossPoints.pointsEarned')}</th>
                  </tr>
                </thead>
                <tbody>
                  {kills.map(kill => (
                    <tr key={kill.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="py-3 px-4 text-gray-300">{formatDate(kill.timestamp)}</td>
                      <td className="py-3 px-4 text-white">{kill.player_name}</td>
                      <td className="py-3 px-4 text-red-400 font-medium">{kill.boss_name}</td>
                      <td className="py-3 px-4 text-green-400 text-right font-medium">
                        +{kill.points_awarded} BP
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Purchase Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-white mb-4">{t('bossPoints.confirmPurchase')}</h3>

            <div className="flex items-center gap-4 mb-6 p-4 bg-gray-800/50 rounded-lg">
              <img
                src={getItemImageUrl(selectedItem)}
                alt={selectedItem.name}
                className="w-16 h-16 object-contain"
              />
              <div>
                <p className="font-bold text-white">{selectedItem.name}</p>
                <p className="text-yellow-400 flex items-center gap-1">
                  <Skull size={14} />
                  {selectedItem.price} BP
                </p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">{t('bossPoints.selectCharacter')}</label>
              <select
                value={selectedCharacter || ''}
                onChange={(e) => setSelectedCharacter(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-yellow-500 focus:outline-none"
              >
                {characters.map(char => (
                  <option key={char.id} value={char.id}>
                    {char.name} - Level {char.level} {VOCATION_NAMES[char.vocation] || ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedItem(null)}
                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handlePurchase}
                disabled={purchasing || !selectedCharacter}
                className="flex-1 py-2 bg-yellow-600 hover:bg-yellow-500 text-black rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {purchasing ? t('common.loading') : t('bossPoints.confirmBuy')}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
