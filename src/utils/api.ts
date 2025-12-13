/**
 * Secure API Helper
 * Handles authentication and cookie-based requests (without JWT)
 */

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3001';

interface ApiRequestOptions extends RequestInit {
  skipRefresh?: boolean;
}

/**
 * Make an authenticated API request
 * Uses simple cookie-based authentication (without JWT)
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  const { skipRefresh, ...fetchOptions } = options;

  try {
    let response = await fetch(`${API_URL}${endpoint}`, {
      ...fetchOptions,
      credentials: 'include', // Always include cookies
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });

    /* ⏸️ JWT DESACTIVADO TEMPORALMENTE - No necesitamos refresh de tokens
    // Handle token expiration and refresh
    if (response.status === 401 && !skipRefresh) {
      let errorData: any = null;

      // Try reading the error safely using clone()
      try {
        errorData = await response.clone().json();
      } catch (_) {
        // Response might not be JSON
      }

      if (errorData?.code === 'TOKEN_EXPIRED') {
        // Attempt token refresh
        const refreshed = await refreshToken();

        if (refreshed) {
          // Retry original request
          response = await fetch(`${API_URL}${endpoint}`, {
            ...fetchOptions,
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              ...fetchOptions.headers,
            },
          });
        } else {
          // Refresh failed → force logout
          window.location.href = '/login';
          return { success: false, error: 'Session expired. Please login again.' };
        }
      }
    }
    */

    // Try reading JSON response safely
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        success: false,
        error: (data && data.error) || 'Request failed',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('API request failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}

/* ⏸️ JWT DESACTIVADO TEMPORALMENTE
/**
 * Refresh the access token
 *
async function refreshToken(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    return response.ok;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
}
*/

/**
 * Login with email and password
 */
export async function login(email: string, password: string) {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    skipRefresh: true, // Don't try to refresh on login failure
  });
}

/**
 * Register a new user
 */
export async function register(username: string, email: string, password: string) {
  return apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
    skipRefresh: true,
  });
}

/**
 * Logout the current user
 */
export async function logout() {
  const result = await apiRequest('/api/auth/logout', {
    method: 'POST',
  });

  if (result.success) {
    window.location.href = '/';
  }

  return result;
}

/**
 * Verify if user is authenticated and get user data
 */
export async function verifyAuth() {
  return apiRequest('/api/auth/verify', {
    method: 'GET',
    credentials: 'include',
  });
}

/**
 * Get user's characters
 */
export async function getCharacters() {
  return apiRequest('/api/characters', {
    method: 'GET',
    credentials: 'include',
  });
}

/**
 * Get marketplace items
 */
export async function getMarketplaceItems(filters?: {
  category?: string;
  featured?: boolean;
}) {
  const params = new URLSearchParams();
  if (filters?.category) params.append('category', filters.category);
  if (filters?.featured) params.append('featured', 'true');

  const query = params.toString() ? `?${params.toString()}` : '';

  return apiRequest(`/api/marketplace/items${query}`, {
    method: 'GET',
    credentials: 'include',
  });
}

/**
 * Get user's cart
 */
export async function getCart() {
  return apiRequest('/api/marketplace/cart', {
    method: 'GET',
    credentials: 'include',
  });
}

/**
 * Add item to cart
 */
export async function addToCart(marketItemId: number, quantity: number = 1, selectedWeaponId?: number) {
  return apiRequest('/api/marketplace/cart', {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify({
      market_item_id: marketItemId,
      quantity,
      selected_weapon_id: selectedWeaponId,
    }),
  });
}

/**
 * Update cart item quantity
 */
export async function updateCartItem(cartItemId: number, quantity: number) {
  return apiRequest(`/api/marketplace/cart/${cartItemId}`, {
    method: 'PUT',
    credentials: 'include',
    body: JSON.stringify({ quantity }),
  });
}

/**
 * Remove item from cart
 */
export async function removeFromCart(cartItemId: number) {
  return apiRequest(`/api/marketplace/cart/${cartItemId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
}

/**
 * Clear entire cart
 */
export async function clearCart() {
  return apiRequest('/api/marketplace/cart', {
    method: 'DELETE',
    credentials: 'include',
  });
}

/**
 * Create checkout (redirects to MercadoPago)
 */
export async function createCheckout(playerId: number) {
  return apiRequest('/api/marketplace/checkout', {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify({ player_id: playerId }),
  });
}

/**
 * Get user's orders
 */
export async function getOrders() {
  return apiRequest('/api/marketplace/orders', {
    method: 'GET',
    credentials: 'include',
  });
}

/**
 * Get specific order details
 */
export async function getOrder(orderId: number) {
  return apiRequest(`/api/marketplace/orders/${orderId}`, {
    method: 'GET',
    credentials: 'include',
  });
}

/**
 * Get account details for account management
 */
export async function getAccountDetails() {
  return apiRequest('/api/account/details', {
    method: 'GET',
    credentials: 'include',
  });
}

/**
 * Change account password
 */
export async function changePassword(currentPassword: string, newPassword: string) {
  return apiRequest('/api/account/change-password', {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

/**
 * Change account email
 */
export async function changeEmail(newEmail: string, currentPassword: string) {
  return apiRequest('/api/account/change-email', {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify({ newEmail, currentPassword }),
  });
}

/**
 * Request password reset email
 */
export async function forgotPassword(email: string) {
  return apiRequest('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
    skipRefresh: true,
  });
}

/**
 * Reset password with token
 */
export async function resetPassword(token: string, newPassword: string) {
  return apiRequest('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
    skipRefresh: true,
  });
}

/**
 * Verify if reset token is valid
 */
export async function verifyResetToken(token: string) {
  return apiRequest(`/api/auth/verify-reset-token?token=${token}`, {
    method: 'GET',
    skipRefresh: true,
  });
}

export { API_URL };