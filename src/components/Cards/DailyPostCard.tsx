import React, { useEffect, useState } from "react";
import { MessageCircle, Share2, Eye, Star, Heart, Crown } from "lucide-react";
import {
  DailyPost,
  commentsApi,
  Comment,
  dailyPostsApi,
  LikersResponse,
} from "../../lib/api";
import {
  formatNumber,
  truncateText,
  formatTurkeyRelativeTime,
  TurkeyTime,
} from "../../lib/utils";
import { ReactionPicker, ReactionType } from "../ReactionPicker";
import { LikersModal } from "../LikersModal";
import { ReactionStats } from "../ReactionStats";
import { useAuthStore } from "../../lib/store";
import { RoleBadge } from "../RoleBadge";
import { useUserProfile } from "../../hooks/useUserProfile";

interface DailyPostCardProps {
  post: DailyPost;
  onLike?: (id: number, reactionType: ReactionType) => void;
  onComment?: (id: number) => void;
  onShare?: (id: number) => void;
  onClick?: (id: number) => void;
  currentUserReaction?: ReactionType | null;
}

export const DailyPostCard: React.FC<DailyPostCardProps> = ({
  post,
  onLike,
  onComment,
  onShare,
  onClick,
  currentUserReaction,
}) => {
  const { user } = useAuthStore();
  const [isLikersModalOpen, setIsLikersModalOpen] = useState(false);
  const [recentComments, setRecentComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  // Kullanıcı bilgilerini al - DailyPost'ta adminName ve adminProfileImageUrl var
  const postUser = {
    firstName: post.adminName?.split(" ")[0] || "Admin",
    lastName: post.adminName?.split(" ").slice(1).join(" ") || "",
    profileImageUrl: post.adminProfileImageUrl,
  };
  const [reactionCounts, setReactionCounts] = useState({
    totalLikes: post.totalLikes || post.likeCount,
    likeCountReaction: post.likeCountReaction || 0,
    loveCount: post.loveCount || 0,
    laughCount: post.laughCount || 0,
    angryCount: post.angryCount || 0,
    sadCount: post.sadCount || 0,
    wowCount: post.wowCount || 0,
  });
  const [userReaction, setUserReaction] = useState<ReactionType | null>(
    currentUserReaction ?? null
  );

  // Son 3 yorumu çek
  useEffect(() => {
    const fetchRecentComments = async () => {
      try {
        setCommentsLoading(true);
        const response = await commentsApi.getDailyPostComments(
          post.id.toString(),
          { page: 1, pageSize: 3, orderBy: "createdAt", orderDirection: "desc" }
        );
        setRecentComments(response.data.comments || []);
      } catch (error) {
        // hata logu kaldırıldı
      } finally {
        setCommentsLoading(false);
      }
    };

    if (post.commentCount > 0) {
      fetchRecentComments();
    }
  }, [post.id, post.commentCount]);

  useEffect(() => {
    if (post.likeCount > 0) {
      dailyPostsApi
        .getLikers(post.id)
        .then((data) => {
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

          setReactionCounts({
            totalLikes: data.totalLikes,
            ...counts,
          });

          const userLike = data.likers.find((l: any) => l.userId === user?.id);
          setUserReaction(
            userLike ? (userLike.likeType as ReactionType) : null
          );
        })
        .catch(() => {});
    }
  }, [post.id, post.likeCount]);

  const handleReaction = (reactionType: ReactionType) => {
    onLike?.(post.id, reactionType);
  };

  const handleClick = () => {
    onClick?.(post.id);
  };

  const handleCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(post.id); // Yorum kısmına tıklayınca da detaya git
  };

  const totalReactions = Object.values(reactionCounts).reduce(
    (a, b) => a + (b as number),
    0
  );

  const handleLikeCountClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (totalReactions > 0) {
      setIsLikersModalOpen(true);
    }
  };

  // Beğenenleri getir
  const fetchLikers = async (
    contentType: string,
    contentId: number
  ): Promise<any> => {
    if (contentType === "dailypost") {
      return await dailyPostsApi.getLikers(contentId);
    }
    throw new Error("Desteklenmeyen içerik türü");
  };

  return (
    <>
      <div
        className="w-full card p-6 hover:shadow-xl transition-all duration-300 cursor-pointer group"
        onClick={handleClick}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {/* Kullanıcı profil resmi - önce cache'den, sonra API'den gelen bilgileri kontrol et */}
            {postUser?.profileImageUrl || post.adminProfileImageUrl ? (
              <img
                src={postUser?.profileImageUrl || post.adminProfileImageUrl}
                alt={
                  postUser
                    ? `${postUser.firstName} ${postUser.lastName}`
                    : post.adminName
                }
                className="w-10 h-10 rounded-full object-cover"
                onError={(e) => {
                  // Resim yüklenemezse fallback'e geç
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  target.nextElementSibling?.classList.remove("hidden");
                }}
              />
            ) : null}
            <div
              className={`w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white font-bold ${
                postUser?.profileImageUrl || post.adminProfileImageUrl
                  ? "hidden"
                  : ""
              }`}
            >
              {(postUser
                ? `${postUser.firstName} ${postUser.lastName}`
                : post.adminName)?.[0]?.toUpperCase() || "A"}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  {postUser
                    ? `${postUser.firstName} ${postUser.lastName}`
                    : post.adminName || "Admin"}
                </h4>
              </div>
              <p className="text-xs text-gray-400">
                {formatTurkeyRelativeTime(post.createdAt)} •{" "}
                {TurkeyTime.format(post.createdAt!, "datetime")}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {post.isFeatured && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                <Star className="w-3 h-3 mr-1" />
                Öne Çıkan
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
            {post.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 line-clamp-3 text-sm leading-relaxed break-words">
            {truncateText(post.content || post.shortContent || "", 150)}
          </p>
        </div>

        {/* Image */}
        {post.imageUrl && (
          <div className="mb-4 rounded-xl overflow-hidden">
            <img
              src={post.imageUrl}
              alt={post.title}
              className="w-full max-h-[70vh] object-contain group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}

        {/* Tags */}
        {post.tagList && post.tagList.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {post.tagList.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
              >
                #{tag}
              </span>
            ))}
            {post.tagList.length > 3 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                +{post.tagList.length - 3} etiket daha
              </span>
            )}
          </div>
        )}

        {/* Recent Comments */}
        {post.commentCount > 0 && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-dark-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Son Yorumlar
              </span>
              {post.commentCount > 3 && (
                <button
                  onClick={handleCommentClick}
                  className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400"
                >
                  +{post.commentCount - 3} yorumu daha gör
                </button>
              )}
            </div>

            {!commentsLoading ? (
              <div className="space-y-2">
                {recentComments.slice(0, 3).map((comment) => (
                  <div key={comment.id} className="text-xs">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {comment.user.firstName} {comment.user.lastName}:
                    </span>{" "}
                    <span className="text-gray-600 dark:text-gray-400">
                      {truncateText(comment.content, 80)}
                    </span>
                  </div>
                ))}

                {post.commentCount > 3 && (
                  <div
                    className="text-xs text-secondary-400 hover:text-secondary-300 cursor-pointer transition-colors"
                    onClick={handleCommentClick}
                  >
                    +{post.commentCount - 3} yorumu daha gör
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-gray-500">
                Yorumlar yükleniyor...
              </div>
            )}
          </div>
        )}

        {/* Reaction Stats */}
        {totalReactions > 0 && (
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
        )}

        {/* Stats & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-dark-700/50 space-y-3 sm:space-y-0">
          <div className="flex items-center justify-between sm:justify-start space-x-4 sm:space-x-6">
            <ReactionPicker
              onReact={handleReaction}
              currentReaction={userReaction}
              className="z-10"
            />

            <button
              onClick={handleCommentClick}
              className="flex items-center space-x-2 text-sm text-gray-500 hover:text-blue-400 transition-colors group/comment"
            >
              <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 group-hover/comment:scale-110 transition-transform" />
              <span className="font-medium text-xs sm:text-sm">
                {formatNumber(post.commentCount)}
              </span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onShare?.(post.id);
                // Share fonksiyonu
                navigator
                  .share?.({
                    title: post.title,
                    text: truncateText(
                      post.content || post.shortContent || "",
                      100
                    ),
                    url: window.location.origin + `/daily-post/${post.id}`,
                  })
                  .catch(() => {
                    // Fallback: clipboard'a kopyala
                    navigator.clipboard.writeText(
                      window.location.origin + `/daily-post/${post.id}`
                    );
                  });
              }}
              className="flex items-center space-x-2 text-sm text-gray-500 hover:text-green-400 transition-colors"
            >
              <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-xs sm:text-sm">Paylaş</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-xs sm:text-sm">
              {formatNumber(post.viewCount)}
            </span>
          </div>
        </div>
      </div>

      {/* Likers Modal */}
      <LikersModal
        isOpen={isLikersModalOpen}
        onClose={() => setIsLikersModalOpen(false)}
        contentType="dailypost"
        contentId={post.id}
        contentTitle={post.title}
        onFetchLikers={fetchLikers}
      />
    </>
  );
};
