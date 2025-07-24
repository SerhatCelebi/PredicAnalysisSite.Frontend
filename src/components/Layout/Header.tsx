import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Bell, Menu, X } from "lucide-react";
import {
  useAuthStore,
  useUIStore,
  useNotificationStore,
} from "../../lib/store";

export const Header: React.FC = () => {
  const { user } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { unreadCount, fetchUnreadCount } = useNotificationStore();

  // Kullanıcı giriş yaptığında bildirim sayısını çek
  useEffect(() => {
    if (user) {
      fetchUnreadCount();

      // Her 30 saniyede bir bildirim sayısını güncelle
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchUnreadCount]);

  return (
    <header className="glass-effect border-b border-dark-700/50 sticky top-0 z-40 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleSidebar}
              className="p-2 text-gray-400 hover:text-gray-200 hover:bg-dark-700/50 rounded-lg transition-all duration-200"
            >
              {sidebarOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Logo or Brand */}
          <div className="flex-1 md:flex-none">
            <Link
              to="/"
              className="text-xl font-bold text-gradient hover:scale-105 transition-transform duration-200"
            >
              VurduGololdu
            </Link>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Notifications */}
                <Link
                  to="/notifications"
                  className="relative p-2 text-gray-400 hover:text-gray-200 hover:bg-dark-700/50 rounded-lg transition-all duration-200 group"
                >
                  <Bell className="h-6 w-6 group-hover:animate-pulse" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shadow-lg animate-pulse">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login" className="btn-ghost text-sm">
                  Giriş Yap
                </Link>
                <Link to="/register" className="btn-primary text-sm">
                  Üye Ol
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
