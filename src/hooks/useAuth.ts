/**
 * DEPRECATED: This file is deprecated. Use src/utils/api.ts instead.
 *
 * This file is kept for backwards compatibility but should not be used for new code.
 * The new API system uses HttpOnly cookies instead of localStorage for better security.
 */

import { login as apiLogin, register as apiRegister } from '../utils/api';

export async function useAuth(endpoint: string, data: Record<string, any>) {
  console.warn('useAuth is deprecated. Please use functions from src/utils/api.ts instead.');

  if (endpoint === 'login') {
    return apiLogin(data.email, data.password);
  } else if (endpoint === 'register') {
    return apiRegister(data.username, data.email, data.password);
  }

  // Fallback to old implementation for unknown endpoints
  const API_URL = import.meta.env.PUBLIC_API_URL;
  try {
    const response = await fetch(`${API_URL}/api/auth/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // Use cookies instead of localStorage
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Request failed");

    // Don't store token in localStorage anymore - it's in HttpOnly cookies
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
}
