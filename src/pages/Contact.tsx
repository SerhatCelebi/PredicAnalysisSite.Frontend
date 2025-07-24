import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { contactApi, ContactMessage } from "../lib/api";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageCircle,
  Clock,
  CheckCircle,
  User,
  HelpCircle,
  AlertCircle,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import { formatRelativeTime } from "../lib/utils";

export const Contact: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"new" | "history">("new");

  // Fetch user's contact messages
  const { data: messagesData, isLoading } = useQuery({
    queryKey: ["contact-messages"],
    queryFn: () => contactApi.getMyMessages({ page: 1, pageSize: 20 }),
    enabled: activeTab === "history",
  });

  const messages: ContactMessage[] = messagesData?.data?.messages || [];

  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  // Submit contact message mutation
  const submitMessageMutation = useMutation({
    mutationFn: contactApi.send,
    onSuccess: () => {
      toast.success("Mesajınız başarıyla gönderildi!");
      setContactForm({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
      queryClient.invalidateQueries({ queryKey: ["contact-messages"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Mesaj gönderilemedi");
    },
  });

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: contactApi.delete,
    onSuccess: () => {
      toast.success("Mesaj silindi");
      queryClient.invalidateQueries({ queryKey: ["contact-messages"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Mesaj silinemedi");
    },
  });

  const handleSubmitMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !contactForm.name ||
      !contactForm.email ||
      !contactForm.subject ||
      !contactForm.message
    ) {
      toast.error("Lütfen gerekli alanları doldurun");
      return;
    }

    submitMessageMutation.mutate(contactForm);
  };

  const handleDeleteMessage = (messageId: number) => {
    if (window.confirm("Bu mesajı silmek istediğinizden emin misiniz?")) {
      deleteMessageMutation.mutate(messageId);
    }
  };

  const contactInfo = [
    {
      icon: Mail,
      title: "E-posta",
      value: "admin@vurdugololdu.com",
      description: "Genel sorularınız için",
    },
    {
      icon: Phone,
      title: "Telefon",
      value: "+90 (532) 123 45 67",
      description: "Acil durumlar için",
    },
    {
      icon: MapPin,
      title: "Adres",
      value: "İstanbul, Türkiye",
      description: "Merkez ofisimiz",
    },
  ];

  const faqItems = [
    {
      question: "VIP üyelik nasıl alınır?",
      answer:
        "Ödemeler sayfasından ödeme bildiriminde bulunarak VIP üyelik alabilirsiniz.",
    },
    {
      question: "Tahminlerime nasıl katılırım?",
      answer:
        "Ana sayfadan veya tahminler sayfasından istediğiniz tahmini seçip katılabilirsiniz.",
    },
    {
      question: "Hesabımı nasıl silebilirim?",
      answer: "Hesap silme talebi için lütfen bizimle iletişime geçin.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">İletişim</h1>
          <p className="text-gray-600 mt-1">
            Sorularınız ve önerileriniz için bizimle iletişime geçin
          </p>
        </div>
      </div>

      {/* Contact Info Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {contactInfo.map((info, index) => (
          <div key={index} className="card p-6 text-center">
            <div className="bg-primary-100 rounded-full p-3 w-fit mx-auto mb-4">
              <info.icon className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{info.title}</h3>
            <p className="text-primary-600 font-medium mb-2">{info.value}</p>
            <p className="text-sm text-gray-500">{info.description}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab("new")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "new"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Send className="h-4 w-4 mr-2 inline" />
              Yeni Mesaj
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "history"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <MessageCircle className="h-4 w-4 mr-2 inline" />
              Mesaj Geçmişi
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* New Message Tab */}
          {activeTab === "new" && (
            <div className="max-w-2xl mx-auto">
              <form onSubmit={handleSubmitMessage} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ad Soyad *
                    </label>
                    <input
                      type="text"
                      placeholder="Adınız Soyadınız"
                      value={contactForm.name}
                      onChange={(e) =>
                        setContactForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      E-posta *
                    </label>
                    <input
                      type="email"
                      placeholder="ornek@eposta.com"
                      value={contactForm.email}
                      onChange={(e) =>
                        setContactForm((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    placeholder="05XXXXXXXXX"
                    value={contactForm.phone}
                    onChange={(e) =>
                      setContactForm((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Konu *
                  </label>
                  <select
                    value={contactForm.subject}
                    onChange={(e) =>
                      setContactForm((prev) => ({
                        ...prev,
                        subject: e.target.value,
                      }))
                    }
                    className="input-field"
                    required
                  >
                    <option value="">Bir konu seçin</option>
                    <option value="Teknik Destek">Teknik Destek</option>
                    <option value="VIP Üyelik">VIP Üyelik</option>
                    <option value="Ödeme Sorunu">Ödeme Sorunu</option>
                    <option value="Hesap Sorunu">Hesap Sorunu</option>
                    <option value="Öneri">Öneri</option>
                    <option value="Şikayet">Şikayet</option>
                    <option value="Diğer">Diğer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mesaj *
                  </label>
                  <textarea
                    placeholder="Mesajınızı detaylı bir şekilde yazın..."
                    value={contactForm.message}
                    onChange={(e) =>
                      setContactForm((prev) => ({
                        ...prev,
                        message: e.target.value,
                      }))
                    }
                    rows={6}
                    className="input-field"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitMessageMutation.isPending}
                  className="w-full btn-primary disabled:opacity-50"
                >
                  {submitMessageMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Gönderiliyor...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Mesajı Gönder
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Message History Tab */}
          {activeTab === "history" && (
            <div>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                </div>
              ) : messages.length > 0 ? (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-900">
                            {message.subject}
                          </h3>
                          <div className="flex items-center space-x-2">
                            {message.isRead ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Okundu
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <Clock className="h-3 w-3 mr-1" />
                                Yeni
                              </span>
                            )}
                            {message.isReplied ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                <MessageCircle className="h-3 w-3 mr-1" />
                                Yanıtlandı
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <Clock className="h-3 w-3 mr-1" />
                                Bekliyor
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">
                            {formatRelativeTime(message.createdAt)}
                          </span>
                          <button
                            onClick={() => handleDeleteMessage(message.id)}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Mesajı sil"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-3">{message.message}</p>
                      {message.adminReply && (
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mt-3">
                          <div className="flex items-center space-x-2 mb-1">
                            <User className="h-4 w-4 text-blue-600" />
                            <p className="text-sm font-medium text-blue-900">
                              Admin Yanıtı:
                            </p>
                            {message.repliedAt && (
                              <span className="text-xs text-blue-700">
                                {formatRelativeTime(message.repliedAt)}
                              </span>
                            )}
                          </div>
                          <p className="text-blue-800">{message.adminReply}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">
                    Henüz mesaj yok
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    İlk mesajınızı göndermek için "Yeni Mesaj" sekmesini
                    kullanın.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="card p-6">
        <div className="flex items-center space-x-2 mb-4">
          <HelpCircle className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Sık Sorulan Sorular
          </h2>
        </div>

        <div className="space-y-4">
          {faqItems.map((item, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">
                {item.question}
              </h3>
              <p className="text-gray-600">{item.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
