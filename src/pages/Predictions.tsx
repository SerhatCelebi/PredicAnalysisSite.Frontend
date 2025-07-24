import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { predictionsApi, PredictionListDto } from "../lib/api";
import { ReactionType } from "../components/ReactionPicker";
import { PredictionCard } from "../components/Cards/PredictionCard";
import { TrendingUp, Award, Heart } from "lucide-react";
import toast from "react-hot-toast";
import { Skeleton } from "../components/Skeleton";
import { useBulkUserProfiles } from "../hooks/useBulkUserProfiles";

type FilterType = "all" | "free";
type SortType = "newest" | "oldest";

export const Predictions: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const queryClient = useQueryClient();

  // Fetch predictions
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["predictions", filter, sort, currentPage],
    queryFn: () =>
      predictionsApi
        .getAll({
          page: currentPage,
          pageSize,
          onlyFree: filter === "free" ? true : undefined,
          sort, // Sıralama parametresi eklendi
        })
        .then((res) => res.data),
  });

  const predictionsRaw = data?.predictions || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Frontend sıralama (backend sıralama çalışmazsa kesin çözüm)
  const predictions = [...predictionsRaw].sort((a, b) => {
    if (sort === "newest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
  });

  // Kullanıcı ID'lerini topla
  const userIds = useMemo(() => {
    return predictions
      .map((prediction) => prediction.user?.id || prediction.userId)
      .filter((id): id is number => id !== undefined && id !== 0);
  }, [predictions]);

  // Kullanıcı bilgilerini toplu olarak yükle
  const { getUser } = useBulkUserProfiles(userIds);

  const handleLike = async (
    predictionId: number,
    reactionType: ReactionType
  ) => {
    try {
      await predictionsApi.like(predictionId, reactionType);
      queryClient.setQueriesData({ queryKey: ["predictions"] }, (old: any) => {
        if (!old) return old;
        if (Array.isArray(old.predictions)) {
          return {
            ...old,
            predictions: old.predictions.map((p: any) => {
              if (p.id !== predictionId) return p;
              const liked = p.isLikedByCurrentUser;
              return {
                ...p,
                likeCount: liked ? p.likeCount - 1 : p.likeCount + 1,
                isLikedByCurrentUser: !liked,
              };
            }),
          };
        }
        return old;
      });
      toast.success("Reaksiyon gönderildi");
    } catch (error) {
      toast.error("Bir hata oluştu");
    }
  };

  const handlePredictionClick = (prediction: PredictionListDto) => {
    // Navigate to prediction detail
    window.location.href = `/prediction/${prediction.id}`;
  };

  const filterButtons = [
    { key: "all", label: "Tümü", icon: TrendingUp },
    { key: "free", label: "Ücretsiz", icon: Award },
  ];

  const sortOptions = [
    { key: "newest", label: "En Yeni" },
    { key: "oldest", label: "En Eski" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tahminler</h1>
          <p className="text-gray-600 mt-1">{totalCount} tahmin bulundu</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {filterButtons.map((btn) => (
              <button
                key={btn.key}
                onClick={() => {
                  setFilter(btn.key as FilterType);
                  setCurrentPage(1);
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === btn.key
                    ? "bg-primary-100 text-primary-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <btn.icon className="h-4 w-4" />
                <span>{btn.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as SortType);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            >
              {sortOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Predictions List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="card p-4">
              <Skeleton className="h-6 w-1/3 mb-4" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      ) : predictions.length > 0 ? (
        <>
          <div className="space-y-4">
            {predictions.map((prediction: PredictionListDto) => (
              <PredictionCard
                key={prediction.id}
                prediction={prediction}
                onLike={handleLike}
                onClick={() => handlePredictionClick(prediction)}
                currentUserReaction={
                  (prediction as any).isLikedByCurrentUser
                    ? ReactionType.Like
                    : null
                }
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Sayfa {currentPage} / {totalPages}
                  <span className="ml-2 text-gray-500">
                    (Toplam {totalCount} tahmin)
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Önceki
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sonraki
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="card p-12 text-center">
          <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Tahmin bulunamadı
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Filtreleri değiştirmeyi deneyin.
          </p>
        </div>
      )}
    </div>
  );
};
