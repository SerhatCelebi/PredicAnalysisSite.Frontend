import React, { useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { notificationApi, EnhancedNotification } from "../lib/api";
import {
  Bell,
  CheckCircle,
  XCircle,
  RefreshCw,
  Star,
  Zap,
  Eye,
  ExternalLink,
  User,
  TrendingUp,
  Calendar,
  MessageCircle,
  Heart,
  Crown,
} from "lucide-react";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { Link } from "react-router-dom";

const getNotificationDetails = (notification: EnhancedNotification) => {
  // Yeni API yapısına uygun
  switch (notification.category) {
    case "NewPrediction":
      return {
        icon: <TrendingUp className="h-5 w-5 text-blue-500" />,
        title: "Yeni Tahmin Yayınlandı",
        description: notification.content || "Yeni bir tahmin paylaşıldı.",
        actionText: "Tahmin Paylaşımına Git",
        actionLink: notification.relatedLink || "#",
        bgColor: "bg-white border-gray-200",
        iconBg: "bg-blue-100",
        unreadBg: "bg-blue-50 border-blue-300",
      };
    case "NewDailyPost":
      return {
        icon: <Calendar className="h-5 w-5 text-green-500" />,
        title: "Yeni Günlük Paylaşım",
        description:
          notification.content || "Yeni bir günlük paylaşım yapıldı.",
        actionText: "Günlük Paylaşıma Git",
        actionLink: notification.relatedLink || "#",
        bgColor: "bg-white border-gray-200",
        iconBg: "bg-green-100",
        unreadBg: "bg-green-50 border-green-300",
      };
    case "NewComment":
      return {
        icon: <MessageCircle className="h-5 w-5 text-purple-500" />,
        title: "Yeni Yorum",
        description: notification.content || "Yeni bir yorum yapıldı.",
        actionText: "Yorumu Gör",
        actionLink: notification.relatedLink || "#",
        bgColor: "bg-white border-gray-200",
        iconBg: "bg-purple-100",
        unreadBg: "bg-purple-50 border-purple-300",
      };
    case "Welcome":
      return {
        icon: <Heart className="h-5 w-5 text-pink-500" />,
        title: "Hoş Geldiniz!",
        description: notification.content || "VurduGololdu'ya hoş geldiniz!",
        actionText: "Ana Sayfaya Git",
        actionLink: "/",
        bgColor: "bg-white border-gray-200",
        iconBg: "bg-pink-100",
        unreadBg: "bg-pink-50 border-pink-300",
      };
    case "PasswordReset":
      return {
        icon: <Zap className="h-5 w-5 text-yellow-500" />,
        title: "Şifre Sıfırlama",
        description:
          notification.content || "Şifre sıfırlama işlemi başlatıldı.",
        actionText: "Detayları Gör",
        actionLink: "#",
        bgColor: "bg-white border-gray-200",
        iconBg: "bg-yellow-100",
        unreadBg: "bg-yellow-50 border-yellow-300",
      };
    case "VipExpiry":
      return {
        icon: <Crown className="h-5 w-5 text-purple-500" />,
        title: "VIP Süre Uyarısı",
        description:
          notification.content || "VIP üyeliğinizin süresi dolmak üzere.",
        actionText: "VIP Yenile",
        actionLink: "/payments",
        bgColor: "bg-white border-gray-200",
        iconBg: "bg-purple-100",
        unreadBg: "bg-purple-50 border-purple-300",
      };
    case "VipUpgrade":
      return {
        icon: <Star className="h-5 w-5 text-yellow-500" />,
        title: "VIP Aktivasyon",
        description: notification.content || "VIP üyeliğiniz aktif edildi!",
        actionText: "Detayları Gör",
        actionLink: "/profile",
        bgColor: "bg-white border-gray-200",
        iconBg: "bg-yellow-100",
        unreadBg: "bg-yellow-50 border-yellow-300",
      };
    default:
      return {
        icon: <Bell className="h-5 w-5 text-gray-500" />,
        title: notification.subject || "Bildirim",
        description:
          notification.content || notification.subject || "Yeni bir bildirim.",
        actionText: "Detayları Gör",
        actionLink: notification.relatedLink || "#",
        bgColor: "bg-white border-gray-200",
        iconBg: "bg-gray-100",
        unreadBg: "bg-gray-50 border-gray-300",
      };
  }
};

// Actor bilgilerini almak için yardımcı fonksiyon
const getActorInfo = (notification: EnhancedNotification) => {
  // Yeni API yapısından actor bilgilerini al
  if (notification.actorFirstName && notification.actorLastName) {
    return {
      name: `${notification.actorFirstName} ${notification.actorLastName}`,
      profileImageUrl: notification.actorProfileImageUrl,
      userId: notification.actorUserId,
    };
  }

  // Eski yapıdan author bilgilerini al (geriye uyumluluk için)
  if (notification.authorName) {
    return {
      name: notification.authorName,
      profileImageUrl: notification.authorProfileImageUrl,
      userId: notification.authorId,
    };
  }

  // Varsayılan değerler
  return {
    name: "Bilinmeyen Kullanıcı",
    profileImageUrl: undefined,
    userId: undefined,
  };
};

// Örnek kullanıcı (gerçek login ile entegre edilecek)
const currentUser = {
  id: 10,
  firstName: "Ahmet",
  lastName: "Yılmaz",
  role: "VipUser", // "NormalUser" veya "VipUser"
  isVipActive: true,
};

export const Notifications: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Enhanced bildirimleri çek
  const { data, isLoading, error } = useQuery({
    queryKey: ["enhancedNotifications", page],
    queryFn: () => notificationApi.getEnhancedNotifications({ page, pageSize }),
    placeholderData: keepPreviousData,
    retry: 3,
    retryDelay: 1000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => notificationApi.markRead(id),
    onSuccess: () => {
      toast.success("Bildirim okundu olarak işaretlendi.");
      queryClient.invalidateQueries({ queryKey: ["enhancedNotifications"] });
    },
    onError: (error: any) => {
      console.error("Bildirim işaretleme hatası:", error);
      toast.error("İşlem sırasında bir hata oluştu.");
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => {
      toast.success("Tüm bildirimler okundu olarak işaretlendi.");
      queryClient.invalidateQueries({ queryKey: ["enhancedNotifications"] });
    },
    onError: (error: any) => {
      console.error("Tüm bildirimleri işaretleme hatası:", error);
      toast.error("İşlem sırasında bir hata oluştu.");
    },
  });

  // Bildirimleri güvenli şekilde al
  const notifications = data?.notifications || [];
  const totalPages = data?.totalPages || 1;
  const totalCount = data?.totalCount || notifications.length;
  const unreadCount = notifications.filter(
    (n: EnhancedNotification) => n && !n.readAt
  ).length;

  // API hatası durumunda
  if (error) {
    return (
      <div className="space-y-6">
        <div className="card p-6">
          <div className="text-center py-8 sm:py-12">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-3 sm:p-4 bg-red-100 rounded-full">
                <XCircle className="h-8 w-8 sm:h-12 sm:w-12 text-red-500" />
              </div>
              <div className="px-4">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                  Bildirimler yüklenirken hata oluştu
                </h3>
                <p className="text-gray-600 max-w-md text-sm sm:text-base">
                  Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 btn-primary text-sm px-4 py-2"
                >
                  Sayfayı Yenile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center space-x-3">
              <Bell className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              <span>Bildirim Merkezi</span>
            </h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">
              Yeni tahmin, paylaşım bildirimlerinizi buradan takip
              edebilirsiniz.
            </p>
          </div>

          {unreadCount > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <span className="text-sm text-gray-600">
                {unreadCount} okunmamış bildirim
              </span>
              <button
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="btn-secondary text-xs sm:text-sm px-3 sm:px-4 py-2 w-full sm:w-auto"
              >
                {markAllAsReadMutation.isPending ? (
                  <div className="flex items-center justify-center sm:justify-start space-x-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>İşleniyor...</span>
                  </div>
                ) : (
                  "Tümünü Okundu İşaretle"
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="card">
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 sm:py-12">
              <div className="flex items-center space-x-3">
                <RefreshCw className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-blue-600" />
                <span className="text-gray-600 text-sm sm:text-base">
                  Bildirimler yükleniyor...
                </span>
              </div>
            </div>
          ) : notifications.length > 0 ? (
            <div className="space-y-4">
              {notifications.map((notification: EnhancedNotification) => {
                if (!notification || !notification.id) {
                  return null; // Geçersiz bildirimleri atla
                }

                const details = getNotificationDetails(notification);
                const isUnread = !notification.readAt;
                return (
                  <div
                    key={notification.id}
                    className={`p-4 sm:p-6 rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${
                      isUnread ? details.unreadBg : details.bgColor
                    } ${isUnread ? "ring-2 ring-blue-200" : ""}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
                      {/* Notification Icon */}
                      <div className="flex-shrink-0 flex flex-col items-center sm:items-start">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center border-2 border-white shadow-sm">
                          <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        {/* Bildirim türü */}
                        <div className="mt-1 flex items-center space-x-1">
                          <span className="text-xs text-gray-600 font-semibold bg-gray-100 px-2 py-1 rounded-full">
                            {notification.category || "Bildirim"}
                          </span>
                        </div>
                      </div>

                      {/* Notification Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
                          <div className="flex-1">
                            {/* Header with Author Info - Twitter Style */}
                            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-3">
                              <div className="flex items-center space-x-3">
                                {/* Actor Profile Image */}
                                {(() => {
                                  const actorInfo = getActorInfo(notification);
                                  return actorInfo.profileImageUrl ? (
                                    <img
                                      src={actorInfo.profileImageUrl}
                                      alt={actorInfo.name}
                                      className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover border-2 border-white shadow-sm"
                                    />
                                  ) : (
                                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-r from-gray-400 to-gray-600 flex items-center justify-center">
                                      <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                    </div>
                                  );
                                })()}

                                {/* Actor Name and Notification Title */}
                                <div className="flex flex-col">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-semibold text-gray-900 text-sm sm:text-base">
                                      {getActorInfo(notification).name}
                                    </span>
                                    {getActorInfo(notification).userId && (
                                      <span className="text-xs text-gray-500">
                                        @{getActorInfo(notification).userId}
                                      </span>
                                    )}
                                  </div>
                                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                                    {details.title}
                                  </h3>
                                </div>
                              </div>
                            </div>

                            {/* Description */}
                            <p className="text-gray-800 mb-3 leading-relaxed text-sm sm:text-base font-medium">
                              {details.description}
                            </p>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-2 sm:space-y-0 sm:space-x-3">
                              <Link
                                to={details.actionLink}
                                className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 w-full sm:w-auto"
                              >
                                <ExternalLink className="h-4 w-4" />
                                <span>{details.actionText}</span>
                              </Link>

                              {isUnread && (
                                <button
                                  onClick={() =>
                                    markAsReadMutation.mutate(notification.id)
                                  }
                                  disabled={markAsReadMutation.isPending}
                                  className="inline-flex items-center justify-center space-x-2 px-3 py-2 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors duration-200 w-full sm:w-auto"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  <span>Okundu İşaretle</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Time */}
                          <div className="flex-shrink-0 flex justify-center sm:justify-start">
                            <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                              {notification.createdAt
                                ? formatDistanceToNow(
                                    new Date(notification.createdAt),
                                    {
                                      addSuffix: true,
                                      locale: tr,
                                    }
                                  )
                                : "Bilinmeyen zaman"}
                            </span>
                          </div>
                        </div>

                        {/* Error Message */}
                        {notification.status === "Failed" &&
                          notification.errorMessage && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <p className="text-xs text-red-600">
                                <strong>Gönderim Hatası:</strong>{" "}
                                {notification.errorMessage}
                              </p>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-gray-200 space-y-3 sm:space-y-0">
                  <div className="text-sm text-gray-600 text-center sm:text-left">
                    Toplam {totalCount} bildirim • Sayfa {page} / {totalPages}
                  </div>

                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <button
                      onClick={() => setPage((p) => Math.max(p - 1, 1))}
                      disabled={page === 1}
                      className="btn-secondary text-xs sm:text-sm px-3 sm:px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Önceki
                    </button>

                    <span className="text-xs sm:text-sm text-gray-600 px-2 sm:px-3 py-2 bg-gray-100 rounded-lg">
                      {page} / {totalPages}
                    </span>

                    <button
                      onClick={() =>
                        setPage((p) => Math.min(p + 1, totalPages))
                      }
                      disabled={page === totalPages}
                      className="btn-secondary text-xs sm:text-sm px-3 sm:px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sonraki
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="p-3 sm:p-4 bg-gray-100 rounded-full">
                  <Bell className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
                </div>
                <div className="px-4">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                    Henüz bildirim yok
                  </h3>
                  <p className="text-gray-600 max-w-md text-sm sm:text-base">
                    Yeni tahmin, paylaşım olduğunda burada bildirimlerinizi
                    görebileceksiniz.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
