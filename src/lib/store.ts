import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "./api";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      login: (user, accessToken, refreshToken) => {
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },
      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },
      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });
      },
      updateUser: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...updates };
          set({ user: updatedUser });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

interface UIState {
  sidebarOpen: boolean;
  theme: "light" | "dark";
  toggleSidebar: () => void;
  toggleTheme: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  theme: "light",
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleTheme: () =>
    set((state) => ({ theme: state.theme === "light" ? "dark" : "light" })),
}));

interface NotificationState {
  notifications: any[];
  unreadCount: number;
  setNotifications: (notifications: any[]) => void;
  addNotification: (notification: any) => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  setUnreadCount: (count: number) => void;
  fetchUnreadCount: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) => {
    // Güvenli filtreleme - geçersiz bildirimleri atla
    const validNotifications = notifications.filter((n) => n && n.id);
    const unreadCount = validNotifications.filter((n) => n && !n.isRead).length;
    set({ notifications: validNotifications, unreadCount });
  },
  addNotification: (notification) => {
    if (!notification || !notification.id) {
      console.warn("Geçersiz bildirim eklenmeye çalışıldı:", notification);
      return;
    }
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },
  markAsRead: (id) => {
    if (!id) {
      console.warn("Geçersiz ID ile bildirim işaretlenmeye çalışıldı:", id);
      return;
    }
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n && n.id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },
  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n ? { ...n, isRead: true } : n
      ),
      unreadCount: 0,
    }));
  },
  setUnreadCount: (count) => {
    const safeCount = typeof count === "number" && count >= 0 ? count : 0;
    set({ unreadCount: safeCount });
  },
  fetchUnreadCount: async () => {
    try {
      const { notificationApi } = await import("./api");
      const response = await notificationApi.getUnreadCount();

      // API response kontrolü
      if (response && typeof response.count === "number") {
        set({ unreadCount: Math.max(0, response.count) });
      } else {
        console.warn("Geçersiz unread count response:", response);
        set({ unreadCount: 0 });
      }
    } catch (error) {
      console.error("Bildirim sayısı alınamadı:", error);
      // Hata durumunda unread count'u sıfırla
      set({ unreadCount: 0 });
    }
  },
}));
