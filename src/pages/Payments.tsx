import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { paymentApi } from "../lib/api";
import {
  CreditCard,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Banknote,
  Crown,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";
import { formatDate, formatCurrency } from "../lib/utils";
import { TermsModal } from "../components/TermsModal";

type Tab = "packages" | "form" | "history";

interface Package {
  type: number;
  name: string;
  price: number;
  durationInMonths: number;
  description: string;
}

interface FormData {
  senderName: string;
  bankName: string;
  amount: number;
  transactionDate: string;
  transactionReference: string;
  note?: string;
  membershipType: number;
}

interface Notification {
  id: number;
  amount: number;
  status: "Pending" | "Approved" | "Rejected";
  createdAt: string;
  processedAt: string | null;
  adminNote: string | null;
}

const statusInfo = {
  Pending: {
    icon: <Clock className="h-5 w-5 text-yellow-500" />,
    text: "Beklemede",
    color: "bg-yellow-100 text-yellow-800",
  },
  Approved: {
    icon: <CheckCircle className="h-5 w-5 text-green-500" />,
    text: "Onaylandı",
    color: "bg-green-100 text-green-800",
  },
  Rejected: {
    icon: <XCircle className="h-5 w-5 text-red-500" />,
    text: "Reddedildi",
    color: "bg-red-100 text-red-800",
  },
};

export const Payments: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("packages");
  const queryClient = useQueryClient();

  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [formData, setFormData] = useState<FormData | null>(null);

  const { data: packages, isLoading: isLoadingPackages } = useQuery<Package[]>({
    queryKey: ["paymentPackages"],
    queryFn: paymentApi.getPackages,
  });

  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ["myPaymentNotifications"],
    queryFn: () => paymentApi.getMyNotifications({ page: 1, pageSize: 20 }),
    enabled: activeTab === "history",
  });

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>();

  const mutation = useMutation({
    mutationFn: (data: FormData) => paymentApi.createNotification(data),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["myPaymentNotifications"] });
      setActiveTab("history");
    },
    onError: () => {
      toast.error("Bildirim gönderilirken bir hata oluştu.");
    },
  });

  const handleFormSubmit = (data: FormData) => {
    setFormData(data);
    setIsTermsModalOpen(true);
  };

  const onAcceptTerms = () => {
    if (formData) {
      onSubmit(formData);
    }
    setIsTermsModalOpen(false);
  };

  const onSubmit = (data: FormData) => {
    const price =
      packages?.find((p) => p.type === data.membershipType)?.price || 0;
    mutation.mutate({
      ...data,
      amount: price,
    });
  };

  const selectPackage = (pkg: Package) => {
    setValue("membershipType", pkg.type);
    setActiveTab("form");
  };

  const renderPackages = () => (
    <>
      <div className="card p-6 mb-6 bg-dark-800/50 border border-dark-700/50 text-sm text-gray-300 shadow-inner">
        <h3 className="text-lg font-semibold mb-3 text-gray-100 flex items-center space-x-2">
          <Banknote className="h-5 w-5 text-green-400" />
          <span>Banka Havalesi Talimatları</span>
        </h3>
        <ul className="space-y-1 ml-4 list-disc">
          <li>
            <strong>Banka Adı:</strong> Ziraat Bankası
          </li>
          <li>
            <strong>IBAN:</strong> TR05 0001 0000 5022 1412 4000 00
          </li>
          <li>
            <strong>Alıcı Adı Soyadı:</strong> Serhat Çelebi
          </li>
          <li>
            <strong>Açıklama:</strong> <u>Boş bırakılmalıdır</u>
          </li>
          <li>
            Ödemeyi tamamladıktan sonra{" "}
            <strong>
              aynı sayfada yer alan <u>Ödeme Bildirim Formu</u>
            </strong>
            'nu mutlaka doldurun; aksi hâlde ödemeniz onay sürecine alınamaz.
          </li>
          <li>
            Dekontu yükledikten sonra ödeme, admin onayına kadar
            <em>"Beklemede"</em> statüsünde gözükecektir.
          </li>
        </ul>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoadingPackages ? (
          <p>Paketler yükleniyor...</p>
        ) : (
          packages?.map((pkg) => (
            <div key={pkg.type} className="card p-6 flex flex-col">
              <div className="flex-grow">
                <div className="flex items-center space-x-2 mb-3">
                  <Crown className="h-6 w-6 text-yellow-500" />
                  <h3 className="text-xl font-bold text-gray-900">
                    {pkg.name}
                  </h3>
                </div>
                <p className="text-3xl font-bold text-primary-600 mb-2">
                  {formatCurrency(pkg.price)}
                </p>
                <p className="text-gray-600 mb-4">{pkg.description}</p>
              </div>
              <button
                onClick={() => selectPackage(pkg)}
                className="btn-primary mt-4 w-full"
              >
                Bu Paketi Seç
              </button>
            </div>
          ))
        )}
      </div>
    </>
  );

  const renderForm = () => (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="space-y-6 card p-8 max-w-2xl mx-auto"
    >
      <h2 className="text-2xl font-bold text-center">Ödeme Bildirim Formu</h2>
      <InputField
        name="senderName"
        label="Adınız Soyadınız"
        control={control}
        errors={errors}
      />
      <InputField
        name="bankName"
        label="Banka Adı"
        control={control}
        errors={errors}
      />
      <InputField
        name="transactionDate"
        label="İşlem Tarihi"
        type="date"
        control={control}
        errors={errors}
      />
      <InputField
        name="transactionReference"
        label="Dekont/Referans No"
        control={control}
        errors={errors}
      />
      <InputField
        name="note"
        label="Not (isteğe bağlı)"
        control={control}
        errors={errors}
        isRequired={false}
      />
      <button
        type="submit"
        disabled={mutation.isPending}
        className="btn-primary w-full flex items-center justify-center space-x-2"
      >
        <Send className="h-5 w-5" />
        <span>
          {mutation.isPending ? "Gönderiliyor..." : "Bildirimi Gönder"}
        </span>
      </button>
    </form>
  );

  const renderHistory = () => (
    <div className="card p-6">
      <h2 className="text-xl font-bold mb-4">Ödeme Bildirimlerim</h2>
      {isLoadingHistory ? (
        <p>Geçmiş yükleniyor...</p>
      ) : (
        <div className="space-y-4">
          {historyData?.notifications.map((n: Notification) => (
            <div
              key={n.id}
              className="p-4 border rounded-lg flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">
                  {formatCurrency(n.amount)} -{" "}
                  <span className="text-sm text-gray-500">
                    {formatDate(n.createdAt)}
                  </span>
                </p>
                <div
                  className={`flex items-center space-x-2 mt-1 px-2 py-1 rounded-full text-sm font-medium ${
                    statusInfo[n.status].color
                  }`}
                >
                  {statusInfo[n.status].icon}
                  <span>{statusInfo[n.status].text}</span>
                </div>
                {n.adminNote && (
                  <p className="text-xs text-gray-500 mt-2">
                    Admin Notu: {n.adminNote}
                  </p>
                )}
              </div>
            </div>
          ))}
          {historyData?.notifications.length === 0 && (
            <p>Daha önce bildirimde bulunmadınız.</p>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="space-y-6">
        <div className="card p-6 text-center">
          <Banknote className="mx-auto h-12 w-12 text-primary-600" />
          <h1 className="text-3xl font-bold mt-4">VIP Üyelik</h1>
          <p className="text-gray-600 mt-2">
            VIP üye olarak tüm ücretli tahminlere erişim sağlayın.
          </p>
        </div>

        <div className="card">
          <div className="border-b">
            <nav className="flex justify-center space-x-4 p-4">
              <TabButton
                label="Paketler"
                isActive={activeTab === "packages"}
                onClick={() => setActiveTab("packages")}
              />
              <TabButton
                label="Bildirim Formu"
                isActive={activeTab === "form"}
                onClick={() => setActiveTab("form")}
              />
              <TabButton
                label="Geçmiş"
                isActive={activeTab === "history"}
                onClick={() => setActiveTab("history")}
              />
            </nav>
          </div>
          <div className="p-6">
            {activeTab === "packages" && renderPackages()}
            {activeTab === "form" && renderForm()}
            {activeTab === "history" && renderHistory()}
          </div>
        </div>
        <div className="card p-6 bg-blue-50 border border-blue-200">
          <div className="flex items-start space-x-3">
            <Info className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-800">Nasıl Çalışır?</h3>
              <p className="text-sm text-blue-700 mt-1">
                1. Yukarıdaki paketlerden birini seçin ve banka hesabımıza
                EFT/Havale yapın.
                <br />
                2. Ödeme sonrası "Bildirim Formu" sekmesinden gerekli bilgileri
                doldurarak bize gönderin.
                <br />
                3. Bildiriminiz en kısa sürede incelenip onaylanacak ve VIP
                üyeliğiniz aktif edilecektir.
                <br />
                4. Süreci "Geçmiş" sekmesinden takip edebilirsiniz.
              </p>
            </div>
          </div>
        </div>
      </div>
      <TermsModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        onAccept={onAcceptTerms}
        isAccepted={termsAccepted}
        setIsAccepted={setTermsAccepted}
        title="Abonelik Şartları ve Kuralları"
      />
    </>
  );
};

interface InputFieldProps {
  name: keyof FormData;
  label: string;
  control: any;
  errors: any;
  type?: string;
  isRequired?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({
  name,
  label,
  control,
  errors,
  type = "text",
  isRequired = true,
}) => (
  <div className="flex flex-col space-y-2">
    <label htmlFor={name} className="font-medium">
      {label} {isRequired && <span className="text-red-500">*</span>}
    </label>
    <Controller
      name={name}
      control={control}
      rules={{ required: isRequired }}
      render={({ field }) => (
        <input
          {...field}
          id={name}
          type={type}
          className={`input ${errors[name] ? "input-error" : ""}`}
        />
      )}
    />
    {errors[name] && (
      <p className="text-red-500 text-sm">{label} alanı zorunludur.</p>
    )}
  </div>
);

interface TabButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
      isActive ? "bg-primary-600 text-white" : "text-gray-600 hover:bg-gray-100"
    }`}
  >
    {label}
  </button>
);
