import { ShoppingCart, Package, Crown, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '../../i18n';

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
  category: 'set_with_weapon' | 'set_without_weapon' | 'item';
  is_active: boolean;
  stock: number;
  featured: boolean;
  items_json: GameItem[];
}

interface ItemCardProps {
  item: MarketItem;
  onAddToCart: () => void;
}

const CATEGORY_COLORS = {
  set_with_weapon: 'from-blue-500 to-blue-700',
  set_without_weapon: 'from-purple-500 to-purple-700',
  item: 'from-green-500 to-green-700'
};

export default function ItemCard({ item, onAddToCart }: ItemCardProps) {
  const { t } = useTranslation();
  const categoryColor = CATEGORY_COLORS[item.category] || 'from-gray-500 to-gray-700';

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'set_with_weapon': return t('marketplace.setWithWeapon');
      case 'set_without_weapon': return t('marketplace.set');
      case 'item': return t('marketplace.item');
      default: return category;
    }
  };

  const categoryLabel = getCategoryLabel(item.category);

  const isOutOfStock = item.stock !== -1 && item.stock <= 0;

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden border border-white/15 hover:border-blue-500 transition-all hover:shadow-xl hover:shadow-blue-500/20 flex flex-col">
      {/* Image */}
      <div className={`relative h-48 bg-linear-to-br ${categoryColor} flex items-center justify-center`}>
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Package size={64} className="text-white/50" />
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-2">
          <span className="px-2 py-1 bg-black/70 text-white text-xs font-semibold rounded">
            {categoryLabel}
          </span>
          {item.featured && (
            <span className="px-2 py-1 bg-yellow-500/90 text-black text-xs font-semibold rounded flex items-center gap-1">
              <Star size={12} fill="currentColor" />
              {t('marketplace.featured')}
            </span>
          )}
        </div>

        {/* Stock badge */}
        {item.stock !== -1 && (
          <div className="absolute top-2 right-2">
            <span className={`px-2 py-1 text-xs font-semibold rounded ${
              isOutOfStock
                ? 'bg-red-500/90 text-white'
                : item.stock < 10
                ? 'bg-orange-500/90 text-white'
                : 'bg-green-500/90 text-white'
            }`}>
              {isOutOfStock ? t('marketplace.outOfStock') : `${item.stock} ${t('marketplace.left')}`}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-xl font-bold text-white mb-2">{item.name}</h3>

        {item.description && (
          <p className="text-gray-400 text-sm mb-4 line-clamp-2">
            {item.description}
          </p>
        )}

        {/* Items included */}
        <div className="mb-4 flex-1">
          <p className="text-xs text-gray-500 uppercase font-semibold mb-2">{t('marketplace.includes')}</p>
          <ul className="space-y-1">
            {item.items_json.slice(0, 4).map((gameItem, index) => (
              <li key={index} className="text-sm text-gray-300 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                <span className="flex-1 truncate">
                  {gameItem.count}x {gameItem.name}
                </span>
              </li>
            ))}
            {item.items_json.length > 4 && (
              <li className="text-sm text-gray-500 italic">
                +{item.items_json.length - 4} {t('marketplace.moreItems')}
              </li>
            )}
          </ul>
        </div>

        {/* Price and action */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-700">
          <div>
            <p className="text-xs text-gray-500">{t('common.price')}</p>
            <p className="text-2xl font-bold text-white">
              ${Number(item.price).toFixed(2)}
            </p>
          </div>

          <button
            onClick={onAddToCart}
            disabled={isOutOfStock}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
              isOutOfStock
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-linear-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 hover:shadow-lg'
            }`}
          >
            <ShoppingCart size={18} />
            {isOutOfStock ? t('marketplace.outOfStock') : t('marketplace.addToCart')}
          </button>
        </div>
      </div>
    </div>
  );
}
