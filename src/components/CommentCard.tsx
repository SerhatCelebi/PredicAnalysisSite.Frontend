import React from "react";
import { Crown, UserX } from "lucide-react";
import { Comment } from "../lib/api";
import { formatTurkeyRelativeTime, TurkeyTime } from "../lib/utils";
import { useUserProfile } from "../hooks/useUserProfile";

interface CommentCardProps {
  comment: Comment;
  onLike?: (commentId: number) => void;
  onReply?: (commentId: number) => void;
  showUserInfo?: boolean;
}

export const CommentCard: React.FC<CommentCardProps> = ({
  comment,
  onLike,
  onReply,
  showUserInfo = true,
}) => {
  // Kullanıcı bilgilerini al - comment.user objesi zaten mevcut
  const commentUser = comment.user;

  return (
    <div className="bg-white dark:bg-dark-800 rounded-lg p-4 mb-3 shadow-sm border border-gray-200 dark:border-dark-700">
      {showUserInfo && (
        <div className="flex items-center space-x-3 mb-3">
          {/* Kullanıcı profil resmi */}
          {commentUser?.profileImageUrl || comment.user.profileImageUrl ? (
            <img
              src={commentUser?.profileImageUrl || comment.user.profileImageUrl}
              alt={`${comment.user.firstName} ${comment.user.lastName}`}
              className="w-8 h-8 rounded-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                target.nextElementSibling?.classList.remove("hidden");
              }}
            />
          ) : null}
          <div
            className={`w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold ${
              commentUser?.profileImageUrl || comment.user.profileImageUrl
                ? "hidden"
                : ""
            }`}
          >
            {(commentUser
              ? `${commentUser.firstName} ${commentUser.lastName}`
              : `${comment.user.firstName} ${comment.user.lastName}`)?.[0]?.toUpperCase() ||
              "U"}
          </div>

          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                {commentUser
                  ? `${commentUser.firstName} ${commentUser.lastName}`
                  : `${comment.user.firstName} ${comment.user.lastName}`}
              </span>

              {/* VIP ve Blok durumu */}
              {(commentUser?.isVipActive || comment.user.isVipActive) && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                  <Crown className="w-3 h-3 mr-1" />
                  VIP
                </span>
              )}

              {(commentUser?.isBlocked || comment.user.isBlocked) && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                  <UserX className="w-3 h-3 mr-1" />
                  Bloklu
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span>{formatTurkeyRelativeTime(comment.createdAt!)}</span>
              <span>•</span>
              <span>{TurkeyTime.format(comment.createdAt!, "datetime")}</span>
              {(commentUser?.createdAt || comment.user.createdAt) && (
                <>
                  <span>•</span>
                  <span>
                    Kayıt:{" "}
                    {new Date(
                      commentUser?.createdAt || comment.user.createdAt!
                    ).toLocaleDateString("tr-TR")}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Yorum içeriği */}
      <div className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed">
        {comment.content}
      </div>

      {/* Yorum resmi varsa */}
      {comment.imageUrl && (
        <div className="mt-3 rounded-lg overflow-hidden">
          <img
            src={comment.imageUrl}
            alt="Yorum resmi"
            className="w-full max-h-64 object-contain"
          />
        </div>
      )}

      {/* Yorum aksiyonları */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-dark-700">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <button
            onClick={() => onLike?.(comment.id)}
            className={`flex items-center space-x-1 hover:text-blue-500 transition-colors ${
              comment.isLikedByCurrentUser ? "text-blue-500" : ""
            }`}
          >
            <span>👍</span>
            <span>{comment.likeCount}</span>
          </button>

          <button
            onClick={() => onReply?.(comment.id)}
            className="flex items-center space-x-1 hover:text-green-500 transition-colors"
          >
            <span>💬</span>
            <span>Yanıtla</span>
          </button>
        </div>

        {!comment.isApproved && (
          <span className="text-xs text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/20 px-2 py-1 rounded-full">
            Onay Bekliyor
          </span>
        )}
      </div>
    </div>
  );
};
