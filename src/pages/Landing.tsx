import React from "react";
import { Link } from "react-router-dom";
import { TrendingUp, Star, Shield, Zap, Users, Trophy } from "lucide-react";

export const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-2">
              <div className="bg-primary-600 text-white p-2 rounded-lg">
                <TrendingUp className="h-6 w-6" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                VurduGololdu
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Giriş Yap
              </Link>
              <Link
                to="/register"
                className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700"
              >
                Üye Ol
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Tahminlerini Paylaş
            <span className="block text-primary-600">Kazanmaya Başla!</span>
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Spor, ekonomi, teknoloji ve daha birçok alanda tahminlerini paylaş.
            Diğer kullanıcılarla etkileşim kur ve başarılı tahminlerinle öne
            çık!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-700 transition-colors"
            >
              Hemen Başla
            </Link>
            <Link
              to="/login"
              className="border-2 border-primary-600 text-primary-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-50 transition-colors"
            >
              Giriş Yap
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Neden VurduGololdu?
            </h2>
            <p className="text-xl text-gray-600">
              En iyi tahmin deneyimi için tasarlandı
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Premium İçerik
              </h3>
              <p className="text-gray-600">
                VIP üyelikle özel tahminlere erişim sağla ve daha fazla kazan
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Güvenli Platform
              </h3>
              <p className="text-gray-600">
                Verileriniz güvende, ödemeleriniz korumalı ve hesaplarınız
                şifreli
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Anlık Bildirimler
              </h3>
              <p className="text-gray-600">
                Tahmin sonuçları, yorumlar ve önemli güncellemeler anında size
                ulaşır
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Sosyal Deneyim
              </h3>
              <p className="text-gray-600">
                Diğer kullanıcılarla etkileşim kur, yorum yap ve takip et
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Başarı Sıralaması
              </h3>
              <p className="text-gray-600">
                En başarılı tahmincilar arasında yer al ve ödüller kazan
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Çok Kategorili
              </h3>
              <p className="text-gray-600">
                Spor, ekonomi, teknoloji, siyaset ve daha birçok alanda tahmin
                yap
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-white mb-2">2,453</div>
              <div className="text-primary-100">Toplam Tahmin</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">1,892</div>
              <div className="text-primary-100">Aktif Kullanıcı</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">856</div>
              <div className="text-primary-100">Günlük Paylaşım</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">%87</div>
              <div className="text-primary-100">Doğruluk Oranı</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Hemen Katıl, Tahmin Yapmaya Başla!
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Ücretsiz üyelik ile sınırsız tahmin yapabilir ve topluluğun bir
            parçası olabilirsin.
          </p>

          <Link
            to="/register"
            className="bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-700 transition-colors inline-block"
          >
            Ücretsiz Üye Ol
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="bg-primary-600 text-white p-2 rounded-lg">
                <TrendingUp className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold">VurduGololdu</span>
            </div>
            <p className="text-gray-400 mb-8">
              En güvenilir tahmin platformu. Tahminlerini paylaş, etkileşim kur,
              kazan!
            </p>
            <p className="text-gray-500">
              &copy; 2024 VurduGololdu. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
