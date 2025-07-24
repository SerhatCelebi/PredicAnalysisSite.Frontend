import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { TrendingUp, Newspaper, Loader2, ChevronDown } from "lucide-react";
import { createPortal } from "react-dom";
import {
  predictionsApi,
  dailyPostsApi,
  PredictionListDto,
  DailyPost,
} from "../lib/api";
import { useAuthStore } from "../lib/store";
import { PredictionCard } from "../components/Cards/PredictionCard";
import { DailyPostCard } from "../components/Cards/DailyPostCard";
import { ReactionType } from "../components/ReactionPicker";
import { cn } from "../lib/utils";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { AxiosResponse } from "axios";
import { UserProfileTest } from "../components/UserProfileTest";
import { useBulkUserProfiles } from "../hooks/useBulkUserProfiles";

export const Home: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"predictions" | "daily" | "all">(
    "all"
  );
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const dropdownRef = useRef<HTMLButtonElement>(null);
  const queryClient = useQueryClient();

  // Click outside handler for mobile menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMobileMenu) {
        const target = event.target as Element;
        // Portal'daki dropdown'ı da kontrol et
        const isDropdownClick = target.closest('[data-dropdown="mobile-menu"]');
        const isMenuButtonClick = target.closest(".mobile-menu-container");

        if (!isDropdownClick && !isMenuButtonClick) {
          setShowMobileMenu(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMobileMenu]);

  // Calculate dropdown position
  const updateDropdownPosition = useCallback(() => {
    if (dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, []);

  useEffect(() => {
    if (showMobileMenu) {
      updateDropdownPosition();
    }
  }, [showMobileMenu, updateDropdownPosition]);

  // Update position on window resize
  useEffect(() => {
    const handleResize = () => {
      if (showMobileMenu) {
        updateDropdownPosition();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [showMobileMenu, updateDropdownPosition]);

  // Infinite Query for Predictions (hem ücretsiz hem ücretli)
  const {
    data: predictionsData,
    fetchNextPage: fetchNextPredictions,
    hasNextPage: hasMorePredictions,
    isLoading: predictionsLoading,
    isFetchingNextPage: isFetchingNextPredictions,
  } = useInfiniteQuery({
    queryKey: ["home-predictions"],
    queryFn: ({ pageParam = 1 }) =>
      predictionsApi.getAll({
        page: pageParam,
        pageSize: 10,
        // onlyFree parametresini geçmiyoruz - tüm tahminleri getir
      }),
    initialPageParam: 1,
    refetchInterval: 60000, // 1 dakikada bir en yeni verileri kontrol et
    getNextPageParam: (
      lastPage: AxiosResponse<{
        predictions: PredictionListDto[];
        totalCount: number;
      }>,
      allPages
    ) => {
      const totalCount = lastPage.data.totalCount;
      const loadedItems = allPages.length * 10;
      return loadedItems < totalCount ? allPages.length + 1 : undefined;
    },
    enabled: !!user,
  });

  // Infinite Query for Daily Posts
  const {
    data: dailyPostsData,
    fetchNextPage: fetchNextDailyPosts,
    hasNextPage: hasMoreDailyPosts,
    isLoading: dailyPostsLoading,
    isFetchingNextPage: isFetchingNextDailyPosts,
  } = useInfiniteQuery({
    queryKey: ["home-daily-posts"],
    queryFn: ({ pageParam = 1 }) =>
      dailyPostsApi.getAll({ page: pageParam, pageSize: 10 }),
    initialPageParam: 1,
    refetchInterval: 60000, // 1 dakikada bir
    getNextPageParam: (lastPage: AxiosResponse<DailyPost[]>, allPages) => {
      return lastPage.data.length === 10 ? allPages.length + 1 : undefined;
    },
    enabled: !!user,
  });

  const observer = useRef<IntersectionObserver>();
  const lastElementRef = useCallback(
    (node: HTMLElement | null) => {
      if (predictionsLoading || dailyPostsLoading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          if (
            (activeTab === "predictions" || activeTab === "all") &&
            hasMorePredictions &&
            !isFetchingNextPredictions
          ) {
            fetchNextPredictions();
          } else if (
            (activeTab === "daily" || activeTab === "all") &&
            hasMoreDailyPosts &&
            !isFetchingNextDailyPosts
          ) {
            fetchNextDailyPosts();
          }
        }
      });
      if (node) observer.current.observe(node);
    },
    [
      activeTab,
      hasMorePredictions,
      hasMoreDailyPosts,
      isFetchingNextPredictions,
      isFetchingNextDailyPosts,
      predictionsLoading,
      dailyPostsLoading,
      fetchNextDailyPosts,
      fetchNextPredictions,
    ]
  );

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["home-predictions"] });
    queryClient.invalidateQueries({ queryKey: ["home-daily-posts"] });
  }, [activeTab]); // queryClient dependency'den kaldırıldı

  const handlePredictionLike = async (
    id: number,
    reactionType: ReactionType
  ) => {
    try {
      await predictionsApi.like(id, reactionType);
      queryClient.setQueriesData(
        { queryKey: ["home-predictions"] },
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => {
              if (!page?.data?.predictions) return page;
              return {
                ...page,
                data: {
                  ...page.data,
                  predictions: page.data.predictions.map((p: any) => {
                    if (p.id !== id) return p;
                    const liked = p.isLikedByCurrentUser;
                    return {
                      ...p,
                      likeCount: liked ? p.likeCount - 1 : p.likeCount + 1,
                      isLikedByCurrentUser: !liked,
                    };
                  }),
                },
              };
            }),
          };
        }
      );
      toast.success("Reaksiyon gönderildi");
    } catch (error) {
      toast.error("Bir hata oluştu");
    }
  };

  const handleDailyPostLike = async (
    id: number,
    reactionType: ReactionType
  ) => {
    try {
      await dailyPostsApi.like(id, reactionType);
      toast.success("Reaksiyon gönderildi");
      queryClient.invalidateQueries({ queryKey: ["home-daily-posts"] });
    } catch (error) {
      toast.error("Bir hata oluştu");
    }
  };

  const handlePredictionClick = (prediction: PredictionListDto) => {
    navigate(`/prediction/${prediction.id}`);
  };

  const handleDailyPostClick = (id: number) => {
    navigate(`/daily-post/${id}`);
  };

  const predictions =
    predictionsData?.pages.flatMap((page) => page.data.predictions) || [];
  const dailyPosts = dailyPostsData?.pages.flatMap((page) => page.data) || [];

  // Kullanıcı ID'lerini topla (hem prediction hem daily post için)
  const allUserIds = useMemo(() => {
    const predictionUserIds = predictions
      .map((prediction) => prediction.user?.id || prediction.userId)
      .filter((id): id is number => id !== undefined && id !== 0);

    const dailyPostUserIds = dailyPosts
      .map((post) => post.adminId)
      .filter((id): id is number => id !== undefined && id !== 0);

    // Tüm kullanıcı ID'lerini birleştir ve sırala
    const allIds = Array.from(
      new Set([...predictionUserIds, ...dailyPostUserIds])
    ).sort();
    return allIds;
  }, [predictions, dailyPosts]);

  // Kullanıcı bilgilerini toplu olarak yükle
  const { getUser } = useBulkUserProfiles(allUserIds);

  const combinedPosts = useMemo(() => {
    const preds = predictions.map((p) => ({
      ...p,
      __type: "prediction",
      createdAt: p.createdAt,
    }));
    const dps = dailyPosts.map((d) => ({
      ...d,
      __type: "daily",
      createdAt: d.createdAt!,
    }));
    return [...preds, ...dps].sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [predictions, dailyPosts]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Welcome Header */}
      <div className="card p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gradient mb-2">
            Hoş Geldiniz, {user.firstName}! 👋
          </h1>
          <p className="text-gray-400">
            En son tahminleri ve günlük paylaşımları keşfedin.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-effect rounded-xl p-2 shadow-lg border border-dark-700/30 relative">
        {/* Desktop Tabs */}
        <div className="hidden lg:flex space-x-2">
          <button
            onClick={() => setActiveTab("predictions")}
            className={cn(
              "w-full text-center px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center space-x-2",
              activeTab === "predictions"
                ? "bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg transform scale-[1.02]"
                : "text-gray-400 hover:bg-dark-700/50 hover:text-gray-200"
            )}
          >
            <TrendingUp className="h-5 w-5" />
            <span>Tahminler</span>
          </button>
          <button
            onClick={() => setActiveTab("daily")}
            className={cn(
              "w-full text-center px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center space-x-2",
              activeTab === "daily"
                ? "bg-gradient-to-r from-secondary-600 to-secondary-700 text-white shadow-lg transform scale-[1.02]"
                : "text-gray-400 hover:bg-dark-700/50 hover:text-gray-200"
            )}
          >
            <Newspaper className="h-5 w-5" />
            <span>Günlük Gönderiler</span>
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={cn(
              "w-full text-center px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center space-x-2",
              activeTab === "all"
                ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg transform scale-[1.02]"
                : "text-gray-400 hover:bg-dark-700/50 hover:text-gray-200"
            )}
          >
            <span>Tümü</span>
          </button>
        </div>

        {/* Mobile Dropdown */}
        <div className="lg:hidden">
          <div className="relative mobile-menu-container">
            <button
              ref={dropdownRef}
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="w-full flex items-center justify-between px-4 py-3 bg-dark-700 rounded-lg border border-dark-600 text-gray-300 hover:bg-dark-600 transition-colors"
            >
              <div className="flex items-center space-x-3">
                {activeTab === "predictions" && (
                  <>
                    <TrendingUp className="h-5 w-5" />
                    <span className="font-medium">Tahminler</span>
                  </>
                )}
                {activeTab === "daily" && (
                  <>
                    <Newspaper className="h-5 w-5" />
                    <span className="font-medium">Günlük Gönderiler</span>
                  </>
                )}
                {activeTab === "all" && (
                  <>
                    <span className="font-medium">Tümü</span>
                  </>
                )}
              </div>
              <ChevronDown
                className={`h-5 w-5 transition-transform ${
                  showMobileMenu ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Mobile Menu - Portal */}
            {showMobileMenu &&
              createPortal(
                <div
                  data-dropdown="mobile-menu"
                  className="fixed bg-dark-800/95 border border-dark-600 rounded-lg shadow-2xl z-[9999] backdrop-blur-md"
                  style={{
                    top: dropdownPosition.top + 8,
                    left: dropdownPosition.left,
                    width: dropdownPosition.width,
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log("Tahminler seçildi");
                      setActiveTab("predictions");
                      setShowMobileMenu(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-dark-700 transition-colors first:rounded-t-lg ${
                      activeTab === "predictions"
                        ? "bg-primary-600/20 text-primary-400 border-l-4 border-primary-500"
                        : "text-gray-300"
                    }`}
                  >
                    <TrendingUp className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">Tahminler</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log("Günlük Gönderiler seçildi");
                      setActiveTab("daily");
                      setShowMobileMenu(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-dark-700 transition-colors ${
                      activeTab === "daily"
                        ? "bg-secondary-600/20 text-secondary-400 border-l-4 border-secondary-500"
                        : "text-gray-300"
                    }`}
                  >
                    <Newspaper className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">Günlük Gönderiler</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log("Tümü seçildi");
                      setActiveTab("all");
                      setShowMobileMenu(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-dark-700 transition-colors last:rounded-b-lg ${
                      activeTab === "all"
                        ? "bg-purple-600/20 text-purple-400 border-l-4 border-purple-500"
                        : "text-gray-300"
                    }`}
                  >
                    <span className="font-medium">Tümü</span>
                  </button>
                </div>,
                document.body
              )}
          </div>
        </div>
      </div>

      {/* Test Component - Geçici */}
      {/* <UserProfileTest /> */}

      {/* Content */}
      <div className="space-y-6">
        {activeTab === "all" && (
          <>
            {predictionsLoading && dailyPostsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              </div>
            ) : combinedPosts.length > 0 ? (
              <div className="space-y-6">
                {combinedPosts.map((item: any, index: number) => {
                  const isLast = index === combinedPosts.length - 1;
                  if (item.__type === "prediction") {
                    return (
                      <div
                        key={`p-${item.id}`}
                        ref={isLast ? lastElementRef : null}
                      >
                        <PredictionCard
                          prediction={item}
                          onLike={handlePredictionLike}
                          onClick={() => handlePredictionClick(item)}
                          currentUserReaction={
                            item.isLikedByCurrentUser ? ReactionType.Like : null
                          }
                        />
                      </div>
                    );
                  }
                  return (
                    <div
                      key={`d-${item.id}`}
                      ref={isLast ? lastElementRef : null}
                    >
                      <DailyPostCard
                        post={item}
                        onLike={handleDailyPostLike}
                        onClick={() => handleDailyPostClick(item.id)}
                        currentUserReaction={
                          item.isLikedByCurrentUser ? ReactionType.Like : null
                        }
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="card p-12 text-center">
                <Loader2 className="mx-auto h-12 w-12 text-gray-400 animate-spin" />
                <h3 className="mt-4 text-lg font-medium text-gray-200">
                  Henüz paylaşım yok
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Yeni içerikler yakında.
                </p>
              </div>
            )}
          </>
        )}

        {activeTab === "predictions" && (
          <>
            {predictionsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
              </div>
            ) : predictions.length > 0 ? (
              <>
                <div className="space-y-6">
                  {predictions.map(
                    (prediction: PredictionListDto, index: number) => (
                      <div
                        key={prediction.id}
                        ref={
                          index === predictions.length - 1
                            ? lastElementRef
                            : null
                        }
                      >
                        <PredictionCard
                          prediction={prediction}
                          onLike={handlePredictionLike}
                          onClick={() => handlePredictionClick(prediction)}
                          currentUserReaction={
                            (prediction as any).isLikedByCurrentUser
                              ? ReactionType.Like
                              : null
                          }
                        />
                      </div>
                    )
                  )}
                </div>
                {isFetchingNextPredictions && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                  </div>
                )}
              </>
            ) : (
              <div className="card p-12 text-center">
                <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-200">
                  Henüz tahmin yok
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  İlk tahminler yakında paylaşılacak.
                </p>
              </div>
            )}
          </>
        )}

        {activeTab === "daily" && (
          <>
            {dailyPostsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-secondary-600" />
              </div>
            ) : dailyPosts.length > 0 ? (
              <>
                <div className="space-y-6">
                  {dailyPosts.map((post: DailyPost, index: number) => (
                    <div
                      key={post.id}
                      ref={
                        index === dailyPosts.length - 1 ? lastElementRef : null
                      }
                    >
                      <DailyPostCard
                        post={post}
                        onLike={handleDailyPostLike}
                        onClick={() => handleDailyPostClick(post.id)}
                        currentUserReaction={
                          post.isLikedByCurrentUser ? ReactionType.Like : null
                        }
                      />
                    </div>
                  ))}
                </div>
                {isFetchingNextDailyPosts && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-secondary-600" />
                  </div>
                )}
              </>
            ) : (
              <div className="card p-12 text-center">
                <Newspaper className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-200">
                  Henüz günlük paylaşım yok
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  İlk paylaşımlar yakında gelecek.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
