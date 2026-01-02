import { ShoppingCart, Package, Star, ArrowLeft, Eye, Skull } from 'lucide-react';
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
  category: 'knight' | 'paladin' | 'sorcerer' | 'druid' | 'item';
  is_active: boolean;
  stock: number;
  featured: boolean;
  items_json: GameItem[];
  redeemable_with_bp?: boolean;
  bp_price?: number | null;
}

interface ItemCardProps {
  item: MarketItem;
  onAddToCart: () => void;
  onBpPurchase?: () => void;
  isFlipped: boolean;
  onFlip: () => void;
  onUnflip: () => void;
}

const CATEGORY_COLORS = {
  knight: 'from-red-500 to-red-700',
  paladin: 'from-yellow-500 to-yellow-700',
  sorcerer: 'from-blue-500 to-blue-700',
  druid: 'from-green-500 to-green-700',
  item: 'from-purple-500 to-purple-700'
};

export default function ItemCard({ item, onAddToCart, onBpPurchase, isFlipped, onFlip, onUnflip }: ItemCardProps) {
  const { t } = useTranslation();
  const categoryColor = CATEGORY_COLORS[item.category] || 'from-gray-500 to-gray-700';

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'knight': return t('marketplace.knight');
      case 'paladin': return t('marketplace.paladin');
      case 'sorcerer': return t('marketplace.sorcerer');
      case 'druid': return t('marketplace.druid');
      case 'item': return t('marketplace.item');
      default: return category;
    }
  };

  const categoryLabel = getCategoryLabel(item.category);
  const isOutOfStock = item.stock !== -1 && item.stock <= 0;

  return (
    <div
      className="relative h-[520px]"
      style={{ perspective: '1000px' }}
    >
      <div
        className={`relative w-full h-full transition-transform duration-500 ease-in-out`}
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
        }}
      >
        {/* Front Side */}
        <div
          className="absolute inset-0 bg-gray-800 rounded-xl overflow-hidden border border-white/15 hover:border-blue-500 transition-colors hover:shadow-xl hover:shadow-blue-500/20 flex flex-col"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Image */}
          <div className={`relative h-48 bg-gradient-to-br ${categoryColor} flex items-center justify-center`}>
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
            <h3 className="text-xl font-bold text-white mb-3">{item.name}</h3>

            {/* View attributes button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFlip();
              }}
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm mb-4"
            >
              <Eye size={16} />
              <span className="underline">{t('marketplace.viewAttributes')}</span>
            </button>

            {/* Items preview */}
            <div className="mb-4 flex-1 flex flex-col min-h-0">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-2">{t('marketplace.includes')}</p>
              <ul className="space-y-1 overflow-y-auto flex-1 pr-1">
                {item.items_json.map((gameItem, index) => (
                  <li key={index} className="text-sm text-gray-300 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0"></span>
                    <span className="flex-1 truncate">
                      {gameItem.count}x {gameItem.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Price and action */}
            <div className="mt-auto pt-4 border-t border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">{t('common.price')}</p>
                  <p className="text-2xl font-bold text-white">
                    AR$ {Number(item.price).toFixed(2)}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  {/* Boss Points Purchase Option - Compact */}
                  {item.redeemable_with_bp && item.bp_price && !isOutOfStock && (
                    <button
                      onClick={onBpPurchase}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-bold text-sm bg-gradient-to-r from-yellow-600 to-orange-600 text-black hover:from-yellow-500 hover:to-orange-500 transition-all"
                      title={t('bossPoints.purchaseWithBP')}
                    >
                      <Skull size={16} />
                      <span>{item.bp_price}</span>
                    </button>
                  )}

                  <button
                    onClick={onAddToCart}
                    disabled={isOutOfStock}
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                      isOutOfStock
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r cursor-pointer from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 hover:shadow-lg'
                    }`}
                  >
                    <ShoppingCart size={18} />
                    {isOutOfStock ? t('marketplace.outOfStock') : t('marketplace.addToCart')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back Side */}
        <div
          className={`absolute inset-0 bg-gray-800 rounded-xl overflow-hidden border border-blue-500 shadow-xl shadow-blue-500/20 flex flex-col`}
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          {/* Header with image */}
          <div className={`relative h-32 bg-gradient-to-br ${categoryColor} flex items-center justify-center`}>
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.name}
                className="w-full h-full object-cover opacity-80"
              />
            ) : (
              <Package size={48} className="text-white/50" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-800 to-transparent"></div>

            {/* Back button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUnflip();
              }}
              className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 bg-black/70 hover:bg-black/90 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <ArrowLeft size={16} />
              {t('marketplace.goBack') || 'Volver'}
            </button>
          </div>

          {/* Full description content */}
          <div className="p-4 flex-1 flex flex-col overflow-hidden">
            <h3 className="text-lg font-bold text-white mb-3">{item.name}</h3>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <p className="text-gray-300 text-sm leading-relaxed">
                {item.description}
              </p>
            </div>

            {/* Price footer */}
            <div className="mt-auto pt-4 border-t border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">{t('common.price')}</p>
                  <p className="text-xl font-bold text-white">
                    AR$ {Number(item.price).toFixed(2)}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  {/* Boss Points Purchase Option - Compact */}
                  {item.redeemable_with_bp && item.bp_price && !isOutOfStock && (
                    <button
                      onClick={onBpPurchase}
                      className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold text-sm bg-gradient-to-r from-yellow-600 to-orange-600 text-black hover:from-yellow-500 hover:to-orange-500 transition-all"
                      title={t('bossPoints.purchaseWithBP')}
                    >
                      <Skull size={14} />
                      <span>{item.bp_price}</span>
                    </button>
                  )}

                  <button
                    onClick={onAddToCart}
                    disabled={isOutOfStock}
                    className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg font-semibold text-sm transition-all ${
                      isOutOfStock
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r cursor-pointer from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 hover:shadow-lg'
                    }`}
                  >
                    <ShoppingCart size={16} />
                    {isOutOfStock ? t('marketplace.outOfStock') : t('marketplace.addToCart')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
