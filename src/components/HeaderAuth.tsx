import { useState, useEffect, useRef } from 'react';
import { LogOut, User, Users, ChevronDown } from 'lucide-react';
import { verifyAuth, logout as apiLogout } from '../utils/api';

interface UserData {
  id: number;
  email: string;
  accountName: string;
}

export default function HeaderAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const checkAuth = async () => {
    try {
      // Verify authentication using cookie-based auth with auto-refresh
      const result = await verifyAuth();

      if (result.success && result.data?.user) {
        setUser({
          id: result.data.user.id,
          email: result.data.user.email,
          accountName: result.data.user.accountName
        });
        setIsLoggedIn(true);
      } else {
        // Not authenticated
        setIsLoggedIn(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsLoggedIn(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleLogout = async () => {
    try {
      await apiLogout();
      // apiLogout already handles redirect to '/'
    } catch (error) {
      console.error('Logout failed:', error);
      // Force redirect anyway
      window.location.href = '/';
    }
  };

  if (isLoading) {
    // Optional: Show a loading state
    return (
      <div className="flex items-center gap-4">
        <div className="w-24 h-10 bg-gray-700/50 animate-pulse rounded"></div>
      </div>
    );
  }

  if (isLoggedIn && user) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition group"
          title={user.accountName}
        >
          <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {getInitials(user.accountName)}
          </div>
          <span className="hidden md:inline text-sm font-medium">{user.accountName}</span>
          <ChevronDown
            size={16}
            className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
            <div className="py-1">
              {/* Mi perfil */}
              <a
                href="/profile"
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                onClick={() => setIsDropdownOpen(false)}
              >
                <User size={18} />
                <span>Mi perfil</span>
              </a>

              {/* Mis personajes */}
              <a
                href="/characters"
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                onClick={() => setIsDropdownOpen(false)}
              >
                <Users size={18} />
                <span>Mis personajes</span>
              </a>

              {/* Divider */}
              <div className="border-t border-gray-700 my-1"></div>

              {/* Salir */}
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors"
              >
                <LogOut size={18} />
                <span>Salir</span>
              </button>
            </div>
          </div>
        )}
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
