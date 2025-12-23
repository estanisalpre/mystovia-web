import { useState, useEffect } from 'react';

export interface ServerStats {
  totalPlayers: number;
  onlinePlayers: number;
  uptimeRecord: { record: number; timestamp: number };
  serverVersion: string | number;
}

// API URL for client-side requests
const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3301';

export const useServerStats = () => {
  const [stats, setStats] = useState<ServerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/server/stats`);
        if (!res.ok) throw new Error(`Error fetching stats: ${res.statusText}`);
        const data: ServerStats = await res.json();
        setStats(data);
      } catch (err: any) {
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  return { stats, loading, error };
};