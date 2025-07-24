import axios from "axios";
import { useAuthStore } from "./store";
import toast from "react-hot-toast";

const API_BASE_URL = "https://localhost:7106/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add the access token to every request
api.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refreshing
api.interceptors.response.use(
  (response) => {
    // Başarılı mutasyonlarda (GET dışı) backend'den "message" varsa otomatik başarı toast'ı göster
    const method = response.config.method?.toLowerCase();
    if (method && method !== "get" && response.data?.message) {
      // İsteği yapan, manuel toast göstermek istemiyorsa header'a { 'X-Skip-Success-Toast': 'true' } ekleyebilir
      const skip = response.config.headers?.["X-Skip-Success-Toast"] === "true";
      if (!skip) {
        toast.success(response.data.message);
      }
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Check if the error is 401 and it's not a retry request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { accessToken, refreshToken } = useAuthStore.getState();
        if (!refreshToken || !accessToken) {
          // If no tokens, logout and redirect
          useAuthStore.getState().logout();
          // window.location.href yerine navigate kullanmayı tercih ediyoruz
          // Bu durumda sadece logout yapıp error'ı reject ediyoruz
          return Promise.reject(error);
        }

        // Call the refresh token endpoint with both tokens
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/Auth/refresh-token`,
          {
            token: accessToken,
            refreshToken,
          }
        );

        // Backend'den gelen yeni token'lar (login yanıtıyla aynı formatta olduğunu varsayıyoruz)
        const { token: newAccessToken, refreshToken: newRefreshToken } =
          refreshResponse.data;

        // Update tokens in the store
        useAuthStore.getState().setTokens(newAccessToken, newRefreshToken);

        // Update the authorization header for the original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // Retry the original request with the new token
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, logout the user
        useAuthStore.getState().logout();
        // window.location.href yerine sadece logout yapıp error'ı reject ediyoruz
        return Promise.reject(refreshError);
      }
    }

    // Global hata toast'ı (manuel override etmek isteyen istekler 'X-Skip-Error-Toast' header'ı ekleyebilir)
    const skipError = error.config?.headers?.["X-Skip-Error-Toast"] === "true";
    if (!skipError) {
      const backendMessage = error.response?.data?.message;

      // Login sayfasında özel hata mesajları için kontrol
      if (originalRequest.url?.includes("/Auth/login")) {
        // Login hatalarında toast gösterme, hata mesajı component'te yönetilecek
        return Promise.reject(error);
      }

      // Diğer hatalarda toast göster
      toast.error(backendMessage || "İşlem sırasında bir hata oluştu");
    }

    return Promise.reject(error);
  }
);

// API Types
export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: "SuperAdmin" | "Admin" | "VipUser" | "NormalUser" | "Guest";
  isEmailVerified: boolean;
  profileImageUrl?: string;
  vipExpiryDate?: string;
  userProfileImageUrl?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  captchaSessionId: string;
  captchaCode: string;
}

// Yeni, detaylı Prediction tipleri
export interface PredictionListDto {
  id: number;
  title: string;
  content: string;
  isPaid: boolean;
  price: number;
  firstImageUrl: string;
  createdAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  userName: string;
  userId?: number; // Kullanıcı ID'si
  userProfileImageUrl?: string;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
    isVipActive?: boolean;
    isBlocked?: boolean;
    createdAt?: string;
  };
  // Reaksiyon sayıları
  totalLikes?: number;
  likeCountReaction?: number; // 👍 Like sayısı
  loveCount?: number; // ❤️ Love sayısı
  laughCount?: number; // 😂 Laugh sayısı
  angryCount?: number; // 😠 Angry sayısı
  sadCount?: number; // 😢 Sad sayısı
  wowCount?: number; // 😮 Wow sayısı
}

export interface PredictionDetailDto {
  id: number;
  title: string;
  content: string;
  isPaid: boolean;
  price: number;
  imageUrls: string[];
  createdAt: string;
  updatedAt?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  user: User; // Mevcut User tipini kullanabiliriz
  isLikedByCurrentUser: boolean;
  isCorrect?: boolean;
  resultNote?: string;
  resultDate?: string;
  isPinned?: boolean;
  pinnedAt?: string;
  pinnedBy?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  isFeatured?: boolean;
}

export interface DailyPost {
  id: number;
  title: string;
  content?: string;
  shortContent?: string;
  imageUrl?: string;
  category: string;
  tags?: string;
  isPublished: boolean;
  isFeatured: boolean;
  createdAt?: string;
  updatedAt?: string;
  adminId: number;
  adminName: string;
  adminProfileImageUrl?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isLikedByCurrentUser?: boolean;
  tagList?: string[];
  // Reaksiyon sayıları
  totalLikes?: number;
  likeCountReaction?: number; // 👍 Like sayısı
  loveCount?: number; // ❤️ Love sayısı
  laughCount?: number; // 😂 Laugh sayısı
  angryCount?: number; // 😠 Angry sayısı
  sadCount?: number; // 😢 Sad sayısı
  wowCount?: number; // 😮 Wow sayısı
}

export interface DailyPostStats {
  totalPosts: number;
  publishedPosts: number;
  featuredPosts: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  categoryStats: Array<{
    category: string;
    postCount: number;
    totalViews: number;
    totalLikes: number;
  }>;
}

export interface Comment {
  id: number;
  content: string;
  imageUrl?: string;
  createdAt?: string;
  likeCount: number;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
    isVipActive?: boolean;
    isBlocked?: boolean;
    createdAt?: string;
  };
  isLikedByCurrentUser?: boolean;
  isApproved: boolean;
}

// Captcha Types
export interface CaptchaGenerateResponse {
  sessionId: string;
  imageBase64: string;
  expiresAt: string;
}

export interface CaptchaVerifyResponse {
  message: string;
  isValid: boolean;
}

export interface CaptchaCleanupResponse {
  message: string;
}

// Contact Types
export interface ContactRequest {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface ContactMessage {
  id: number;
  name?: string;
  email?: string;
  phone?: string;
  subject: string;
  message: string;
  adminReply?: string;
  isRead: boolean;
  isReplied: boolean;
  createdAt: string;
  readAt?: string;
  repliedAt?: string;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  repliedByUser?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface ContactStats {
  totalMessages: number;
  unreadMessages: number;
  repliedMessages: number;
  todayMessages: number;
  replyRate: number;
}

// Analytics Types
export interface AnalyticsSummary {
  totalUsers: number;
  totalVipUsers: number;
  totalPredictions: number;
  completedPredictions: number;
  correctPredictions: number;
  overallSuccessRate: number;
  totalRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  totalLikes: number;
  totalComments: number;
  totalViews: number;
  generatedAt: string;
}

export interface TodayAnalytics {
  id: number;
  date: string;
  newUserCount: number;
  activeUserCount: number;
  totalUserCount: number;
  newPredictionCount: number;
  completedPredictionCount: number;
  correctPredictionCount: number;
  totalPredictionCount: number;
  overallSuccessRate: number;
  vipSuccessRate: number;
  normalUserSuccessRate: number;
  dailyRevenue: number;
  totalRevenue: number;
  newVipUserCount: number;
  expiredVipUserCount: number;
  totalLikeCount: number;
  totalCommentCount: number;
  totalShareCount: number;
  totalViewCount: number;
  createdAt: string;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  averageOrderValue: number;
  totalTransactions: number;
  dailyRevenue: Array<{
    date: string;
    revenue: number;
  }>;
  startDate: string;
  endDate: string;
}

export interface DashboardAnalytics {
  summary: AnalyticsSummary;
  todayAnalytics: TodayAnalytics;
  topUsers: any[];
  lastUpdated: string;
}

// AuditLog Types
export interface AuditLogItem {
  id: number;
  action: string;
  entity: string;
  entityId?: number;
  userId: number;
  userEmail: string;
  userName: string;
  ipAddress: string;
  userAgent: string;
  endpoint: string;
  httpMethod: string;
  requestData?: string;
  responseData?: string;
  statusCode: number;
  duration: number;
  errorMessage?: string;
  createdAt: string;
  level: number;
}

export interface AuditLogSummary {
  totalLogs: number;
  totalUsers: number;
  totalActions: number;
  errorCount: number;
  warningCount: number;
  topActions: Array<{
    action: string;
    count: number;
  }>;
  topUsers: Array<{
    userId: number;
    userName: string;
    userEmail: string;
    count: number;
  }>;
  topIps: Array<{
    ipAddress: string;
    count: number;
    uniqueUsers: number;
  }>;
}

// API Functions
export const authApi = {
  login: (data: LoginRequest) =>
    api.post("/auth/login", data, {
      headers: {
        "X-Skip-Success-Toast": "true",
        "X-Skip-Error-Toast": "true",
      },
    }),
  register: (data: RegisterRequest) => api.post("/auth/register", data),
  forgotPassword: (email: string) =>
    api.post("/auth/forgot-password", { email }),
  resetPassword: (token: string, newPassword: string) =>
    api.post("/auth/reset-password", { token, newPassword }),
  verifyEmail: (token: string) => api.post("/auth/verify-email", { token }),
  checkEmail: (email: string) => api.post("/auth/check-email", { email }),
};

// Tamamen yenilenmiş predictionsApi
export const predictionsApi = {
  // GET /api/predictions?page=1&pageSize=10&onlyFree=false
  getAll: (params: {
    page: number;
    pageSize: number;
    onlyFree?: boolean;
    sort?: string;
  }) =>
    api.get<{ predictions: PredictionListDto[]; totalCount: number }>(
      "/predictions",
      { params }
    ),

  // GET /api/predictions/{id}
  getById: (id: number) => api.get<PredictionDetailDto>(`/predictions/${id}`),

  // POST /api/predictions
  create: (data: FormData) =>
    api.post<{ message: string; predictionId: number }>("/predictions", data, {
      headers: {
        "Content-Type": "multipart/form-data",
        "X-Skip-Success-Toast": "true", // Çifte toast'ı önle
      },
      timeout: 60000, // 60 saniye timeout - resim yükleme için daha uzun
    }),

  // PUT /api/predictions/{id}
  update: (
    id: number,
    data: { title: string; content: string; isPaid: boolean; price: number }
  ) => api.put<{ message: string }>(`/predictions/${id}`, data),

  // DELETE /api/predictions/{id}
  delete: (id: number) => api.delete<{ message: string }>(`/predictions/${id}`),

  // POST /api/predictions/{id}/like
  like: (id: number, type: number) =>
    api.post<{ message: string; likeCount: number }>(
      `/predictions/${id}/like`,
      {
        type,
      }
    ),

  // PUT /api/predictions/{id}/result
  setResult: (
    id: number,
    data: { isCorrect: boolean; resultNote: string; resultDate: string }
  ) =>
    api.put<{ message: string; isCorrect: boolean; resultNote: string }>(
      `/predictions/${id}/result`,
      data
    ),

  // PUT /api/predictions/{id}/pin
  pin: (id: number, data: { isPinned: boolean; reason: string }) =>
    api.put<{ message: string; isPinned: boolean; reason: string }>(
      `/predictions/${id}/pin`,
      data
    ),

  // PUT /api/Predictions/{id}/featured
  feature: (id: number, data: { isFeatured: boolean; reason: string }) =>
    api.put<{ message: string; isFeatured: boolean; reason: string }>(
      `/Predictions/${id}/featured`,
      data
    ),

  // GET /api/Predictions/featured?count=5
  getFeatured: (count: number = 5) =>
    api.get<PredictionListDto[]>(`/Predictions/featured?count=${count}`),

  // GET /api/Predictions/pinned
  getPinned: () => api.get<PredictionDetailDto>("/Predictions/pinned"),

  // GET /api/Predictions/{id}/likes
  getLikers: (id: number): Promise<LikersResponse> =>
    api.get(`/Predictions/${id}/likes`).then((res) => res.data),
};

export const dailyPostsApi = {
  getAll: (params?: any) => api.get("/dailyposts", { params }),
  getById: (id: number) => api.get(`/dailyposts/${id}`),
  create: (data: FormData) =>
    api.post("/dailyposts", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id: number, data: FormData) =>
    api.put(`/dailyposts/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  delete: (id: number) => api.delete(`/dailyposts/${id}`),
  like: (id: number, type: number) =>
    api.post(`/dailyposts/${id}/like`, { type }),
  getCategories: () => api.get("/dailyposts/categories"),
  getAdminStats: () => api.get("/dailyposts/admin/stats"),
  getLikers: (id: number): Promise<LikersResponse> =>
    api.get(`/dailyposts/${id}/likes`).then((res) => res.data),
};

export const commentsApi = {
  getPredictionComments: (predictionId: string, params?: any) =>
    api.get(`/comments/prediction/${predictionId}`, { params }),
  getDailyPostComments: (dailyPostId: string, params?: any) =>
    api.get(`/comments/dailypost/${dailyPostId}`, { params }),
  getPendingComments: (params?: any) =>
    api.get("/comments/pending", { params }),
  approveComment: (id: number) => api.post(`/comments/${id}/approve`),
  rejectComment: (id: number) => api.post(`/comments/${id}/reject`),
  addPredictionComment: (
    predictionId: string,
    data: { content: string; image?: File }
  ) => {
    const formData = new FormData();
    formData.append("content", data.content);
    if (data.image) {
      formData.append("image", data.image);
    }
    return api.post(`/comments/prediction/${predictionId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  addDailyPostComment: (
    dailyPostId: string,
    data: { content: string; image?: File }
  ) => {
    const formData = new FormData();
    formData.append("content", data.content);
    if (data.image) {
      formData.append("image", data.image);
    }
    return api.post(`/comments/dailypost/${dailyPostId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  like: (id: number, type: number) =>
    api.post(`/comments/${id}/like`, { type }),
  getLikers: (id: number): Promise<LikersResponse> =>
    api.get(`/comments/${id}/likes`).then((res) => res.data),
};

// Kullanıcı bilgileri için interface
export interface UserProfileInfo {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  profileImageUrl?: string;
  createdAt: string;
  isVipActive: boolean;
  isBlocked: boolean;
}

export const profileApi = {
  get: () => api.get("/Auth/profile"),
  update: (data: { firstName: string; lastName: string; phone?: string }) =>
    api.put("/Profile/update-profile", data),
  uploadProfileImage: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/Profile/upload-profile-image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  changePassword: (
    currentPassword: string,
    newPassword: string,
    confirmNewPassword: string
  ) =>
    api.post("/auth/change-password", {
      currentPassword,
      newPassword,
      confirmNewPassword,
    }),
  getPredictions: (params?: any) => api.get("/profile/predictions", { params }),
  getComments: (params?: any) => api.get("/profile/comments", { params }),

  // Yeni kullanıcı bilgileri endpoint'leri
  getAllUsers: (params?: any) => api.get("/profile/users", { params }),
  getUserById: (id: number) => api.get(`/profile/users/${id}`),
  getUsersByIds: (userIds: string) =>
    api.get(`/profile/users/bulk?userIds=${userIds}`),
};

export const captchaApi = {
  generate: (sessionId: string) => api.post("/Captcha/generate", { sessionId }),
  verify: (sessionId: string, captchaCode: string) =>
    api.post("/Captcha/verify", { sessionId, captchaCode }),
  cleanup: () => api.post("/Captcha/cleanup"),
};

// Admin Password Reset Request API
export const adminPasswordResetApi = {
  // GET /api/admin/password-reset-requests
  getAll: (params?: any) =>
    api.get<{ requests: PasswordResetRequest[]; totalCount: number }>(
      "/admin/password-reset-requests",
      { params }
    ),

  // POST /api/admin/password-reset-requests/{id}/approve
  approve: (id: number, note?: string) =>
    api.post(`/admin/password-reset-requests/${id}/approve`, { note }),

  // POST /api/admin/password-reset-requests/{id}/reject
  reject: (id: number, note?: string) =>
    api.post(`/admin/password-reset-requests/${id}/reject`, { note }),

  // POST /api/admin/password-reset-requests/{id}/complete
  complete: (id: number) =>
    api.post(`/admin/password-reset-requests/${id}/complete`),
};

export const contactApi = {
  send: (data: ContactRequest) => api.post("/contact", data),
  getMyMessages: (params?: any) => api.get("/contact/my-messages", { params }),
  getAll: (params?: any) => api.get("/contact/all", { params }),
  getById: (id: number) => api.get(`/contact/${id}`),
  delete: (id: number) => api.delete(`/contact/${id}`),
  reply: (id: number, reply: string) =>
    api.post(`/contact/${id}/reply`, reply, {
      headers: { "Content-Type": "application/json" },
    }),
  markAsRead: (id: number) => api.post(`/contact/${id}/mark-read`),
  getStats: () => api.get("/contact/stats"),
};

export const notificationsApi = {
  get: (params?: any) => api.get("/notifications", { params }),
  getAll: (params?: any) => api.get("/notifications", { params }),
  markAsRead: (id: number) => api.post(`/notifications/${id}/mark-read`),
  markAllAsRead: () => api.post("/notifications/mark-all-read"),
};

export const paymentNotificationsApi = {
  submit: (data: FormData) =>
    api.post("/payment-notifications", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getMyNotifications: (params?: any) =>
    api.get("/payment-notifications/my-notifications", { params }),
  getPending: (params?: any) =>
    api.get("/payment-notifications/pending", { params }),
  process: (id: number, data: any) =>
    api.post(`/payment-notifications/${id}/process`, data),
};

export const adminApi = {
  getStats: () => api.get("/admin/stats"),
  getUsers: (params?: any) => api.get("/admin/users", { params }),
  getUserById: (id: number) => api.get(`/admin/users/${id}`),
  grantVip: (id: number, data: { membershipType: number }) =>
    api.post(`/admin/users/${id}/grant-vip`, data),
  revokeVip: (id: number) => api.post(`/admin/users/${id}/revoke-vip`),
  blockUser: (id: number, data: { reason: string }) =>
    api.post(`/admin/users/${id}/block`, data),
  unblockUser: (id: number) => api.post(`/admin/users/${id}/unblock`),
  changeRole: (id: number, roleId: number) =>
    api.post(`/admin/users/${id}/change-role`, roleId),
  getVipExpiring: (days: number = 7) =>
    api.get(`/admin/vip-expiring?days=${days}`),
  getAuditLogs: (params?: any) => api.get("/admin/audit-logs", { params }),

  // SuperAdmin API'leri
  grantAdmin: (id: number, data: { reason: string; note?: string }) =>
    api.post(`/admin/users/${id}/grant-admin`, data),
  revokeAdmin: (
    id: number,
    data: { reason: string; note?: string; convertToNormalUser?: boolean }
  ) => api.post(`/admin/users/${id}/revoke-admin`, data),
  changeRoleSuper: (id: number, data: { newRole: number; reason: string }) =>
    api.post(`/admin/users/${id}/change-role-super`, data),
  getAdmins: () => api.get("/admin/admins").then((res) => res.data),
  getRoleHistory: (userId: number) =>
    api.get(`/admin/role-history/${userId}`).then((res) => res.data),
};

export const analyticsApi = {
  getSummary: () => api.get("/analytics/summary"),
  getToday: () => api.get("/analytics/today"),
  getRange: (startDate: string, endDate: string) =>
    api.get("/analytics/range", {
      params: { startDate, endDate },
    }),
  getRevenue: (startDate: string, endDate: string) =>
    api.get("/analytics/revenue", {
      params: { startDate, endDate },
    }),
  getDashboard: () => api.get("/analytics/dashboard"),
};

export const auditLogApi = {
  getAll: (params?: any) => api.get("/auditlog", { params }),
  getById: (id: number) => api.get(`/auditlog/${id}`),
  getSummary: (startDate?: string, endDate?: string) =>
    api.get("/auditlog/summary", {
      params: { startDate, endDate },
    }),
  cleanup: (daysToKeep: number = 30) =>
    api.delete("/auditlog/cleanup", {
      params: { daysToKeep },
    }),
};

export const notificationApi = {
  getNotifications: (params: {
    page: number;
    pageSize: number;
    unreadOnly?: boolean;
  }) => api.get("/notification", { params }).then((res) => res.data),
  markRead: (id: number) => {
    if (!id || typeof id !== "number") {
      return Promise.reject(new Error("Geçersiz bildirim ID"));
    }
    return api.post(`/notification/mark-read/${id}`).then((res) => res.data);
  },
  markAllRead: () =>
    api.post("/notification/mark-all-read").then((res) => res.data),
  getUnreadCount: () =>
    api.get("/notification/unread-count").then((res) => {
      // API response kontrolü
      if (res.data && typeof res.data.count === "number") {
        return res.data;
      }
      // Geçersiz response durumunda default değer döndür
      return { count: 0 };
    }),

  getSettings: () => api.get("/notification/settings").then((res) => res.data),
  updateSettings: (settings: {
    enableEmailNotifications: boolean;
    notifyOnNewPredictions: boolean;
    notifyOnComments: boolean;
    notifyOnVipExpiry: boolean;
  }) => api.put("/notification/settings", settings).then((res) => res.data),
  getLogs: (params: { type?: string; page: number; pageSize: number }) =>
    api.get("/notification/logs", { params }).then((res) => res.data),

  // Enhanced notification endpoints - mevcut endpoint'i kullan
  getEnhancedNotifications: (params: {
    page: number;
    pageSize: number;
    unreadOnly?: boolean;
  }) => {
    // Parametre kontrolü
    if (!params.page || params.page < 1) {
      return Promise.reject(new Error("Geçersiz sayfa numarası"));
    }
    if (!params.pageSize || params.pageSize < 1) {
      return Promise.reject(new Error("Geçersiz sayfa boyutu"));
    }

    return api
      .get<{
        notifications: EnhancedNotification[];
        totalCount: number;
        totalPages: number;
      }>("/notification", { params })
      .then((res) => {
        // API response kontrolü
        if (res.data) {
          return {
            notifications: Array.isArray(res.data.notifications)
              ? res.data.notifications
              : [],
            totalCount:
              typeof res.data.totalCount === "number" ? res.data.totalCount : 0,
            totalPages:
              typeof res.data.totalPages === "number" ? res.data.totalPages : 1,
          };
        }
        // Boş response durumunda default değerler döndür
        return {
          notifications: [],
          totalCount: 0,
          totalPages: 1,
        };
      });
  },

  // Bildirim detayları için
  getNotificationDetails: (id: number) => {
    if (!id || typeof id !== "number") {
      return Promise.reject(new Error("Geçersiz bildirim ID"));
    }
    return api
      .get<EnhancedNotification>(`/notification/${id}/details`)
      .then((res) => res.data);
  },
};

export const paymentApi = {
  // User endpoints
  getPackages: () =>
    api.get("/paymentnotifications/packages").then((res) => res.data),
  createNotification: (data: {
    senderName: string;
    bankName: string;
    amount: number;
    transactionDate: string;
    transactionReference: string;
    note?: string;
    membershipType: number;
  }) => api.post("/paymentnotifications", data).then((res) => res.data),
  getMyNotifications: (params: { page: number; pageSize: number }) =>
    api
      .get("/paymentnotifications/my-notifications", { params })
      .then((res) => res.data),

  // Admin endpoints
  getAllNotifications: (params: { page: number; pageSize: number }) =>
    api.get("/paymentnotifications/all", { params }).then((res) => res.data),
  getPendingNotifications: (params: { page: number; pageSize: number }) =>
    api
      .get("/paymentnotifications/pending", { params })
      .then((res) => res.data),
  approveNotification: (id: number, adminNote: string) =>
    api
      .post(`/paymentnotifications/${id}/approve`, JSON.stringify(adminNote), {
        headers: { "Content-Type": "application/json" },
      })
      .then((res) => res.data),
  rejectNotification: (id: number, adminNote: string) =>
    api
      .post(`/paymentnotifications/${id}/reject`, JSON.stringify(adminNote), {
        headers: { "Content-Type": "application/json" },
      })
      .then((res) => res.data),
};

// 👍 Beğenenler Listesi İçin Interface'ler
export interface Liker {
  userId: number;
  userName: string;
  profileImageUrl?: string | null;
  likeType: number; // 1=Like, 2=Love, 3=Laugh, 4=Angry, 5=Sad, 6=Wow
  likeTypeName: string;
  likedAt: string;
}

export interface LikersResponse {
  totalLikes: number;
  likeCount: number; // 👍 Like sayısı
  loveCount: number; // ❤️ Love sayısı
  laughCount: number; // 😂 Laugh sayısı
  angryCount: number; // 😠 Angry sayısı
  sadCount: number; // 😢 Sad sayısı
  wowCount: number; // 😮 Wow sayısı
  likers: Liker[];
  // Content bilgileri
  postId?: number;
  postTitle?: string;
  predictionId?: number;
  predictionTitle?: string;
  commentId?: number;
}

// Password Reset Request Interface
export interface PasswordResetRequest {
  id: number;
  userId: number;
  userEmail: string;
  userName: string;
  status: "Pending" | "Approved" | "Rejected" | "Completed";
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  completedAt?: string;
  approvedBy?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  resetToken?: string;
  adminNote?: string;
}

// Enhanced Notification Interface
export interface EnhancedNotification {
  id: number;
  type: string;
  category: string;
  subject: string;
  content: string;
  status: "Sent" | "Failed" | "Pending";
  createdAt: string;
  readAt: string | null;
  errorMessage?: string;

  // Yeni API yapısına uygun alanlar
  relatedLink?: string; // Bildirim linki
  actorUserId?: number; // Bildirim yapan kişinin ID'si
  actorFirstName?: string; // Bildirim yapan kişinin adı
  actorLastName?: string; // Bildirim yapan kişinin soyadı
  actorProfileImageUrl?: string; // Bildirim yapan kişinin profil resmi

  // Eski alanlar (geriye uyumluluk için)
  entityId?: number; // Tahmin veya paylaşım ID'si
  entityType?: "Prediction" | "DailyPost"; // Entity türü
  entityTitle?: string; // Tahmin/paylaşım başlığı

  // Paylaşım yapan kişi bilgileri (geriye uyumluluk için)
  authorId?: number;
  authorName?: string;
  authorProfileImageUrl?: string;

  // Bildirim türüne göre ek bilgiler (geriye uyumluluk için)
  predictionId?: number;
  dailyPostId?: number;
  commentId?: number;
}
