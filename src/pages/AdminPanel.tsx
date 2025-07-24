import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminApi,
  paymentNotificationsApi,
  commentsApi,
  predictionsApi,
  dailyPostsApi,
  analyticsApi,
  auditLogApi,
  captchaApi,
  contactApi,
  adminPasswordResetApi,
  DashboardAnalytics,
  AuditLogItem,
  AuditLogSummary,
  ContactMessage,
  ContactStats,
  paymentApi,
  PredictionListDto,
  DailyPost,
  PasswordResetRequest,
} from "../lib/api";
import { useAuthStore } from "../lib/store";
import { Navigate } from "react-router-dom";
import {
  Users,
  TrendingUp,
  CreditCard,
  MessageCircle,
  Shield,
  Settings,
  Activity,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  XCircle,
  Crown,
  Calendar,
  DollarSign,
  Eye,
  UserCheck,
  UserX,
  Clock,
  Award,
  FileText,
  Search,
  Filter,
  Upload,
  Image as ImageIcon,
  Plus,
  Mail,
  Reply,
  Trash2,
  Heart,
  X,
  User,
  Edit,
  Pin,
  Star,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import { formatDate, formatNumber, TurkeyTime } from "../lib/utils";
import { EmojiTextarea } from "../components/EmojiTextarea";

type AdminTab =
  | "dashboard"
  | "users"
  | "predictions"
  | "payments"
  | "comments"
  | "contact"
  | "logs"
  | "add-prediction"
  | "add-daily-post"
  | "daily-posts"
  | "password-reset-requests";

type PaymentTab = "pending" | "all"; // New type for payment sub-tabs

// Define the PaymentNotification type
interface PaymentNotification {
  id: number;
  userId: number;
  userFullName: string;
  userEmail: string;
  amount: number;
  bankName: string;
  membershipType: number;
  status: "Pending" | "Approved" | "Rejected";
  createdAt: string;
  processedAt?: string;
  adminNote?: string;
  transactionDate?: string;
  transactionReference?: string;
  note?: string;
}

export const AdminPanel: React.FC = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [paymentTab, setPaymentTab] = useState<PaymentTab>("pending"); // State for payment sub-tabs
  const [searchTerm, setSearchTerm] = useState("");
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Click outside handler for mobile menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".mobile-menu-container")) {
        setShowMobileMenu(false);
      }
    };

    if (showMobileMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMobileMenu]);

  // Audit logs filter states
  const [logSearchTerm, setLogSearchTerm] = useState("");
  const [logLevelFilter, setLogLevelFilter] = useState("");
  const [logCurrentPage, setLogCurrentPage] = useState(1);
  const [logPageSize] = useState(20);

  // Modal states
  const [showVipModal, setShowVipModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showAuditLogDetail, setShowAuditLogDetail] = useState(false);
  const [selectedAuditLogId, setSelectedAuditLogId] = useState<number | null>(
    null
  );
  const [showPaymentActionModal, setShowPaymentActionModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [paymentAction, setPaymentAction] = useState<
    "approve" | "reject" | null
  >(null);
  const [adminNote, setAdminNote] = useState("");

  // Form states for adding daily post
  const [dailyPostForm, setDailyPostForm] = useState({
    title: "",
    content: "",
    category: "Yaşam",
    tags: "",
    isPublished: true,
    isFeatured: false,
  });
  const [dailyPostImage, setDailyPostImage] = useState<File | null>(null);
  const [dailyPostImagePreview, setDailyPostImagePreview] = useState<
    string | null
  >(null);

  // Form states for adding prediction
  const [predictionForm, setPredictionForm] = useState({
    title: "",
    content: "",
    isPaid: false,
  });
  const [predictionImages, setPredictionImages] = useState<File[]>([]);
  const [predictionImagePreviews, setPredictionImagePreviews] = useState<
    string[]
  >([]);

  // --- Tahmin Yönetimi için YENİ State'ler ---
  const [showPredictionEditModal, setShowPredictionEditModal] = useState(false);
  const [showPredictionActionModal, setShowPredictionActionModal] =
    useState(false);
  const [selectedPrediction, setSelectedPrediction] =
    useState<PredictionListDto | null>(null);
  const [predictionActionType, setPredictionActionType] = useState<
    "result" | "pin" | "feature" | null
  >(null);
  const [predictionActionForm, setPredictionActionForm] = useState({
    isCorrect: false,
    resultNote: "",
    isPinned: false,
    pinReason: "",
    isFeatured: false,
    featureReason: "",
  });
  const [editablePrediction, setEditablePrediction] = useState<{
    id: number;
    title: string;
    content: string;
    isPaid: boolean;
  } | null>(null);

  // --- Günlük Paylaşım Düzenleme State'leri ---
  const [showDailyPostEditModal, setShowDailyPostEditModal] = useState(false);
  const [editableDailyPost, setEditableDailyPost] = useState<DailyPost | null>(
    null
  );

  // All hooks must be called before any early returns
  // Fetch dashboard data
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => analyticsApi.getDashboard(),
    enabled:
      activeTab === "dashboard" &&
      (user?.role === "Admin" || user?.role === "SuperAdmin"),
    staleTime: 2 * 60 * 1000, // 2 dakika
    gcTime: 5 * 60 * 1000, // 5 dakika
  });

  // Fetch users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users", searchTerm],
    queryFn: () =>
      adminApi.getUsers({
        page: 1,
        pageSize: 20,
        search: searchTerm || undefined,
      }),
    enabled:
      activeTab === "users" &&
      (user?.role === "Admin" || user?.role === "SuperAdmin"),
    staleTime: 2 * 60 * 1000, // 2 dakika
    gcTime: 5 * 60 * 1000, // 5 dakika
  });

  // Fetch pending payments (for the new 'pending' tab)
  const { data: pendingPaymentsData, isLoading: pendingPaymentsLoading } =
    useQuery({
      queryKey: ["admin-pending-payments"],
      queryFn: () =>
        paymentApi.getPendingNotifications({ page: 1, pageSize: 20 }),
      enabled:
        activeTab === "payments" &&
        paymentTab === "pending" &&
        (user?.role === "Admin" || user?.role === "SuperAdmin"),
    });

  // Fetch all payments (for the new 'all' tab)
  const { data: allPaymentsData, isLoading: allPaymentsLoading } = useQuery({
    queryKey: ["admin-all-payments"],
    queryFn: () => paymentApi.getAllNotifications({ page: 1, pageSize: 20 }),
    enabled:
      activeTab === "payments" &&
      paymentTab === "all" &&
      (user?.role === "Admin" || user?.role === "SuperAdmin"),
  });

  // Fetch pending comments
  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ["admin-comments"],
    queryFn: () => commentsApi.getPendingComments({ page: 1, pageSize: 20 }),
    enabled:
      activeTab === "comments" &&
      (user?.role === "Admin" || user?.role === "SuperAdmin"),
  });

  // Fetch audit logs
  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ["admin-logs", logCurrentPage, logPageSize, logLevelFilter],
    queryFn: () =>
      auditLogApi.getAll({
        Page: logCurrentPage,
        Size: logPageSize,
        SortBy: "CreatedAt",
        SortDescending: true,
        Level: logLevelFilter || undefined,
      }),
    enabled:
      activeTab === "logs" &&
      (user?.role === "Admin" || user?.role === "SuperAdmin"),
  });

  // Fetch audit logs summary
  const { data: logsSummaryData, isLoading: logsSummaryLoading } = useQuery({
    queryKey: ["admin-logs-summary"],
    queryFn: () => auditLogApi.getSummary(),
    enabled:
      activeTab === "logs" &&
      (user?.role === "Admin" || user?.role === "SuperAdmin"),
  });

  // Fetch contact messages
  const { data: contactData, isLoading: contactLoading } = useQuery({
    queryKey: ["admin-contact"],
    queryFn: () => contactApi.getAll({ page: 1, pageSize: 20 }),
    enabled:
      activeTab === "contact" &&
      (user?.role === "Admin" || user?.role === "SuperAdmin"),
  });

  // Fetch contact stats
  const { data: contactStatsData, isLoading: contactStatsLoading } = useQuery({
    queryKey: ["admin-contact-stats"],
    queryFn: () => contactApi.getStats(),
    enabled:
      activeTab === "contact" &&
      (user?.role === "Admin" || user?.role === "SuperAdmin"),
  });

  // Fetch daily post stats
  const { data: dailyPostStatsData, isLoading: dailyPostStatsLoading } =
    useQuery({
      queryKey: ["admin-dailypost-stats"],
      queryFn: () => dailyPostsApi.getAdminStats(),
      enabled:
        activeTab === "dashboard" &&
        (user?.role === "Admin" || user?.role === "SuperAdmin"),
    });

  // Fetch audit log detail
  const { data: auditLogDetail, isLoading: auditLogDetailLoading } = useQuery({
    queryKey: ["audit-log-detail", selectedAuditLogId],
    queryFn: () => auditLogApi.getById(selectedAuditLogId!),
    enabled: !!selectedAuditLogId && showAuditLogDetail,
  });

  // Fetch password reset requests
  const {
    data: passwordResetRequestsData,
    isLoading: passwordResetRequestsLoading,
  } = useQuery({
    queryKey: ["admin-password-reset-requests"],
    queryFn: () => adminPasswordResetApi.getAll({ page: 1, pageSize: 50 }),
    enabled:
      activeTab === "password-reset-requests" &&
      (user?.role === "Admin" || user?.role === "SuperAdmin"),
  });

  // --- Tahmin Yönetimi için YENİ Query ---
  const { data: predictionsData, isLoading: predictionsLoading } = useQuery({
    queryKey: ["admin-predictions"],
    queryFn: () => predictionsApi.getAll({ page: 1, pageSize: 50 }), // Şimdilik sayfalama basit
    enabled: activeTab === "predictions",
  });

  // --- Günlük Paylaşım Yönetimi için YENİ Query ---
  const { data: dailyPostsData, isLoading: dailyPostsLoading } = useQuery({
    queryKey: ["admin-daily-posts"],
    queryFn: () => dailyPostsApi.getAll({ page: 1, pageSize: 50 }),
    enabled: activeTab === "daily-posts",
  });

  // Mutations
  const processPaymentMutation = useMutation({
    mutationFn: ({
      id,
      action,
      data,
    }: {
      id: number;
      action: string;
      data: any;
    }) => paymentNotificationsApi.process(id, { action, ...data }),
    onSuccess: () => {
      toast.success("Ödeme işlemi başarıyla güncellendi");
      queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
    },
    onError: () => {
      toast.error("Ödeme işlemi güncellenirken hata oluştu");
    },
  });

  const blockUserMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      adminApi.blockUser(id, { reason }),
    onSuccess: () => {
      toast.success("Kullanıcı engellendi");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => {
      toast.error("Kullanıcı engellenirken hata oluştu");
    },
  });

  const unblockUserMutation = useMutation({
    mutationFn: (id: number) => adminApi.unblockUser(id),
    onSuccess: () => {
      toast.success("Kullanıcının engeli kaldırıldı");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => {
      toast.error("Kullanıcının engeli kaldırılırken hata oluştu");
    },
  });

  const grantVipMutation = useMutation({
    mutationFn: ({
      id,
      membershipType,
    }: {
      id: number;
      membershipType: number;
    }) => adminApi.grantVip(id, { membershipType }),
    onSuccess: () => {
      toast.success("VIP üyelik verildi");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => {
      toast.error("VIP üyelik verilirken hata oluştu");
    },
  });

  const revokeVipMutation = useMutation({
    mutationFn: (id: number) => adminApi.revokeVip(id),
    onSuccess: () => {
      toast.success("VIP üyeliği iptal edildi");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => {
      toast.error("VIP üyeliği iptal edilirken hata oluştu");
    },
  });

  // Comment approval mutations
  const approveCommentMutation = useMutation({
    mutationFn: (id: number) => commentsApi.approveComment(id),
    onSuccess: () => {
      toast.success("Yorum onaylandı");
      queryClient.invalidateQueries({ queryKey: ["admin-comments"] });
      queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          (q.queryKey[0] === "prediction-comments" ||
            q.queryKey[0] === "daily-post-comments"),
      });
    },
    onError: () => {
      toast.error("Yorum onaylanırken hata oluştu");
    },
  });

  const rejectCommentMutation = useMutation({
    mutationFn: (id: number) => commentsApi.rejectComment(id),
    onSuccess: () => {
      toast.success("Yorum reddedildi");
      queryClient.invalidateQueries({ queryKey: ["admin-comments"] });
      queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          (q.queryKey[0] === "prediction-comments" ||
            q.queryKey[0] === "daily-post-comments"),
      });
    },
    onError: () => {
      toast.error("Yorum reddedilirken hata oluştu");
    },
  });

  // Create daily post mutation
  const createDailyPostMutation = useMutation({
    mutationFn: (data: FormData) => dailyPostsApi.create(data),
    onSuccess: () => {
      toast.success("Günlük paylaşım başarıyla oluşturuldu");
      // Reset form
      setDailyPostForm({
        title: "",
        content: "",
        category: "Yaşam",
        tags: "",
        isPublished: true,
        isFeatured: false,
      });
      setDailyPostImage(null);
      setDailyPostImagePreview(null);
    },
    onError: () => {
      toast.error("Günlük paylaşım oluşturulurken hata oluştu");
    },
  });

  // Cleanup logs mutation
  const cleanupLogsMutation = useMutation({
    mutationFn: (daysToKeep: number) => auditLogApi.cleanup(daysToKeep),
    onSuccess: (response) => {
      toast.success(response.data.message);
      queryClient.invalidateQueries({ queryKey: ["admin-logs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-logs-summary"] });
    },
    onError: () => {
      toast.error("Log temizleme işlemi başarısız oldu");
    },
  });

  // Cleanup captcha mutation
  const cleanupCaptchaMutation = useMutation({
    mutationFn: () => captchaApi.cleanup(),
    onSuccess: (response) => {
      toast.success(response.data.message);
    },
    onError: () => {
      toast.error("Captcha temizleme işlemi başarısız oldu");
    },
  });

  // Contact mutations
  const replyContactMutation = useMutation({
    mutationFn: ({ id, reply }: { id: number; reply: string }) =>
      contactApi.reply(id, reply),
    onSuccess: () => {
      toast.success("Cevap gönderildi");
      queryClient.invalidateQueries({ queryKey: ["admin-contact"] });
    },
    onError: () => {
      toast.error("Cevap gönderilirken hata oluştu");
    },
  });

  const markContactReadMutation = useMutation({
    mutationFn: (id: number) => contactApi.markAsRead(id),
    onSuccess: () => {
      toast.success("Mesaj okundu olarak işaretlendi");
      queryClient.invalidateQueries({ queryKey: ["admin-contact"] });
    },
    onError: () => {
      toast.error("İşlem başarısız");
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: (id: number) => contactApi.delete(id),
    onSuccess: () => {
      toast.success("Mesaj silindi");
      queryClient.invalidateQueries({ queryKey: ["admin-contact"] });
    },
    onError: () => {
      toast.error("Mesaj silinemedi");
    },
  });

  // Mutations for payment actions
  const approvePaymentMutation = useMutation({
    mutationFn: ({ id, note }: { id: number; note: string }) =>
      paymentApi.approveNotification(id, note),
    onSuccess: () => {
      toast.success("Ödeme onaylandı ve VIP üyelik verildi.");
      queryClient.invalidateQueries({ queryKey: ["admin-pending-payments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-all-payments"] });
      setShowPaymentActionModal(false);
      setAdminNote("");
    },
    onError: () => {
      toast.error("Ödeme onaylanırken bir hata oluştu.");
    },
  });

  const rejectPaymentMutation = useMutation({
    mutationFn: ({ id, note }: { id: number; note: string }) =>
      paymentApi.rejectNotification(id, note),
    onSuccess: () => {
      toast.success("Ödeme reddedildi.");
      queryClient.invalidateQueries({ queryKey: ["admin-pending-payments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-all-payments"] });
      setShowPaymentActionModal(false);
      setAdminNote("");
    },
    onError: () => {
      toast.error("Ödeme reddedilirken bir hata oluştu.");
    },
  });

  // Create prediction mutation
  const createPredictionMutation = useMutation({
    mutationFn: (data: FormData) => predictionsApi.create(data),
    onSuccess: () => {
      toast.success("Tahmin başarıyla oluşturuldu!");
      // Tüm tahmin listelerini invalidate et
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          return (
            Array.isArray(queryKey) &&
            (queryKey[0] === "predictions" ||
              queryKey[0] === "admin-predictions" ||
              queryKey[0] === "home-predictions")
          );
        },
      });
      // Formu temizle
      setPredictionForm({
        title: "",
        content: "",
        isPaid: false,
      });
      setPredictionImages([]);
      // Preview URL'lerini temizle
      setPredictionImagePreviews((prev) => {
        prev.forEach((url) => URL.revokeObjectURL(url));
        return [];
      });
    },
    onError: (error: any) => {
      let errorMessage = "Tahmin oluşturulurken bir hata oluştu.";

      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.code === "ECONNABORTED") {
        errorMessage = "İşlem zaman aşımına uğradı. Lütfen tekrar deneyin.";
      } else if (error?.response?.status === 413) {
        errorMessage =
          "Dosya boyutu çok büyük. Lütfen daha küçük dosyalar seçin.";
      } else if (error?.response?.status === 400) {
        errorMessage = "Geçersiz veri formatı. Lütfen bilgileri kontrol edin.";
      } else if (!error?.response) {
        errorMessage =
          "Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.";
      }

      toast.error(errorMessage);
    },
  });

  // --- Tahmin Yönetimi için YENİ Mutation'lar ---
  const updatePredictionMutation = useMutation({
    mutationFn: (data: {
      id: number;
      title: string;
      content: string;
      isPaid: boolean;
      price: number;
    }) => predictionsApi.update(data.id, data),
    onSuccess: () => {
      toast.success("Tahmin güncellendi.");
      queryClient.invalidateQueries({ queryKey: ["admin-predictions"] });
      queryClient.invalidateQueries({ queryKey: ["predictions"] });
      queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) && q.queryKey[0] === "prediction",
      });
      setShowPredictionEditModal(false);
    },
    onError: () => toast.error("Güncelleme başarısız oldu."),
  });

  const deletePredictionMutation = useMutation({
    mutationFn: (id: number) => predictionsApi.delete(id),
    onSuccess: () => {
      toast.success("Tahmin silindi.");
      // Admin listesi
      queryClient.invalidateQueries({ queryKey: ["admin-predictions"] });
      // Genel kullanıcı listeleri
      queryClient.invalidateQueries({ queryKey: ["predictions"] });
      queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) && q.queryKey[0] === "prediction",
      });
    },
    onError: () => toast.error("Silme işlemi başarısız oldu."),
  });

  const predictionActionResultMutation = useMutation({
    mutationFn: (data: {
      id: number;
      isCorrect: boolean;
      resultNote: string;
      resultDate: string;
    }) => predictionsApi.setResult(data.id, data),
    onSuccess: () => {
      toast.success("Tahmin sonucu ayarlandı.");
      queryClient.invalidateQueries({ queryKey: ["admin-predictions"] });
      setShowPredictionActionModal(false);
    },
    onError: (error: any) => {
      toast.error(
        `İşlem başarısız: ${
          error?.response?.data?.message ||
          error?.message ||
          "Bilinmeyen bir hata oluştu"
        }`
      );
    },
  });

  const predictionActionPinMutation = useMutation({
    mutationFn: (data: { id: number; isPinned: boolean; reason: string }) =>
      predictionsApi.pin(data.id, data),
    onSuccess: () => {
      toast.success("Sabitleme durumu güncellendi.");
      queryClient.invalidateQueries({ queryKey: ["admin-predictions"] });
      setShowPredictionActionModal(false);
    },
    onError: (error: any) => {
      toast.error(
        `İşlem başarısız: ${
          error?.response?.data?.message ||
          error?.message ||
          "Bilinmeyen bir hata oluştu"
        }`
      );
    },
  });

  const predictionActionFeatureMutation = useMutation({
    mutationFn: (data: { id: number; isFeatured: boolean; reason: string }) =>
      predictionsApi.feature(data.id, data),
    onSuccess: () => {
      toast.success("Öne çıkarılma durumu güncellendi.");
      queryClient.invalidateQueries({ queryKey: ["admin-predictions"] });
      setShowPredictionActionModal(false);
    },
    onError: (error: any) => {
      toast.error(
        `İşlem başarısız: ${
          error?.response?.data?.message ||
          error?.message ||
          "Bilinmeyen bir hata oluştu"
        }`
      );
    },
  });

  // Password Reset Request mutations
  const approvePasswordResetMutation = useMutation({
    mutationFn: ({ id, note }: { id: number; note?: string }) =>
      adminPasswordResetApi.approve(id, note),
    onSuccess: () => {
      toast.success("Şifre sıfırlama talebi onaylandı.");
      queryClient.invalidateQueries({
        queryKey: ["admin-password-reset-requests"],
      });
    },
    onError: () => {
      toast.error("Talep onaylanırken hata oluştu.");
    },
  });

  const rejectPasswordResetMutation = useMutation({
    mutationFn: ({ id, note }: { id: number; note?: string }) =>
      adminPasswordResetApi.reject(id, note),
    onSuccess: () => {
      toast.success("Şifre sıfırlama talebi reddedildi.");
      queryClient.invalidateQueries({
        queryKey: ["admin-password-reset-requests"],
      });
    },
    onError: () => {
      toast.error("Talep reddedilirken hata oluştu.");
    },
  });

  const completePasswordResetMutation = useMutation({
    mutationFn: (id: number) => adminPasswordResetApi.complete(id),
    onSuccess: () => {
      toast.success("Şifre sıfırlama talebi tamamlandı.");
      queryClient.invalidateQueries({
        queryKey: ["admin-password-reset-requests"],
      });
    },
    onError: () => {
      toast.error("Talep tamamlanırken hata oluştu.");
    },
  });

  // --- Günlük Paylaşım Silme Mutasyonu ---
  const deleteDailyPostMutation = useMutation({
    mutationFn: (id: number) => {
      return dailyPostsApi.delete(id);
    },
    onSuccess: (response) => {
      toast.success("Paylaşım silindi.");
      queryClient.invalidateQueries({ queryKey: ["admin-daily-posts"] });
      queryClient.invalidateQueries({ queryKey: ["daily-posts"] });
    },
    onError: (error) => {
      toast.error("Silme işlemi başarısız oldu.");
    },
  });

  const updateDailyPostMutation = useMutation({
    mutationFn: (data: { id: number; formData: FormData }) =>
      dailyPostsApi.update(data.id, data.formData),
    onSuccess: () => {
      toast.success("Paylaşım güncellendi.");
      queryClient.invalidateQueries({ queryKey: ["admin-daily-posts"] });
      queryClient.invalidateQueries({ queryKey: ["daily-posts"] });
      setShowDailyPostEditModal(false);
      setEditableDailyPost(null);
    },
    onError: () => toast.error("Güncelleme başarısız oldu."),
  });

  // Reset page when filters change
  useEffect(() => {
    setLogCurrentPage(1);
  }, [logSearchTerm, logLevelFilter]);

  // Redirect if not admin (after all hooks)
  if (!user || (user.role !== "Admin" && user.role !== "SuperAdmin")) {
    return <Navigate to="/" replace />;
  }

  const dashboard = dashboardData?.data;
  const stats = dashboard?.summary;
  const todayStats = dashboard?.todayAnalytics;
  const users = usersData?.data?.users || [];
  const pendingPayments = pendingPaymentsData?.notifications || [];
  const allPayments = allPaymentsData?.notifications || [];
  const commentsRaw = commentsData?.data ?? commentsData;
  const comments =
    commentsRaw?.comments || commentsRaw?.data || commentsRaw?.items || [];
  const allLogs = logsData?.data?.data || [];
  const logsSummary = logsSummaryData?.data;
  const totalLogs = logsData?.data?.totalCount || allLogs.length;
  const logs = allLogs;
  const totalLogPages = Math.ceil(totalLogs / logPageSize);
  const startIndex = (logCurrentPage - 1) * logPageSize;
  const endIndex = startIndex + logPageSize;

  const tabConfig = [
    { key: "dashboard", label: "Dashboard", icon: Activity },
    { key: "users", label: "Kullanıcılar", icon: Users },
    { key: "predictions", label: "Tahminler", icon: Award },
    { key: "daily-posts", label: "Paylaşımlar", icon: Calendar },
    { key: "payments", label: "Ödemeler", icon: CreditCard },
    { key: "comments", label: "Yorumlar", icon: MessageCircle },
    { key: "contact", label: "İletişim", icon: Mail },
    { key: "add-prediction", label: "Tahmin Ekle", icon: TrendingUp },
    { key: "add-daily-post", label: "Paylaşım Ekle", icon: Calendar },
    { key: "logs", label: "Loglar", icon: FileText },
    { key: "password-reset-requests", label: "Şifre Talepleri", icon: Shield },
  ];

  const handleProcessPayment = (
    id: number,
    action: "approve" | "reject",
    vipDays?: number
  ) => {
    const data: any = {};
    if (action === "approve" && vipDays) {
      data.vipDurationDays = vipDays;
      data.adminNote = "Ödeme onaylandı, VIP üyelik verildi";
    } else if (action === "reject") {
      data.adminNote = "Ödeme reddedildi";
    }

    processPaymentMutation.mutate({ id, action, data });
  };

  const handleBlockUser = (id: number) => {
    const reason = "Admin tarafından engellendi";
    blockUserMutation.mutate({ id, reason });
  };

  const handleUnblockUser = (id: number) => {
    unblockUserMutation.mutate(id);
  };

  const handleGrantVip = (id: number) => {
    setSelectedUserId(id);
    setShowVipModal(true);
  };

  const handleVipGrant = (membershipType: number) => {
    if (selectedUserId) {
      grantVipMutation.mutate({
        id: selectedUserId,
        membershipType, // 1 = Aylık, 2 = 3 Aylık, 3 = 6 Aylık
      });
      setShowVipModal(false);
      setSelectedUserId(null);
    }
  };

  const handleRevokeVip = (id: number) => {
    revokeVipMutation.mutate(id);
  };

  const handleDailyPostImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast.error("Resim boyutu 5MB'dan küçük olmalı");
        return;
      }
      setDailyPostImage(file);
      const reader = new FileReader();
      reader.onload = (e) =>
        setDailyPostImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitDailyPost = () => {
    if (!dailyPostForm.title.trim()) {
      toast.error("Başlık boş olamaz");
      return;
    }

    const formData = new FormData();
    formData.append("title", dailyPostForm.title);
    formData.append("content", dailyPostForm.content);
    formData.append("category", dailyPostForm.category);
    formData.append("tags", dailyPostForm.tags);
    formData.append("isPublished", dailyPostForm.isPublished.toString());
    formData.append("isFeatured", dailyPostForm.isFeatured.toString());

    if (dailyPostImage) {
      formData.append("image", dailyPostImage);
    }

    createDailyPostMutation.mutate(formData);
  };

  const handleCleanupLogs = (daysToKeep: number) => {
    if (
      window.confirm(
        `${daysToKeep} günden eski loglar silinecek. Emin misiniz?`
      )
    ) {
      cleanupLogsMutation.mutate(daysToKeep);
    }
  };

  const handleCleanupCaptcha = () => {
    if (window.confirm("Süresi dolmuş captcha'lar silinecek. Emin misiniz?")) {
      cleanupCaptchaMutation.mutate();
    }
  };

  // Contact handlers
  const handleReplyContact = (messageId: number, reply: string) => {
    if (reply.trim()) {
      replyContactMutation.mutate({ id: messageId, reply });
    }
  };

  const handleMarkContactRead = (messageId: number) => {
    markContactReadMutation.mutate(messageId);
  };

  const handleDeleteContact = (messageId: number) => {
    if (window.confirm("Bu mesajı silmek istediğinizden emin misiniz?")) {
      deleteContactMutation.mutate(messageId);
    }
  };

  const handleShowAuditLogDetail = (logId: number) => {
    setSelectedAuditLogId(logId);
    setShowAuditLogDetail(true);
  };

  const handlePaymentAction = () => {
    if (!selectedPayment || !paymentAction) return;

    if (paymentAction === "approve") {
      approvePaymentMutation.mutate({
        id: selectedPayment.id,
        note: adminNote,
      });
    } else if (paymentAction === "reject") {
      rejectPaymentMutation.mutate({ id: selectedPayment.id, note: adminNote });
    }
  };

  const openPaymentModal = (payment: any, action: "approve" | "reject") => {
    setSelectedPayment(payment);
    setPaymentAction(action);
    setAdminNote("");
    setShowPaymentActionModal(true);
  };

  // Handle image uploads for prediction
  const handlePredictionImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);

      // Dosya boyutu kontrolü
      const maxSize = 5 * 1024 * 1024; // 5MB
      const oversizedFiles = files.filter((file) => file.size > maxSize);
      if (oversizedFiles.length > 0) {
        toast.error(
          "Bazı dosyalar 5MB'dan büyük. Lütfen daha küçük dosyalar seçin."
        );
        return;
      }

      if (predictionImages.length + files.length > 5) {
        toast.error("En fazla 5 resim yükleyebilirsiniz.");
        return;
      }

      setPredictionImages((prevImages) => [...prevImages, ...files]);
      const newPreviews = files.map((file) => URL.createObjectURL(file));
      setPredictionImagePreviews((prevPreviews) => [
        ...prevPreviews,
        ...newPreviews,
      ]);
    }
  };

  const handleRemovePredictionImage = (index: number) => {
    setPredictionImages((prev) => {
      const newImages = prev.filter((_, i) => i !== index);
      return newImages;
    });
    setPredictionImagePreviews((prev) => {
      const newPreviews = prev.filter((_, i) => i !== index);
      // Eski URL'leri temizle
      const removedPreview = prev[index];
      if (removedPreview) {
        URL.revokeObjectURL(removedPreview);
      }
      return newPreviews;
    });
  };

  const handleSubmitPrediction = () => {
    if (!predictionForm.title || !predictionForm.content) {
      toast.error("Başlık ve İçerik alanları zorunludur.");
      return;
    }
    if (predictionImages.length === 0) {
      toast.error("En az bir resim yüklemelisiniz.");
      return;
    }

    // FormData'yı daha verimli oluştur
    const formData = new FormData();
    formData.append("Title", predictionForm.title.trim());
    formData.append("Content", predictionForm.content.trim());
    formData.append("IsPaid", String(predictionForm.isPaid));
    formData.append("Price", "0"); // API beklentisi için

    // Resimleri tek seferde ekle - dosya adı olmadan
    predictionImages.forEach((image) => {
      formData.append("Images", image);
    });

    createPredictionMutation.mutate(formData);
  };

  // --- Tahmin Yönetimi için YENİ Handler'lar ---
  const handleDeletePrediction = (id: number) => {
    if (
      window.confirm(
        "Bu tahmini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
      )
    ) {
      deletePredictionMutation.mutate(id);
    }
  };

  const openPredictionEditModal = (prediction: PredictionListDto) => {
    setEditablePrediction({
      id: prediction.id,
      title: prediction.title,
      content: prediction.content,
      isPaid: prediction.isPaid,
    });
    setShowPredictionEditModal(true);
  };

  const handleUpdatePrediction = () => {
    if (editablePrediction) {
      updatePredictionMutation.mutate({ ...editablePrediction, price: 0 });
    }
  };

  const openPredictionActionModal = (
    prediction: PredictionListDto,
    type: "result" | "pin" | "feature"
  ) => {
    setSelectedPrediction(prediction);
    setPredictionActionType(type);
    // Reset form state when modal opens
    setPredictionActionForm({
      isCorrect: false,
      resultNote: "",
      isPinned: false,
      pinReason: "",
      isFeatured: false,
      featureReason: "",
    });
    setShowPredictionActionModal(true);
  };

  const handlePredictionAction = () => {
    if (!selectedPrediction || !predictionActionType) return;

    switch (predictionActionType) {
      case "result":
        predictionActionResultMutation.mutate({
          id: selectedPrediction.id,
          isCorrect: predictionActionForm.isCorrect,
          resultNote: predictionActionForm.resultNote,
          resultDate: new Date().toISOString(),
        });
        break;
      case "pin":
        predictionActionPinMutation.mutate({
          id: selectedPrediction.id,
          isPinned: predictionActionForm.isPinned,
          reason: predictionActionForm.pinReason,
        });
        break;
      case "feature":
        predictionActionFeatureMutation.mutate({
          id: selectedPrediction.id,
          isFeatured: predictionActionForm.isFeatured,
          reason: predictionActionForm.featureReason,
        });
        break;
    }
  };

  const handleDeleteDailyPost = (id: number) => {
    if (window.confirm("Bu paylaşımı silmek istediğinizden emin misiniz?")) {
      deleteDailyPostMutation.mutate(id);
    }
  };

  const openDailyPostEditModal = (post: DailyPost) => {
    setEditableDailyPost(post);
    setDailyPostForm({
      title: post.title,
      content: post.content || "",
      category: post.category,
      tags: post.tags || "",
      isPublished: post.isPublished,
      isFeatured: post.isFeatured,
    });
    setDailyPostImagePreview(post.imageUrl || null);
    setDailyPostImage(null);
    setShowDailyPostEditModal(true);
  };

  const handleUpdateDailyPost = () => {
    if (!editableDailyPost) return;

    const formData = new FormData();
    formData.append("title", dailyPostForm.title);
    formData.append("content", dailyPostForm.content);
    formData.append("category", dailyPostForm.category);
    formData.append("tags", dailyPostForm.tags);
    formData.append("isPublished", dailyPostForm.isPublished.toString());
    formData.append("isFeatured", dailyPostForm.isFeatured.toString());

    if (dailyPostImage) {
      formData.append("image", dailyPostImage);
    }

    updateDailyPostMutation.mutate({ id: editableDailyPost.id, formData });
  };

  // Password Reset Request handlers
  const handleApprovePasswordReset = (id: number, note?: string) => {
    approvePasswordResetMutation.mutate({ id, note });
  };

  const handleRejectPasswordReset = (id: number, note?: string) => {
    rejectPasswordResetMutation.mutate({ id, note });
  };

  const handleCompletePasswordReset = (id: number) => {
    completePasswordResetMutation.mutate(id);
  };

  return (
    <div className="space-y-6 overflow-x-hidden px-2 sm:px-0">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center space-x-3">
          <div className="bg-purple-100 p-3 rounded-full">
            <Shield className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Admin Panel</h1>
            <p className="text-gray-600">Sistem yönetimi ve kontrol paneli</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-dark-600">
          {/* Desktop Tabs */}
          <nav className="hidden lg:flex space-x-8 px-6 overflow-x-auto scrollbar-thin scrollbar-thumb-dark-700/50 whitespace-nowrap">
            {tabConfig.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as AdminTab)}
                className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 flex-shrink-0 ${
                  activeTab === tab.key
                    ? "border-purple-500 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* Mobile Dropdown */}
          <div className="lg:hidden px-4 py-3">
            <div className="relative mobile-menu-container">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="w-full flex items-center justify-between px-4 py-3 bg-dark-700 rounded-lg border border-dark-600 text-gray-300 hover:bg-dark-600 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {tabConfig.map((tab) => {
                    if (tab.key === activeTab) {
                      const IconComponent = tab.icon;
                      return (
                        <React.Fragment key={tab.key}>
                          <IconComponent className="h-5 w-5" />
                          <span className="font-medium">{tab.label}</span>
                        </React.Fragment>
                      );
                    }
                    return null;
                  })}
                </div>
                <ChevronDown
                  className={`h-5 w-5 transition-transform ${
                    showMobileMenu ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Mobile Menu */}
              {showMobileMenu && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-dark-800 border border-dark-600 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto backdrop-blur-sm">
                  {tabConfig.map((tab) => {
                    const IconComponent = tab.icon;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => {
                          setActiveTab(tab.key as AdminTab);
                          setShowMobileMenu(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-dark-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                          activeTab === tab.key
                            ? "bg-purple-600/20 text-purple-400 border-l-4 border-purple-500"
                            : "text-gray-300"
                        }`}
                      >
                        <IconComponent className="h-5 w-5 flex-shrink-0" />
                        <span className="font-medium">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {dashboardLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                </div>
              ) : dashboardData ? (
                <>
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-dark-800 rounded-xl p-4 shadow-2xl border border-dark-600">
                      <div className="flex items-center">
                        <Users className="h-8 w-8 text-blue-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-blue-600">
                            Toplam Kullanıcı
                          </p>
                          <p className="text-2xl font-bold text-blue-900">
                            {formatNumber(stats?.totalUsers || 0)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-dark-800 rounded-xl p-4 shadow-2xl border border-dark-600">
                      <div className="flex items-center">
                        <TrendingUp className="h-8 w-8 text-green-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-green-600">
                            Toplam Tahmin
                          </p>
                          <p className="text-2xl font-bold text-green-900">
                            {formatNumber(stats?.totalPredictions || 0)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-dark-800 rounded-xl p-4 shadow-2xl border border-dark-600">
                      <div className="flex items-center">
                        <Crown className="h-8 w-8 text-yellow-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-yellow-600">
                            VIP Kullanıcı
                          </p>
                          <p className="text-2xl font-bold text-yellow-900">
                            {formatNumber(stats?.totalVipUsers || 0)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-dark-800 rounded-xl p-4 shadow-2xl border border-dark-600">
                      <div className="flex items-center">
                        <DollarSign className="h-8 w-8 text-purple-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-purple-600">
                            Toplam Gelir
                          </p>
                          <p className="text-2xl font-bold text-purple-900">
                            ₺{formatNumber(stats?.totalRevenue || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Daily Posts Stats */}
                  {dailyPostStatsData?.data && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-indigo-50 rounded-lg p-4">
                        <div className="flex items-center">
                          <Calendar className="h-8 w-8 text-indigo-600" />
                          <div className="ml-4">
                            <p className="text-sm font-medium text-indigo-600">
                              Toplam Paylaşım
                            </p>
                            <p className="text-2xl font-bold text-indigo-900">
                              {dailyPostStatsData.data.totalPosts}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-dark-800 rounded-xl p-4 shadow-2xl border border-dark-600">
                        <div className="flex items-center">
                          <Eye className="h-8 w-8 text-green-400" />
                          <div className="ml-4">
                            <p className="text-sm font-medium text-green-400">
                              Toplam Görüntüleme
                            </p>
                            <p className="text-2xl font-bold text-green-300">
                              {formatNumber(dailyPostStatsData.data.totalViews)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-dark-800 rounded-xl p-4 shadow-2xl border border-dark-600">
                        <div className="flex items-center">
                          <Heart className="h-8 w-8 text-red-400" />
                          <div className="ml-4">
                            <p className="text-sm font-medium text-red-400">
                              Toplam Beğeni
                            </p>
                            <p className="text-2xl font-bold text-red-300">
                              {formatNumber(dailyPostStatsData.data.totalLikes)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-dark-800 rounded-xl p-4 shadow-2xl border border-dark-600">
                        <div className="flex items-center">
                          <MessageCircle className="h-8 w-8 text-blue-400" />
                          <div className="ml-4">
                            <p className="text-sm font-medium text-blue-400">
                              Toplam Yorum
                            </p>
                            <p className="text-2xl font-bold text-blue-300">
                              {formatNumber(
                                dailyPostStatsData.data.totalComments
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Additional Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="card p-6">
                      <h3 className="text-lg font-semibold text-gray-100 mb-4">
                        Kullanıcı Durumu
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Bugün Aktif</span>
                          <span className="font-medium">
                            {todayStats?.activeUserCount || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            Bugün Yeni Kullanıcı
                          </span>
                          <span className="font-medium">
                            {todayStats?.newUserCount || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">VIP Kullanıcı</span>
                          <span className="font-medium">
                            {stats?.totalVipUsers || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Başarı Oranı</span>
                          <span className="font-medium">
                            %{stats?.overallSuccessRate?.toFixed(1) || "0.0"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="card p-6">
                      <h3 className="text-lg font-semibold text-gray-100 mb-4">
                        İçerik Durumu
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Toplam Beğeni</span>
                          <span className="font-medium">
                            {formatNumber(stats?.totalLikes || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Toplam Yorum</span>
                          <span className="font-medium">
                            {formatNumber(stats?.totalComments || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            Toplam Görüntüleme
                          </span>
                          <span className="font-medium">
                            {formatNumber(stats?.totalViews || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Bugün Tahmin</span>
                          <span className="font-medium">
                            {todayStats?.newPredictionCount || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Analytics Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="card p-6">
                      <h3 className="text-lg font-semibold text-gray-100 mb-4">
                        Gelir İstatistikleri
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Haftalık Gelir</span>
                          <span className="font-medium text-green-600">
                            ₺{formatNumber(stats?.weeklyRevenue || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Aylık Gelir</span>
                          <span className="font-medium text-blue-600">
                            ₺{formatNumber(stats?.monthlyRevenue || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Bugün Gelir</span>
                          <span className="font-medium text-purple-600">
                            ₺{formatNumber(todayStats?.dailyRevenue || 0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="card p-6">
                      <h3 className="text-lg font-semibold text-gray-100 mb-4">
                        Tahmin İstatistikleri
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tamamlanan</span>
                          <span className="font-medium">
                            {stats?.completedPredictions || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Doğru Tahmin</span>
                          <span className="font-medium text-green-600">
                            {stats?.correctPredictions || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            Bugün Tamamlanan
                          </span>
                          <span className="font-medium">
                            {todayStats?.completedPredictionCount || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="card p-6">
                      <h3 className="text-lg font-semibold text-gray-100 mb-4">
                        VIP İstatistikleri
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            VIP Başarı Oranı
                          </span>
                          <span className="font-medium text-yellow-600">
                            %{todayStats?.vipSuccessRate?.toFixed(1) || "0.0"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Normal Başarı</span>
                          <span className="font-medium">
                            %
                            {todayStats?.normalUserSuccessRate?.toFixed(1) ||
                              "0.0"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Bugün Yeni VIP</span>
                          <span className="font-medium text-yellow-600">
                            {todayStats?.newVipUserCount || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Activity className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-100">
                    Dashboard verileri yüklenemedi
                  </h3>
                </div>
              )}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <div className="space-y-6">
              {/* Header with Search and Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <h3 className="text-lg font-semibold text-gray-100">
                  Kullanıcı Yönetimi
                </h3>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="İsim, email ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-dark-600 rounded-md bg-dark-900 text-gray-100 placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <select
                    className="px-3 py-2 border border-dark-600 rounded-md bg-dark-900 text-gray-100 focus:ring-primary-500 focus:border-primary-500"
                    defaultValue="All"
                  >
                    <option value="All">Tüm Roller</option>
                    <option value="Admin">Admin</option>
                    <option value="VipUser">VIP</option>
                    <option value="NormalUser">Normal</option>
                  </select>
                </div>
              </div>

              {/* User Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-dark-800 rounded-xl p-4 shadow-2xl border border-dark-600">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-blue-400" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-blue-400">
                        Toplam Kullanıcı
                      </p>
                      <p className="text-2xl font-bold text-blue-300">
                        {usersData?.data?.totalCount || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-dark-800 rounded-xl p-4 shadow-2xl border border-dark-600">
                  <div className="flex items-center">
                    <Crown className="h-8 w-8 text-yellow-400" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-yellow-400">
                        VIP Kullanıcı
                      </p>
                      <p className="text-2xl font-bold text-yellow-300">
                        {users.filter((u: any) => u.role === "VipUser").length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-dark-800 rounded-xl p-4 shadow-2xl border border-dark-600">
                  <div className="flex items-center">
                    <UserX className="h-8 w-8 text-red-400" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-red-400">
                        Engelli Kullanıcı
                      </p>
                      <p className="text-2xl font-bold text-red-300">
                        {users.filter((u: any) => u.isBlocked).length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-dark-800 rounded-xl p-4 shadow-2xl border border-dark-600">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-green-400" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-green-400">
                        Doğrulanmış
                      </p>
                      <p className="text-2xl font-bold text-green-300">
                        {users.length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Users Grid */}
              {usersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                </div>
              ) : users.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {users.map((user: any) => (
                    <div
                      key={user.id}
                      className="bg-dark-800 rounded-xl shadow-2xl border border-dark-600 p-4 hover:shadow-xl transition-shadow"
                    >
                      {/* Header */}
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="flex-shrink-0">
                          {user.profileImageUrl ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={user.profileImageUrl}
                              alt={`${user.firstName} ${user.lastName}`}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center">
                              <span className="text-sm font-medium text-white">
                                {user.firstName?.[0]}
                                {user.lastName?.[0]}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-100 truncate">
                            {user.firstName} {user.lastName}
                          </h4>
                          <p className="text-xs text-gray-400 truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {user.role === "Admin" && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-900/50 text-purple-300 border border-purple-700/50">
                            <Shield className="h-3 w-3 mr-1" />
                            Admin
                          </span>
                        )}
                        {user.role === "SuperAdmin" && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-900/50 text-red-300 border border-red-700/50">
                            <Shield className="h-3 w-3 mr-1" />
                            SüperAdmin
                          </span>
                        )}
                        {user.isBlocked && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-900/50 text-red-300 border border-red-700/50">
                            <XCircle className="h-3 w-3 mr-1" />
                            Engelli
                          </span>
                        )}
                        {/* Email doğrulama artık gerekli değil */}
                        {user.role === "VipUser" && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-900/50 text-yellow-300 border border-yellow-700/50">
                            <Crown className="h-3 w-3 mr-1" />
                            VIP
                          </span>
                        )}
                      </div>

                      {/* Phone Info */}
                      {user.phone && (
                        <div className="text-xs text-gray-400 mb-3">
                          📞 {user.phone}
                        </div>
                      )}

                      {/* Actions */}
                      {user.role !== "Admin" && (
                        <div className="flex flex-wrap gap-2">
                          {/* VIP Toggle */}
                          {user.role !== "VipUser" ? (
                            <button
                              onClick={() => handleGrantVip(user.id)}
                              className="flex-1 inline-flex items-center justify-center px-2 py-1 border border-yellow-600/50 text-xs font-medium rounded-md text-yellow-300 bg-yellow-900/50 hover:bg-yellow-800/50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                              title="VIP Yap"
                            >
                              <Crown className="h-3 w-3 mr-1" />
                              VIP Yap
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRevokeVip(user.id)}
                              className="flex-1 inline-flex items-center justify-center px-2 py-1 border border-gray-600/50 text-xs font-medium rounded-md text-gray-300 bg-gray-900/50 hover:bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                              title="VIP'liği Kaldır"
                            >
                              <Crown className="h-3 w-3 mr-1" />
                              VIP Kaldır
                            </button>
                          )}

                          {/* Block/Unblock Toggle */}
                          {user.isBlocked ? (
                            <button
                              onClick={() => handleUnblockUser(user.id)}
                              className="flex-1 inline-flex items-center justify-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                              title="Engeli Kaldır"
                            >
                              <UserCheck className="h-3 w-3 mr-1" />
                              Engeli Kaldır
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBlockUser(user.id)}
                              className="flex-1 inline-flex items-center justify-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                              title="Kullanıcıyı Engelle"
                            >
                              <UserX className="h-3 w-3 mr-1" />
                              Engelle
                            </button>
                          )}

                          {/* User Details Button */}
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUserDetail(true);
                            }}
                            className="w-full mt-2 inline-flex items-center justify-center px-2 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            title="Detayları Görüntüle"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Detayları Görüntüle
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">
                    Kullanıcı bulunamadı
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Arama kriterlerinizi değiştirmeyi deneyin.
                  </p>
                </div>
              )}

              {/* Pagination Info */}
              {usersData?.data && (
                <div className="bg-dark-800 px-4 py-3 flex items-center justify-between border-t border-dark-600 text-gray-100 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <span className="text-sm text-gray-300">
                      {usersData.data.totalCount} kullanıcıdan {users.length}{" "}
                      tanesi gösteriliyor
                    </span>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-300">
                        Toplam{" "}
                        <span className="font-medium">
                          {usersData.data.totalCount}
                        </span>{" "}
                        kullanıcıdan <span className="font-medium">1</span> ile{" "}
                        <span className="font-medium">{users.length}</span>{" "}
                        arası gösteriliyor
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-400">
                        Sayfa {usersData.data.currentPage} /{" "}
                        {usersData.data.totalPages}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === "payments" && (
            <PaymentManagementTab
              pendingPayments={pendingPayments}
              allPayments={allPayments}
              loadingPending={pendingPaymentsLoading}
              loadingAll={allPaymentsLoading}
              activePaymentTab={paymentTab}
              setActivePaymentTab={setPaymentTab}
              onAction={openPaymentModal}
            />
          )}

          {/* Comments Tab */}
          {activeTab === "comments" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Bekleyen Yorumlar
              </h3>

              {commentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                </div>
              ) : comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((comment: any) => (
                    <div
                      key={comment.id}
                      className="border border-gray-200 dark:border-dark-600 rounded-lg p-4 bg-white dark:bg-dark-800"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mb-2 space-y-1 sm:space-y-0">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                              {comment.user.firstName} {comment.user.lastName}
                            </h4>
                            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                              {comment.user.email}
                            </span>
                            <span className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 px-2 py-1 rounded-full text-xs w-fit">
                              Bekliyor
                            </span>
                          </div>
                          <div className="space-y-2">
                            <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                              {comment.content}
                            </p>
                            {comment.imageUrl && (
                              <img
                                src={comment.imageUrl}
                                alt="Yorum resmi"
                                className="w-32 h-24 object-cover rounded"
                              />
                            )}
                            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 space-y-1">
                              <p>
                                <strong>İçerik:</strong>{" "}
                                {comment.prediction?.title ||
                                  comment.dailyPost?.title ||
                                  "Bilinmiyor"}
                              </p>
                              <p>
                                <strong>Tür:</strong>{" "}
                                {comment.prediction
                                  ? "Tahmin"
                                  : comment.dailyPost
                                  ? "Günlük Paylaşım"
                                  : "Bilinmiyor"}
                              </p>
                              <p>
                                <strong>Tarih:</strong>{" "}
                                {formatDate(comment.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 sm:ml-4 w-full sm:w-auto">
                          <button
                            onClick={() =>
                              approveCommentMutation.mutate(comment.id)
                            }
                            disabled={approveCommentMutation.isPending}
                            className="bg-green-600 text-white px-3 py-2 rounded text-xs sm:text-sm hover:bg-green-700 disabled:opacity-50 flex items-center justify-center space-x-1 w-full sm:w-auto"
                          >
                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">
                              {approveCommentMutation.isPending
                                ? "Onaylanıyor..."
                                : "Onayla"}
                            </span>
                            <span className="sm:hidden">
                              {approveCommentMutation.isPending
                                ? "..."
                                : "Onayla"}
                            </span>
                          </button>
                          <button
                            onClick={() =>
                              rejectCommentMutation.mutate(comment.id)
                            }
                            disabled={rejectCommentMutation.isPending}
                            className="bg-red-600 text-white px-3 py-2 rounded text-xs sm:text-sm hover:bg-red-700 disabled:opacity-50 flex items-center justify-center space-x-1 w-full sm:w-auto"
                          >
                            <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">
                              {rejectCommentMutation.isPending
                                ? "Reddediliyor..."
                                : "Reddet"}
                            </span>
                            <span className="sm:hidden">
                              {rejectCommentMutation.isPending
                                ? "..."
                                : "Reddet"}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">
                    Bekleyen yorum yok
                  </h3>
                </div>
              )}
            </div>
          )}

          {/* Logs Tab */}
          {activeTab === "logs" && (
            <div className="space-y-6">
              {/* Summary Cards */}
              {logsSummary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-dark-800 rounded-xl p-4 shadow-2xl border border-dark-600">
                    <div className="flex items-center">
                      <FileText className="h-8 w-8 text-blue-400" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-blue-400">
                          Toplam Log
                        </p>
                        <p className="text-2xl font-bold text-blue-300">
                          {formatNumber(logsSummary.totalLogs)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-dark-800 rounded-xl p-4 shadow-2xl border border-dark-600">
                    <div className="flex items-center">
                      <Users className="h-8 w-8 text-green-400" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-green-400">
                          Aktif Kullanıcı
                        </p>
                        <p className="text-2xl font-bold text-green-300">
                          {logsSummary.totalUsers}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-dark-800 rounded-xl p-4 shadow-2xl border border-dark-600">
                    <div className="flex items-center">
                      <AlertCircle className="h-8 w-8 text-red-400" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-red-400">
                          Hata Sayısı
                        </p>
                        <p className="text-2xl font-bold text-red-300">
                          {logsSummary.errorCount}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <AlertTriangle className="h-8 w-8 text-yellow-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-yellow-600">
                          Uyarı Sayısı
                        </p>
                        <p className="text-2xl font-bold text-yellow-900">
                          {logsSummary.warningCount}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Top Actions */}
              {logsSummary && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      En Sık Yapılan İşlemler
                    </h3>
                    <div className="space-y-3">
                      {logsSummary.topActions
                        .slice(0, 5)
                        .map(
                          (
                            action: { action: string; count: number },
                            index: number
                          ) => (
                            <div
                              key={action.action}
                              className="flex justify-between"
                            >
                              <span className="text-gray-600 truncate">
                                {index + 1}. {action.action}
                              </span>
                              <span className="font-medium text-purple-600">
                                {formatNumber(action.count)}
                              </span>
                            </div>
                          )
                        )}
                    </div>
                  </div>

                  <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      En Aktif Kullanıcılar
                    </h3>
                    <div className="space-y-3">
                      {logsSummary.topUsers.slice(0, 5).map(
                        (
                          user: {
                            userId: number;
                            userName: string;
                            userEmail: string;
                            count: number;
                          },
                          index: number
                        ) => (
                          <div
                            key={user.userId}
                            className="flex justify-between"
                          >
                            <span className="text-gray-600 truncate">
                              {index + 1}. {user.userName}
                            </span>
                            <span className="font-medium text-purple-600">
                              {formatNumber(user.count)}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Search and Filters */}
              <div className="card p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Sistem Logları
                  </h3>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Kullanıcı, email, IP, işlem, endpoint ara..."
                        value={logSearchTerm}
                        onChange={(e) => setLogSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-dark-600 rounded-md bg-dark-900 text-gray-100 placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500 w-full sm:w-64"
                      />
                    </div>

                    {/* Level Filter */}
                    <select
                      value={logLevelFilter}
                      onChange={(e) => setLogLevelFilter(e.target.value)}
                      className="px-3 py-2 border border-dark-600 rounded-md bg-dark-900 text-gray-100 focus:ring-primary-500 focus:border-primary-500 w-full sm:w-auto"
                    >
                      <option value="">Tüm Seviyeler</option>
                      <option value="1">Info</option>
                      <option value="2">Warning</option>
                      <option value="3">Error</option>
                      <option value="4">Critical</option>
                    </select>

                    {/* Clear Filters */}
                    {(logSearchTerm || logLevelFilter) && (
                      <button
                        onClick={() => {
                          setLogSearchTerm("");
                          setLogLevelFilter("");
                        }}
                        className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
                      >
                        Temizle
                      </button>
                    )}
                  </div>
                </div>

                {/* Results count */}
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div className="text-sm text-gray-600">
                    {logs.length > 0 ? (
                      <>
                        {startIndex + 1}-{Math.min(endIndex, logs.length)} arası
                        gösteriliyor
                        <span className="ml-2 text-purple-600">
                          (toplam {logs.length} sonuç)
                        </span>
                        {logs.length !== totalLogs && (
                          <span className="ml-2 text-gray-500">
                            • {totalLogs} toplam log
                          </span>
                        )}
                      </>
                    ) : (
                      "Sonuç bulunamadı"
                    )}
                  </div>

                  {/* Pagination info */}
                  {totalLogPages > 1 && (
                    <div className="text-sm text-gray-300">
                      Sayfa {logCurrentPage} / {totalLogPages}
                    </div>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-100">
                  Log Yönetimi
                </h3>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleCleanupLogs(30)}
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500"
                    disabled={cleanupLogsMutation.isPending}
                  >
                    {cleanupLogsMutation.isPending
                      ? "Temizleniyor..."
                      : "30 Gün+ Temizle"}
                  </button>
                  <button
                    onClick={() => handleCleanupLogs(7)}
                    className="px-4 py-2 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:ring-2 focus:ring-orange-500"
                    disabled={cleanupLogsMutation.isPending}
                  >
                    {cleanupLogsMutation.isPending
                      ? "Temizleniyor..."
                      : "7 Gün+ Temizle"}
                  </button>
                  <button
                    onClick={handleCleanupCaptcha}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                    disabled={cleanupCaptchaMutation.isPending}
                  >
                    {cleanupCaptchaMutation.isPending
                      ? "Temizleniyor..."
                      : "Captcha Temizle"}
                  </button>
                </div>
              </div>

              {logsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                </div>
              ) : logs.length > 0 ? (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-dark-600">
                      <thead className="bg-dark-800">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Zaman
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Seviye
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            İşlem
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Kullanıcı
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            HTTP
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Endpoint
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-dark-900 divide-y divide-dark-600">
                        {logs.map((log: AuditLogItem) => {
                          const getLevelInfo = (level: number) => {
                            switch (level) {
                              case 1:
                                return {
                                  name: "Info",
                                  bg: "bg-blue-900/50",
                                  text: "text-blue-300",
                                  icon: "ℹ️",
                                };
                              case 2:
                                return {
                                  name: "Warning",
                                  bg: "bg-yellow-900/50",
                                  text: "text-yellow-300",
                                  icon: "⚠️",
                                };
                              case 3:
                                return {
                                  name: "Error",
                                  bg: "bg-red-900/50",
                                  text: "text-red-300",
                                  icon: "🚨",
                                };
                              case 4:
                                return {
                                  name: "Critical",
                                  bg: "bg-red-800/50",
                                  text: "text-red-200",
                                  icon: "💀",
                                };
                              default:
                                return {
                                  name: "Unknown",
                                  bg: "bg-gray-900/50",
                                  text: "text-gray-300",
                                  icon: "❓",
                                };
                            }
                          };

                          const levelInfo = getLevelInfo(log.level);

                          return (
                            <tr
                              key={log.id}
                              className="hover:bg-dark-700 cursor-pointer transition-colors"
                              onClick={() => handleShowAuditLogDetail(log.id)}
                              title="Detayları görüntülemek için tıklayın"
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-100">
                                {formatDate(log.createdAt)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${levelInfo.bg} ${levelInfo.text}`}
                                >
                                  {levelInfo.icon} {levelInfo.name}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-100 font-mono">
                                {log.action}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-100">
                                <div>
                                  <div className="font-medium">
                                    {log.userName}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    {log.userEmail}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                    log.statusCode >= 200 &&
                                    log.statusCode < 300
                                      ? "bg-green-900/50 text-green-300"
                                      : log.statusCode >= 400 &&
                                        log.statusCode < 500
                                      ? "bg-yellow-900/50 text-yellow-300"
                                      : log.statusCode >= 500
                                      ? "bg-red-900/50 text-red-300"
                                      : "bg-gray-900/50 text-gray-300"
                                  }`}
                                >
                                  {log.httpMethod} {log.statusCode}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate font-mono">
                                {log.endpoint}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalLogPages > 1 && (
                    <div className="card p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-300">
                          Sayfa {logCurrentPage} / {totalLogPages}
                          <span className="ml-2 text-gray-400">
                            (Toplam {logs.length} sonuç)
                          </span>
                        </div>

                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                          <button
                            onClick={() =>
                              setLogCurrentPage(Math.max(1, logCurrentPage - 1))
                            }
                            disabled={logCurrentPage === 1}
                            className="px-2 sm:px-3 py-1.5 sm:py-1 text-xs sm:text-sm border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="hidden sm:inline">Önceki</span>
                            <span className="sm:hidden">Önceki</span>
                          </button>

                          <span className="text-xs sm:text-sm text-gray-700 text-center">
                            {logCurrentPage} / {totalLogPages}
                          </span>

                          <button
                            onClick={() =>
                              setLogCurrentPage(
                                Math.min(totalLogPages, logCurrentPage + 1)
                              )
                            }
                            disabled={logCurrentPage === totalLogPages}
                            className="px-2 sm:px-3 py-1.5 sm:py-1 text-xs sm:text-sm border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="hidden sm:inline">Sonraki</span>
                            <span className="sm:hidden">Sonraki</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">
                    {logSearchTerm || logLevelFilter
                      ? "Arama kriterlerinize uygun log bulunamadı"
                      : "Henüz log kaydı bulunmuyor"}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {logSearchTerm || logLevelFilter
                      ? "Farklı arama terimleri veya filtreler deneyin"
                      : "Sistem kullanıldıkça loglar burada görünecek"}
                  </p>
                  {(logSearchTerm || logLevelFilter) && (
                    <button
                      onClick={() => {
                        setLogSearchTerm("");
                        setLogLevelFilter("");
                      }}
                      className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                    >
                      Tüm Logları Göster
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Password Reset Requests Tab */}
          {activeTab === "password-reset-requests" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-100">
                  Şifre Sıfırlama Talepleri
                </h3>
                <div className="text-sm text-gray-400">
                  {passwordResetRequestsData?.data ? (
                    <span>
                      Toplam: {passwordResetRequestsData.data.totalCount} talep
                    </span>
                  ) : null}
                </div>
              </div>

              {passwordResetRequestsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                </div>
              ) : passwordResetRequestsData?.data?.requests ? (
                <div className="card">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-dark-600">
                      <thead className="bg-dark-800">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Kullanıcı
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Durum
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Tarih
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            İşlemler
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-dark-900 divide-y divide-dark-600">
                        {passwordResetRequestsData.data.requests.map(
                          (request: PasswordResetRequest) => {
                            const getStatusInfo = (status: string) => {
                              switch (status) {
                                case "Pending":
                                  return {
                                    name: "Beklemede",
                                    bg: "bg-yellow-900/50",
                                    text: "text-yellow-300",
                                    icon: "⏳",
                                  };
                                case "Approved":
                                  return {
                                    name: "Onaylandı",
                                    bg: "bg-green-900/50",
                                    text: "text-green-300",
                                    icon: "✅",
                                  };
                                case "Rejected":
                                  return {
                                    name: "Reddedildi",
                                    bg: "bg-red-900/50",
                                    text: "text-red-300",
                                    icon: "❌",
                                  };
                                case "Completed":
                                  return {
                                    name: "Tamamlandı",
                                    bg: "bg-blue-900/50",
                                    text: "text-blue-300",
                                    icon: "🎉",
                                  };
                                default:
                                  return {
                                    name: "Bilinmiyor",
                                    bg: "bg-gray-900/50",
                                    text: "text-gray-300",
                                    icon: "❓",
                                  };
                              }
                            };

                            const statusInfo = getStatusInfo(request.status);

                            return (
                              <tr
                                key={request.id}
                                className="hover:bg-dark-700 transition-colors"
                              >
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-100">
                                  {request.userName}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-100">
                                  {request.userEmail}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.text}`}
                                  >
                                    {statusInfo.icon} {statusInfo.name}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-100">
                                  {formatDate(request.createdAt)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-100">
                                  <div className="flex space-x-2">
                                    {request.status === "Pending" && (
                                      <>
                                        <button
                                          onClick={() =>
                                            handleApprovePasswordReset(
                                              request.id
                                            )
                                          }
                                          className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                                        >
                                          Onayla
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleRejectPasswordReset(
                                              request.id
                                            )
                                          }
                                          className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700"
                                        >
                                          Reddet
                                        </button>
                                      </>
                                    )}
                                    {request.status === "Approved" && (
                                      <button
                                        onClick={() =>
                                          handleCompletePasswordReset(
                                            request.id
                                          )
                                        }
                                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700"
                                      >
                                        Tamamla
                                      </button>
                                    )}
                                    {request.resetToken && (
                                      <button
                                        onClick={() => {
                                          navigator.clipboard.writeText(
                                            request.resetToken!
                                          );
                                          toast.success("Token kopyalandı!");
                                        }}
                                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-purple-600 hover:bg-purple-700"
                                        title="Token'ı kopyala"
                                      >
                                        Token
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          }
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Shield className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-100">
                    Henüz şifre sıfırlama talebi bulunmuyor
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Kullanıcılar şifre sıfırlama talebinde bulundukça burada
                    görünecek
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Contact Tab */}
          {activeTab === "contact" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  İletişim Mesajları
                </h3>
                <div className="text-sm text-gray-500">
                  {contactStatsData?.data ? (
                    <span>
                      Toplam: {contactStatsData.data.totalMessages} | Okunmamış:{" "}
                      {contactStatsData.data.unreadMessages} | Yanıt Oranı: %
                      {contactStatsData.data.replyRate}
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Stats Cards */}
              {contactStatsData?.data && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <Mail className="h-8 w-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-blue-600">
                          Toplam Mesaj
                        </p>
                        <p className="text-2xl font-bold text-blue-900">
                          {contactStatsData.data.totalMessages}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <Clock className="h-8 w-8 text-yellow-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-yellow-600">
                          Okunmamış
                        </p>
                        <p className="text-2xl font-bold text-yellow-900">
                          {contactStatsData.data.unreadMessages}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <Reply className="h-8 w-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-green-600">
                          Yanıtlanan
                        </p>
                        <p className="text-2xl font-bold text-green-900">
                          {contactStatsData.data.repliedMessages}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <Calendar className="h-8 w-8 text-purple-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-purple-600">
                          Bugün
                        </p>
                        <p className="text-2xl font-bold text-purple-900">
                          {contactStatsData.data.todayMessages}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Messages List */}
              {contactLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                </div>
              ) : contactData?.data?.messages?.length > 0 ? (
                <div className="space-y-4">
                  {contactData?.data?.messages?.map(
                    (message: ContactMessage) => (
                      <div
                        key={message.id}
                        className={`border rounded-lg p-4 ${
                          message.isRead
                            ? "bg-white"
                            : "bg-blue-50 border-blue-200"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 space-y-2 sm:space-y-0">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-medium text-gray-900">
                                {message.subject}
                              </h4>
                              <div className="flex items-center space-x-2">
                                {!message.isRead && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Yeni
                                  </span>
                                )}
                                {message.isReplied && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Yanıtlandı
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0">
                                <span>
                                  <strong>Gönderen:</strong> {message.name}
                                </span>
                                <span>
                                  <strong>Email:</strong> {message.email}
                                </span>
                                {message.phone && (
                                  <span>
                                    <strong>Telefon:</strong> {message.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-gray-700 mb-3">
                              {message.message}
                            </p>

                            {message.adminReply && (
                              <div className="bg-dark-800 border-l-4 border-purple-400 p-3 mb-3">
                                <p className="text-sm font-medium text-purple-300 mb-1">
                                  Admin Yanıtı:
                                </p>
                                <p className="text-gray-300">
                                  {message.adminReply}
                                </p>
                                {message.repliedAt && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    {formatDate(message.repliedAt)}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center space-x-2 mt-2 sm:mt-0 sm:ml-4">
                            <span className="text-sm text-gray-500">
                              {formatDate(message.createdAt)}
                            </span>
                            <div className="flex items-center space-x-1">
                              {!message.isRead && (
                                <button
                                  onClick={() =>
                                    handleMarkContactRead(message.id)
                                  }
                                  className="p-1 text-blue-600 hover:text-blue-800"
                                  title="Okundu işaretle"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  const reply = prompt("Yanıtınızı yazın:");
                                  if (reply) {
                                    handleReplyContact(message.id, reply);
                                  }
                                }}
                                className="p-1 text-green-600 hover:text-green-800"
                                title="Yanıtla"
                              >
                                <Reply className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteContact(message.id)}
                                className="p-1 text-red-600 hover:text-red-800"
                                title="Sil"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Mail className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">
                    Henüz mesaj yok
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Kullanıcılar tarafından gönderilen mesajlar burada
                    görünecek.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Add Daily Post Tab */}
          {activeTab === "add-daily-post" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Yeni Günlük Paylaşım Ekle
              </h3>

              <div className="card p-6">
                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Başlık *
                    </label>
                    <input
                      type="text"
                      value={dailyPostForm.title}
                      onChange={(e) =>
                        setDailyPostForm({
                          ...dailyPostForm,
                          title: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-dark-600 rounded-md bg-dark-900 text-gray-100 placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Paylaşım başlığını girin..."
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      İçerik *
                    </label>
                    <EmojiTextarea
                      value={dailyPostForm.content}
                      onChange={(val) =>
                        setDailyPostForm({
                          ...dailyPostForm,
                          content: val,
                        })
                      }
                      rows={6}
                      placeholder="Paylaşım içeriğini girin..."
                      className="px-3 py-2 border border-dark-600 rounded-md bg-dark-900 text-gray-100 placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kategori
                    </label>
                    <select
                      value={dailyPostForm.category}
                      onChange={(e) =>
                        setDailyPostForm({
                          ...dailyPostForm,
                          category: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-dark-600 rounded-md bg-dark-900 text-gray-100 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="Yemek">Yemek</option>
                      <option value="Seyahat">Seyahat</option>
                      <option value="Teknoloji">Teknoloji</option>
                      <option value="Yaşam">Yaşam</option>
                      <option value="Düşünceler">Düşünceler</option>
                    </select>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Etiketler
                    </label>
                    <input
                      type="text"
                      value={dailyPostForm.tags}
                      onChange={(e) =>
                        setDailyPostForm({
                          ...dailyPostForm,
                          tags: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-dark-600 rounded-md bg-dark-900 text-gray-100 placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="restoran,lezzetli,deneyim (virgülle ayırın)"
                    />
                  </div>

                  {/* Options */}
                  <div className="flex items-center space-x-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={dailyPostForm.isPublished}
                        onChange={(e) =>
                          setDailyPostForm({
                            ...dailyPostForm,
                            isPublished: e.target.checked,
                          })
                        }
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Yayınla
                      </span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={dailyPostForm.isFeatured}
                        onChange={(e) =>
                          setDailyPostForm({
                            ...dailyPostForm,
                            isFeatured: e.target.checked,
                          })
                        }
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Öne Çıkar
                      </span>
                    </label>
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Resim
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                      {dailyPostImagePreview ? (
                        <div className="relative">
                          <img
                            src={dailyPostImagePreview}
                            alt="Preview"
                            className="h-48 w-full object-cover rounded"
                          />
                          <button
                            onClick={() => {
                              setDailyPostImage(null);
                              setDailyPostImagePreview(null);
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <div className="text-center">
                            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="mt-4">
                              <span className="text-purple-600 hover:text-purple-500">
                                Resim yükle
                              </span>
                              <p className="text-sm text-gray-500">
                                PNG, JPG, GIF (maks. 5MB)
                              </p>
                            </div>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleDailyPostImageUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={handleSubmitDailyPost}
                      disabled={createDailyPostMutation.isPending}
                      className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>
                        {createDailyPostMutation.isPending
                          ? "Oluşturuluyor..."
                          : "Paylaşım Oluştur"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add Prediction Tab */}
          {activeTab === "add-prediction" && (
            <div className="card p-6">
              <h2 className="text-xl font-bold mb-6">Yeni Tahmin Ekle</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Başlık
                  </label>
                  <input
                    type="text"
                    value={predictionForm.title}
                    onChange={(e) =>
                      setPredictionForm({
                        ...predictionForm,
                        title: e.target.value,
                      })
                    }
                    className="input w-full mt-1"
                    placeholder="Maç sonucu tahmini..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    İçerik / Analiz
                  </label>
                  <EmojiTextarea
                    value={predictionForm.content}
                    onChange={(val) =>
                      setPredictionForm({
                        ...predictionForm,
                        content: val,
                      })
                    }
                    rows={8}
                    className="input w-full mt-1"
                    placeholder="Detaylı analiz ve tahmininizi buraya yazın..."
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={predictionForm.isPaid}
                    onChange={(e) =>
                      setPredictionForm({
                        ...predictionForm,
                        isPaid: e.target.checked,
                      })
                    }
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Bu bir VIP (Ücretli) Tahmin mi?
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Resimler (En fazla 5 adet)
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="prediction-images-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                        >
                          <span>Resim yükle</span>
                          <input
                            id="prediction-images-upload"
                            type="file"
                            className="sr-only"
                            multiple
                            accept="image/*"
                            onChange={handlePredictionImageUpload}
                          />
                        </label>
                        <p className="pl-1">veya sürükleyip bırakın</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF (Her biri maks. 5MB)
                      </p>
                    </div>
                  </div>
                </div>

                {predictionImagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {predictionImagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Önizleme ${index + 1}`}
                          className="h-28 w-full object-cover rounded-md"
                        />
                        <button
                          onClick={() => handleRemovePredictionImage(index)}
                          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={handleSubmitPrediction}
                    className="btn-primary flex items-center space-x-2"
                    disabled={createPredictionMutation.isPending}
                  >
                    {createPredictionMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Yükleniyor...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-5 w-5" />
                        <span>Tahmini Oluştur</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "predictions" && (
            <PredictionManagementTab
              predictions={predictionsData?.data.predictions || []}
              loading={predictionsLoading}
              onEdit={openPredictionEditModal}
              onDelete={handleDeletePrediction}
              onAction={openPredictionActionModal}
            />
          )}

          {activeTab === "daily-posts" && (
            <DailyPostManagementTab
              posts={
                Array.isArray(dailyPostsData?.data)
                  ? (dailyPostsData?.data as DailyPost[])
                  : dailyPostsData?.data?.dailyPosts ||
                    dailyPostsData?.data?.data ||
                    []
              }
              loading={dailyPostsLoading}
              onDelete={handleDeleteDailyPost}
              onEdit={openDailyPostEditModal}
            />
          )}
        </div>
      </div>

      {/* Payment Action Modal */}
      {showPaymentActionModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-900 rounded-lg p-6 w-full max-w-sm shadow-xl text-gray-900 dark:text-gray-100">
            <h3 className="text-lg font-bold mb-4">
              {paymentAction === "approve"
                ? "Ödemeyi Onayla"
                : "Ödemeyi Reddet"}
            </h3>
            <div className="mb-4">
              <p>
                <strong>Kullanıcı:</strong> {selectedPayment.user.firstName}{" "}
                {selectedPayment.user.lastName}
              </p>
              <p>
                <strong>Miktar:</strong> ₺{selectedPayment.amount}
              </p>
              <p>
                <strong>Banka:</strong> {selectedPayment.bankName}
              </p>
            </div>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Admin notu (kullanıcıya gösterilebilir)..."
              className="w-full p-2 border rounded-md"
              rows={3}
            />
            <div className="flex justify-end space-x-4 mt-4">
              <button
                onClick={() => setShowPaymentActionModal(false)}
                className="btn-secondary"
              >
                İptal
              </button>
              <button
                onClick={handlePaymentAction}
                disabled={
                  approvePaymentMutation.isPending ||
                  rejectPaymentMutation.isPending
                }
                className={
                  paymentAction === "approve" ? "btn-success" : "btn-danger"
                }
              >
                {paymentAction === "approve" ? "Onayla" : "Reddet"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIP Modal */}
      {showVipModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-lg p-6 w-full max-w-sm shadow-2xl border border-dark-600 text-gray-100">
            <h3 className="text-lg font-semibold mb-4 text-gray-100">
              VIP Üyelik Ver
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => handleVipGrant(1)}
                className="w-full text-left p-2 rounded hover:bg-dark-700 text-gray-100 border border-dark-600"
              >
                Aylık Abonelik
              </button>
              <button
                onClick={() => handleVipGrant(2)}
                className="w-full text-left p-2 rounded hover:bg-dark-700 text-gray-100 border border-dark-600"
              >
                3 Aylık Abonelik
              </button>
              <button
                onClick={() => handleVipGrant(3)}
                className="w-full text-left p-2 rounded hover:bg-dark-700 text-gray-100 border border-dark-600"
              >
                6 Aylık Abonelik
              </button>
            </div>
            <div className="text-right mt-4">
              <button
                onClick={() => setShowVipModal(false)}
                className="text-sm text-gray-300 hover:text-gray-100"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {showUserDetail && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-end sm:items-center sm:justify-center">
          <div className="bg-dark-800 w-full sm:w-full max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-lg p-6 shadow-2xl border border-dark-600 text-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-100">
                Kullanıcı Detayları
              </h3>
              <button
                onClick={() => {
                  setShowUserDetail(false);
                  setSelectedUser(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* User Info */}
              <div className="flex items-center space-x-4">
                {selectedUser.profileImageUrl ? (
                  <img
                    src={selectedUser.profileImageUrl}
                    alt={selectedUser.firstName}
                    className="h-16 w-16 rounded-full object-cover shadow-md"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-xl">
                    {selectedUser.firstName?.[0]}
                    {selectedUser.lastName?.[0]}
                  </div>
                )}
                <div>
                  <h4 className="text-xl font-semibold text-gray-100">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </h4>
                  <p className="text-gray-300">{selectedUser.email}</p>
                  {selectedUser.phone && (
                    <p className="text-gray-300">{selectedUser.phone}</p>
                  )}
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {selectedUser.role === "Admin" && (
                  <span className="bg-red-900/50 text-red-300 border border-red-700/50 px-2 py-1 rounded-full text-xs font-medium">
                    Admin
                  </span>
                )}
                {selectedUser.role === "SuperAdmin" && (
                  <span className="bg-red-900/50 text-red-300 border border-red-700/50 px-2 py-1 rounded-full text-xs font-medium">
                    SüperAdmin
                  </span>
                )}
                {selectedUser.role === "VipUser" && (
                  <span className="bg-yellow-900/50 text-yellow-300 border border-yellow-700/50 px-2 py-1 rounded-full text-xs font-medium">
                    VIP Kullanıcı
                  </span>
                )}
                {selectedUser.isBlocked && (
                  <span className="bg-red-900/50 text-red-300 border border-red-700/50 px-2 py-1 rounded-full text-xs font-medium">
                    Engelli
                  </span>
                )}
                {/* Email doğrulama artık gerekli değil */}
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-dark-800 p-4 rounded-lg border border-dark-600">
                  <h5 className="font-medium text-gray-100 mb-2">
                    Kayıt Tarihi
                  </h5>
                  <p className="text-gray-300">
                    {new Date(selectedUser.createdAt).toLocaleDateString(
                      "tr-TR",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </p>
                </div>

                <div className="bg-dark-800 p-4 rounded-lg border border-dark-600">
                  <h5 className="font-medium text-gray-100 mb-2">Durum</h5>
                  <p className="text-gray-300">
                    {selectedUser.isActive ? (
                      <span className="text-green-600 font-medium">Aktif</span>
                    ) : (
                      <span className="text-red-600 font-medium">Pasif</span>
                    )}
                  </p>
                </div>

                {selectedUser.vipExpiryDate && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-2">
                      VIP Bitiş Tarihi
                    </h5>
                    <p className="text-yellow-800">
                      {new Date(selectedUser.vipExpiryDate).toLocaleDateString(
                        "tr-TR",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </p>
                  </div>
                )}

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">Rol</h5>
                  <p className="text-gray-600">{selectedUser.role}</p>
                </div>
              </div>

              {/* Account Status */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-2">Hesap Durumu</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Email Doğrulama:</span>
                    <span className="font-medium text-green-600">
                      ✓ Otomatik Doğrulanmış
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Hesap Durumu:</span>
                    <span
                      className={`font-medium ${
                        selectedUser.isActive
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {selectedUser.isActive ? "✓ Aktif" : "✗ Pasif"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Engelleme Durumu:</span>
                    <span
                      className={`font-medium ${
                        selectedUser.isBlocked
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {selectedUser.isBlocked ? "✗ Engelli" : "✓ Engellenmemiş"}
                    </span>
                  </div>
                  {selectedUser.isBlocked && selectedUser.blockReason && (
                    <div className="mt-2 p-2 bg-red-50 rounded">
                      <span className="text-xs text-red-600">
                        <strong>Engelleme Sebebi:</strong>{" "}
                        {selectedUser.blockReason}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowUserDetail(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Detail Modal */}
      {showAuditLogDetail && selectedAuditLogId && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-dark-600 text-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-100">
                Audit Log Detayı #{selectedAuditLogId}
              </h3>
              <button
                onClick={() => {
                  setShowAuditLogDetail(false);
                  setSelectedAuditLogId(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {auditLogDetailLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
              </div>
            ) : auditLogDetail?.data ? (
              <div className="space-y-6">
                {/* Header Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-dark-800 p-4 rounded-lg border border-dark-600">
                    <h5 className="font-medium text-gray-100 mb-2">İşlem</h5>
                    <p className="text-blue-300 font-mono text-sm">
                      {auditLogDetail.data.action}
                    </p>
                  </div>

                  <div className="bg-dark-800 p-4 rounded-lg border border-dark-600">
                    <h5 className="font-medium text-gray-100 mb-2">
                      HTTP Metod
                    </h5>
                    <p className="text-green-300 font-mono text-sm">
                      {auditLogDetail.data.httpMethod}{" "}
                      {auditLogDetail.data.statusCode}
                    </p>
                  </div>

                  <div className="bg-dark-800 p-4 rounded-lg border border-dark-600">
                    <h5 className="font-medium text-gray-100 mb-2">Süre</h5>
                    <p className="text-purple-300 font-mono text-sm">
                      {auditLogDetail.data.duration}ms
                    </p>
                  </div>
                </div>

                {/* User Info */}
                <div className="bg-dark-800 p-4 rounded-lg border border-dark-600">
                  <h5 className="font-medium text-gray-100 mb-3">
                    Kullanıcı Bilgileri
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-400">Kullanıcı:</span>
                      <p className="font-medium text-gray-100">
                        {auditLogDetail.data.userName}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-400">Email:</span>
                      <p className="font-medium text-gray-100">
                        {auditLogDetail.data.userEmail}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-400">IP Adresi:</span>
                      <p className="font-mono text-sm text-gray-100">
                        {auditLogDetail.data.ipAddress}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-400">Tarih:</span>
                      <p className="font-medium text-gray-100">
                        {new Date(auditLogDetail.data.createdAt).toLocaleString(
                          "tr-TR"
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Request Info */}
                <div className="bg-dark-800 p-4 rounded-lg border border-dark-600">
                  <h5 className="font-medium text-gray-100 mb-3">
                    İstek Bilgileri
                  </h5>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-400">Endpoint:</span>
                      <p className="font-mono text-sm bg-dark-900 p-2 rounded border border-dark-600 text-gray-100">
                        {auditLogDetail.data.endpoint}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-400">Entity:</span>
                      <p className="font-medium text-gray-100">
                        {auditLogDetail.data.entity}
                      </p>
                    </div>
                    {auditLogDetail.data.entityId && (
                      <div>
                        <span className="text-sm text-gray-400">
                          Entity ID:
                        </span>
                        <p className="font-mono text-sm text-gray-100">
                          {auditLogDetail.data.entityId}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* User Agent */}
                <div className="bg-dark-800 p-4 rounded-lg border border-dark-600">
                  <h5 className="font-medium text-gray-100 mb-2">User Agent</h5>
                  <p className="font-mono text-xs bg-dark-900 p-3 rounded border border-dark-600 break-all text-gray-100">
                    {auditLogDetail.data.userAgent}
                  </p>
                </div>

                {/* Request Data */}
                {auditLogDetail.data.requestData && (
                  <div className="bg-dark-800 p-4 rounded-lg border border-dark-600">
                    <h5 className="font-medium text-gray-100 mb-2">
                      İstek Verisi
                    </h5>
                    <pre className="bg-dark-900 p-3 rounded border border-dark-600 text-xs overflow-x-auto text-gray-100">
                      {JSON.stringify(
                        JSON.parse(auditLogDetail.data.requestData),
                        null,
                        2
                      )}
                    </pre>
                  </div>
                )}

                {/* Response Data */}
                {auditLogDetail.data.responseData && (
                  <div className="bg-dark-800 p-4 rounded-lg border border-dark-600">
                    <h5 className="font-medium text-gray-100 mb-2">
                      Yanıt Verisi
                    </h5>
                    <pre className="bg-dark-900 p-3 rounded border border-dark-600 text-xs overflow-x-auto text-gray-100">
                      {JSON.stringify(
                        JSON.parse(auditLogDetail.data.responseData),
                        null,
                        2
                      )}
                    </pre>
                  </div>
                )}

                {/* Error Message */}
                {auditLogDetail.data.errorMessage && (
                  <div className="bg-dark-800 p-4 rounded-lg border border-dark-600">
                    <h5 className="font-medium text-gray-100 mb-2">
                      Hata Mesajı
                    </h5>
                    <p className="text-red-300 bg-dark-900 p-3 rounded border border-dark-600">
                      {auditLogDetail.data.errorMessage}
                    </p>
                  </div>
                )}

                {/* Level Info */}
                <div className="bg-dark-800 p-4 rounded-lg border border-dark-600">
                  <h5 className="font-medium text-gray-100 mb-2">
                    Log Seviyesi
                  </h5>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        auditLogDetail.data.level === 1
                          ? "bg-blue-900/50 text-blue-300"
                          : auditLogDetail.data.level === 2
                          ? "bg-yellow-900/50 text-yellow-300"
                          : auditLogDetail.data.level === 3
                          ? "bg-red-900/50 text-red-300"
                          : auditLogDetail.data.level === 4
                          ? "bg-red-800/50 text-red-200"
                          : "bg-gray-900/50 text-gray-300"
                      }`}
                    >
                      {auditLogDetail.data.level === 1
                        ? "ℹ️ Info"
                        : auditLogDetail.data.level === 2
                        ? "⚠️ Warning"
                        : auditLogDetail.data.level === 3
                        ? "🚨 Error"
                        : auditLogDetail.data.level === 4
                        ? "💀 Critical"
                        : "❓ Unknown"}
                    </span>
                    <span className="text-sm text-gray-600">
                      Level {auditLogDetail.data.level}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Log detayı yüklenemedi.</p>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowAuditLogDetail(false);
                  setSelectedAuditLogId(null);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {showPredictionEditModal && editablePrediction && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-900 rounded-lg p-6 w-full max-w-sm shadow-xl text-gray-900 dark:text-gray-100">
            <h3 className="text-xl font-bold text-gradient mb-6">
              Tahmin Düzenle
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Başlık
                </label>
                <input
                  type="text"
                  placeholder="Tahmin başlığını girin..."
                  value={editablePrediction.title}
                  onChange={(e) =>
                    setEditablePrediction({
                      ...editablePrediction,
                      title: e.target.value,
                    })
                  }
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  İçerik
                </label>
                <EmojiTextarea
                  value={editablePrediction.content}
                  onChange={(val) =>
                    setEditablePrediction({
                      ...editablePrediction,
                      content: val,
                    })
                  }
                  placeholder="Tahmin içeriğini girin..."
                  rows={6}
                  className=""
                />
              </div>

              <div>
                <label className="flex items-center space-x-3 p-3 rounded-lg bg-dark-700/30 border border-dark-600/30 hover:bg-dark-700/50 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editablePrediction.isPaid}
                    onChange={(e) =>
                      setEditablePrediction({
                        ...editablePrediction,
                        isPaid: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-purple-600 bg-dark-700 border-dark-600 rounded focus:ring-purple-500 focus:ring-2"
                  />
                  <span className="text-gray-200 font-medium">VIP Tahmini</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-8">
              <button
                onClick={() => setShowPredictionEditModal(false)}
                className="btn-ghost"
              >
                İptal
              </button>
              <button
                onClick={handleUpdatePrediction}
                className="btn-primary"
                disabled={updatePredictionMutation.isPending}
              >
                {updatePredictionMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Kaydediliyor...</span>
                  </div>
                ) : (
                  "Kaydet"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPredictionActionModal && selectedPrediction && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-900 rounded-lg p-6 w-full max-w-sm shadow-xl text-gray-900 dark:text-gray-100">
            <h3 className="text-xl font-bold text-gradient mb-6">
              {predictionActionType === "result"
                ? "Sonuç Gir"
                : predictionActionType === "pin"
                ? "Sabitle"
                : predictionActionType === "feature"
                ? "Öne Çıkar"
                : ""}{" "}
              Aksiyonu
            </h3>

            {predictionActionType === "result" && (
              <div className="space-y-4">
                <label className="flex items-center space-x-3 p-3 rounded-lg bg-dark-700/30 border border-dark-600/30 hover:bg-dark-700/50 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-primary-600 bg-dark-700 border-dark-600 rounded focus:ring-primary-500 focus:ring-2"
                    onChange={(e) =>
                      setPredictionActionForm({
                        ...predictionActionForm,
                        isCorrect: e.target.checked,
                      })
                    }
                  />
                  <span className="text-gray-200 font-medium">
                    Tahmin başarılı mı?
                  </span>
                </label>
                <textarea
                  placeholder="Sonuç notunu girin..."
                  onChange={(e) =>
                    setPredictionActionForm({
                      ...predictionActionForm,
                      resultNote: e.target.value,
                    })
                  }
                  className="input-field w-full"
                  rows={4}
                ></textarea>
              </div>
            )}

            {predictionActionType === "pin" && (
              <div className="space-y-4">
                <label className="flex items-center space-x-3 p-3 rounded-lg bg-dark-700/30 border border-dark-600/30 hover:bg-dark-700/50 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-yellow-600 bg-dark-700 border-dark-600 rounded focus:ring-yellow-500 focus:ring-2"
                    onChange={(e) =>
                      setPredictionActionForm({
                        ...predictionActionForm,
                        isPinned: e.target.checked,
                      })
                    }
                  />
                  <span className="text-gray-200 font-medium">
                    Başa sabitlensin mi?
                  </span>
                </label>
                <textarea
                  placeholder="Sabitleme nedenini girin..."
                  onChange={(e) =>
                    setPredictionActionForm({
                      ...predictionActionForm,
                      pinReason: e.target.value,
                    })
                  }
                  className="input-field w-full"
                  rows={4}
                ></textarea>
              </div>
            )}

            {predictionActionType === "feature" && (
              <div className="space-y-4">
                <label className="flex items-center space-x-3 p-3 rounded-lg bg-dark-700/30 border border-dark-600/30 hover:bg-dark-700/50 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-indigo-600 bg-dark-700 border-dark-600 rounded focus:ring-indigo-500 focus:ring-2"
                    onChange={(e) =>
                      setPredictionActionForm({
                        ...predictionActionForm,
                        isFeatured: e.target.checked,
                      })
                    }
                  />
                  <span className="text-gray-200 font-medium">
                    Öne çıkarılsın mı?
                  </span>
                </label>
                <textarea
                  placeholder="Öne çıkarma nedenini girin..."
                  onChange={(e) =>
                    setPredictionActionForm({
                      ...predictionActionForm,
                      featureReason: e.target.value,
                    })
                  }
                  className="input-field w-full"
                  rows={4}
                ></textarea>
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-8">
              <button
                onClick={() => setShowPredictionActionModal(false)}
                className="btn-ghost"
              >
                İptal
              </button>
              <button
                onClick={handlePredictionAction}
                className="btn-primary"
                disabled={
                  predictionActionResultMutation.isPending ||
                  predictionActionPinMutation.isPending ||
                  predictionActionFeatureMutation.isPending
                }
              >
                {predictionActionResultMutation.isPending ||
                predictionActionPinMutation.isPending ||
                predictionActionFeatureMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>İşleniyor...</span>
                  </div>
                ) : (
                  "Uygula"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Daily Post Edit Modal */}
      {showDailyPostEditModal && editableDailyPost && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-900 rounded-lg p-6 w-full max-w-2xl shadow-xl text-gray-900 dark:text-gray-100 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Paylaşımı Düzenle</h3>
              <button onClick={() => setShowDailyPostEditModal(false)}>
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Başlık</label>
                <input
                  type="text"
                  value={dailyPostForm.title}
                  onChange={(e) =>
                    setDailyPostForm({
                      ...dailyPostForm,
                      title: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">İçerik</label>
                <EmojiTextarea
                  value={dailyPostForm.content}
                  onChange={(val) =>
                    setDailyPostForm({
                      ...dailyPostForm,
                      content: val,
                    })
                  }
                  rows={6}
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Kategori
                  </label>
                  <input
                    type="text"
                    value={dailyPostForm.category}
                    onChange={(e) =>
                      setDailyPostForm({
                        ...dailyPostForm,
                        category: e.target.value,
                      })
                    }
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Etiketler (virgülle)
                  </label>
                  <input
                    type="text"
                    value={dailyPostForm.tags}
                    onChange={(e) =>
                      setDailyPostForm({
                        ...dailyPostForm,
                        tags: e.target.value,
                      })
                    }
                    className="w-full p-2 border rounded-md"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={dailyPostForm.isPublished}
                    onChange={(e) =>
                      setDailyPostForm({
                        ...dailyPostForm,
                        isPublished: e.target.checked,
                      })
                    }
                  />
                  <span>Yayınla</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={dailyPostForm.isFeatured}
                    onChange={(e) =>
                      setDailyPostForm({
                        ...dailyPostForm,
                        isFeatured: e.target.checked,
                      })
                    }
                  />
                  <span>Öne Çıkar</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Resim</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleDailyPostImageUpload}
                />
                {dailyPostImagePreview && (
                  <img
                    src={dailyPostImagePreview}
                    alt="Önizleme"
                    className="mt-2 h-32 w-auto object-contain"
                  />
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  className="btn-secondary"
                  onClick={() => setShowDailyPostEditModal(false)}
                >
                  İptal
                </button>
                <button
                  className="btn-primary"
                  onClick={handleUpdateDailyPost}
                  disabled={updateDailyPostMutation.isPending}
                >
                  {updateDailyPostMutation.isPending
                    ? "Güncelleniyor..."
                    : "Güncelle"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Define props type for PaymentManagementTab
interface PaymentManagementTabProps {
  pendingPayments: PaymentNotification[];
  allPayments: PaymentNotification[];
  loadingPending: boolean;
  loadingAll: boolean;
  activePaymentTab: PaymentTab;
  setActivePaymentTab: (tab: PaymentTab) => void;
  onAction: (
    payment: PaymentNotification,
    action: "approve" | "reject"
  ) => void;
}

const PaymentManagementTab: React.FC<PaymentManagementTabProps> = ({
  pendingPayments,
  allPayments,
  loadingPending,
  loadingAll,
  activePaymentTab,
  setActivePaymentTab,
  onAction,
}) => {
  const statusInfo: {
    [key in "Pending" | "Approved" | "Rejected"]: {
      color: string;
      icon: JSX.Element;
    };
  } = {
    Pending: {
      color: "bg-yellow-100 text-yellow-800",
      icon: <Clock className="h-4 w-4" />,
    },
    Approved: {
      color: "bg-green-100 text-green-800",
      icon: <CheckCircle className="h-4 w-4" />,
    },
    Rejected: {
      color: "bg-red-100 text-red-800",
      icon: <XCircle className="h-4 w-4" />,
    },
  };

  const renderList = (
    title: string,
    payments: PaymentNotification[],
    loading: boolean
  ) => (
    <div>
      <h3 className="text-xl font-semibold mb-4">{title}</h3>
      {loading ? (
        <p>Yükleniyor...</p>
      ) : payments.length > 0 ? (
        <div className="space-y-4">
          {payments.map((p) => (
            <div key={p.id} className="card p-4">
              <div className="flex flex-col md:flex-row md:justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-2">
                    <span
                      className={`inline-flex items-center space-x-2 px-2 py-1 rounded-full text-xs font-medium ${
                        statusInfo[p.status].color
                      }`}
                    >
                      {statusInfo[p.status].icon}
                      <span>{p.status}</span>
                    </span>
                    <p className="font-bold">
                      {p.userFullName} ({p.userEmail})
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(p.createdAt)}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <p>
                      <strong>Tutar:</strong> ₺{p.amount}
                    </p>
                    <p>
                      <strong>Banka:</strong> {p.bankName}
                    </p>
                    <p>
                      <strong>İşlem Tarihi:</strong>{" "}
                      {formatDate(p.transactionDate)}
                    </p>
                    <p>
                      <strong>Referans No:</strong> {p.transactionReference}
                    </p>
                    {p.note && (
                      <p className="col-span-2">
                        <strong>Not:</strong> {p.note}
                      </p>
                    )}
                    {p.adminNote && (
                      <p className="col-span-2 mt-2 text-purple-700 bg-purple-50 p-2 rounded">
                        <strong>Admin Notu:</strong> {p.adminNote}
                      </p>
                    )}
                  </div>
                </div>

                {p.status === "Pending" && (
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-4 md:mt-0 md:ml-4">
                    <button
                      onClick={() => onAction(p, "approve")}
                      className="btn-success-small text-xs px-2 sm:px-3 py-1.5 sm:py-2 flex items-center justify-center space-x-1"
                    >
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Onayla</span>
                      <span className="sm:hidden">Onayla</span>
                    </button>
                    <button
                      onClick={() => onAction(p, "reject")}
                      className="btn-danger-small text-xs px-2 sm:px-3 py-1.5 sm:py-2 flex items-center justify-center space-x-1"
                    >
                      <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Reddet</span>
                      <span className="sm:hidden">Reddet</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>Gösterilecek bildirim yok.</p>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="border-b">
        <nav className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <button
            onClick={() => setActivePaymentTab("pending")}
            className={`tab-button text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-3 ${
              activePaymentTab === "pending" ? "tab-active" : ""
            }`}
          >
            <span className="hidden sm:inline">
              Bekleyenler ({pendingPayments.length})
            </span>
            <span className="sm:hidden">Bekleyenler</span>
          </button>
          <button
            onClick={() => setActivePaymentTab("all")}
            className={`tab-button text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-3 ${
              activePaymentTab === "all" ? "tab-active" : ""
            }`}
          >
            Tümü
          </button>
        </nav>
      </div>

      <div>
        {activePaymentTab === "pending" &&
          renderList("Onay Bekleyen Ödemeler", pendingPayments, loadingPending)}
        {activePaymentTab === "all" &&
          renderList("Tüm Ödeme Bildirimleri", allPayments, loadingAll)}
      </div>
    </div>
  );
};

// --- YENİ BİLEŞEN: PredictionManagementTab ---
interface PredictionManagementTabProps {
  predictions: PredictionListDto[];
  loading: boolean;
  onEdit: (prediction: PredictionListDto) => void;
  onDelete: (id: number) => void;
  onAction: (
    prediction: PredictionListDto,
    type: "result" | "pin" | "feature"
  ) => void;
}

const PredictionManagementTab: React.FC<PredictionManagementTabProps> = ({
  predictions,
  loading,
  onEdit,
  onDelete,
  onAction,
}) => {
  if (loading)
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="text-gray-400">Tahminler yükleniyor...</span>
        </div>
      </div>
    );

  if (predictions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-dark-900 rounded-xl p-8 border border-dark-700/60 shadow-2xl">
          <TrendingUp className="mx-auto h-16 w-16 text-gray-500 mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">
            Henüz tahmin yok
          </h3>
          <p className="text-gray-500">
            İlk tahmin eklendikten sonra burada görünecek.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-dark-800 rounded-xl p-6 shadow-2xl border border-dark-600">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gradient">Tahminler</h2>
            <p className="text-gray-400 mt-1">
              Toplam {predictions.length} içerik yönetiliyor
            </p>
          </div>
          <div className="bg-primary-900 text-primary-300 px-3 py-1 rounded-full text-xs font-semibold">
            {predictions.length} İçerik
          </div>
        </div>
      </div>

      {/* Predictions Grid */}
      <div className="grid grid-cols-1 gap-6">
        {predictions.map((prediction) => (
          <div
            key={prediction.id}
            className="bg-dark-800 rounded-xl p-6 shadow-2xl border border-dark-600 group hover:bg-dark-700 transition-colors"
          >
            <div className="flex items-start justify-between">
              {/* Left Content */}
              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center space-x-3 mb-3">
                  <span className="text-sm font-medium text-gray-500">
                    #{prediction.id}
                  </span>
                  {prediction.isPaid ? (
                    <div className="bg-purple-900 text-purple-300 px-3 py-1 rounded-full text-xs font-semibold">
                      VIP
                    </div>
                  ) : (
                    <div className="bg-green-900 text-green-300 px-3 py-1 rounded-full text-xs font-semibold">
                      Ücretsiz
                    </div>
                  )}
                </div>

                <h3 className="text-xl font-bold text-gray-200 mb-3 group-hover:text-gradient transition-all duration-300">
                  {prediction.title}
                </h3>

                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-1">
                    <User className="w-4 h-4" />
                    <span>{prediction.userName}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {TurkeyTime.format(prediction.createdAt, "time")}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Heart className="w-4 h-4" />
                    <span>{prediction.likeCount} beğeni</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="w-4 h-4" />
                    <span>{prediction.commentCount} yorum</span>
                  </div>
                </div>

                {prediction.firstImageUrl && (
                  <div className="mt-3">
                    <img
                      src={prediction.firstImageUrl}
                      alt={prediction.title}
                      className="h-24 w-24 rounded-xl object-cover shadow-lg group-hover:shadow-xl transition-all duration-300"
                    />
                  </div>
                )}
              </div>

              {/* Right Actions */}
              <div className="flex flex-col space-y-2 sm:space-y-3">
                {/* Primary Actions */}
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <button
                    onClick={() => onEdit(prediction)}
                    className="btn-ghost text-xs px-2 sm:px-3 py-1.5 sm:py-2 flex items-center justify-center space-x-1"
                    title="Düzenle"
                  >
                    <Edit className="w-3 h-3" />
                    <span className="hidden sm:inline">Düzenle</span>
                    <span className="sm:hidden">Düzenle</span>
                  </button>
                  <button
                    onClick={() => onDelete(prediction.id)}
                    className="btn-danger text-xs px-2 sm:px-3 py-1.5 sm:py-2 flex items-center justify-center space-x-1"
                    title="Sil"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span className="hidden sm:inline">Sil</span>
                    <span className="sm:hidden">Sil</span>
                  </button>
                </div>

                {/* Secondary Actions (gizlendi) */}
                <div className="hidden">
                  {/* Secondary Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onAction(prediction, "result")}
                      className="btn-success text-xs px-3 py-2 flex items-center space-x-1"
                      title="Sonuç Gir"
                    >
                      <CheckCircle className="w-3 h-3" />
                      <span>Sonuç</span>
                    </button>
                    <button
                      onClick={() => onAction(prediction, "pin")}
                      className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white text-xs px-3 py-2 rounded-lg flex items-center space-x-1 shadow-lg hover:shadow-xl transition-all duration-200"
                      title="Sabitle"
                    >
                      <Pin className="w-3 h-3" />
                      <span>Sabitle</span>
                    </button>
                  </div>
                </div>

                {/* Tertiary Actions (gizlendi) */}
                <div className="hidden">
                  {/* Tertiary Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onAction(prediction, "feature")}
                      className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs px-3 py-2 rounded-lg flex items-center space-x-1 shadow-lg hover:shadow-xl transition-all duration-200"
                      title="Öne Çıkar"
                    >
                      <Star className="w-3 h-3" />
                      <span>Öne Çıkar</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- YENİ BİLEŞEN: DailyPostManagementTab ---
interface DailyPostManagementTabProps {
  posts: DailyPost[];
  loading: boolean;
  onDelete: (id: number) => void;
  onEdit: (post: DailyPost) => void;
}

const DailyPostManagementTab: React.FC<DailyPostManagementTabProps> = ({
  posts,
  loading,
  onDelete,
  onEdit,
}) => {
  if (loading)
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="text-gray-400">Paylaşımlar yükleniyor...</span>
        </div>
      </div>
    );

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-dark-900 rounded-xl p-8 border border-dark-700/60 shadow-2xl">
          <Calendar className="mx-auto h-16 w-16 text-gray-500 mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">
            Henüz paylaşım yok
          </h3>
          <p className="text-gray-500">
            İlk günlük paylaşım eklendikten sonra burada görünecek.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-dark-800 rounded-xl p-6 shadow-2xl border border-dark-600">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gradient">
              Günlük Paylaşımlar
            </h2>
            <p className="text-gray-400 mt-1">
              Toplam {posts.length} paylaşım yönetiliyor
            </p>
          </div>
          <div className="bg-primary-900 text-primary-300 px-3 py-1 rounded-full text-xs font-semibold">
            {posts.length} Paylaşım
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 gap-6">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-dark-800 rounded-xl p-6 shadow-2xl border border-dark-600 group hover:bg-dark-700 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center space-x-3 mb-3">
                  <span className="text-sm font-medium text-gray-500">
                    #{post.id}
                  </span>
                  {post.isFeatured && (
                    <div className="bg-purple-900 text-purple-300 px-3 py-1 rounded-full text-xs font-semibold">
                      Öne Çıkan
                    </div>
                  )}
                  {!post.isPublished && (
                    <div className="bg-red-900 text-red-300 px-3 py-1 rounded-full text-xs font-semibold">
                      Taslak
                    </div>
                  )}
                </div>

                <h3 className="text-xl font-bold text-gray-200 mb-3 group-hover:text-gradient transition-all duration-300">
                  {post.title}
                </h3>

                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {TurkeyTime.format(post.createdAt || "", "time")}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Heart className="w-4 h-4" />
                    <span>{post.likeCount} beğeni</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="w-4 h-4" />
                    <span>{post.commentCount} yorum</span>
                  </div>
                </div>

                {post.imageUrl && (
                  <div className="mt-3">
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="h-24 w-24 rounded-xl object-cover shadow-lg group-hover:shadow-xl transition-all duration-300"
                    />
                  </div>
                )}
              </div>

              {/* Right Actions */}
              <div className="flex flex-col space-y-2 sm:space-y-3">
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <button
                    onClick={() => onDelete(post.id)}
                    className="btn-danger text-xs px-2 sm:px-3 py-1.5 sm:py-2 flex items-center justify-center space-x-1"
                    title="Sil"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span className="hidden sm:inline">Sil</span>
                    <span className="sm:hidden">Sil</span>
                  </button>
                  <button
                    onClick={() => onEdit(post)}
                    className="btn-primary text-xs px-2 sm:px-3 py-1.5 sm:py-2 flex items-center justify-center space-x-1"
                    title="Düzenle"
                  >
                    <Edit className="w-3 h-3" />
                    <span className="hidden sm:inline">Düzenle</span>
                    <span className="sm:hidden">Düzenle</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
