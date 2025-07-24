import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  TrendingUp,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { authApi } from "../../lib/api";
import { validatePassword } from "../../lib/utils";
import toast from "react-hot-toast";

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);

  const token = searchParams.get("token");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    getValues,
  } = useForm<ResetPasswordFormData>();

  const watchPassword = watch("password");
  const watchConfirmPassword = watch("confirmPassword");

  // Token kontrolü
  useEffect(() => {
    if (!token) {
      setIsTokenValid(false);
      toast.error("Geçersiz şifre sıfırlama bağlantısı");
    } else {
      setIsTokenValid(true);
    }
  }, [token]);

  // Şifre uyumluluğunu kontrol et
  const passwordsMatch = !!(
    watchPassword &&
    watchConfirmPassword &&
    watchPassword === watchConfirmPassword
  );
  const passwordsDontMatch = !!(
    watchPassword &&
    watchConfirmPassword &&
    watchPassword !== watchConfirmPassword
  );

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      toast.error("Geçersiz token");
      return;
    }

    // Şifre kontrolü
    if (data.password !== data.confirmPassword) {
      toast.error("Şifreler eşleşmiyor");
      return;
    }

    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.isValid) {
      toast.error(
        passwordValidation.message || "Şifre gereksinimleri karşılanmıyor"
      );
      return;
    }

    setIsLoading(true);

    try {
      await authApi.resetPassword(token, data.password);
      toast.success("Şifreniz başarıyla sıfırlandı! Giriş yapabilirsiniz.");
      navigate("/login");
    } catch (error: any) {
      if (error.response?.status === 400) {
        toast.error("Admin onaylı token geçersiz veya süresi dolmuş");
      } else if (error.response?.status === 404) {
        toast.error("Geçersiz admin onaylı token");
      } else {
        toast.error("Şifre sıfırlanırken bir hata oluştu");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isTokenValid === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="bg-red-600 text-white p-3 rounded-xl shadow-lg">
              <AlertCircle className="h-8 w-8" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gradient">
            Geçersiz Bağlantı ❌
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="glass-effect rounded-xl py-8 px-4 shadow-2xl border border-dark-700/30 sm:px-10">
            <div className="text-center space-y-4">
              <div className="bg-red-500/20 text-red-400 p-4 rounded-lg border border-red-500/30">
                <p className="text-sm leading-relaxed">
                  Şifre sıfırlama bağlantısının süresi geçmiş veya bağlantı
                  geçersiz.
                  <br />
                  <br />
                  Lütfen yeni bir şifre sıfırlama talebinde bulunun.
                </p>
              </div>

              <div className="pt-4 space-y-3">
                <Link
                  to="/forgot-password"
                  className="w-full btn-primary flex justify-center py-3 px-4"
                >
                  Yeni Şifre Sıfırlama Talebi
                </Link>

                <Link
                  to="/login"
                  className="w-full btn-secondary flex justify-center py-3 px-4"
                >
                  Giriş Sayfasına Dön
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white p-3 rounded-xl shadow-lg">
            <TrendingUp className="h-8 w-8" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gradient">
          Yeni Şifre Oluştur
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Hesabınız için güçlü bir şifre belirleyin
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass-effect rounded-xl py-8 px-4 shadow-2xl border border-dark-700/30 sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Success Info */}
            <div className="bg-green-500/20 text-green-400 p-3 rounded-lg border border-green-500/30">
              <p className="text-xs leading-relaxed">
                ✅ Admin onaylı şifre sıfırlama token'ınız geçerli. Yeni
                şifrenizi belirleyebilirsiniz.
              </p>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-200"
              >
                Yeni Şifre
              </label>
              <div className="mt-1 relative">
                <input
                  {...register("password", {
                    required: "Şifre gerekli",
                    validate: (value) => {
                      const validation = validatePassword(value);
                      return validation.isValid || validation.message;
                    },
                  })}
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className="input-field pr-10"
                  placeholder="Güçlü bir şifre oluşturun"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-400">
                  {errors.password.message}
                </p>
              )}
              <div className="mt-2 text-xs text-gray-400">
                Şifre en az 8 karakter, büyük/küçük harf, rakam ve özel karakter
                içermeli
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-200"
              >
                Yeni Şifre Tekrarı
              </label>
              <div className="mt-1 relative">
                <input
                  {...register("confirmPassword", {
                    required: "Şifre tekrarı gerekli",
                    validate: (value) => {
                      const password = getValues("password");
                      return value === password || "Şifreler eşleşmiyor";
                    },
                  })}
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className="input-field pr-10"
                  placeholder="Şifrenizi tekrar giriniz"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>

              {/* Real-time şifre uyum kontrolü */}
              {passwordsMatch && (
                <div className="mt-1 flex items-center space-x-1 text-xs text-green-400">
                  <CheckCircle className="h-3 w-3" />
                  <span>Şifreler eşleşiyor</span>
                </div>
              )}
              {passwordsDontMatch && (
                <div className="mt-1 flex items-center space-x-1 text-xs text-red-400">
                  <AlertCircle className="h-3 w-3" />
                  <span>Şifreler eşleşmiyor</span>
                </div>
              )}

              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-400">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading || passwordsDontMatch}
                className="w-full btn-primary flex justify-center py-3 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Şifre güncelleniyor...</span>
                  </div>
                ) : (
                  "Şifreyi Güncelle"
                )}
              </button>
            </div>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-sm text-gray-400">
                Şifrenizi hatırladınız mı?{" "}
                <Link
                  to="/login"
                  className="font-medium text-primary-400 hover:text-primary-300 transition-colors"
                >
                  Giriş yapın
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
