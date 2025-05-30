# RestoCafe - Restoran Yönetim Sistemi

RestoCafe, modern restoranlar için geliştirilmiş kapsamlı bir yönetim sistemidir. Masaüstü ve tablet uyumlu arayüzü ile garsonlar ve yöneticiler için özelleştirilmiş deneyim sunar.

## 🚀 Özellikler

### 💻 Platform Desteği
- Masaüstü uygulama (Ana yönetim paneli)
- Tablet uygulaması (Garson paneli)
- Gerçek zamanlı senkronizasyon

### 🎯 Temel Özellikler
- **Masa Yönetimi**
  - Bölgelere göre masa organizasyonu
  - Masa ekleme, düzenleme ve silme
  - Masa durumu takibi
  - Gerçek zamanlı masa durumu güncelleme

- **Menü Yönetimi**
  - Kategori bazlı menü organizasyonu
  - Ürün ekleme, düzenleme ve silme
  - Fiyat güncelleme
  - Stok durumu entegrasyonu

- **Sipariş Sistemi**
  - Garsonlar için özelleştirilmiş tablet arayüzü
  - Anlık sipariş takibi
  - Mutfak ve kasa için otomatik fiş çıktısı
  - Adisyon talebi özelliği
  - Gerçek zamanlı sipariş bildirimleri

- **Stok Takibi**
  - Ürün bazlı stok yönetimi
  - Minimum stok uyarı sistemi
  - Tedarikçi yönetimi
  - Stok giriş/çıkış takibi
  - Gerçek zamanlı stok durumu güncelleme

- **Raporlama**
  - Günlük, haftalık ve aylık raporlar
  - Satış analizleri
  - Ödeme yöntemi bazlı raporlar
  - Detaylı sipariş özetleri

- **Kullanıcı Yönetimi**
  - Rol bazlı yetkilendirme
  - Personel takibi
  - Kullanıcı aktivite logları
  - Çevrimiçi kullanıcı takibi

- **Sistem Özellikleri**
  - Otomatik yedekleme sistemi
  - Yedekten geri yükleme
  - Yazıcı entegrasyonu
  - Ayarlar paneli
  - Gerçek zamanlı bildirimler

## 🛠️ Kurulum

### Gereksinimler
- Node.js (v18 veya üzeri)
- PostgreSQL (v14 veya üzeri)
- npm veya yarn

### Backend Kurulumu

1. Repoyu klonlayın:
```bash
git clone https://github.com/yourusername/restocafe.git
cd restocafe/backend
```

2. Bağımlılıkları yükleyin:
```bash
npm install
# veya
yarn install
```

3. .env dosyasını oluşturun:
```bash
cp .env.example .env
```

4. .env dosyasını düzenleyin:
```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/restocafe"

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=12h

# Frontend
FRONTEND_URL=http://localhost:3000
```

5. Veritabanını oluşturun:
```bash
npx prisma migrate dev
```

6. Sunucuyu başlatın:
```bash
npm run dev
# veya
yarn dev
```

### Frontend Kurulumu

1. Frontend dizinine gidin:
```bash
cd ../frontend
```

2. Bağımlılıkları yükleyin:
```bash
npm install
# veya
yarn install
```

3. .env.local dosyasını oluşturun:
```bash
cp .env.example .env.local
```

4. .env.local dosyasını düzenleyin:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

5. Geliştirme sunucusunu başlatın:
```bash
npm run dev
# veya
yarn dev
```

## 📝 Kullanım

### Varsayılan Kullanıcı
- **Kullanıcı adı:** admin
- **Şifre:** admin123

### Roller ve Yetkiler
- **Admin:** Tam yetki
- **Kasiyer:** Ödeme alma, adisyon işlemleri
- **Garson:** Sipariş alma, masa yönetimi
- **Mutfak:** Sipariş takibi

## 🤝 Katkıda Bulunma

1. Bu repoyu forklayın
2. Feature branch'i oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: Add some amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 📞 İletişim

Proje Sahibi - [@ByCodeTR](https://github.com/ByCodeTR)

Proje Linki: [https://github.com/ByCodeTR/restocafe](https://github.com/ByCodeTR/restocafe)

## ✅ Yapılacaklar Listesi

### 🔄 Geliştirme Aşaması
- [x] Proje yapısının oluşturulması
- [x] Frontend için Next.js kurulumu
- [x] Backend için Express.js kurulumu
- [x] TypeScript entegrasyonu
- [x] Veritabanı şeması tasarımı
- [x] Socket.IO entegrasyonu
- [x] Temel dosya yapısının oluşturulması
- [x] Gerekli paketlerin yüklenmesi
- [x] Ortam değişkenleri (.env) yapılandırması
- [x] PostgreSQL veritabanı kurulumu ve bağlantısı
- [x] Test verilerinin oluşturulması
- [x] API altyapısının kurulması
- [x] Gerçek zamanlı iletişim sisteminin kurulması

### 📱 Tablet Uygulaması
- [x] Garson girişi
- [x] Masa yönetimi
- [x] Sipariş oluşturma
- [x] Adisyon talep sistemi
- [x] Gerçek zamanlı güncelleme

### 💼 Masaüstü Uygulaması
- [x] Kullanıcı yönetimi
- [x] Bölge yönetimi
- [x] Masa yönetimi
- [x] Menü yönetimi
- [x] Sipariş yönetimi
- [x] Stok takip sistemi
- [x] Tedarikçi yönetimi
- [x] Raporlama sistemi
- [x] Yazıcı entegrasyonu
- [x] Yedekleme sistemi

### 📊 Raporlama Sistemi
- [x] Günlük rapor
- [x] Haftalık rapor
- [x] Aylık rapor
- [x] Özel tarih aralığı raporları
- [x] Ödeme yöntemi bazlı raporlar

### ⚙️ Sistem Özellikleri
- [x] Otomatik yedekleme
- [x] Manuel yedekleme
- [x] Yedekten geri yükleme
- [x] Sistem ayarları
- [x] Yazıcı ayarları

## 🛠️ Teknik Gereksinimler
- Masaüstü bilgisayar (Kasa için)
- 2-3 adet tablet (Garsonlar için)
- Termal yazıcılar (Mutfak ve kasa için)
- Stabil internet bağlantısı
- Yedekleme için yeterli depolama alanı
- PostgreSQL veritabanı

## 📝 Notlar
- Garsonların tablet uygulamasında sadece masa oluşturma ve sipariş alma yetkileri olacaktır
- Ödeme alma işlemi sadece kasadan yapılabilecektir
- Sistem gerçek zamanlı olarak tüm cihazlarda senkronize çalışacaktır
- Düzenli yedekleme sistemi veri kaybını önleyecektir
- Varsayılan admin kullanıcısı: admin / admin123

## 🔄 Güncelleme Geçmişi
- v0.1 - Proje başlangıcı ve temel yapılandırma (30.05.2024)
  - Next.js ve Express.js kurulumu
  - TypeScript entegrasyonu
  - Veritabanı şeması tasarımı
  - Temel dosya yapısı oluşturuldu
  - Socket.IO entegrasyonu
  - PostgreSQL veritabanı kurulumu ve test verileri 