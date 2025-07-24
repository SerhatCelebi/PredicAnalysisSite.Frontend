import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { dailyPostsApi } from "../lib/api";
import { DailyPostCard } from "../components/Cards/DailyPostCard";
import { ReactionType } from "../components/ReactionPicker";
import {
  Calendar,
  Star,
  User,
  Eye,
  Heart,
  MessageCircle,
  TrendingUp,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "../components/Skeleton";
import { useBulkUserProfiles } from "../hooks/useBulkUserProfiles";

type FilterType = "all" | "featured" | "recent";
type SortOrder = "newest" | "oldest";

export const DailyPosts: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");

  // Fetch daily posts
  const {
    data: postsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["daily-posts", filter],
    queryFn: () =>
      dailyPostsApi.getAll({
        page: 1,
        pageSize: 20,
        featuredOnly: filter === "featured",
      }),
  });

  // Fetch categories - This might be removed if not used elsewhere
  // const { data: categories } = useQuery({
  //   queryKey: ["daily-post-categories"],
  //   queryFn: () => dailyPostsApi.getCategories(),
  // });

  const posts = Array.isArray(postsData?.data) ? postsData.data : [];
  const totalViews = posts.reduce(
    (acc: number, post: any) => acc + (post.viewCount || 0),
    0
  );
  const totalLikes = posts.reduce(
    (acc: number, post: any) => acc + (post.likeCount || 0),
    0
  );
  const totalComments = posts.reduce(
    (acc: number, post: any) => acc + (post.commentCount || 0),
    0
  );

  const handleLike = async (postId: number, reactionType: ReactionType) => {
    try {
      await dailyPostsApi.like(postId, reactionType);
      toast.success("Reaksiyon gönderildi");
      refetch();
    } catch (error) {
      toast.error("Bir hata oluştu");
    }
  };

  const handlePostClick = (postId: number) => {
    navigate(`/daily-post/${postId}`);
  };

  const filterButtons = [{ key: "all", label: "Tümü", icon: Calendar }];

  // Filter posts based on selected filter
  const filteredPosts = posts.filter((post: any) => {
    if (filter === "recent") {
      const today = new Date();
      const postDate = new Date(post.createdAt);
      const diffTime = Math.abs(today.getTime() - postDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7; // Last 7 days
    }
    return true;
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    if (sortOrder === "oldest") {
      return dateA - dateB;
    }
    return dateB - dateA; // newest by default
  });

  // Kullanıcı ID'lerini topla
  const userIds = useMemo(() => {
    return sortedPosts
      .map((post) => post.adminId)
      .filter((id): id is number => id !== undefined);
  }, [sortedPosts]);

  // Kullanıcı bilgilerini toplu olarak yükle
  const { getUser } = useBulkUserProfiles(userIds);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div>
          <h1 className="text-2xl font-bold text-gradient">
            Günlük Paylaşımlar
          </h1>
          <p className="text-gray-400 mt-1">
            Admin ekibinden güncel paylaşımlar ve hikayeler
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-primary-400">
            {posts.length}
          </div>
          <div className="text-sm text-gray-500">Toplam Paylaşım</div>
        </div>

        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-green-400">
            {totalViews.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">Toplam Görüntüleme</div>
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
                onClick={() => setFilter(btn.key as FilterType)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === btn.key
                    ? "bg-primary-600/20 text-primary-400 border border-primary-500/30"
                    : "bg-dark-700/50 text-gray-400 hover:bg-dark-600/50 hover:text-gray-200"
                }`}
              >
                <btn.icon className="h-4 w-4" />
                <span>{btn.label}</span>
              </button>
            ))}
          </div>

          {/* Sort Order */}
          <div className="flex items-center space-x-4">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              className="px-3 py-2 bg-dark-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm text-gray-200"
            >
              <option value="newest">En Yeni</option>
              <option value="oldest">En Eski</option>
            </select>
          </div>
        </div>
      </div>

      {/* Featured section for ALL filter, show first */}
      {filter === "all" &&
        !isLoading &&
        posts.filter((p: any) => p.isFeatured).length > 0 && (
          <div className="card p-6">
            <div className="space-y-4">
              {posts
                .filter((p: any) => p.isFeatured)
                .map((post: any) => (
                  <DailyPostCard
                    key={post.id}
                    post={post}
                    onLike={handleLike}
                    onClick={handlePostClick}
                    currentUserReaction={
                      post.isLikedByCurrentUser ? ReactionType.Like : null
                    }
                  />
                ))}
            </div>
          </div>
        )}

      {/* Posts List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="card p-4">
              <Skeleton className="h-6 w-1/2 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      ) : sortedPosts.length > 0 ? (
        <div className="space-y-6">
          {sortedPosts.map((post: any) => (
            <DailyPostCard
              key={post.id}
              post={post}
              onLike={handleLike}
              onClick={handlePostClick}
              currentUserReaction={
                post.isLikedByCurrentUser ? ReactionType.Like : null
              }
            />
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-200">
            Paylaşım bulunamadı
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Seçili kriterlere uygun paylaşım bulunmuyor.
          </p>
        </div>
      )}
    </div>
  );
};
