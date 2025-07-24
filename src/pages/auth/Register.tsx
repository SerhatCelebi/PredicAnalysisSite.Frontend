import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  Eye,
  EyeOff,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { authApi, captchaApi, RegisterRequest } from "../../lib/api";
import { generateId, validateEmail, validatePassword } from "../../lib/utils";
import toast from "react-hot-toast";
import { TermsModal } from "../../components/TermsModal";
import { useRef } from "react";

interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  captchaCode: string;
  terms: boolean;
}

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [captchaImage, setCaptchaImage] = useState<string>("");
  const [captchaSessionId, setCaptchaSessionId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [formData, setFormData] = useState<RegisterFormData | null>(null);
  const [emailCheck, setEmailCheck] = useState<
    null | "checking" | "exists" | "available"
  >(null);
  const [emailCheckMsg, setEmailCheckMsg] = useState<string>("");
  const emailCheckTimeout = useRef<NodeJS.Timeout | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    getValues,
  } = useForm<RegisterFormData>();

  const watchPassword = watch("password");
  const watchConfirmPassword = watch("confirmPassword");

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

  const generateCaptcha = useCallback(async () => {
    setCaptchaLoading(true);
    try {
      const sessionId = generateId();
      const response = await captchaApi.generate(sessionId);
      setCaptchaImage(response.data.imageBase64);
      setCaptchaSessionId(sessionId);
      setValue("captchaCode", ""); // Clear captcha input
    } catch (error) {
      toast.error("Captcha yüklenirken hata oluştu");
    } finally {
      setCaptchaLoading(false);
    }
  }, [setValue]);

  // Generate captcha on component mount
  useEffect(() => {
    generateCaptcha();
  }, [generateCaptcha]);

  // Email kontrolü (debounce)
  const emailValue = watch("email");
  useEffect(() => {
    if (!emailValue || !validateEmail(emailValue)) {
      setEmailCheck(null);
      setEmailCheckMsg("");
      return;
    }
    setEmailCheck("checking");
    setEmailCheckMsg("");
    if (emailCheckTimeout.current) clearTimeout(emailCheckTimeout.current);
    emailCheckTimeout.current = setTimeout(async () => {
      try {
        const res = await authApi.checkEmail(emailValue);
        if (res.data.isAvailable === false) {
          setEmailCheck("exists");
          setEmailCheckMsg("Bu email zaten kullanılıyor.");
        } else if (res.data.isAvailable === true) {
          setEmailCheck("available");
          setEmailCheckMsg("Email kullanılabilir.");
        } else {
          setEmailCheck(null);
          setEmailCheckMsg("");
        }
      } catch {
        setEmailCheck(null);
        setEmailCheckMsg("");
      }
    }, 500);
    // eslint-disable-next-line
  }, [emailValue]);

  const handleFormSubmit = (data: RegisterFormData) => {
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

    setFormData(data);
    setIsTermsModalOpen(true);
  };

  const onAcceptTerms = async () => {
    setTermsAccepted(true);
    setValue("terms", true);
    if (formData) {
      await onSubmit(formData);
    }
    setIsTermsModalOpen(false);
  };

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);

    try {
      const registerData: RegisterRequest = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        phone: data.phone,
        captchaSessionId,
        captchaCode: data.captchaCode,
      };

      await authApi.register(registerData);
      toast.success("Kayıt başarılı! Hesabınız aktif edildi.");
      navigate("/login");
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error("Bu email adresi zaten kullanılıyor");
      } else if (error.response?.status === 422) {
        toast.error("Captcha kodu hatalı");
        generateCaptcha(); // Refresh captcha
      } else if (error.response?.data?.errors) {
        const errorMessages = Object.values(error.response.data.errors).flat();
        toast.error(errorMessages[0] as string);
      } else {
        toast.error("Kayıt olurken bir hata oluştu");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white p-3 rounded-xl shadow-lg">
              <TrendingUp className="h-8 w-8" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gradient">
            VurduGololdu'ya Üye Ol
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Zaten hesabın var mı?{" "}
            <Link
              to="/login"
              className="font-medium text-primary-400 hover:text-primary-300 transition-colors"
            >
              Giriş yap
            </Link>
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="glass-effect rounded-xl py-8 px-4 shadow-2xl border border-dark-700/30 sm:px-10">
            <form
              className="space-y-6"
              onSubmit={handleSubmit(handleFormSubmit)}
            >
              {/* First Name & Last Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-gray-200"
                  >
                    Ad
                  </label>
                  <div className="mt-1">
                    <input
                      {...register("firstName", {
                        required: "Ad gerekli",
                        minLength: {
                          value: 2,
                          message: "Ad en az 2 karakter olmalı",
                        },
                        maxLength: {
                          value: 50,
                          message: "Ad en fazla 50 karakter olabilir",
                        },
                      })}
                      type="text"
                      className="input-field"
                      placeholder="Adınız"
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-xs text-red-400">
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-gray-200"
                  >
                    Soyad
                  </label>
                  <div className="mt-1">
                    <input
                      {...register("lastName", {
                        required: "Soyad gerekli",
                        minLength: {
                          value: 2,
                          message: "Soyad en az 2 karakter olmalı",
                        },
                        maxLength: {
                          value: 50,
                          message: "Soyad en fazla 50 karakter olabilir",
                        },
                      })}
                      type="text"
                      className="input-field"
                      placeholder="Soyadınız"
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-xs text-red-400">
                        {errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>
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
                  {emailCheck === "checking" && (
                    <p className="mt-1 text-xs text-blue-400">
                      Email kontrol ediliyor...
                    </p>
                  )}
                  {emailCheck === "exists" && (
                    <p className="mt-1 text-xs text-red-400">{emailCheckMsg}</p>
                  )}
                  {emailCheck === "available" && (
                    <p className="mt-1 text-xs text-green-400">
                      {emailCheckMsg}
                    </p>
                  )}
                </div>
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-200"
                >
                  Telefon (Opsiyonel)
                </label>
                <div className="mt-1">
                  <input
                    {...register("phone")}
                    type="tel"
                    className="input-field"
                    placeholder="05XXXXXXXXX"
                  />
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
                  Şifre en az 8 karakter, büyük/küçük harf, rakam ve özel
                  karakter içermeli
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-200"
                >
                  Şifre Tekrarı
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
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Şifreler eşleşiyor</span>
                  </div>
                )}
                {passwordsDontMatch && (
                  <div className="mt-1 flex items-center space-x-1 text-xs text-red-400">
                    <XCircle className="h-3 w-3" />
                    <span>Şifreler eşleşmiyor</span>
                  </div>
                )}
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-400">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Captcha */}
              <div>
                <label className="block text-sm font-medium text-gray-200">
                  Güvenlik Kodu
                </label>
                <div className="mt-1 flex space-x-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="bg-gradient-to-br from-dark-700 to-dark-900 p-3 rounded-xl border-2 border-primary-700 shadow-lg min-w-[120px] min-h-[50px] flex items-center justify-center select-none">
                        {captchaLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                        ) : captchaImage ? (
                          <img
                            src={captchaImage}
                            alt="Captcha"
                            className="max-w-[120px] max-h-[50px] object-contain"
                            style={{ filter: "drop-shadow(0 1px 4px #0008)" }}
                          />
                        ) : (
                          <span className="text-gray-400 text-xs">
                            Captcha yükleniyor...
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={generateCaptcha}
                        disabled={captchaLoading}
                        className="p-2 text-primary-400 hover:text-primary-200 disabled:opacity-50 transition-colors"
                        title="Yenile"
                      >
                        <RefreshCw
                          className={`h-5 w-5 ${
                            captchaLoading ? "animate-spin" : ""
                          }`}
                        />
                      </button>
                    </div>
                    <input
                      {...register("captchaCode", {
                        required: "Güvenlik kodu gerekli",
                        minLength: {
                          value: 4,
                          message: "Güvenlik kodu en az 4 karakter olmalı",
                        },
                      })}
                      type="text"
                      className="input-field"
                      placeholder="Güvenlik kodunu giriniz"
                      maxLength={6}
                    />
                    {errors.captchaCode && (
                      <p className="mt-1 text-xs text-red-400">
                        {errors.captchaCode.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-center">
                <input
                  {...register("terms", {
                    required: "Kullanım şartlarını kabul etmelisiniz",
                  })}
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-600 rounded bg-dark-700"
                  checked={termsAccepted}
                  onChange={(e) => {
                    setTermsAccepted(e.target.checked);
                    setValue("terms", e.target.checked);
                  }}
                />
                <label className="ml-2 block text-sm text-gray-300">
                  <span
                    className="text-primary-400 hover:text-primary-300 cursor-pointer"
                    onClick={() => setIsTermsModalOpen(true)}
                  >
                    Kullanım şartlarını
                  </span>{" "}
                  kabul ediyorum
                </label>
              </div>
              {errors.terms && (
                <p className="text-xs text-red-400">{errors.terms.message}</p>
              )}

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
                      <span>Kayıt olunuyor...</span>
                    </div>
                  ) : (
                    "Üye Ol"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <TermsModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        onAccept={onAcceptTerms}
        isAccepted={termsAccepted}
        setIsAccepted={setTermsAccepted}
        title="Üyelik Şartları ve Kuralları"
      />
    </>
  );
};
