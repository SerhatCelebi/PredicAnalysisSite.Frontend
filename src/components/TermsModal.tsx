import React from "react";
import { X } from "lucide-react";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  isAccepted: boolean;
  setIsAccepted: (value: boolean) => void;
  title: string;
}

export const TermsModal: React.FC<TermsModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  isAccepted,
  setIsAccepted,
  title,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Tam opak koyu arka plan */}
      <div className="fixed inset-0 bg-black bg-opacity-90" />
      <div className="relative bg-dark-800 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col z-10 border border-dark-600">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-4">
          <h3 className="text-lg font-semibold">Yasal Uyarı</h3>
          <p className="text-sm text-gray-600">
            vurdugololdu.com 18 yaşından küçük kullanıcılara yönelik değildir.
            vurdugololdu.com'da bahis oynatılmaz. vurdugololdu.com analiz ve
            tahmin için veri tabanı sunan, resmi iddaa bülteninde yer alan
            müsabakalarla ilgili istatistiki bilgilere göre analiz, yorum ve
            görüşler içeren bir web sitesidir.
          </p>
          <h3 className="text-lg font-semibold">Onam ve Kabul</h3>
          <p className="text-sm text-gray-600">
            Bu onam formu vurdugololdu.com kullanımına ilişkin sorumluluk
            reddini içerir.
          </p>
          <p className="text-sm text-gray-600">
            Bu site, analiz ve tahmin platformudur. Yapılan tahminler ve
            analizler dahil olmak üzere, web sitemizi veya hizmetlerimizi
            kullanımınızdan doğan veya bunlarla bağlantılı olan herhangi bir
            talep, zarar, kayıp veya masraftan sorumlu olmayacağız, üye olup
            abonelik aldığınızda bunu kabul etmiş sayılacaksınız. Siteyi
            kullanarak, bu sorumluluk reddini okuduğunuzu ve anladığınızı ve bu
            koşullara uymayı kabul ettiğinizi belirtmiş olursunuz.
          </p>
          <p className="text-sm text-gray-600">
            vurdugololdu.com sitesinde yer alan analiz ve tahminlerin yatırım
            tavsiyesi olmadığını, bilgilendirme amaçlı olduğunu, kullanıcıya
            veri tabanı sunduğunu biliyor; Bu çerçevede tahmin, analiz ve
            yorumlardan faydalanacağımı, yaptığım tercihlerden, aldığım
            kararlardan sorumlu olduğumu, olumlu veya olumsuz sonuçlarına
            katlanacağımı kabul ediyorum.
          </p>
          <p className="text-sm text-gray-600">
            vurdugololdu.com sitesine isteyerek üye olduğumu, siteden üyelik ve
            abonelik seçeneği çerçevesinde faydalanabileceğimi, dijital içerik
            olduğu için abonelik ücretimin iade edilmeyeceğini biliyor, şartları
            ve kuralları kabul ettiğimi beyan ediyorum.
          </p>
        </div>
        <div className="p-4 border-t space-y-4">
          <div className="flex items-center">
            <input
              id="terms-accept"
              type="checkbox"
              checked={isAccepted}
              onChange={(e) => setIsAccepted(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label
              htmlFor="terms-accept"
              className="ml-2 block text-sm text-gray-900"
            >
              Okudum, anladım ve kabul ediyorum.
            </label>
          </div>
          <div className="flex justify-end space-x-3">
            <button onClick={onClose} className="btn-secondary">
              İptal
            </button>
            <button
              onClick={onAccept}
              disabled={!isAccepted}
              className="btn-primary"
            >
              Onayla ve Devam Et
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
