import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dailyPostsApi, commentsApi } from "../lib/api";
import { useAuthStore } from "../lib/store";
import { ReactionPicker, ReactionType } from "../components/ReactionPicker";
import {
  ArrowLeft,
  MessageCircle,
  Share2,
  Eye,
  Star,
  Calendar,
  User,
  Send,
  Image as ImageIcon,
  X,
} from "lucide-react";
import {
  formatDate,
  formatNumber,
  cn,
  TurkeyTime,
  formatTurkeyRelativeTime,
} from "../lib/utils";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { ShareModal } from "../components/ShareModal";
import { ReactionStats } from "../components/ReactionStats";
import { LikersModal } from "../components/LikersModal";
import { RoleBadge } from "../components/RoleBadge";

export const DailyPostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [commentContent, setCommentContent] = useState("");
  const [commentImage, setCommentImage] = useState<File | null>(null);
  const [commentImagePreview, setCommentImagePreview] = useState<string | null>(
    null
  );
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Fetch daily post
  const {
    data: postData,
    isLoading: postLoading,
    error: postError,
  } = useQuery({
    queryKey: ["daily-post", id],
    queryFn: () => dailyPostsApi.getById(Number(id)),
    enabled: !!id,
  });

  // Fetch comments
  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ["daily-post-comments", id],
    queryFn: () =>
      commentsApi.getDailyPostComments(id as string, { page: 1, pageSize: 50 }),
    enabled: !!id,
  });

  // Like mutation with ReactionType
  const likeMutation = useMutation({
    mutationFn: (reactionType: ReactionType) =>
      dailyPostsApi.like(Number(id), reactionType),
    onSuccess: () => {
      toast.success("Reaksiyon gönderildi");
      queryClient.invalidateQueries({ queryKey: ["daily-post", id] });
      // Ana sayfa cache'ini de güncelle
      queryClient.invalidateQueries({ queryKey: ["home-daily-posts"] });
    },
    onError: () => {
      toast.error("Bir hata oluştu");
    },
  });

  // Comment mutation
  const commentMutation = useMutation({
    mutationFn: (data: { content: string; image?: File }) =>
      commentsApi.addDailyPostComment(id as string, data),
    onSuccess: () => {
      toast.success("Yorum eklendi");
      setCommentContent("");
      setCommentImage(null);
      setCommentImagePreview(null);
      queryClient.invalidateQueries({ queryKey: ["daily-post-comments", id] });
    },
    onError: () => {
      toast.error("Yorum eklenirken hata oluştu");
    },
  });

  // Comment like mutation
  const commentLikeMutation = useMutation({
    mutationFn: ({ commentId, type }: { commentId: number; type: number }) =>
      commentsApi.like(commentId, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-post-comments", id] });
    },
    onError: () => {
      toast.error("Bir hata oluştu");
    },
  });

  const post = postData?.data;
  const comments = commentsData?.data?.comments || [];

  const [reactionCounts, setReactionCounts] = useState({
    likeCountReaction: postData?.data.likeCountReaction || 0,
    loveCount: postData?.data.loveCount || 0,
    laughCount: postData?.data.laughCount || 0,
    angryCount: postData?.data.angryCount || 0,
    sadCount: postData?.data.sadCount || 0,
    wowCount: postData?.data.wowCount || 0,
  });
  const [userReaction, setUserReaction] = useState<ReactionType | null>(
    post?.isLikedByCurrentUser ? ReactionType.Love : null
  );

  const totalReactions = Object.values(reactionCounts).reduce(
    (acc: number, val: any) => acc + (val as number),
    0
  );

  const [isLikersModalOpen, setIsLikersModalOpen] = useState(false);

  const handleLikeCountClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (totalReactions > 0) setIsLikersModalOpen(true);
  };

  // fetch liker stats
  React.useEffect(() => {
    if (!id) return;
    dailyPostsApi.getLikers(Number(id)).then((data: any) => {
      let counts: any;
      if (typeof data.likeCount === "number") {
        counts = {
          likeCountReaction: data.likeCount,
          loveCount: data.loveCount,
          laughCount: data.laughCount,
          angryCount: data.angryCount,
          sadCount: data.sadCount,
          wowCount: data.wowCount,
        };
      } else {
        counts = {
          likeCountReaction: 0,
          loveCount: 0,
          laughCount: 0,
          angryCount: 0,
          sadCount: 0,
          wowCount: 0,
        };
        data.likers.forEach((l: any) => {
          switch (l.likeType) {
            case 1:
              counts.likeCountReaction++;
              break;
            case 2:
              counts.loveCount++;
              break;
            case 3:
              counts.laughCount++;
              break;
            case 4:
              counts.angryCount++;
              break;
            case 5:
              counts.sadCount++;
              break;
            case 6:
              counts.wowCount++;
              break;
          }
        });
      }
      setReactionCounts(counts);
      const ul = data.likers.find((l: any) => l.userId === user?.id);
      if (ul) setUserReaction(ul.likeType);
    });
  }, [id]);

  const handleReaction = (reactionType: ReactionType) => {
    likeMutation.mutate(reactionType);
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const handleCommentImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Resim boyutu 5MB'dan küçük olmalı");
        return;
      }
      setCommentImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setCommentImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitComment = () => {
    if (!commentContent.trim()) {
      toast.error("Yorum içeriği boş olamaz");
      return;
    }

    commentMutation.mutate({
      content: commentContent,
      image: commentImage || undefined,
    });
  };

  const handleCommentLike = (commentId: number) => {
    commentLikeMutation.mutate({ commentId, type: 2 });
  };

  if (postLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (postError || !post) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-200">
          Paylaşım bulunamadı
        </h3>
        <p className="text-gray-500 mt-2">
          Bu paylaşım mevcut değil veya silinmiş olabilir.
        </p>
        <button onClick={() => navigate(-1)} className="mt-4 btn-primary">
          Geri Dön
        </button>
      </div>
    );
  }

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

      {/* Post Content */}
      <div className="card p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-3">
            {post.adminProfileImageUrl ? (
              <img
                src={post.adminProfileImageUrl}
                alt={post.adminName}
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
                post.adminProfileImageUrl ? "hidden" : ""
              }`}
            >
              <span className="text-white font-medium">
                {post.adminName
                  .split(" ")
                  .map((n: string) => n.charAt(0))
                  .join("")}
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <p className="font-semibold text-gray-200 flex items-center space-x-2">
                  <span>{post.adminName}</span>
                </p>
                {/* Static Admin rozetini kaldırdık; RoleBadge zaten gösteriyor */}
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                <span>
                  {formatTurkeyRelativeTime(post.createdAt)} •{" "}
                  {TurkeyTime.format(post.createdAt, "datetime")}
                </span>
              </div>
            </div>
          </div>

          {post.isFeatured && (
            <div className="badge-warning">
              <Star className="h-4 w-4 fill-current mr-1" />
              Öne Çıkan
            </div>
          )}
        </div>

        {/* Title & Category */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gradient mb-2">
            {post.title}
          </h1>
          <div className="badge-primary inline-block">{post.category}</div>
        </div>

        {/* Image */}
        {post.imageUrl && (
          <div className="mb-6 rounded-xl overflow-hidden">
            <img
              src={post.imageUrl}
              alt={post.title}
              className="w-full h-auto object-contain max-h-[80vh] mx-auto"
            />
          </div>
        )}

        {/* Content */}
        <div
          className="prose max-w-none text-gray-300 mb-6 leading-relaxed break-words"
          dangerouslySetInnerHTML={{
            __html: post.content || post.shortContent || "",
          }}
        />

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
                {formatNumber(post.commentCount)}
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
            <span>{formatNumber(post.viewCount)}</span>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="card p-6">
        <h2 className="text-2xl font-bold text-gray-200 mb-6">
          {comments.length} Yorum
        </h2>

        {/* Comment Form */}
        {user ? (
          <div className="mb-6 space-y-4">
            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
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
                  onChange={handleCommentImageUpload}
                />
              </label>

              <button
                onClick={handleSubmitComment}
                disabled={commentMutation.isPending}
                className="btn-primary flex items-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>
                  {commentMutation.isPending ? "Gönderiliyor..." : "Gönder"}
                </span>
              </button>
            </div>

            {commentImagePreview && (
              <div className="relative w-32">
                <img
                  src={commentImagePreview}
                  alt="Yorum önizleme"
                  className="rounded-lg h-24 w-24 object-cover"
                />
                <button
                  onClick={() => {
                    setCommentImagePreview(null);
                    setCommentImage(null);
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
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
        <div className="divide-y divide-gray-700">
          {commentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            </div>
          ) : comments.length > 0 ? (
            comments.map((comment: any) => (
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
                          {TurkeyTime.format(comment.createdAt, "datetime")}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCommentLike(comment.id)}
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
        contentType="dailypost"
        contentId={post.id}
        contentTitle={post.title}
        onFetchLikers={() => dailyPostsApi.getLikers(post.id)}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        url={window.location.href}
        text={post.title}
      />
    </div>
  );
};
