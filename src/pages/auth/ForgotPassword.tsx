import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { TrendingUp, ArrowLeft, Mail } from "lucide-react";
import { authApi } from "../../lib/api";
import { validateEmail } from "../../lib/utils";
import toast from "react-hot-toast";

interface ForgotPasswordFormData {
  email: string;
}

export const ForgotPassword: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>();

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);

    try {
      await authApi.forgotPassword(data.email);
      setIsSuccess(true);
      toast.success(
        "Şifre sıfırlama talebiniz alınmıştır. Admin onayı bekleniyor."
      );
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast.error("Bu email adresi ile kayıtlı hesap bulunamadı");
      } else {
        toast.error("Bir hata oluştu. Lütfen tekrar deneyin.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white p-3 rounded-xl shadow-lg">
              <Mail className="h-8 w-8" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gradient">
            Talep Alındı! 📋
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="glass-effect rounded-xl py-8 px-4 shadow-2xl border border-dark-700/30 sm:px-10">
            <div className="text-center space-y-4">
              <div className="bg-green-500/20 text-green-400 p-4 rounded-lg border border-green-500/30">
                <p className="text-sm leading-relaxed">
                  Şifre sıfırlama talebiniz başarıyla alınmıştır.
                  <br />
                  <br />
                  Admin onayından sonra size bilgi verilecektir.
                  <br />
                  <br />
                  Lütfen sabırla bekleyin.
                </p>
              </div>

              <div className="pt-4">
                <Link
                  to="/login"
                  className="w-full btn-primary flex justify-center py-3 px-4"
                >
                  Giriş Sayfasına Dön
                </Link>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-400">
                  Email almadınız mı?{" "}
                  <button
                    onClick={() => setIsSuccess(false)}
                    className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
                  >
                    Tekrar gönder
                  </button>
                </p>
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
          Şifremi Unuttum
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Email adresinizi girin, şifre sıfırlama bağlantısı gönderelim
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass-effect rounded-xl py-8 px-4 shadow-2xl border border-dark-700/30 sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Back to Login */}
            <div className="flex items-center">
              <Link
                to="/login"
                className="flex items-center space-x-2 text-gray-400 hover:text-gray-200 transition-colors text-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Giriş sayfasına dön</span>
              </Link>
            </div>

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
                  {...register("email", {
                    required: "Email adresi gerekli",
                    validate: (value) =>
                      validateEmail(value) ||
                      "Geçerli bir email adresi giriniz",
                  })}
                  type="email"
                  autoComplete="email"
                  className="input-field"
                  placeholder="ornek@email.com"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-400">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="bg-blue-500/20 text-blue-400 p-3 rounded-lg border border-blue-500/30">
              <p className="text-xs leading-relaxed">
                💡 Kayıtlı email adresinizi girin. Şifre sıfırlama talebiniz
                admin onayından sonra işleme alınacaktır.
              </p>
            </div>

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
                    <span>Gönderiliyor...</span>
                  </div>
                ) : (
                  "Şifre Sıfırlama Bağlantısı Gönder"
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
