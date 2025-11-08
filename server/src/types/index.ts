export interface User {
  id: number;
  email: string;
  password: string;
  created_at: Date;
}

export interface Character {
  id: number;
  name: string;
  user_id: number;
  level: number;
  vocation: string;
  created_at: Date;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateCharacterRequest {
  name: string;
  vocation: string;
}

// =====================================================
// MARKETPLACE TYPES
// =====================================================

export interface MarketItem {
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
  created_at: Date;
  updated_at: Date;
}

export interface GameItem {
  itemId: number | string;
  count: number;
  name: string;
}

export interface WeaponOption {
  itemId: number;
  name: string;
  imageUrl?: string;
}

export interface CartItem {
  id: number;
  account_id: number;
  market_item_id: number;
  quantity: number;
  created_at: Date;
  market_item?: MarketItem;
}

export interface Order {
  id: number;
  account_id: number;
  player_id: number | null;
  total_amount: number;
  status: 'pending' | 'processing' | 'approved' | 'delivered' | 'cancelled' | 'refunded';
  payment_method: string;
  payment_id: string | null;
  preference_id: string | null;
  delivered_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItem {
  id: number;
  order_id: number;
  market_item_id: number;
  quantity: number;
  price: number;
  item_name: string;
  items_json: GameItem[];
}

export interface PaymentLog {
  id: number;
  order_id: number;
  payment_provider: string;
  payment_id: string | null;
  status: string;
  status_detail: string | null;
  transaction_amount: number;
  webhook_data: any;
  created_at: Date;
}

// Request/Response types
export interface CreateMarketItemRequest {
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  category: 'set_with_weapon' | 'set_without_weapon' | 'item';
  stock?: number;
  featured?: boolean;
  items_json: GameItem[];
}

export interface UpdateMarketItemRequest extends Partial<CreateMarketItemRequest> {
  is_active?: boolean;
}

export interface AddToCartRequest {
  market_item_id: number;
  quantity?: number;
  selected_weapon_id?: number;
}

export interface CreateOrderRequest {
  player_id: number;
  cart_item_ids?: number[];
}

export interface CartWithItems extends CartItem {
  market_item: MarketItem;
  subtotal: number;
}

export interface OrderWithDetails extends Order {
  items: OrderItem[];
  account_email?: string;
  player_name?: string;
}