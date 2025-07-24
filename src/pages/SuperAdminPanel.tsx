import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../lib/api";
import { useAuthStore } from "../lib/store";
import { Navigate } from "react-router-dom";
import {
  Users,
  Shield,
  Activity,
  UserCheck,
  UserX,
  Crown,
  Settings,
  History,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Minus,
  Edit,
  Eye,
  Search,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";
import { formatDate } from "../lib/utils";

type SuperAdminTab = "users" | "admins" | "role-history";

export const SuperAdminPanel: React.FC = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<SuperAdminTab>("users");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [showGrantAdminModal, setShowGrantAdminModal] = useState(false);
  const [showRevokeAdminModal, setShowRevokeAdminModal] = useState(false);
  const [showRoleChangeModal, setShowRoleChangeModal] = useState(false);
  const [showRoleHistoryModal, setShowRoleHistoryModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Form states
  const [grantAdminForm, setGrantAdminForm] = useState({
    reason: "",
    note: "",
  });
  const [revokeAdminForm, setRevokeAdminForm] = useState({
    reason: "",
    note: "",
    convertToNormalUser: true,
  });
  const [roleChangeForm, setRoleChangeForm] = useState({
    newRole: 3, // NormalUser
    reason: "",
  });

  // Fetch users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["super-admin-users", searchTerm],
    queryFn: () =>
      adminApi.getUsers({
        page: 1,
        pageSize: 50,
        search: searchTerm || undefined,
      }),
    enabled: activeTab === "users" && user?.role === "SuperAdmin",
  });

  // Fetch admins
  const { data: adminsData, isLoading: adminsLoading } = useQuery({
    queryKey: ["super-admin-admins"],
    queryFn: () => adminApi.getAdmins(),
    enabled: activeTab === "admins" && user?.role === "SuperAdmin",
  });

  // Fetch role history
  const { data: roleHistoryData, isLoading: roleHistoryLoading } = useQuery({
    queryKey: ["role-history", selectedUserId],
    queryFn: () => adminApi.getRoleHistory(selectedUserId!),
    enabled: !!selectedUserId && showRoleHistoryModal,
  });

  // Mutations
  const grantAdminMutation = useMutation({
    mutationFn: (data: { id: number; reason: string; note?: string }) =>
      adminApi.grantAdmin(data.id, { reason: data.reason, note: data.note }),
    onSuccess: () => {
      toast.success("Admin yetkisi başarıyla verildi");
      queryClient.invalidateQueries({ queryKey: ["super-admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin-admins"] });
      setShowGrantAdminModal(false);
      setGrantAdminForm({ reason: "", note: "" });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Admin yetkisi verilemedi");
    },
  });

  const revokeAdminMutation = useMutation({
    mutationFn: (data: {
      id: number;
      reason: string;
      note?: string;
      convertToNormalUser?: boolean;
    }) => adminApi.revokeAdmin(data.id, data),
    onSuccess: () => {
      toast.success("Admin yetkisi başarıyla kaldırıldı");
      queryClient.invalidateQueries({ queryKey: ["super-admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin-admins"] });
      setShowRevokeAdminModal(false);
      setRevokeAdminForm({ reason: "", note: "", convertToNormalUser: true });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Admin yetkisi kaldırılamadı"
      );
    },
  });

  const changeRoleMutation = useMutation({
    mutationFn: (data: { id: number; newRole: number; reason: string }) =>
      adminApi.changeRoleSuper(data.id, data),
    onSuccess: () => {
      toast.success("Rol başarıyla değiştirildi");
      queryClient.invalidateQueries({ queryKey: ["super-admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin-admins"] });
      setShowRoleChangeModal(false);
      setRoleChangeForm({ newRole: 3, reason: "" });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Rol değiştirilemedi");
    },
  });

  // Redirect if not SuperAdmin
  if (!user || user.role !== "SuperAdmin") {
    return <Navigate to="/" replace />;
  }

  const users = usersData?.data?.users || [];
  const admins = adminsData || [];
  const roleHistory = roleHistoryData || [];

  const getRoleInfo = (role: string) => {
    switch (role) {
      case "SuperAdmin":
        return {
          name: "Süper Admin",
          color: "bg-red-100 text-red-800",
          icon: Shield,
        };
      case "Admin":
        return {
          name: "Admin",
          color: "bg-purple-100 text-purple-800",
          icon: Shield,
        };
      case "VipUser":
        return {
          name: "VIP Kullanıcı",
          color: "bg-yellow-100 text-yellow-800",
          icon: Crown,
        };
      case "NormalUser":
        return {
          name: "Normal Kullanıcı",
          color: "bg-gray-100 text-gray-800",
          icon: Users,
        };
      default:
        return { name: role, color: "bg-gray-100 text-gray-800", icon: Users };
    }
  };

  const tabConfig = [
    { key: "users", label: "Kullanıcı Yönetimi", icon: Users },
  ];

  const handleGrantAdmin = (userId: number, user: any) => {
    setSelectedUserId(userId);
    setSelectedUser(user);
    setShowGrantAdminModal(true);
  };

  const handleRevokeAdmin = (userId: number, user: any) => {
    setSelectedUserId(userId);
    setSelectedUser(user);
    setShowRevokeAdminModal(true);
  };

  const handleRoleChange = (userId: number, user: any) => {
    setSelectedUserId(userId);
    setSelectedUser(user);
    setShowRoleChangeModal(true);
  };

  const handleShowRoleHistory = (userId: number, user: any) => {
    setSelectedUserId(userId);
    setSelectedUser(user);
    setShowRoleHistoryModal(true);
  };

  const submitGrantAdmin = () => {
    if (!selectedUserId || !grantAdminForm.reason.trim()) {
      toast.error("Sebep alanı zorunludur");
      return;
    }
    grantAdminMutation.mutate({
      id: selectedUserId,
      reason: grantAdminForm.reason,
      note: grantAdminForm.note,
    });
  };

  const submitRevokeAdmin = () => {
    if (!selectedUserId || !revokeAdminForm.reason.trim()) {
      toast.error("Sebep alanı zorunludur");
      return;
    }
    revokeAdminMutation.mutate({
      id: selectedUserId,
      reason: revokeAdminForm.reason,
      note: revokeAdminForm.note,
      convertToNormalUser: revokeAdminForm.convertToNormalUser,
    });
  };

  const submitRoleChange = () => {
    if (!selectedUserId || !roleChangeForm.reason.trim()) {
      toast.error("Sebep alanı zorunludur");
      return;
    }
    changeRoleMutation.mutate({
      id: selectedUserId,
      newRole: roleChangeForm.newRole,
      reason: roleChangeForm.reason,
    });
  };

  return (
    <div className="space-y-6 overflow-x-hidden px-2 sm:px-0">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center space-x-3">
          <div className="bg-red-100 p-3 rounded-full">
            <Shield className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              SuperAdmin Panel
            </h1>
            <p className="text-gray-600">
              Üst düzey sistem yönetimi ve admin yetkileri
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-4 sm:space-x-8 px-2 sm:px-6 overflow-x-auto scrollbar-thin scrollbar-thumb-dark-700/50 whitespace-nowrap">
            {tabConfig.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as SuperAdminTab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.key
                    ? "border-red-500 text-red-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Users Tab */}
          {activeTab === "users" && (
            <div className="space-y-6">
              {/* Header with Search */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <h3 className="text-lg font-semibold text-gray-900">
                  Kullanıcı Yönetimi
                </h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="İsim, email ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              {/* Users Grid */}
              {usersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
                </div>
              ) : users.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {users.map((user: any) => {
                    const roleInfo = getRoleInfo(user.role);
                    return (
                      <div
                        key={user.id}
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                      >
                        {/* Header */}
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="flex-shrink-0">
                            {user.profileImageUrl ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={user.profileImageUrl}
                                alt={`${user.firstName} ${user.lastName}`}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-red-400 to-pink-400 flex items-center justify-center">
                                <span className="text-sm font-medium text-white">
                                  {user.firstName?.[0]}
                                  {user.lastName?.[0]}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                              {user.firstName} {user.lastName}
                            </h4>
                            <p className="text-xs text-gray-500 truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>

                        {/* Role Badge */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${roleInfo.color}`}
                          >
                            <roleInfo.icon className="h-3 w-3 mr-1" />
                            {roleInfo.name}
                          </span>
                          {user.isBlocked && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <XCircle className="h-3 w-3 mr-1" />
                              Engelli
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        {user.role !== "SuperAdmin" && (
                          <div className="flex flex-wrap gap-2">
                            {/* Admin Actions */}
                            {user.role !== "Admin" ? (
                              <button
                                onClick={() => handleGrantAdmin(user.id, user)}
                                className="flex-1 inline-flex items-center justify-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                title="Admin Yetkisi Ver"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Admin Yap
                              </button>
                            ) : (
                              <button
                                onClick={() => handleRevokeAdmin(user.id, user)}
                                className="flex-1 inline-flex items-center justify-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                                title="Admin Yetkisi Kaldır"
                              >
                                <Minus className="h-3 w-3 mr-1" />
                                Admin Kaldır
                              </button>
                            )}

                            {/* Role Change */}
                            <button
                              onClick={() => handleRoleChange(user.id, user)}
                              className="flex-1 inline-flex items-center justify-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              title="Rol Değiştir"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Rol Değiştir
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">
                    Kullanıcı bulunamadı
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Arama kriterlerinizi değiştirmeyi deneyin.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Admins Tab */}
          {activeTab === "admins" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Admin Listesi
              </h3>

              {adminsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
                </div>
              ) : admins.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {admins.map((admin: any) => {
                    const roleInfo = getRoleInfo(admin.role);
                    return (
                      <div
                        key={admin.id}
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
                      >
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="flex-shrink-0">
                            {admin.profileImageUrl ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={admin.profileImageUrl}
                                alt={`${admin.firstName} ${admin.lastName}`}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center">
                                <span className="text-sm font-medium text-white">
                                  {admin.firstName?.[0]}
                                  {admin.lastName?.[0]}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                              {admin.firstName} {admin.lastName}
                            </h4>
                            <p className="text-xs text-gray-500 truncate">
                              {admin.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1 mb-3">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${roleInfo.color}`}
                          >
                            <roleInfo.icon className="h-3 w-3 mr-1" />
                            {roleInfo.name}
                          </span>
                        </div>

                        {admin.role !== "SuperAdmin" && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleRevokeAdmin(admin.id, admin)}
                              className="flex-1 inline-flex items-center justify-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                              <Minus className="h-3 w-3 mr-1" />
                              Yetki Kaldır
                            </button>
                            <button
                              onClick={() =>
                                handleShowRoleHistory(admin.id, admin)
                              }
                              className="flex-1 inline-flex items-center justify-center px-2 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                              <History className="h-3 w-3 mr-1" />
                              Geçmiş
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">
                    Admin bulunamadı
                  </h3>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Grant Admin Modal */}
      {showGrantAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50">
          <div className="bg-dark-800 rounded-xl shadow-2xl border border-dark-600 max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">
              Admin Yetkisi Ver
            </h3>
            <p className="text-sm text-gray-300 mb-4">
              <strong>
                {selectedUser?.firstName} {selectedUser?.lastName}
              </strong>{" "}
              kullanıcısına admin yetkisi verilecek.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Sebep (Zorunlu)
                </label>
                <textarea
                  value={grantAdminForm.reason}
                  onChange={(e) =>
                    setGrantAdminForm({
                      ...grantAdminForm,
                      reason: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-600 rounded-md focus:ring-red-500 focus:border-red-500 bg-dark-700 text-gray-100"
                  rows={3}
                  placeholder="Admin yetkisi verme sebebini açıklayın..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Not (Opsiyonel)
                </label>
                <textarea
                  value={grantAdminForm.note}
                  onChange={(e) =>
                    setGrantAdminForm({
                      ...grantAdminForm,
                      note: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-600 rounded-md focus:ring-red-500 focus:border-red-500 bg-dark-700 text-gray-100"
                  rows={2}
                  placeholder="Ek notlar..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowGrantAdminModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600"
              >
                İptal
              </button>
              <button
                onClick={submitGrantAdmin}
                disabled={grantAdminMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {grantAdminMutation.isPending
                  ? "Veriliyor..."
                  : "Admin Yetkisi Ver"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Admin Modal */}
      {showRevokeAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50">
          <div className="bg-dark-800 rounded-xl shadow-2xl border border-dark-600 max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">
              Admin Yetkisi Kaldır
            </h3>
            <p className="text-sm text-gray-300 mb-4">
              <strong>
                {selectedUser?.firstName} {selectedUser?.lastName}
              </strong>{" "}
              kullanıcısının admin yetkisi kaldırılacak.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Sebep (Zorunlu)
                </label>
                <textarea
                  value={revokeAdminForm.reason}
                  onChange={(e) =>
                    setRevokeAdminForm({
                      ...revokeAdminForm,
                      reason: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-600 rounded-md focus:ring-red-500 focus:border-red-500 bg-dark-700 text-gray-100"
                  rows={3}
                  placeholder="Admin yetkisi kaldırma sebebini açıklayın..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Not (Opsiyonel)
                </label>
                <textarea
                  value={revokeAdminForm.note}
                  onChange={(e) =>
                    setRevokeAdminForm({
                      ...revokeAdminForm,
                      note: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-600 rounded-md focus:ring-red-500 focus:border-red-500 bg-dark-700 text-gray-100"
                  rows={2}
                  placeholder="Ek notlar..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="convertToNormalUser"
                  checked={revokeAdminForm.convertToNormalUser}
                  onChange={(e) =>
                    setRevokeAdminForm({
                      ...revokeAdminForm,
                      convertToNormalUser: e.target.checked,
                    })
                  }
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="convertToNormalUser"
                  className="ml-2 block text-sm text-gray-300"
                >
                  Normal kullanıcıya çevir
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowRevokeAdminModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600"
              >
                İptal
              </button>
              <button
                onClick={submitRevokeAdmin}
                disabled={revokeAdminMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {revokeAdminMutation.isPending
                  ? "Kaldırılıyor..."
                  : "Yetkiyi Kaldır"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Change Modal */}
      {showRoleChangeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50">
          <div className="bg-dark-800 rounded-xl shadow-2xl border border-dark-600 max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">
              Rol Değiştir
            </h3>
            <p className="text-sm text-gray-300 mb-4">
              <strong>
                {selectedUser?.firstName} {selectedUser?.lastName}
              </strong>{" "}
              kullanıcısının rolü değiştirilecek.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Yeni Rol
                </label>
                <select
                  value={roleChangeForm.newRole}
                  onChange={(e) =>
                    setRoleChangeForm({
                      ...roleChangeForm,
                      newRole: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-600 rounded-md focus:ring-red-500 focus:border-red-500 bg-dark-700 text-gray-100"
                >
                  <option value={1}>Admin</option>
                  <option value={2}>VIP Kullanıcı</option>
                  <option value={3}>Normal Kullanıcı</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Sebep (Zorunlu)
                </label>
                <textarea
                  value={roleChangeForm.reason}
                  onChange={(e) =>
                    setRoleChangeForm({
                      ...roleChangeForm,
                      reason: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-600 rounded-md focus:ring-red-500 focus:border-red-500 bg-dark-700 text-gray-100"
                  rows={3}
                  placeholder="Rol değiştirme sebebini açıklayın..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowRoleChangeModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600"
              >
                İptal
              </button>
              <button
                onClick={submitRoleChange}
                disabled={changeRoleMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {changeRoleMutation.isPending
                  ? "Değiştiriliyor..."
                  : "Rolü Değiştir"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role History Modal */}
      {showRoleHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50">
          <div className="bg-dark-800 rounded-xl shadow-2xl border border-dark-600 max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">
              Rol Geçmişi - {selectedUser?.firstName} {selectedUser?.lastName}
            </h3>

            {roleHistoryLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
              </div>
            ) : roleHistory.length > 0 ? (
              <div className="space-y-4">
                {roleHistory.map((history: any, index: number) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            getRoleInfo(history.newRole).color
                          }`}
                        >
                          {getRoleInfo(history.newRole).name}
                        </span>
                        <span className="text-xs text-gray-500">←</span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            getRoleInfo(history.oldRole).color
                          }`}
                        >
                          {getRoleInfo(history.oldRole).name}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(history.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-1">
                      <strong>Sebep:</strong> {history.reason}
                    </p>
                    {history.note && (
                      <p className="text-sm text-gray-600">
                        <strong>Not:</strong> {history.note}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      İşlemi yapan: {history.changedByUserName}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <History className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  Rol geçmişi bulunamadı
                </h3>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowRoleHistoryModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
