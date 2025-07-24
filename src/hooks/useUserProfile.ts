import { useState, useEffect, useCallback } from "react";
import { profileApi, UserProfileInfo } from "../lib/api";

// Kullanıcı bilgilerini cache'lemek için global cache
const userCache = new Map<number, UserProfileInfo>();

export const useUserProfile = (userId?: number) => {
  const [userInfo, setUserInfo] = useState<UserProfileInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserInfo = useCallback(async (id: number) => {
    // Cache'de varsa direkt döndür
    if (userCache.has(id)) {
      setUserInfo(userCache.get(id)!);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await profileApi.getUserById(id);
      const userData = response.data;

      // Cache'e ekle
      userCache.set(id, userData);
      setUserInfo(userData);
    } catch (err) {
      setError("Kullanıcı bilgileri yüklenemedi");
      console.error("Kullanıcı bilgileri yüklenirken hata:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Birden fazla kullanıcı bilgisini toplu olarak getir
  const fetchMultipleUsers = useCallback(async (userIds: number[]) => {
    const uncachedIds = userIds.filter((id) => !userCache.has(id));

    if (uncachedIds.length === 0) {
      return userIds.map((id) => userCache.get(id)!);
    }

    try {
      setLoading(true);
      setError(null);

      // Tüm kullanıcıları tek seferde getir
      const response = await profileApi.getAllUsers({
        userIds: uncachedIds.join(","),
      });

      const users = response.data;

      // Cache'e ekle
      users.forEach((user: UserProfileInfo) => {
        userCache.set(user.id, user);
      });

      return userIds.map((id) => userCache.get(id)!);
    } catch (err) {
      setError("Kullanıcı bilgileri yüklenemedi");
      console.error("Kullanıcı bilgileri yüklenirken hata:", err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Cache'i temizle
  const clearCache = useCallback(() => {
    userCache.clear();
  }, []);

  // Belirli bir kullanıcıyı cache'den kaldır
  const removeFromCache = useCallback((id: number) => {
    userCache.delete(id);
  }, []);

  useEffect(() => {
    if (userId) {
      fetchUserInfo(userId);
    }
  }, [userId]); // fetchUserInfo dependency'den kaldırıldı

  return {
    userInfo,
    loading,
    error,
    fetchUserInfo,
    fetchMultipleUsers,
    clearCache,
    removeFromCache,
    // Cache'den kullanıcı bilgisi al
    getUserFromCache: (id: number) => userCache.get(id) || null,
  };
};
