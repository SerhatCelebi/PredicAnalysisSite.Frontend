import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, TrendingUp } from "lucide-react";
import { authApi, LoginRequest } from "../../lib/api";
import { useAuthStore } from "../../lib/store";
import { validateEmail } from "../../lib/utils";
import toast from "react-hot-toast";

interface LoginFormData {
  email: string;
  password: string;
}

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // URL'den hata mesajını al
  const urlError = searchParams.get("error");
  const urlMessage = searchParams.get("message");

  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );

  // Sayfa yüklendiğinde URL'den ve localStorage'dan hata mesajını al
  useEffect(() => {
    // Önce localStorage'dan hata mesajını kontrol et
    const storedError = localStorage.getItem("login_error");
    if (storedError) {
      setErrorMessage(storedError);
      localStorage.removeItem("login_error");
    }

    // Sonra URL'den hata mesajını kontrol et
    if (urlError || urlMessage) {
      const errorMsg =
        urlMessage || urlError || "Giriş yapılırken bir hata oluştu";
      setErrorMessage(errorMsg);

      // URL'den hata parametrelerini temizle
      setSearchParams({}, { replace: true });
    }
  }, [urlError, urlMessage, setSearchParams]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!formData.email) {
      newErrors.email = "Email adresi gerekli";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Geçerli bir email adresi giriniz";
    }

    if (!formData.password) {
      newErrors.password = "Şifre gerekli";
    } else if (formData.password.length < 6) {
      newErrors.password = "Şifre en az 6 karakter olmalı";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null); // Hata mesajını temizle

    try {
      const loginData: LoginRequest = {
        email: formData.email,
        password: formData.password,
      };

      const response = await authApi.login(loginData);
      const { user, token, refreshToken } = response.data;

      // Başarılı girişte localStorage'ı temizle
      localStorage.removeItem("login_error");

      login(user, token, refreshToken);
      toast.success(`Hoş geldin, ${user.firstName}!`);
      navigate("/");
    } catch (error: any) {
      // Backend'ten dönen hata mesajı varsa kullan, yoksa statü koduna göre Türkçe fallback mesaj göster
      let backendMessage: string | undefined = undefined;
      if (error?.response?.data) {
        if (typeof error.response.data === "string") {
          backendMessage = error.response.data;
        } else if (
          typeof error.response.data === "object" &&
          error.response.data.message
        ) {
          backendMessage = error.response.data.message;
        }
      }

      let errorMsg = "";

      if (backendMessage) {
        // Engellenmiş kullanıcıya özel teknik hata mesajı kontrolü
        if (
          backendMessage
            .toLowerCase()
            .includes("no authentication handler is registered") ||
          backendMessage.toLowerCase().includes("addauthentication") ||
          backendMessage.toLowerCase().includes("engellenmiştir") ||
          backendMessage.toLowerCase().includes("banned") ||
          backendMessage.toLowerCase().includes("blocked") ||
          backendMessage.toLowerCase().includes("hesabınız engellenmiştir")
        ) {
          errorMsg =
            "Hesabınız engellenmiştir ve siteye giriş yapamazsınız. Lütfen destek ile iletişime geçin.";
        } else {
          errorMsg = backendMessage;
        }
      } else if (
        error.response?.status === 400 ||
        error.response?.status === 401
      ) {
        errorMsg = "Kullanıcı adı veya şifre hatalı";
      } else if (error.code === "ECONNABORTED" || !error.response) {
        errorMsg =
          "Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.";
      } else {
        errorMsg = "Giriş yapılırken bir hata oluştu";
      }

      setErrorMessage(errorMsg);

      // Hata mesajını localStorage'a ve URL'ye ekle (sayfa yenilenmesi durumunda korunması için)
      localStorage.setItem("login_error", errorMsg);
      setSearchParams(
        {
          error: "true",
          message: errorMsg,
        },
        { replace: true }
      );

      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

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
          VurduGololdu'ya Giriş Yap
        </h2>
        <div className="mt-4 text-center">
          <Link
            to="/register"
            className="inline-block text-sm font-semibold text-primary-100 bg-primary-600/20 hover:bg-primary-600/30 border border-primary-500/50 px-4 py-2 rounded-lg shadow-md backdrop-blur-sm transition-all duration-200"
          >
            Hesabın yok mu? <span className="underline">Hemen Üye Ol</span>
          </Link>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass-effect rounded-xl py-8 px-4 shadow-2xl border border-dark-700/30 sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-200"
              >
                Email Adresi
              </label>
              <div className="mt-1">
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="input-field"
                  placeholder="ornek@email.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSubmit(e as any);
                    }
                  }}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-400">{errors.email}</p>
                )}
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-200"
              >
                Şifre
              </label>
              <div className="mt-1 relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="input-field pr-10"
                  placeholder="Şifrenizi giriniz"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSubmit(e as any);
                    }
                  }}
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
                <p className="mt-1 text-xs text-red-400">{errors.password}</p>
              )}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                  <p className="text-red-400 text-sm font-medium text-center">
                    {errorMessage}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setSearchParams({}, { replace: true });
                    localStorage.removeItem("login_error");
                  }}
                  className="mt-2 text-xs text-red-300 hover:text-red-200 transition-colors"
                >
                  Mesajı kapat
                </button>
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary flex justify-center py-3 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Giriş yapılıyor...</span>
                  </div>
                ) : (
                  "Giriş Yap"
                )}
              </button>
            </div>

            {/* Forgot Password */}
            <div className="text-center">
              <Link
                to="/forgot-password"
                className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
              >
                Şifremi unuttum
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
