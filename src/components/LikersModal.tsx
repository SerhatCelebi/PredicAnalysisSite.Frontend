import React, { useState, useEffect } from "react";
import { X, User } from "lucide-react";
import { cn } from "../lib/utils";
import {
  getReactionEmoji,
  getReactionLabel,
  ReactionType,
} from "./ReactionPicker";

interface Liker {
  userId: number;
  userName: string;
  profileImageUrl?: string | null;
  likeType: ReactionType;
  likeTypeName: string;
  likedAt: string;
}

interface LikersData {
  totalLikes: number;
  likeCount: number; // 👍 Like sayısı
  loveCount: number; // ❤️ Love sayısı
  laughCount: number; // 😂 Laugh sayısı
  angryCount: number; // 😠 Angry sayısı
  sadCount: number; // 😢 Sad sayısı
  wowCount: number; // 😮 Wow sayısı
  likers: Liker[];
}

interface LikersModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentType: "dailypost" | "prediction" | "comment";
  contentId: number;
  contentTitle?: string;
  onFetchLikers: (
    contentType: string,
    contentId: number
  ) => Promise<LikersData>;
}

export const LikersModal: React.FC<LikersModalProps> = ({
  isOpen,
  onClose,
  contentType,
  contentId,
  contentTitle,
  onFetchLikers,
}) => {
  const [likersData, setLikersData] = useState<LikersData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedReaction, setSelectedReaction] = useState<
    ReactionType | "all"
  >("all");

  // Modal açıldığında beğenenleri çek
  useEffect(() => {
    if (isOpen) {
      fetchLikers();
    }
  }, [isOpen, contentType, contentId]);

  const fetchLikers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await onFetchLikers(contentType, contentId);
      setLikersData(data);
    } catch (err) {
      setError("Beğenenler yüklenirken hata oluştu");
      // Hata detayı konsola basılmadı
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setLikersData(null);
    setSelectedReaction("all");
    onClose();
  };

  // Keyboard ile modal kapatma
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Filtrelenmiş beğenenler listesi
  const filteredLikers =
    likersData?.likers.filter(
      (liker) =>
        selectedReaction === "all" || liker.likeType === selectedReaction
    ) || [];

  // Reaksiyon istatistikleri
  const reactionStats = [
    { type: ReactionType.Like, count: likersData?.likeCount || 0 },
    { type: ReactionType.Love, count: likersData?.loveCount || 0 },
    { type: ReactionType.Laugh, count: likersData?.laughCount || 0 },
    { type: ReactionType.Angry, count: likersData?.angryCount || 0 },
    { type: ReactionType.Sad, count: likersData?.sadCount || 0 },
    { type: ReactionType.Wow, count: likersData?.wowCount || 0 },
  ].filter((stat) => stat.count > 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Tam opak koyu arka plan */}
      <div
        className="fixed inset-0 bg-black bg-opacity-90"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-dark-800 rounded-xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-dark-600 flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              👥 Beğenenler
            </h3>
            {contentTitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                {contentTitle}
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-3 text-gray-500">Yükleniyor...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-red-500">{error}</p>
            </div>
          ) : likersData ? (
            <>
              {/* Toplam ve Reaksiyon Filtreleri */}
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-dark-600">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Toplam: {likersData.totalLikes} beğeni
                  </span>
                </div>

                {/* Reaksiyon Filtre Butonları */}
                {reactionStats.length > 0 && (
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    <button
                      onClick={() => setSelectedReaction("all")}
                      className={cn(
                        "px-2 sm:px-3 py-1 text-xs rounded-full transition-colors",
                        selectedReaction === "all"
                          ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-dark-700 dark:text-gray-400 dark:hover:bg-dark-600"
                      )}
                    >
                      Tümü ({likersData.totalLikes})
                    </button>
                    {reactionStats.map((stat) => (
                      <button
                        key={stat.type}
                        onClick={() => setSelectedReaction(stat.type)}
                        className={cn(
                          "px-2 sm:px-3 py-1 text-xs rounded-full transition-colors flex items-center space-x-1",
                          selectedReaction === stat.type
                            ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-dark-700 dark:text-gray-400 dark:hover:bg-dark-600"
                        )}
                      >
                        <span>{getReactionEmoji(stat.type)}</span>
                        <span>{stat.count}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Beğenenler Listesi */}
              <div className="flex-1 overflow-y-auto">
                {filteredLikers.length > 0 ? (
                  <div className="space-y-1">
                    {filteredLikers.map((liker) => (
                      <div
                        key={`${liker.userId}-${liker.likeType}`}
                        className="flex items-center justify-between px-4 sm:px-6 py-3 hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors"
                      >
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          {/* Profil Fotoğrafı */}
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 dark:bg-dark-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {liker.profileImageUrl ? (
                              <img
                                src={liker.profileImageUrl}
                                alt={liker.userName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-5 h-5 text-gray-400" />
                            )}
                          </div>

                          {/* Kullanıcı Bilgileri */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                              {liker.userName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(liker.likedAt).toLocaleDateString(
                                "tr-TR",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Reaksiyon */}
                        <div className="flex items-center space-x-2">
                          <span
                            className="text-lg"
                            title={getReactionLabel(liker.likeType)}
                          >
                            {getReactionEmoji(liker.likeType)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      {selectedReaction === "all"
                        ? "Henüz beğeni yok"
                        : `Bu reaksiyon türü için beğeni yok`}
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-dark-600">
          <button
            onClick={handleClose}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 rounded-lg transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
