import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { User, Edit, Save, X, Camera, Lock } from "lucide-react";
import { profileApi } from "../lib/api";
import { useAuthStore } from "../lib/store";
import { formatDate } from "../lib/utils";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { RoleBadge } from "../components/RoleBadge";

interface ProfileFormData {
  firstName: string;
  lastName: string;
  phone?: string;
}

export const Profile: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "password">("profile");
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["profile"],
    queryFn: profileApi.get,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<ProfileFormData>();

  const updateProfileMutation = useMutation({
    mutationFn: (payload: {
      firstName: string;
      lastName: string;
      phone?: string;
    }) => profileApi.update(payload),
    onSuccess: (response) => {
      const updatedUser = response.data.user || response.data;
      updateUser(updatedUser);
      toast.success("Profil başarıyla güncellendi!");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setIsEditing(false);
    },
    onError: () => {
      toast.error("Profil güncellenirken bir hata oluştu");
    },
  });

  // Şifre değiştirme formu için react-hook-form
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
  } = useForm<{
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }>();

  const changePasswordMutation = useMutation({
    mutationFn: (data: {
      currentPassword: string;
      newPassword: string;
      confirmNewPassword: string;
    }) =>
      profileApi.changePassword(
        data.currentPassword,
        data.newPassword,
        data.confirmNewPassword
      ),
    onSuccess: () => {
      toast.success("Şifre başarıyla değiştirildi, lütfen tekrar giriş yapın");
      resetPasswordForm();
      useAuthStore.getState().logout();
      navigate("/login");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Şifre değiştirilirken bir hata oluştu"
      );
    },
  });

  // Profil fotoğrafını yükleme mutation
  const uploadImageMutation = useMutation({
    mutationFn: (file: File) => profileApi.uploadProfileImage(file),
    onSuccess: (response) => {
      const { profileImageUrl } = response.data;
      updateUser({ profileImageUrl });
      toast.success("Profil resmi güncellendi");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: () => {
      toast.error("Profil resmi yüklenirken bir hata oluştu");
    },
  });

  const handleSelectImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basit validasyon
    if (!file.type.startsWith("image/")) {
      toast.error("Lütfen geçerli bir resim dosyası seçin");
      return;
    }

    uploadImageMutation.mutate(file);
  };

  const triggerFileDialog = () => {
    fileInputRef.current?.click();
  };

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate({
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone?.trim() || undefined,
    });
  };

  const handleEditClick = () => {
    if (profile?.data) {
      setValue("firstName", profile.data.firstName);
      setValue("lastName", profile.data.lastName);
      setValue("phone", profile.data.phone || "");
    }
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    reset();
  };

  const tabs = [
    { key: "profile", label: "Profil Bilgileri", icon: User },
    { key: "password", label: "Şifre Değiştir", icon: Lock },
  ];

  if (isLoadingProfile) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="card p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-dark-700 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-dark-700 rounded w-full"></div>
              <div className="h-4 bg-dark-700 rounded w-3/4"></div>
              <div className="h-4 bg-dark-700 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-full overflow-hidden shadow-lg bg-dark-700 flex items-center justify-center">
                {profile?.data?.profileImageUrl ? (
                  <img
                    src={profile.data.profileImageUrl}
                    alt="Profil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-xl">
                    {user?.firstName?.charAt(0)}
                    {user?.lastName?.charAt(0)}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={triggerFileDialog}
                className="absolute -bottom-1 -right-1 bg-dark-700 border-2 border-dark-600 rounded-full p-2 hover:bg-dark-600 transition-colors"
              >
                <Camera className="h-3 w-3 text-gray-300" />
              </button>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleSelectImage}
                className="hidden"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-200">
                {profile?.data?.firstName} {profile?.data?.lastName}
              </h1>
              <p className="text-gray-400">{profile?.data?.email}</p>
            </div>
          </div>

          {!isEditing ? (
            <button
              onClick={handleEditClick}
              className="btn-primary flex items-center space-x-2 self-start sm:self-auto w-full sm:w-auto justify-center"
            >
              <Edit className="h-4 w-4" />
              <span>Düzenle</span>
            </button>
          ) : (
            <button
              onClick={handleCancelEdit}
              className="btn-secondary flex items-center space-x-2 self-start sm:self-auto w-full sm:w-auto justify-center"
            >
              <X className="h-4 w-4" />
              <span>İptal</span>
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-dark-700">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? "border-primary-500 text-primary-400"
                    : "border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </div>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "profile" && (
        <div className="card p-6">
          {isEditing ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Ad
                  </label>
                  <input
                    {...register("firstName", {
                      required: "Ad gerekli",
                    })}
                    className="input-field"
                    placeholder="Adınız"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-xs text-red-400">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Soyad
                  </label>
                  <input
                    {...register("lastName", {
                      required: "Soyad gerekli",
                    })}
                    className="input-field"
                    placeholder="Soyadınız"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-xs text-red-400">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Email (değiştirilemez)
                  </label>
                  <input
                    value={profile?.data?.email || ""}
                    disabled
                    className="input-field opacity-70 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Telefon (Opsiyonel)
                  </label>
                  <input
                    {...register("phone")}
                    type="tel"
                    className="input-field"
                    placeholder="05XXXXXXXXX"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>
                    {updateProfileMutation.isPending
                      ? "Kaydediliyor..."
                      : "Kaydet"}
                  </span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-200 mb-4">
                    Kişisel Bilgiler
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-200 mb-1">
                        Ad Soyad
                      </h4>
                      <p className="text-gray-400">
                        {profile?.data?.firstName} {profile?.data?.lastName}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-200 mb-1">Email</h4>
                      <p className="text-gray-400">{profile?.data?.email}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-200 mb-1">
                        Telefon
                      </h4>
                      <p className="text-gray-400">
                        {profile?.data?.phone || "Belirtilmemiş"}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-200 mb-4">
                    Hesap Bilgileri
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-200 mb-1">Rol</h4>
                      <RoleBadge role={user?.role} />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-200 mb-1">
                        Üyelik Tarihi
                      </h4>
                      <p className="text-gray-400">
                        {profile?.data?.createdAt
                          ? formatDate(profile.data.createdAt)
                          : "Bilinmiyor"}
                      </p>
                    </div>
                    {user?.role === "VipUser" &&
                      profile?.data?.vipExpiryDate && (
                        <div>
                          <h4 className="font-medium text-gray-200 mb-1">
                            VIP Bitiş Tarihi
                          </h4>
                          <p className="text-gray-400">
                            {formatDate(profile.data.vipExpiryDate)}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                new Date(profile.data.vipExpiryDate) >
                                new Date()
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                              }`}
                            >
                              {new Date(profile.data.vipExpiryDate) > new Date()
                                ? "Aktif VIP"
                                : "Süresi Dolmuş"}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(profile.data.vipExpiryDate) > new Date()
                                ? "Premium özellikler aktif"
                                : "Yenilemek için ödeme yapın"}
                            </span>
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Change Password Tab */}
      {activeTab === "password" && (
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-200 mb-4">
            Şifre Değiştir
          </h3>

          <form
            onSubmit={handleSubmitPassword((data) => {
              if (data.newPassword !== data.confirmNewPassword) {
                toast.error("Yeni şifreler uyuşmuyor");
                return;
              }
              changePasswordMutation.mutate({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
                confirmNewPassword: data.confirmNewPassword,
              });
            })}
            className="space-y-6 max-w-md"
          >
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Mevcut Şifre
              </label>
              <input
                type="password"
                {...registerPassword("currentPassword", {
                  required: "Mevcut şifre gerekli",
                })}
                className="input-field"
                placeholder="Mevcut şifreniz"
              />
              {passwordErrors.currentPassword && (
                <p className="mt-1 text-xs text-red-400">
                  {passwordErrors.currentPassword.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Yeni Şifre
              </label>
              <input
                type="password"
                {...registerPassword("newPassword", {
                  required: "Yeni şifre gerekli",
                  minLength: {
                    value: 8,
                    message: "En az 8 karakter olmalı",
                  },
                })}
                className="input-field"
                placeholder="Yeni şifreniz"
              />
              {passwordErrors.newPassword && (
                <p className="mt-1 text-xs text-red-400">
                  {passwordErrors.newPassword.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Yeni Şifre (Tekrar)
              </label>
              <input
                type="password"
                {...registerPassword("confirmNewPassword", {
                  required: "Şifre tekrarı gerekli",
                })}
                className="input-field"
                placeholder="Yeni şifre tekrar"
              />
              {passwordErrors.confirmNewPassword && (
                <p className="mt-1 text-xs text-red-400">
                  {passwordErrors.confirmNewPassword.message}
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>
                  {changePasswordMutation.isPending
                    ? "Kaydediliyor..."
                    : "Şifreyi Güncelle"}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
