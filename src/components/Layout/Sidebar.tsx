import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Bell,
  Mail,
  User,
  TrendingUp,
  Calendar,
  DollarSign,
  LogOut,
  Shield,
} from "lucide-react";
import { useAuthStore } from "../../lib/store";
import { cn } from "../../lib/utils";

const navigationItems = [
  {
    name: "Ana Sayfa",
    href: "/",
    icon: Home,
  },
  {
    name: "Bildirimler",
    href: "/notifications",
    icon: Bell,
  },
  {
    name: "Tahminler",
    href: "/predictions",
    icon: TrendingUp,
  },
  {
    name: "Günlük Paylaşımlar",
    href: "/daily-posts",
    icon: Calendar,
  },
  {
    name: "Ödemeler",
    href: "/payments",
    icon: DollarSign,
  },
  {
    name: "İletişim",
    href: "/contact",
    icon: Mail,
  },
  {
    name: "Profil",
    href: "/profile",
    icon: User,
  },
  {
    name: "Şartlar",
    href: "/terms",
    icon: Shield,
  },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="h-full w-64 glass-effect border-r border-dark-700/50 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-dark-700/50">
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-2.5 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-200 group-hover:scale-105">
            <TrendingUp className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold text-gradient">VurduGololdu</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group hover-lift",
                isActive
                  ? "bg-gradient-to-r from-primary-600/20 to-secondary-600/20 text-primary-300 border-l-4 border-primary-500 shadow-lg"
                  : "text-gray-400 hover:bg-dark-700/50 hover:text-gray-200"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-all duration-200",
                  isActive
                    ? "text-primary-400 group-hover:animate-pulse"
                    : "text-gray-500 group-hover:text-gray-300"
                )}
              />
              <span className="group-hover:translate-x-1 transition-transform duration-200">
                {item.name}
              </span>
            </Link>
          );
        })}

        {/* Admin Panel - Only for Admin and SuperAdmin users */}
        {(user?.role === "Admin" || user?.role === "SuperAdmin") && (
          <Link
            to="/admin"
            className={cn(
              "flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 border-t border-dark-700/50 mt-4 pt-4 group hover-lift",
              location.pathname === "/admin"
                ? "bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-300 border-l-4 border-purple-500 shadow-lg"
                : "text-purple-400 hover:bg-purple-900/20 hover:text-purple-300"
            )}
          >
            <Shield
              className={cn(
                "h-5 w-5 transition-all duration-200",
                location.pathname === "/admin"
                  ? "text-purple-400 group-hover:animate-pulse"
                  : "text-purple-500 group-hover:text-purple-300"
              )}
            />
            <span className="group-hover:translate-x-1 transition-transform duration-200">
              Admin Panel
            </span>
          </Link>
        )}

        {/* SuperAdmin Panel - Only for SuperAdmin users */}
        {user?.role === "SuperAdmin" && (
          <Link
            to="/super-admin"
            className={cn(
              "flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group hover-lift",
              location.pathname === "/super-admin"
                ? "bg-gradient-to-r from-red-600/20 to-red-600/20 text-red-300 border-l-4 border-red-500 shadow-lg"
                : "text-red-400 hover:bg-red-900/20 hover:text-red-300"
            )}
          >
            <Shield
              className={cn(
                "h-5 w-5 transition-all duration-200",
                location.pathname === "/super-admin"
                  ? "text-red-400 group-hover:animate-pulse"
                  : "text-red-500 group-hover:text-red-300"
              )}
            />
            <span className="group-hover:translate-x-1 transition-transform duration-200">
              SuperAdmin Panel
            </span>
          </Link>
        )}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-dark-700/50">
        {user && (
          <div className="mb-4 p-4 glass-effect rounded-xl border border-dark-600/30">
            <div className="flex items-center space-x-3">
              {user.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt={user.firstName}
                  className="h-12 w-12 rounded-full object-cover shadow-lg"
                />
              ) : (
                <div className="h-12 w-12 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-semibold text-sm">
                    {user.firstName.charAt(0)}
                    {user.lastName.charAt(0)}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-200 truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-400 truncate flex items-center">
                  {user.role === "VipUser" && "👑 "}
                  {user.role === "SuperAdmin" && "🔥 "}
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      user.role === "VipUser"
                        ? "bg-yellow-900/50 text-yellow-300 border border-yellow-700/50"
                        : user.role === "Admin"
                        ? "bg-purple-900/50 text-purple-300 border border-purple-700/50"
                        : user.role === "SuperAdmin"
                        ? "bg-red-900/50 text-red-300 border border-red-700/50"
                        : "bg-gray-700/50 text-gray-300 border border-gray-600/50"
                    )}
                  >
                    {user.role}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-1">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-xl transition-all duration-200 group"
          >
            <LogOut className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
            <span>Çıkış Yap</span>
          </button>
        </div>
      </div>
    </div>
  );
};
