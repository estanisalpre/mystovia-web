import { login as apiLogin, register as apiRegister } from '../utils/api';

export async function useAuth(endpoint: string, data: Record<string, any>) {
  if (endpoint === 'login') {
    return apiLogin(data.email, data.password);
  } else if (endpoint === 'register') {
    const result = await apiRegister(data.username, data.email, data.password);
    if (result.success && result.data?.recoveryKey) {
      return { ...result, recoveryKey: result.data.recoveryKey };
    }
    return result;
  }

  const INTERNAL_API_URL = `http://localhost:${process.env.PORT || 3301}`;

  try {
    const response = await fetch(`${INTERNAL_API_URL}/api/auth/${endpoint}`, {
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
