import { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';

interface UserData {
  id: number;
  email: string;
  accountName: string;
}

export default function HeaderAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Decode JWT to get user info
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({
          id: payload.userId,
          email: payload.email,
          accountName: payload.accountName
        });
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Invalid token:', error);
        localStorage.removeItem('token');
      }
    }
  }, []);

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  if (isLoggedIn && user) {
    return (
      <div className="flex items-center gap-3">
        <a
          href="/profile"
          className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition group"
          title={user.accountName}
        >
          <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {getInitials(user.accountName)}
          </div>
          <span className="hidden md:inline text-sm font-medium">{user.accountName}</span>
        </a>
        <button
          onClick={handleLogout}
          className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          title="Cerrar sesión"
        >
          <LogOut size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <a
        href="/login"
        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition text-sm font-medium"
      >
        INGRESAR
      </a>
      <a
        href="/register"
        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded transition text-sm font-medium"
      >
        REGISTRARME
      </a>
    </div>
  );
}
