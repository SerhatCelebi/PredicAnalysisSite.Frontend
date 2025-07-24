# VurduGololdu Frontend

VurduGololdu spor tahmin platformunun modern React TypeScript frontend uygulaması.

## 📱 Proje Hakkında

VurduGololdu, kullanıcıların spor tahminlerini paylaşabildiği, VIP üyelik sistemi ile premium içeriklere erişim sağlayabildiği ve sosyal etkileşim özellikleri bulunan bir platformdur.

## 🚀 Özellikler

### 👤 Kullanıcı Sistemi

- **Kayıt/Giriş**: Email doğrulama ile güvenli üyelik
- **Profil Yönetimi**: Profil resmi yükleme, bilgi güncelleme
- **Rol Sistemi**: SuperAdmin, Admin, VipUser, NormalUser, Guest
- **VIP Üyelik**: Aylık, 3 aylık, 6 aylık paketler (1000₺/ay, 2250₺/3ay, 3900₺/6ay)
- **Şifre Sıfırlama**: Güvenli şifre sıfırlama sistemi

### 🎯 Tahmin Sistemi

- **Ücretsiz/Ücretli Tahminler**: Karma içerik modeli
- **Görsel Destekli**: Çoklu resim yükleme desteği
- **Reaksiyon Sistemi**: 6 farklı reaksiyon türü (👍 Like, ❤️ Love, 😂 Laugh, 😠 Angry, 😢 Sad, 😮 Wow)
- **Sonuç Takibi**: Tahmin doğruluk oranları
- **Sabitlenmiş Tahminler**: Öne çıkan içerikler
- **Özel Tahminler**: VIP kullanıcılar için özel içerikler

### 📰 Günlük Postlar

- **Kategori Sistemi**: Organize edilmiş içerik
- **Etiket Sistemi**: Gelişmiş filtreleme
- **Medya Desteği**: Resim ve içerik yönetimi
- **Sosyal Etkileşim**: Beğeni ve yorum sistemi

### 💬 Sosyal Özellikler

- **Yorum Sistemi**: Resimli yorum desteği
- **Beğeni Sistemi**: Detaylı reaksiyon takibi
- **Bildirim Sistemi**: Gerçek zamanlı bildirimler
- **Paylaşım**: Sosyal medya entegrasyonu

### 👨‍💼 Yönetim Paneli

- **Admin Dashboard**: Kapsamlı yönetim araçları
- **Kullanıcı Yönetimi**: Blokla/engeli kaldır, rol değiştir
- **İçerik Yönetimi**: Tahmin ve post moderasyonu
- **Ödeme Yönetimi**: VIP üyelik işlemleri
- **Analitik**: Detaylı istatistikler ve raporlar
- **Audit Log**: Sistem aktivite kayıtları

### 💰 Ödeme Sistemi

- **Ödeme Bildirimleri**: Banka havalesi bildirimi
- **Otomatik VIP**: Onaylanan ödemeler sonrası otomatik aktivasyon
- **Geçmiş Takibi**: Ödeme geçmişi ve durumları

## 🛠 Teknoloji Stack

### Frontend

- **React 18** - Modern React framework
- **TypeScript** - Tip güvenliği
- **Tailwind CSS** - Utility-first CSS framework
- **TanStack Query** - Server state management
- **Zustand** - Client state management
- **React Router Dom** - Routing çözümü
- **Axios** - HTTP client
- **React Hook Form** - Form yönetimi
- **React Hot Toast** - Bildirim sistemi

### UI/UX Kütüphaneler

- **Lucide React** - İkon sistemi
- **Emoji Picker React** - Emoji seçici
- **Date-fns** - Tarih işlemleri
- **Tailwind Merge** - CSS class birleştirici
- **clsx** - Conditional class names

## 🏗 Proje Yapısı

```
src/
├── components/           # Yeniden kullanılabilir bileşenler
│   ├── Cards/           # Kart bileşenleri (Prediction, DailyPost)
│   ├── Layout/          # Ana layout bileşenleri
│   └── ...              # Diğer UI bileşenleri
├── hooks/               # Custom React hooks
├── lib/                 # Utility fonksiyonlar ve konfigürasyonlar
│   ├── api.ts          # API client ve endpoint tanımlamaları
│   ├── store.ts        # Zustand store tanımlamaları
│   └── utils.ts        # Yardımcı fonksiyonlar
├── pages/              # Sayfa bileşenleri
│   ├── auth/           # Kimlik doğrulama sayfaları
│   └── ...             # Diğer sayfalar
└── ...
```

## 🚀 Kurulum ve Başlatma

### Gereksinimler

- Node.js 18.0.0 veya üzeri
- npm veya yarn paket yöneticisi
- VurduGololdu.API backend servisi

### Kurulum Adımları

1. **Proje klonlama**

```bash
git clone <repository-url>
cd vurdugololdu.frontend
```

2. **Bağımlılıkları yükleme**

```bash
npm install
# veya
yarn install
```

3. **Environment konfigürasyonu**
   API base URL'i `src/lib/api.ts` dosyasında yapılandırılmıştır:

```typescript
const API_BASE_URL = "https://localhost:7106/api";
```

4. **Geliştirme sunucusunu başlatma**

```bash
npm start
# veya
yarn start
```

Uygulama [http://localhost:3000](http://localhost:3000) adresinde çalışacaktır.

## 📦 Build ve Deploy

### Production Build

```bash
npm run build
# veya
yarn build
```

Build dosyaları `build/` klasöründe oluşturulacaktır.

### Test Çalıştırma

```bash
npm test
# veya
yarn test
```

## 🔧 Konfigürasyon

### API Konfigürasyonu

- **Base URL**: Backend API adresi
- **Interceptors**: Otomatik token yenileme ve hata yönetimi
- **Toast System**: Otomatik başarı/hata mesajları

### Authentication

- **JWT Token**: Güvenli kimlik doğrulama
- **Refresh Token**: Otomatik token yenileme
- **Persistent Storage**: Zustand ile kalıcı oturum

### State Management

- **Auth Store**: Kullanıcı kimlik bilgileri
- **UI Store**: Tema ve sidebar durumu
- **Notification Store**: Bildirim yönetimi

## 🎨 UI/UX Özellikleri

### Responsive Design

- Mobile-first yaklaşım
- Tailwind CSS breakpoint sistemi
- Tüm cihazlarda optimize görünüm

### Dark/Light Mode

- Sistem tercihi algılama
- Kullanıcı tercih kaydetme
- Smooth geçiş animasyonları

### Accessibility

- ARIA etiketleri
- Keyboard navigation
- Screen reader desteği

## 🔐 Güvenlik Özellikleri

### Authentication & Authorization

- JWT token tabanlı kimlik doğrulama
- Rol tabanlı erişim kontrolü
- Otomatik token yenileme sistemi

### API Security

- Request/Response interceptors
- HTTPS only communication
- CORS policy implementation

### Data Validation

- Form validation ile React Hook Form
- TypeScript ile tip güvenliği
- Input sanitization

## 📊 Performans Optimizasyonları

### Code Splitting

- Lazy loading ile sayfa bazlı code splitting
- React.lazy() kullanımı
- Suspense ile loading states

### Caching Strategy

- TanStack Query ile akıllı cache yönetimi
- 5 dakika stale time
- 10 dakika garbage collection time

### Bundle Optimization

- Tree shaking ile gereksiz kod temizleme
- Production build optimizasyonları
- Gzip compression desteği

## 🚨 Hata Yönetimi

### Error Boundaries

- React Error Boundary implementasyonu
- Graceful error handling
- User-friendly error messages

### API Error Handling

- Global error interceptors
- Contextual error messages
- Retry mechanisms

## 🧪 Test Stratejisi

### Unit Tests

- Jest test runner
- React Testing Library
- Component testing

### Integration Tests

- API integration tests
- User flow testing
- End-to-end scenarios

## 📈 Monitoring ve Analytics

### Performance Monitoring

- React DevTools integration
- TanStack Query DevTools
- Performance metrics tracking

### User Analytics

- User interaction tracking
- Feature usage analytics
- Error reporting

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun
