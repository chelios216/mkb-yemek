# MKB Yemek Sistemi

QR kod tabanlı yemek dağıtım sistemi. Modern web teknolojileri ile geliştirilmiş, sade ve kullanıcı dostu arayüz.

## 🚀 Özellikler

### ✨ Ana Özellikler
- **QR Kod Okuma**: Kamera ile QR kod tarama
- **Cihaz Tanımlama**: Benzersiz cihaz parmak izi ile otomatik giriş
- **Yemek Takibi**: Kahvaltı ve öğle yemeği kayıtları
- **Admin Paneli**: Kapsamlı yönetim ve raporlama
- **Real-time**: Anlık veri güncellemeleri

### 🎨 Tasarım
- **Modern UI**: Sade ve şık tasarım
- **Animasyonlar**: Framer Motion ile smooth geçişler
- **Responsive**: Mobil-first yaklaşım
- **Dark/Light**: Tema desteği (gelecek sürümlerde)
- **Türkçe**: Tam Türkçe dil desteği

### 🔒 Güvenlik
- **Cihaz Kimlik Doğrulama**: Benzersiz cihaz tanımlama
- **Zaman Kontrolü**: Yemek saatleri dışında erişim engeli
- **Günlük Limit**: Aynı öğün tekrar alım engeli
- **API Güvenliği**: Input validation ve rate limiting

## 🛠️ Teknolojiler

### Frontend
- **Next.js 14**: React framework
- **TypeScript**: Type-safe geliştirme
- **Tailwind CSS**: Utility-first CSS
- **Framer Motion**: Animasyon kütüphanesi
- **QR Scanner**: Kamera tabanlı QR okuma

### Backend
- **Next.js API Routes**: Serverless API
- **Mock Database**: Geliştirme için (PostgreSQL'e geçiş planlanıyor)
- **UUID**: Benzersiz ID oluşturma
- **Device Fingerprinting**: Cihaz tanımlama

## 📦 Kurulum

```bash
# Repository'yi klonlayın
git clone https://github.com/your-username/mkb-yemek.git

# Proje dizinine gidin
cd mkb-yemek

# Bağımlılıkları yükleyin
npm install

# Environment variables dosyası oluşturun
cp .env.example .env.local

# Development server'ı başlatın
npm run dev

# Tarayıcıda açın
# http://localhost:3001
```

## 🚀 Deployment

### Vercel ile Deploy (Önerilen)

1. **GitHub Repository Oluşturun**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/mkb-yemek.git
git push -u origin main
```

2. **Vercel'e Deploy**
   - [Vercel.com](https://vercel.com)'a gidin
   - GitHub ile giriş yapın
   - "Import Project" ile repository'nizi seçin
   - Environment Variables ekleyin:
     - `JWT_SECRET`: Güvenli bir secret key
     - `NODE_ENV`: `production`
     - `NEXT_PUBLIC_APP_URL`: Vercel domain'iniz
   - Deploy edin!

### Railway ile Deploy (Database Dahil)

1. **Railway Account**
   - [Railway.app](https://railway.app)'e gidin
   - GitHub ile connect edin

2. **Deploy**
   - "New Project" → "Deploy from GitHub repo"
   - Repository'nizi seçin
   - PostgreSQL service ekleyin
   - Environment variables ayarlayın

### Manuel Deploy (Diğer Platformlar)

```bash
# Production build oluşturun
npm run build

# Build'i test edin
npm start

# Build dosyalarını sunucunuza yükleyin
# .next/ klasörü ve package.json gerekli
```

## 🏗️ Proje Yapısı

```
mkb-yemek/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Ana sayfa
│   │   ├── scan/
│   │   │   └── page.tsx          # QR kod okuma
│   │   ├── admin/
│   │   │   └── page.tsx          # Admin paneli
│   │   └── api/
│   │       ├── auth/             # Kimlik doğrulama
│   │       ├── meals/            # Yemek işlemleri
│   │       └── admin/            # Admin işlemleri
│   ├── lib/
│   │   ├── types.ts              # TypeScript tipleri
│   │   ├── database.ts           # Database işlemleri
│   │   └── hooks.ts              # Custom React hooks
│   └── components/               # Paylaşılan bileşenler (gelecek)
├── .github/
│   └── copilot-instructions.md   # AI asistan talimatları
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## 🚦 API Endpoints

### Kimlik Doğrulama
- `POST /api/auth` - Yeni kullanıcı kaydı
- `GET /api/auth?fingerprint=...` - Kullanıcı doğrulama

### Yemek İşlemleri
- `GET /api/meals?fingerprint=...` - Yemek uygunluk kontrolü
- `POST /api/meals` - Yemek kaydı

### Admin İşlemleri
- `GET /api/admin?type=stats` - Dashboard istatistikleri
- `GET /api/admin?type=users` - Kullanıcı listesi
- `GET /api/admin?type=recent-activities` - Son aktiviteler
- `POST /api/admin` - Admin aksiyonları

## 💡 Kullanım

### Personel İçin
1. Ana sayfadan "QR Kod Okut" butonuna tıklayın
2. İlk kullanımda ad-soyad ve departman bilgilerinizi girin
3. Kamerayı başlatın ve QR kodu okutun
4. Yemek hakkınız varsa onaylayın

### Admin İçin
1. Ana sayfadan "Admin Paneli" butonuna tıklayın
2. Dashboard'da güncel istatistikleri görün
3. Raporlar sekmesinden aylık özeti inceleyin
4. Personel sekmesinden kullanıcıları yönetin

## 🔮 Gelecek Planları

### Teknik Geliştirmeler
- [ ] PostgreSQL veritabanı entegrasyonu
- [ ] Gerçek QR kod okuma (js-scanner entegrasyonu)
- [ ] JWT authentication
- [ ] Redis cache katmanı
- [ ] Docker containerization

### Özellik Geliştirmeleri
- [ ] Push notification desteği
- [ ] Email raporlama
- [ ] Grafik ve chart'lar (Chart.js)
- [ ] Export/Import işlemleri
- [ ] Çoklu dil desteği
- [ ] Dark mode

### Güvenlik Geliştirmeleri
- [ ] Rate limiting middleware
- [ ] HTTPS zorunlu hale getirme
- [ ] Input sanitization
- [ ] CORS konfigürasyonu
- [ ] Security headers

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'e push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için `LICENSE` dosyasına bakın.

## 📞 İletişim

Proje Sahibi - [@yourhandle](https://twitter.com/yourhandle) - email@example.com

Proje Linki: [https://github.com/your-username/mkb-yemek](https://github.com/your-username/mkb-yemek)

---

⭐ Projeyi faydalı bulduysanız star vermeyi unutmayın!