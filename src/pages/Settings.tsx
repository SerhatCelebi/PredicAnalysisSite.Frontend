import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { profileApi, notificationApi } from "../lib/api";
import {
  Settings as SettingsIcon,
  User,
  Lock,
  Bell,
  AlertTriangle,
} from "lucide-react";

type SettingsTab = "profile" | "notifications" | "account";

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: profileApi.get,
  });

  const { data: notificationSettings } = useQuery({
    queryKey: ["notificationSettings"],
    queryFn: () => notificationApi.getSettings(),
    enabled: activeTab === "notifications",
  });

  const tabs = [
    { key: "profile", label: "Profil", icon: User },
    { key: "notifications", label: "Bildirimler", icon: Bell },
    { key: "account", label: "Hesap", icon: AlertTriangle },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center space-x-3">
          <SettingsIcon className="h-6 w-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-200">Ayarlar</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="card p-4 space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as SettingsTab)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeTab === tab.key
                    ? "bg-primary-600 text-white"
                    : "text-gray-400 hover:text-gray-200 hover:bg-dark-700/50"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span className="text-sm">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="card p-6">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-200">
                  Profil Bilgileri
                </h2>

                {profile?.data ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-200 mb-1">
                          Ad
                        </label>
                        <p className="text-gray-300">
                          {profile.data.firstName}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-200 mb-1">
                          Soyad
                        </label>
                        <p className="text-gray-300">{profile.data.lastName}</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-1">
                        Email
                      </label>
                      <p className="text-gray-300">{profile.data.email}</p>
                    </div>

                    <div className="bg-blue-500/20 text-blue-400 p-3 rounded-lg border border-blue-500/30">
                      <p className="text-xs">
                        💡 Profil bilgilerinizi güncellemek için Profil
                        sayfasını kullanın.
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Yükleniyor...</p>
                )}
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-200">
                  Bildirim Ayarları
                </h2>

                <div className="bg-blue-500/20 text-blue-400 p-3 rounded-lg border border-blue-500/30">
                  <p className="text-xs">
                    💡 Bildirim ayarlarını Bildirimler sayfasından
                    yönetebilirsiniz.
                  </p>
                </div>
              </div>
            )}

            {/* Account Tab */}
            {activeTab === "account" && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-200">
                  Hesap Ayarları
                </h2>

                <div className="bg-red-500/20 text-red-400 p-4 rounded-lg border border-red-500/30">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-red-300 mb-2">
                        Hesap Silme
                      </h3>
                      <p className="text-sm">
                        Hesabınızı silmek için lütfen iletişim sayfasından
                        bizimle iletişime geçin.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
