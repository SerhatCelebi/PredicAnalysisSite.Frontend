import React, { useState } from "react";
import { profileApi, UserProfileInfo } from "../lib/api";
import { useUserProfile } from "../hooks/useUserProfile";

export const UserProfileTest: React.FC = () => {
  const [userId, setUserId] = useState<number>(1);
  const [testResults, setTestResults] = useState<string[]>([]);

  const { userInfo, loading, error, fetchUserInfo } = useUserProfile(userId);

  const testGetUserById = async () => {
    try {
      setTestResults((prev) => [
        ...prev,
        `Test başlatılıyor: Kullanıcı ID ${userId}`,
      ]);

      const response = await profileApi.getUserById(userId);
      const userData = response.data;

      setTestResults((prev) => [
        ...prev,
        `✅ Kullanıcı bilgileri alındı:`,
        `   ID: ${userData.id}`,
        `   Ad Soyad: ${userData.firstName} ${userData.lastName}`,
        `   Email: ${userData.email}`,
        `   Profil Resmi: ${userData.profileImageUrl || "Yok"}`,
        `   VIP Durumu: ${userData.isVipActive ? "Aktif" : "Pasif"}`,
        `   Blok Durumu: ${userData.isBlocked ? "Bloklu" : "Aktif"}`,
        `   Kayıt Tarihi: ${new Date(userData.createdAt).toLocaleDateString(
          "tr-TR"
        )}`,
        "",
      ]);
    } catch (error: any) {
      setTestResults((prev) => [
        ...prev,
        `❌ Hata: ${error.response?.data?.message || error.message}`,
        "",
      ]);
    }
  };

  const testGetAllUsers = async () => {
    try {
      setTestResults((prev) => [
        ...prev,
        "Test başlatılıyor: Tüm kullanıcılar",
      ]);

      const response = await profileApi.getAllUsers();
      const users = response.data.users || [];

      setTestResults((prev) => [
        ...prev,
        `✅ ${users.length} kullanıcı bulundu:`,
        ...users.map(
          (user: UserProfileInfo) =>
            `   ${user.id}: ${user.firstName} ${user.lastName} (${
              user.isVipActive ? "VIP" : "Normal"
            })`
        ),
        "",
      ]);
    } catch (error: any) {
      setTestResults((prev) => [
        ...prev,
        `❌ Hata: ${error.response?.data?.message || error.message}`,
        "",
      ]);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="card p-6 space-y-4">
      <h2 className="text-xl font-bold">Kullanıcı Profil API Test</h2>

      <div className="flex space-x-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Kullanıcı ID:
          </label>
          <input
            type="number"
            value={userId}
            onChange={(e) => setUserId(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg"
            min="1"
          />
        </div>

        <button
          onClick={testGetUserById}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Tek Kullanıcı Test
        </button>

        <button
          onClick={testGetAllUsers}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          Tüm Kullanıcılar Test
        </button>

        <button
          onClick={clearResults}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
        >
          Temizle
        </button>
      </div>

      {loading && <div className="text-blue-500">Yükleniyor...</div>}
      {error && <div className="text-red-500">Hata: {error}</div>}

      {userInfo && (
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Hook ile alınan bilgiler:</h3>
          <p>ID: {userInfo.id}</p>
          <p>
            Ad Soyad: {userInfo.firstName} {userInfo.lastName}
          </p>
          <p>Email: {userInfo.email}</p>
          <p>VIP: {userInfo.isVipActive ? "Aktif" : "Pasif"}</p>
          <p>Blok: {userInfo.isBlocked ? "Bloklu" : "Aktif"}</p>
        </div>
      )}

      {testResults.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Test Sonuçları:</h3>
          <pre className="text-sm whitespace-pre-wrap">
            {testResults.join("\n")}
          </pre>
        </div>
      )}
    </div>
  );
};
