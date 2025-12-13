import { login as apiLogin, register as apiRegister } from '../utils/api';

export async function useAuth(endpoint: string, data: Record<string, any>) {
  console.warn('useAuth is deprecated. Please use functions from src/utils/api.ts instead.');

  if (endpoint === 'login') {
    return apiLogin(data.email, data.password);
  } else if (endpoint === 'register') {
    const result = await apiRegister(data.username, data.email, data.password);
    if (result.success && result.data?.recoveryKey) {
      return { ...result, recoveryKey: result.data.recoveryKey };
    }
    return result;
  }

  const API_URL = import.meta.env.PUBLIC_API_URL;
  try {
    const response = await fetch(`${API_URL}/api/auth/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", 
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Request failed");

    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
}
