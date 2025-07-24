import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MessageCircle,
  Eye,
  Send,
  Image as ImageIcon,
  X,
  CheckCircle,
  XCircle,
  Info,
  Share2,
  ArrowLeft,
  Calendar,
  Star,
} from "lucide-react";
import {
  predictionsApi,
  commentsApi,
  PredictionDetailDto,
  Comment,
} from "../lib/api";
import { useAuthStore } from "../lib/store";
import {
  formatDate,
  formatNumber,
  TurkeyTime,
  formatTurkeyRelativeTime,
} from "../lib/utils";
import { ReactionPicker, ReactionType } from "../components/ReactionPicker";
import toast from "react-hot-toast";
import { ShareModal } from "../components/ShareModal";
import { ReactionStats } from "../components/ReactionStats";
import { LikersModal } from "../components/LikersModal";
import { RoleBadge } from "../components/RoleBadge";

// Yorum kartı bileşeni
const CommentCard: React.FC<{
  comment: Comment;
  onLike: (id: number) => void;
}> = ({ comment, onLike }) => {
  const { user } = useAuthStore();
  return (
    <div className="flex items-start space-x-4 py-4">
      {comment.user.profileImageUrl ||
      (user && user.id === comment.user.id && user.profileImageUrl) ? (
        <img
          src={
            comment.user.profileImageUrl ||
            (user && user.id === comment.user.id ? user.profileImageUrl : "")
          }
          alt={`${comment.user.firstName} ${comment.user.lastName}`}
          className="h-10 w-10 rounded-full object-cover"
        />
      ) : (
        <img
          src={`https://ui-avatars.com/api/?name=${comment.user.firstName}+${comment.user.lastName}&background=random`}
          alt={`${comment.user.firstName} ${comment.user.lastName}`}
          className="h-10 w-10 rounded-full"
        />
      )}
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold flex items-center space-x-2">
              <span>
                {comment.user.firstName} {comment.user.lastName}
              </span>
              <RoleBadge role={(comment.user as any).role} />
            </p>
            <p className="text-xs text-gray-400">
              {comment.createdAt
                ? TurkeyTime.format(comment.createdAt, "datetime")
                : ""}
            </p>
          </div>
          <button
            onClick={() => onLike(comment.id)}
            className="flex items-center space-x-1 text-gray-500 hover:text-red-500"
          >
            <span className="text-lg">❤️</span>
            <span>{formatNumber(comment.likeCount)}</span>
          </button>
        </div>
        <p className="mt-2 text-gray-700">{comment.content}</p>
        {comment.imageUrl && (
          <img
            src={comment.imageUrl}
            alt="Yorum resmi"
            className="mt-2 rounded-lg max-h-48"
          />
        )}
      </div>
    </div>
  );
};

export const PredictionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const [commentText, setCommentText] = useState("");
  const [commentImage, setCommentImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Reaksiyon durumları
  const [reactionCounts, setReactionCounts] = useState({
    likeCountReaction: 0,
    loveCount: 0,
    laughCount: 0,
    angryCount: 0,
    sadCount: 0,
    wowCount: 0,
  });

  const [userReaction, setUserReaction] = useState<ReactionType | null>(null);

  const [isLikersModalOpen, setIsLikersModalOpen] = useState(false);

  // Fetch prediction details
  const { data: prediction, isLoading } = useQuery({
    queryKey: ["prediction", id],
    queryFn: () => predictionsApi.getById(Number(id!)).then((res) => res.data),
    enabled: !!id,
  });

  // Fetch comments
  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ["prediction-comments", id],
    queryFn: () =>
      commentsApi
        .getPredictionComments(id!, { page: 1, pageSize: 50 })
        .then((res) => res.data),
    enabled: !!id,
  });

  // Like / Reaction mutation
  const likeMutation = useMutation({
    mutationFn: (reactionType: ReactionType) =>
      predictionsApi.like(Number(id!), reactionType),
    onSuccess: (data) => {
      // Reaksiyonlar yenilensin
      fetchLikers();
      toast.success("Reaksiyon gönderildi");
      // Ana sayfa cache'ini de güncelle
      queryClient.invalidateQueries({ queryKey: ["home-predictions"] });
    },
    onError: () => {
      toast.error("Bir hata oluştu.");
    },
  });

  // Comment mutation
  const commentMutation = useMutation({
    mutationFn: (data: { content: string; image?: File }) =>
      commentsApi.addPredictionComment(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prediction-comments", id] });
      setCommentText("");
      setCommentImage(null);
      setImagePreview(null);
      toast.success("Yorumun gönderildi. Admin onayından sonra yayınlanacak.");
    },
    onError: () => {
      toast.error("Yorum gönderilirken bir hata oluştu");
    },
  });

  // Like comment mutation
  const likeCommentMutation = useMutation({
    mutationFn: (commentId: number) => commentsApi.like(commentId, 1), // Type 1 for comment like
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prediction-comments", id] });
    },
  });

  const comments = commentsData?.comments || [];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        // 2MB
        toast.error("Resim boyutu 2MB'dan küçük olmalı");
        return;
      }
      setCommentImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) {
      toast.error("Yorum metni boş olamaz");
      return;
    }
    commentMutation.mutate({
      content: commentText,
      image: commentImage || undefined,
    });
  };

  const handleReaction = (reactionType: ReactionType) => {
    likeMutation.mutate(reactionType);
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  // Beğenenleri çek
  const fetchLikers = React.useCallback(() => {
    if (!id) return Promise.resolve();
    return predictionsApi.getLikers(Number(id)).then((data: any) => {
      const counts = {
        likeCountReaction: data.likeCount || 0,
        loveCount: data.loveCount || 0,
        laughCount: data.laughCount || 0,
        angryCount: data.angryCount || 0,
        sadCount: data.sadCount || 0,
        wowCount: data.wowCount || 0,
      };
      setReactionCounts(counts);
      // Kullanıcının reaksiyonu (varsa)
      const myLike = data.likers.find((l: any) => l.userId === user?.id);
      setUserReaction(myLike ? (myLike.likeType as ReactionType) : null);
      return data;
    });
  }, [id, user?.id]);

  // İlk render + prediction değişiminde liker'ları çek
  React.useEffect(() => {
    fetchLikers();
  }, [fetchLikers]);

  const totalReactions = Object.values(reactionCounts).reduce(
    (acc: number, val: any) => acc + (val as number),
    0
  );

  const handleLikeCountClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (totalReactions > 0) {
      setIsLikersModalOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-200">Tahmin bulunamadı</h3>
        <p className="text-gray-500 mt-2">
          Bu tahmin mevcut değil veya silinmiş olabilir.
        </p>
        <button onClick={() => navigate(-1)} className="mt-4 btn-primary">
          Geri Dön
        </button>
      </div>
    );
  }

  const isResultAvailable = typeof prediction.isCorrect === "boolean";

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center space-x-2 text-gray-400 hover:text-gray-200 transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
        <span>Geri</span>
      </button>

      {/* Prediction Content */}
      <div className="card p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-3">
            {prediction.user.profileImageUrl ? (
              <img
                src={prediction.user.profileImageUrl}
                alt={prediction.user.firstName}
                className="h-12 w-12 rounded-full object-cover"
                onError={(e) => {
                  // Resim yüklenemezse fallback'e geç
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  target.nextElementSibling?.classList.remove("hidden");
                }}
              />
            ) : null}
            <div
              className={`h-12 w-12 bg-gradient-to-r from-secondary-600 to-blue-600 rounded-full flex items-center justify-center ${
                prediction.user.profileImageUrl ? "hidden" : ""
              }`}
            >
              <span className="text-white font-medium">
                {prediction.user.firstName?.[0]}
                {prediction.user.lastName?.[0]}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <p className="font-semibold text-gray-200 flex items-center space-x-2">
                <span>
                  {prediction.user.firstName} {prediction.user.lastName}
                </span>
                <RoleBadge role={prediction.user.role as any} />
              </p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              <span>
                {formatTurkeyRelativeTime(prediction.createdAt)} •{" "}
                {TurkeyTime.format(prediction.createdAt, "datetime")}
              </span>
            </div>
          </div>
          {prediction.isFeatured && (
            <div className="badge-warning">
              <Star className="h-4 w-4 fill-current mr-1" />
              Öne Çıkan
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gradient mb-2">
          {prediction.title}
        </h1>

        {/* Image */}
        {prediction.imageUrls && prediction.imageUrls.length > 0 && (
          <div className="mb-6 rounded-xl overflow-hidden">
            <img
              src={prediction.imageUrls[0]}
              alt={prediction.title}
              className="w-full h-auto object-contain max-h-[80vh] mx-auto"
            />
          </div>
        )}

        {/* Content */}
        <div
          className="prose max-w-none text-gray-300 mb-6 leading-relaxed break-words"
          dangerouslySetInnerHTML={{ __html: prediction.content }}
        />

        {/* Sonuç */}
        {isResultAvailable && (
          <div
            className={`p-4 rounded-lg mb-6 flex items-start space-x-3 ${
              prediction.isCorrect
                ? "bg-green-50 text-green-900"
                : "bg-red-50 text-red-900"
            }`}
          >
            {prediction.isCorrect ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : (
              <XCircle className="h-6 w-6 text-red-500" />
            )}
            <div>
              <h3 className="font-bold">
                Tahmin Sonucu: {prediction.isCorrect ? "Başarılı" : "Başarısız"}
              </h3>
              {prediction.resultNote && (
                <p className="text-sm mt-1">{prediction.resultNote}</p>
              )}
            </div>
          </div>
        )}

        {/* Reaction Stats */}
        <div className="mb-4">
          <ReactionStats
            likeCountReaction={reactionCounts.likeCountReaction}
            loveCount={reactionCounts.loveCount}
            laughCount={reactionCounts.laughCount}
            angryCount={reactionCounts.angryCount}
            sadCount={reactionCounts.sadCount}
            wowCount={reactionCounts.wowCount}
            onClick={handleLikeCountClick}
          />
        </div>

        {/* Stats & Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-dark-700/50">
          <div className="flex items-center space-x-6">
            <ReactionPicker
              onReact={handleReaction}
              currentReaction={userReaction}
            />
            <div className="flex items-center space-x-2 text-gray-500">
              <MessageCircle className="h-5 w-5" />
              <span className="font-medium">
                {formatNumber(prediction.commentCount)}
              </span>
            </div>
            <button
              onClick={handleShare}
              className="flex items-center space-x-2 text-gray-500 hover:text-green-400 transition-colors"
            >
              <Share2 className="h-5 w-5" />
              <span>Paylaş</span>
            </button>
          </div>
          <div className="flex items-center space-x-2 text-gray-500">
            <Eye className="h-5 w-5" />
            <span>{formatNumber(prediction.viewCount)}</span>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="card p-6">
        <h2 className="text-2xl font-bold text-gray-200 mb-6">
          {comments.length} Yorum
        </h2>
        {/* Comment Form */}
        {isAuthenticated ? (
          <form onSubmit={handleSubmitComment} className="mb-6 space-y-4">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="input-field w-full"
              placeholder="Yorumunuzu buraya yazın..."
              rows={3}
            />
            <div className="flex items-center justify-between">
              <label className="cursor-pointer p-2 rounded-full hover:bg-gray-700/50 transition-colors">
                <ImageIcon className="h-5 w-5 text-gray-400" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
              <button
                type="submit"
                className="btn-primary flex items-center space-x-2"
                disabled={commentMutation.isPending}
              >
                <Send className="h-4 w-4" />
                <span>
                  {commentMutation.isPending ? "Gönderiliyor..." : "Gönder"}
                </span>
              </button>
            </div>
            {imagePreview && (
              <div className="relative w-32">
                <img
                  src={imagePreview}
                  alt="Yorum önizleme"
                  className="rounded-lg h-24 w-24 object-cover"
                />
                <button
                  onClick={() => {
                    setImagePreview(null);
                    setCommentImage(null);
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </form>
        ) : (
          <div className="text-center p-4 border border-gray-600 rounded-lg bg-dark-700/30 mb-6">
            <p className="text-gray-300">
              Yorum yapmak için{" "}
              <Link
                to="/login"
                className="text-primary-400 font-semibold hover:text-primary-300 transition-colors"
              >
                giriş yapmanız
              </Link>{" "}
              gerekmektedir.
            </p>
          </div>
        )}
        {/* Comments List */}
        <div className="divide-y">
          {commentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            </div>
          ) : comments.length > 0 ? (
            comments.map((comment: Comment) => (
              <div key={comment.id} className="py-4">
                <div className="flex items-start space-x-4">
                  {comment.user.profileImageUrl ? (
                    <img
                      src={comment.user.profileImageUrl}
                      alt={comment.user.firstName}
                      className="h-10 w-10 rounded-full object-cover"
                      onError={(e) => {
                        // Resim yüklenemezse fallback'e geç
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        target.nextElementSibling?.classList.remove("hidden");
                      }}
                    />
                  ) : null}
                  <div
                    className={`h-10 w-10 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-full flex items-center justify-center ${
                      comment.user.profileImageUrl ? "hidden" : ""
                    }`}
                  >
                    <span className="text-white font-semibold text-sm">
                      {comment.user.firstName?.[0]}
                      {comment.user.lastName?.[0]}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-200 flex items-center space-x-2">
                          <span>
                            {comment.user.firstName} {comment.user.lastName}
                          </span>
                          <RoleBadge role={(comment.user as any).role} />
                        </p>
                        <p className="text-xs text-gray-500">
                          {comment.createdAt
                            ? TurkeyTime.format(comment.createdAt, "datetime")
                            : ""}
                        </p>
                      </div>
                      <button
                        onClick={() => likeCommentMutation.mutate(comment.id)}
                        className="flex items-center space-x-1 text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <span className="text-lg">❤️</span>
                        <span>{formatNumber(comment.likeCount)}</span>
                      </button>
                    </div>
                    <p className="mt-2 text-gray-300">{comment.content}</p>
                    {comment.imageUrl && (
                      <img
                        src={comment.imageUrl}
                        alt="Yorum resmi"
                        className="mt-2 rounded-lg max-h-48 object-cover"
                      />
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Henüz hiç yorum yapılmamış.</p>
            </div>
          )}
        </div>
      </div>

      {/* Likers Modal */}
      <LikersModal
        isOpen={isLikersModalOpen}
        onClose={() => setIsLikersModalOpen(false)}
        contentType="prediction"
        contentId={prediction.id}
        contentTitle={prediction.title}
        onFetchLikers={(_contentType: string, _contentId: number) =>
          predictionsApi.getLikers(Number(id!))
        }
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        url={window.location.href}
        text={prediction.title}
      />
    </div>
  );
};
