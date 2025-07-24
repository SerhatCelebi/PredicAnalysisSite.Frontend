import { useState, useEffect, useCallback } from "react";
import { profileApi, UserProfileInfo } from "../lib/api";

// Kullanıcı bilgilerini cache'lemek için global cache
const userCache = new Map<number, UserProfileInfo>();

export const useBulkUserProfiles = (userIds: number[]) => {
  const [users, setUsers] = useState<Map<number, UserProfileInfo>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUserIds, setLastUserIds] = useState<string>("");

  const fetchUsers = useCallback(async (ids: number[]) => {
    const uncachedIds = ids.filter((id) => !userCache.has(id));

    if (uncachedIds.length === 0) {
      // Tüm kullanıcılar cache'de varsa direkt döndür
      const cachedUsers = new Map<number, UserProfileInfo>();
      ids.forEach((id) => {
        const user = userCache.get(id);
        if (user) cachedUsers.set(id, user);
      });
      setUsers(cachedUsers);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Tüm kullanıcıları tek seferde getir
      const response = await profileApi.getUsersByIds(uncachedIds.join(","));

      const fetchedUsers = response.data;

      // Cache'e ekle
      fetchedUsers.forEach((user: UserProfileInfo) => {
        userCache.set(user.id, user);
      });

      // Tüm kullanıcıları (cache'den + yeni gelenler) birleştir
      const allUsers = new Map<number, UserProfileInfo>();
      ids.forEach((id) => {
        const user = userCache.get(id);
        if (user) allUsers.set(id, user);
      });

      setUsers(allUsers);
    } catch (err) {
      setError("Kullanıcı bilgileri yüklenemedi");
      console.error("Kullanıcı bilgileri yüklenirken hata:", err);
    } finally {
      setLoading(false);
    }
  }, []); // Boş dependency array - fonksiyon hiç değişmeyecek

  const getUser = useCallback(
    (id: number): UserProfileInfo | null => {
      return users.get(id) || userCache.get(id) || null;
    },
    [users]
  );

  const refreshUser = useCallback(async (id: number) => {
    try {
      const response = await profileApi.getUserById(id);
      const userData = response.data;

      // Cache'i güncelle
      userCache.set(id, userData);

      // State'i güncelle
      setUsers((prev) => new Map(prev).set(id, userData));
    } catch (err) {
      console.error("Kullanıcı bilgisi güncellenirken hata:", err);
    }
  }, []);

  const clearCache = useCallback(() => {
    userCache.clear();
    setUsers(new Map());
  }, []);

  useEffect(() => {
    if (userIds.length > 0) {
      // userIds array'inin string temsilini oluştur
      const userIdsString = userIds.sort().join(",");

      // Sadece gerçekten değiştiyse fetch et
      if (userIdsString !== lastUserIds) {
        setLastUserIds(userIdsString);
        fetchUsers(userIds);
      }
    }
  }, [userIds, lastUserIds]); // fetchUsers'ı dependency'den kaldır

  return {
    users,
    loading,
    error,
    getUser,
    refreshUser,
    clearCache,
    // Cache'den kullanıcı bilgisi al
    getUserFromCache: (id: number) => userCache.get(id) || null,
  };
};
