import React, { useEffect, useState } from "react";
import { MessageCircle, Share2, Eye, Crown, Heart } from "lucide-react";
import {
  PredictionListDto,
  commentsApi,
  Comment,
  predictionsApi,
  LikersResponse,
} from "../../lib/api";
import {
  formatNumber,
  truncateText,
  formatTurkeyRelativeTime,
} from "../../lib/utils";
import { ReactionPicker, ReactionType } from "../ReactionPicker";
import { LikersModal } from "../LikersModal";
import { ReactionStats } from "../ReactionStats";
import { useAuthStore } from "../../lib/store";
import { TurkeyTime } from "../../lib/utils";
import { RoleBadge } from "../RoleBadge";
import { useUserProfile } from "../../hooks/useUserProfile";

interface PredictionCardProps {
  prediction: PredictionListDto;
  onLike?: (predictionId: number, reactionType: ReactionType) => void;
  onClick?: (prediction: PredictionListDto) => void;
  currentUserReaction?: ReactionType | null;
}

export const PredictionCard: React.FC<PredictionCardProps> = ({
  prediction,
  onLike,
  onClick,
  currentUserReaction,
}) => {
  const { user } = useAuthStore();
  const [isLikersModalOpen, setIsLikersModalOpen] = useState(false);
  const [recentComments, setRecentComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  // Kullanıcı bilgilerini al - cache'den direkt al, hook kullanma
  const predictionUser = prediction.user || null;
  const [reactionCounts, setReactionCounts] = useState({
    totalLikes: prediction.totalLikes || prediction.likeCount,
    likeCountReaction: prediction.likeCountReaction || 0,
    loveCount: prediction.loveCount || 0,
    laughCount: prediction.laughCount || 0,
    angryCount: prediction.angryCount || 0,
    sadCount: prediction.sadCount || 0,
    wowCount: prediction.wowCount || 0,
  });
  const [userReaction, setUserReaction] = useState<ReactionType | null>(
    currentUserReaction ?? null
  );

  // Son 3 yorumu çek
  useEffect(() => {
    const fetchRecentComments = async () => {
      try {
        setCommentsLoading(true);
        const response = await commentsApi.getPredictionComments(
          prediction.id.toString(),
          { page: 1, pageSize: 3, orderBy: "createdAt", orderDirection: "desc" }
        );
        setRecentComments(response.data.comments || []);
      } catch (error) {
        // hata logu kaldırıldı
      } finally {
        setCommentsLoading(false);
      }
    };

    if (prediction.commentCount > 0) {
      fetchRecentComments();
    }
  }, [prediction.id, prediction.commentCount]);

  // Reaksiyon dağılımını çek
  useEffect(() => {
    if (prediction.likeCount > 0) {
      predictionsApi
        .getLikers(prediction.id)
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
        .catch(() => {
          /* ignore */
        });
    }
  }, [prediction.id, prediction.likeCount]);

  const handleReaction = (reactionType: ReactionType) => {
    onLike?.(prediction.id, reactionType);
  };

  const handleClick = () => {
    onClick?.(prediction);
  };

  const handleCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(prediction); // Yorum kısmına tıklayınca da detaya git
  };

  const handleLikeCountClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (prediction.likeCount > 0) {
      setIsLikersModalOpen(true);
    }
  };

  // Beğenenleri getir
  const fetchLikers = async (
    contentType: string,
    contentId: number
  ): Promise<any> => {
    if (contentType === "prediction") {
      return await predictionsApi.getLikers(contentId);
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
            {predictionUser?.profileImageUrl ||
            prediction.userProfileImageUrl ? (
              <img
                src={
                  predictionUser?.profileImageUrl ||
                  prediction.userProfileImageUrl
                }
                alt={
                  predictionUser
                    ? `${predictionUser.firstName} ${predictionUser.lastName}`
                    : prediction.userName
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
              className={`w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold ${
                predictionUser?.profileImageUrl ||
                prediction.userProfileImageUrl
                  ? "hidden"
                  : ""
              }`}
            >
              {(predictionUser
                ? `${predictionUser.firstName} ${predictionUser.lastName}`
                : prediction.userName)?.[0]?.toUpperCase() || "A"}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  {predictionUser
                    ? `${predictionUser.firstName} ${predictionUser.lastName}`
                    : prediction.userName || "Admin"}
                </h4>

                {predictionUser?.isBlocked && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                    Bloklu
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">
                {formatTurkeyRelativeTime(prediction.createdAt)} •{" "}
                {TurkeyTime.format(prediction.createdAt, "datetime")}
                {predictionUser?.createdAt && (
                  <span>
                    {" "}
                    •{" "}
                    {new Date(predictionUser.createdAt).toLocaleDateString(
                      "tr-TR"
                    )}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {prediction.isPaid && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                <Crown className="w-3 h-3 mr-1" />
                VIP
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
            {prediction.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 line-clamp-3 text-sm leading-relaxed break-words">
            {truncateText(prediction.content, 150)}
          </p>
        </div>

        {/* Image */}
        {prediction.firstImageUrl && (
          <div className="mb-4 rounded-xl overflow-hidden">
            <img
              src={prediction.firstImageUrl}
              alt={prediction.title}
              className="w-full max-h-[70vh] object-contain group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}

        {/* Recent Comments */}
        {prediction.commentCount > 0 && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-dark-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Son Yorumlar
              </span>
              {prediction.commentCount > 3 && (
                <button
                  onClick={handleCommentClick}
                  className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400"
                >
                  +{prediction.commentCount - 3} yorumu daha gör
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

                {prediction.commentCount > 3 && (
                  <div
                    className="text-xs text-secondary-400 hover:text-secondary-300 cursor-pointer transition-colors"
                    onClick={handleCommentClick}
                  >
                    +{prediction.commentCount - 3} yorumu daha gör
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
        {(prediction.totalLikes || prediction.likeCount) > 0 && (
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
          <div className="flex items-center justify-between sm:justify-start space-x-4 sm:space-x-6 text-gray-500">
            <ReactionPicker
              onReact={handleReaction}
              currentReaction={userReaction}
              className="z-10"
            />

            <div
              className="flex items-center space-x-2 text-sm hover:text-blue-400 transition-colors cursor-pointer"
              onClick={handleCommentClick}
            >
              <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="font-medium text-xs sm:text-sm">
                {formatNumber(prediction.commentCount)}
              </span>
            </div>

            <div
              className="flex items-center space-x-2 text-sm hover:text-green-400 transition-colors cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                // Share fonksiyonu
                navigator
                  .share?.({
                    title: prediction.title,
                    text: truncateText(prediction.content, 100),
                    url:
                      window.location.origin + `/prediction/${prediction.id}`,
                  })
                  .catch(() => {
                    // Fallback: clipboard'a kopyala
                    navigator.clipboard.writeText(
                      window.location.origin + `/prediction/${prediction.id}`
                    );
                  });
              }}
            >
              <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-xs sm:text-sm">Paylaş</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Eye className="h-4 w-4" />
            <span className="text-xs sm:text-sm">
              {formatNumber(prediction.viewCount)}
            </span>
          </div>
        </div>
      </div>

      {/* Likers Modal */}
      <LikersModal
        isOpen={isLikersModalOpen}
        onClose={() => setIsLikersModalOpen(false)}
        contentType="prediction"
        contentId={prediction.id}
        contentTitle={prediction.title}
        onFetchLikers={fetchLikers}
      />
    </>
  );
};
