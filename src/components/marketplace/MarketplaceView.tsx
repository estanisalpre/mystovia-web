import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, Coins, Shield, Search, Sword, Wand2, Heart, X } from 'lucide-react';
import ItemCard from './ItemCard';
import WeaponSelectionModal from './WeaponSelectionModal';
import '../../i18n';

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3301';

interface GameItem {
  itemId: number | string;
  count: number;
  name: string;
}

interface WeaponOption {
  itemId: number;
  name: string;
  imageUrl?: string;
}

interface MarketItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: 'knight' | 'paladin' | 'sorcerer' | 'druid' | 'item';
  is_active: boolean;
  stock: number;
  featured: boolean;
  items_json: GameItem[];
  weapon_options: WeaponOption[] | null;
  created_at: string;
  updated_at: string;
}

const CATEGORY_KEYS = [
  { id: 'all', labelKey: 'marketplace.all', icon: Package },
  { id: 'knight', labelKey: 'marketplace.knight', icon: Shield },
  { id: 'paladin', labelKey: 'marketplace.paladin', icon: Sword },
  { id: 'sorcerer', labelKey: 'marketplace.sorcerer', icon: Wand2 },
  { id: 'druid', labelKey: 'marketplace.druid', icon: Heart },
  { id: 'item', labelKey: 'marketplace.items', icon: Coins }
];

export default function MarketplaceView() {
  const { t } = useTranslation();
  const [items, setItems] = useState<MarketItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [weaponModalOpen, setWeaponModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);
  const [flippedCardId, setFlippedCardId] = useState<number | null>(null);

  useEffect(() => {
    loadMarketItems();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (flippedCardId !== null) {
        const target = e.target as HTMLElement;
        if (!target.closest('[data-card-id]')) {
          setFlippedCardId(null);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [flippedCardId]);

  useEffect(() => {
    filterItems();
  }, [items, selectedCategory, showFeaturedOnly, searchQuery]);

  const loadMarketItems = async () => {
    try {
      const response = await fetch(`${API_URL}/api/marketplace/items`);
      const data = await response.json();

      if (data.success) {
        setItems(data.items);
      }
    } catch (error) {
      console.error('Error loading market items:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = items;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    if (showFeaturedOnly) {
      filtered = filtered.filter(item => item.featured);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query))
      );
    }

    setFilteredItems(filtered);
  };

  const handleAddToCart = (item: MarketItem) => {
    if (item.weapon_options && item.weapon_options.length > 0) {
      setSelectedItem(item);
      setWeaponModalOpen(true);
    } else {
      addToCart(item.id);
    }
  };

  const handleWeaponSelect = (weaponId: number) => {
    if (selectedItem) {
      addToCart(selectedItem.id, weaponId);
    }
  };

  const addToCart = async (itemId: number, weaponId?: number) => {
    try {
      const response = await fetch(`${API_URL}/api/marketplace/cart`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          market_item_id: itemId,
          quantity: 1,
          selected_weapon_id: weaponId
        })
      });

      const data = await response.json();

      if (data.success) {
        window.dispatchEvent(new Event('cart-updated'));
      } else {
        if (data.code === 'INVALID_SESSION' || data.code === 'NO_TOKEN' || response.status === 401) {
          window.location.href = '/login';
        }
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  return (
    <main className="medieval-container top-16 md:top-20 relative z-10 mx-4 sm:mx-8 md:mx-16 lg:mx-auto lg:max-w-6xl py-6 md:py-8 mb-16 md:mb-32">
      {/* Header */}
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">{t('marketplace.title')}</h1>
        <p className="text-sm md:text-base text-gray-400">{t('marketplace.subtitle')}</p>
      </header>

      {/* Search Bar */}
      <search className="mb-6">
        <form role="search" onSubmit={(e) => e.preventDefault()}>
          <label className="relative block">
            <span className="sr-only">{t('marketplace.searchPlaceholder')}</span>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} aria-hidden="true" />
            <input
              type="search"
              placeholder={t('marketplace.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                type="button"
                aria-label="Limpiar búsqueda"
              >
                <X size={16} aria-hidden="true" />
              </button>
            )}
          </label>
        </form>
      </search>

      {/* Filters */}
      <nav className="mb-6 md:mb-8" aria-label="Filtros de categoría">
        <menu className="flex flex-wrap gap-2 md:gap-3 mb-4 list-none p-0 m-0">
          {CATEGORY_KEYS.map(category => {
            const Icon = category.icon;
            const label = t(category.labelKey);
            return (
              <li key={category.id}>
                <button
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 text-sm md:text-base rounded-lg transition-all ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                  type="button"
                  aria-pressed={selectedCategory === category.id}
                >
                  <Icon size={16} className="md:w-[18px] md:h-[18px]" aria-hidden="true" />
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">{category.id === 'all' ? t('marketplace.all') : label.split(' ')[0]}</span>
                </button>
              </li>
            );
          })}
        </menu>

        <label className="flex items-center gap-2 text-sm md:text-base text-gray-300 cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={showFeaturedOnly}
            onChange={(e) => setShowFeaturedOnly(e.target.checked)}
            className="w-4 h-4 rounded bg-gray-700 border-gray-600"
          />
          <span>{t('marketplace.showFeaturedOnly')}</span>
        </label>
      </nav>

      {/* Items Grid */}
      {loading ? (
        <section className="text-center py-20" aria-busy="true" aria-live="polite">
          <figure className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" role="status" aria-label="Cargando" />
          <p className="text-gray-400 mt-4">{t('marketplace.loading')}</p>
        </section>
      ) : filteredItems.length === 0 ? (
        <section className="text-center py-20">
          <Package size={64} className="mx-auto text-gray-600 mb-4" aria-hidden="true" />
          <p className="text-gray-400 text-xl">{t('marketplace.noItems')}</p>
        </section>
      ) : (
        <section aria-label="Lista de productos">
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 list-none p-0 m-0">
            {filteredItems.map(item => (
              <li key={item.id} data-card-id={item.id}>
                <ItemCard
                  item={item}
                  onAddToCart={() => handleAddToCart(item)}
                  isFlipped={flippedCardId === item.id}
                  onFlip={() => setFlippedCardId(item.id)}
                  onUnflip={() => setFlippedCardId(null)}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Weapon Selection Modal */}
      {selectedItem && (
        <WeaponSelectionModal
          isOpen={weaponModalOpen}
          onClose={() => {
            setWeaponModalOpen(false);
            setSelectedItem(null);
          }}
          weapons={selectedItem.weapon_options || []}
          onSelect={handleWeaponSelect}
          itemName={selectedItem.name}
        />
      )}
    </main>
  );
}
