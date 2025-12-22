import { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3001';

interface GameItem {
  itemId: number | string;
  count: number;
  name: string;
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
}

interface ItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MarketItem | null;
  onSuccess: () => void;
}

export default function ItemFormModal({
  isOpen,
  onClose,
  item,
  onSuccess
}: ItemFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    category: 'item' as 'knight' | 'paladin' | 'sorcerer' | 'druid' | 'item',
    stock: '-1',
    featured: false,
    is_active: true
  });

  const [gameItems, setGameItems] = useState<GameItem[]>([
    { itemId: '', count: 1, name: '' }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && item) {
      // Editing existing item
      // Map old category values to new ones
      const validCategories = ['knight', 'paladin', 'sorcerer', 'druid', 'item'];
      let category = item.category;
      if (!validCategories.includes(category)) {
        // Default to 'item' if category is from old schema
        category = 'item';
      }
      setFormData({
        name: item.name,
        description: item.description || '',
        price: item.price.toString(),
        image_url: item.image_url || '',
        category: category as 'knight' | 'paladin' | 'sorcerer' | 'druid' | 'item',
        stock: item.stock.toString(),
        featured: item.featured,
        is_active: item.is_active
      });
      setGameItems(item.items_json.length > 0 ? item.items_json : [{ itemId: '', count: 1, name: '' }]);
    } else if (isOpen) {
      // Creating new item
      setFormData({
        name: '',
        description: '',
        price: '',
        image_url: '',
        category: 'item',
        stock: '-1',
        featured: false,
        is_active: true
      });
      setGameItems([{ itemId: '', count: 1, name: '' }]);
    }
    setError('');
  }, [isOpen, item]);

  const addGameItem = () => {
    setGameItems([...gameItems, { itemId: '', count: 1, name: '' }]);
  };

  const removeGameItem = (index: number) => {
    if (gameItems.length <= 1) return;
    setGameItems(gameItems.filter((_, i) => i !== index));
  };

  const updateGameItem = (index: number, field: keyof GameItem, value: any) => {
    const updated = [...gameItems];
    updated[index] = { ...updated[index], [field]: value };
    setGameItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name || !formData.price) {
      setError('Name and price are required');
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price < 0) {
      setError('Price must be a valid positive number');
      return;
    }

    const stock = parseInt(formData.stock);
    if (isNaN(stock)) {
      setError('Stock must be a valid number');
      return;
    }

    const validGameItems = gameItems.filter(gi => gi.itemId && gi.name);
    if (validGameItems.length === 0) {
      setError('At least one game item is required');
      return;
    }

    // Convert Imgur page URLs to direct image URLs
    let imageUrl = formData.image_url || null;
    if (imageUrl) {
      // Convert https://imgur.com/XXXXX to https://i.imgur.com/XXXXX.png
      const imgurPageMatch = imageUrl.match(/^https?:\/\/imgur\.com\/(\w+)$/);
      if (imgurPageMatch) {
        imageUrl = `https://i.imgur.com/${imgurPageMatch[1]}.png`;
      }
      // Also handle https://imgur.com/a/XXXXX (album links - take first image)
      const imgurAlbumMatch = imageUrl.match(/^https?:\/\/imgur\.com\/a\/(\w+)$/);
      if (imgurAlbumMatch) {
        // For albums, we can't auto-convert, so leave as is (will show warning)
        console.warn('Imgur album links are not supported. Please use direct image link.');
      }
    }

    const payload: any = {
      name: formData.name,
      description: formData.description || null,
      price: price,
      image_url: imageUrl,
      category: formData.category,
      stock: stock,
      featured: formData.featured,
      items_json: validGameItems
    };

    if (item) {
      payload.is_active = formData.is_active;
    }

    setLoading(true);

    try {
      const url = item
        ? `${API_URL}/api/admin/marketplace/items/${item.id}`
        : `${API_URL}/api/admin/marketplace/items`;

      const response = await fetch(url, {
        method: item ? 'PUT' : 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
      } else {
        setError(data.error || 'Failed to save item');
      }
    } catch (error) {
      console.error('Error saving item:', error);
      setError('Failed to save item. Please try again.');
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
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl max-h-[90vh] bg-gray-900 rounded-xl shadow-2xl z-70 border border-gray-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold text-white">
            {item ? 'Edit Item' : 'Create New Item'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-white font-semibold mb-2">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                  placeholder="e.g., Knight Starter Pack"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block text-white font-semibold mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 h-24 resize-none"
                  placeholder="Describe the item or set..."
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">
                  Price ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                >
                  <option value="knight">Knight</option>
                  <option value="paladin">Paladin</option>
                  <option value="sorcerer">Sorcerer</option>
                  <option value="druid">Druid</option>
                  <option value="item">Item</option>
                </select>
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">
                  Stock (-1 = unlimited)
                </label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                  placeholder="-1"
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                  placeholder="https://i.imgur.com/XXXXX.png"
                />
                <p className="text-gray-500 text-xs mt-1">
                  Tip: Usa el link directo de Imgur (i.imgur.com). Links de página se convierten automáticamente.
                </p>
                {/* Image Preview */}
                {formData.image_url && (
                  <div className="mt-3">
                    <p className="text-gray-400 text-xs mb-2">Vista previa:</p>
                    <div className="w-24 h-24 bg-gray-700 rounded-lg overflow-hidden">
                      <img
                        src={formData.image_url.match(/^https?:\/\/imgur\.com\/(\w+)$/)
                          ? `https://i.imgur.com/${formData.image_url.match(/^https?:\/\/imgur\.com\/(\w+)$/)?.[1]}.png`
                          : formData.image_url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                        onLoad={(e) => {
                          (e.target as HTMLImageElement).style.display = 'block';
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="col-span-2 flex gap-4">
                <label className="flex items-center gap-2 text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="w-4 h-4 rounded bg-gray-700 border-gray-600"
                  />
                  <span>Featured Item</span>
                </label>

                {item && (
                  <label className="flex items-center gap-2 text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 rounded bg-gray-700 border-gray-600"
                    />
                    <span>Active</span>
                  </label>
                )}
              </div>
            </div>

            {/* Game Items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-white font-semibold">
                  Items Included *
                </label>
                <button
                  type="button"
                  onClick={addGameItem}
                  className="flex items-center gap-1 text-blue-500 hover:text-blue-400 text-sm"
                >
                  <Plus size={16} />
                  Add Item
                </button>
              </div>

              <div className="space-y-3">
                {gameItems.map((gameItem, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Item ID"
                      value={gameItem.itemId}
                      onChange={(e) => updateGameItem(index, 'itemId', e.target.value)}
                      className="w-24 bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="Count"
                      min="1"
                      value={gameItem.count}
                      onChange={(e) => updateGameItem(index, 'count', parseInt(e.target.value) || 1)}
                      className="w-24 bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Item Name"
                      value={gameItem.name}
                      onChange={(e) => updateGameItem(index, 'name', e.target.value)}
                      className="flex-1 bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeGameItem(index)}
                      disabled={gameItems.length <= 1}
                      className="p-2 text-red-500 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>

              <p className="text-gray-500 text-sm mt-2">
                Add the Tibia item IDs and names that will be included in this product
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-linear-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : item ? 'Update Item' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
