import { useState, useEffect } from 'react';
import { Package, Coins, Shield, Search } from 'lucide-react';
import ItemCard from './ItemCard';
import WeaponSelectionModal from './WeaponSelectionModal';

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3001';

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
  category: 'set_with_weapon' | 'set_without_weapon' | 'item';
  is_active: boolean;
  stock: number;
  featured: boolean;
  items_json: GameItem[];
  weapon_options: WeaponOption[] | null;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  { id: 'all', label: 'Todos', icon: Package },
  { id: 'set_with_weapon', label: 'Sets con Arma', icon: Shield },
  { id: 'set_without_weapon', label: 'Sets sin Arma', icon: Package },
  { id: 'item', label: 'Items', icon: Coins }
];

export default function MarketplaceView() {
  const [items, setItems] = useState<MarketItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [weaponModalOpen, setWeaponModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);

  useEffect(() => {
    loadMarketItems();
  }, []);

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

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Filter by featured
    if (showFeaturedOnly) {
      filtered = filtered.filter(item => item.featured);
    }

    // Filter by search query
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
    // Check if item requires weapon selection
    if (item.category === 'set_with_weapon' && item.weapon_options && item.weapon_options.length > 0) {
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
        credentials: 'include', // Use cookies instead of Authorization header
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
        // Dispatch custom event to update cart in header
        window.dispatchEvent(new Event('cart-updated'));
      } else {
        // Check if it's an authentication error
        if (data.code === 'INVALID_SESSION' || data.code === 'NO_TOKEN' || response.status === 401) {
          window.location.href = '/login';
        }
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  return (
    <div className="container rounded-2xl bg-gray-800 top-20 relative z-10 mx-auto px-4 py-8 mb-32">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Marketplace</h1>
        <p className="text-gray-400">Explora y compra items, sets y equipamiento</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar items, sets o equipamiento..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-3 mb-4">
          {CATEGORIES.map(category => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  selectedCategory === category.id
                    ? 'bg-linear-to-r from-blue-600 to-purple-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Icon size={18} />
                {category.label}
              </button>
            );
          })}
        </div>

        <label className="flex items-center gap-2 text-gray-300 cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={showFeaturedOnly}
            onChange={(e) => setShowFeaturedOnly(e.target.checked)}
            className="w-4 h-4 rounded bg-gray-700 border-gray-600"
          />
          <span>Mostrar solo destacados</span>
        </label>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 mt-4">Loading marketplace...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20">
          <Package size={64} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 text-xl">No items found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              onAddToCart={() => handleAddToCart(item)}
            />
          ))}
        </div>
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
    </div>
  );
}
