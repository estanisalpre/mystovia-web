export async function useAuth(endpoint: string, data: Record<string, any>) {
  const API_URL = import.meta.env.PUBLIC_API_URL;
  try {
    const response = await fetch(`${API_URL}/api/auth/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Request failed");

    if (result.token) {
      localStorage.setItem("token", result.token);
      localStorage.setItem("user", JSON.stringify(result.user));
    }

    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
}
