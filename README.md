backend# 🍽️ RestoCafe - Kapsamlı Restoran Yönetim Sistemi

<!-- Railway deployment trigger - Root directory configured -->

RestoCafe, modern restoran işletmeciliği için tasarlanmış kapsamlı bir yönetim sistemidir. Masa takibinden envanter yönetimine, sipariş sürecinden raporlamaya kadar restoran operasyonlarının tüm süreçlerini dijitalleştirir.

## 🌟 Özellikler

### 💻 Admin Panel
- **Dashboard ve Genel Bakış**
  - Günlük, haftalık ve aylık satış grafiklerı
  - Anlık KPI'lar (gelir, sipariş sayısı, ortalama adisyon)
  - En çok satan ürünler analizi
  - Çalışan performans takibi
  - Gerçek zamanlı bildirimler

- **Masa ve Bölge Yönetimi**
  - Masa düzeni tasarlama
  - Bölge bazlı organizasyon
  - Masa durumu takibi (Boş, Dolu, Rezerve, Bakımda)
  - QR kod entegrasyonu

- **Menü Yönetimi**
  - Kategori bazlı ürün organizasyonu
  - Fiyat güncellemeleri
  - Ürün açıklamaları ve görselleri
  - Stok durumu entegrasyonu
  - Mevsimel menü düzenlemeleri

- **Envanter ve Stok Takibi**
  - Gerçek zamanlı stok seviyeleri
  - Otomatik düşük stok uyarıları
  - Hammadde ve malzeme takibi
  - Tedarikçi yönetimi
  - Giriş/çıkış hareketleri

- **Sipariş Yönetimi**
  - Tüm sipariş kanallarının merkezi takibi
  - Sipariş durumu yönetimi
  - Mutfak-servis koordinasyonu
  - İptal ve iade süreçleri

- **Finansal Yönetim**
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

### 🎨 Frontend Geliştirme
- [x] Tema ve UI kütüphanesi seçimi (Tailwind CSS + Shadcn/ui)
- [x] Sayfa şablonlarının oluşturulması
  - [x] Ana şablon (Layout)
  - [x] Auth şablonu
  - [x] Yönetici paneli şablonu
  - [x] Garson paneli şablonu
  - [x] Mutfak paneli şablonu
- [x] Oturum yönetimi
  - [x] Giriş sayfası (Basit authentication)
  - [ ] Şifremi unuttum sayfası
  - [ ] Profil sayfası
- [x] Yönetici Paneli
  - [x] Dashboard tasarımı
    - [x] İstatistik kartları (Günlük satış, aktif masalar, bekleyen siparişler)
    - [x] Grafik ve analizler
    - [x] Son işlemler listesi
    - [x] Hızlı eylemler menüsü
  - [x] Kullanıcı yönetimi arayüzü
    - [x] Kullanıcı listesi
    - [x] Kullanıcı ekleme
    - [x] Kullanıcı düzenleme
    - [x] Kullanıcı silme
    - [x] Rol bazlı yetkilendirme
  - [x] Bölge ve masa yönetimi
  - [x] Menü yönetimi
  - [x] Stok takip ekranı
  - [x] Tedarikçi yönetimi
  - [ ] Raporlama ekranları
  - [ ] Sistem ayarları
- [x] Garson Paneli (Tablet) ✅ **TAMAMLANDI**
  - [x] Ana sayfa (Büyük dokunmatik butonlar)
  - [x] Bölge ve masa seçimi
  - [x] Masa durumu yönetimi (Boş/Dolu/Rezerve/Bakımda)
  - [x] Sipariş oluşturma (Kategori bazlı menü)
  - [x] Sipariş özeti ve gönderme
  - [x] Aktif siparişler görüntüleme
  - [x] Sipariş durumu güncelleme
  - [x] Tablet için optimize edilmiş tasarım
- [ ] Mutfak Paneli
  - [ ] Aktif siparişler ekranı
  - [ ] Sipariş durumu güncelleme
- [ ] Kasa Paneli
  - [ ] Aktif masalar
  - [ ] Ödeme alma ekranı
  - [ ] Günlük rapor
- [ ] Bildirim Sistemi
  - [ ] Gerçek zamanlı bildirimler
  - [ ] Bildirim tercihleri
- [ ] Genel Özellikler
  - [ ] Çoklu dil desteği
  - [ ] Tema desteği (Açık/Koyu)
  - [ ] Responsive tasarım
  - [ ] Erişilebilirlik uyumu
  - [ ] Performans optimizasyonu

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
- v0.5 - Stok Yönetimi (01.03.2024)
  - Ürün bazlı stok takibi
  - Stok giriş/çıkış/düzeltme işlemleri
  - Tedarikçi yönetimi
  - Düşük stok bildirimleri
  - Stok raporlama
  - Gerçek zamanlı stok durumu güncelleme
  - Form validasyonları
  - Toast bildirimleri
  - Responsive tasarım
- v0.4 - Menü Yönetimi (01.03.2024)
  - Kategori bazlı menü organizasyonu
  - Ürün ekleme, düzenleme ve silme
  - Fiyat güncelleme
  - Stok durumu entegrasyonu
  - Form validasyonları
  - Toast bildirimleri
  - Responsive tasarım
- v0.3 - Garson Paneli Geliştirmeleri (01.03.2024)
  - Bölge ve masa seçimi arayüzü
  - Masa durumu yönetimi
  - Form validasyonları
  - Toast bildirimleri
  - Gerçek zamanlı güncelleme
  - Responsive tasarım
- v0.2 - Bölge ve Masa Yönetimi (01.03.2024)
  - Bölge ekleme, düzenleme ve silme özellikleri
  - Masa ekleme, düzenleme ve silme özellikleri
  - Masa durumu yönetimi (Müsait, Dolu, Rezerve, Bakımda)
  - Bölgelere göre masa organizasyonu
  - Gerçek zamanlı masa durumu güncelleme
  - Form validasyonları ve hata yönetimi
  - Toast bildirimleri
- v0.1 - Proje başlangıcı ve temel yapılandırma (30.05.2024)
  - Next.js ve Express.js kurulumu
  - TypeScript entegrasyonu
  - Veritabanı şeması tasarımı
  - Temel dosya yapısı oluşturuldu
  - Socket.IO entegrasyonu
  - PostgreSQL veritabanı kurulumu ve test verileri

### Frontend Yapılacaklar
- [x] Sipariş yönetimi (admin paneli)
- [ ] Garson paneli (tablet uyumlu)
- [ ] Mutfak ekranı
- [ ] Şifremi unuttum sayfası
- [ ] Profil sayfası 

# RestoCafe - Restaurant Management System

RestoCafe, modern restoranlar için tasarlanmış kapsamlı bir yönetim sistemidir.

## 🚀 Özellikler

- **Sipariş Yönetimi**: Masalar arası sipariş takibi ve yönetimi
- **Mutfak Ekranı**: Gerçek zamanlı sipariş durumu takibi
- **Stok Yönetimi**: Ürün stoklarını takip etme ve uyarı sistemi
- **Yazıcı Entegrasyonu**: Fiş ve mutfak siparişi yazdırma
- **Tablet Desteği**: Garsonlar için tablet arayüzü
- **Dashboard & Raporlar**: Detaylı satış raporları ve analitik
- **Çoklu Kullanıcı**: Admin, Manager, Garson ve Aşçı rolleri

## 📋 Sistem Gereksinimleri

- Node.js 18.0.0 veya üzeri
- PostgreSQL 12 veya üzeri
- NPM 8.0.0 veya üzeri

## 🛠️ Kurulum (Node.js Hosting)

### 1. Dosyaları Yükleyin
Tüm proje dosyalarını hosting sunucunuza yükleyin.

### 2. Ortam Değişkenlerini Ayarlayın
`env.example` dosyasını `.env` olarak kopyalayın ve değerlerini düzenleyin:

```bash
cp env.example .env
```

Önemli ayarlar:
- `DATABASE_URL`: PostgreSQL veritabanı bağlantı URL'i
- `JWT_SECRET`: Güvenlik için güçlü bir anahtar
- `FRONTEND_URL`: Frontend domain URL'i
- `PORT`: Sunucu portu (varsayılan: 5000)

### 3. Bağımlılıkları Yükleyin

```bash
npm run setup
```

### 4. Veritabanını Hazırlayın

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
npx prisma db seed
```

### 5. Uygulamayı Başlatın

```bash
npm start
```

## 🔧 Geliştirme Ortamı

### Local Development

```bash
# Backend bağımlılıklarını yükle
cd backend
npm install

# Frontend bağımlılıklarını yükle
cd ../frontend
npm install

# Backend'i başlat
cd ../backend
npm run dev

# Frontend'i başlat (yeni terminal)
cd frontend
npm run dev
```

## 📱 API Endpoints

### Kimlik Doğrulama
- `POST /api/auth/login` - Kullanıcı girişi
- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/logout` - Çıkış

### Siparişler
- `GET /api/orders` - Tüm siparişler
- `POST /api/orders` - Yeni sipariş
- `PUT /api/orders/:id` - Sipariş güncelle
- `POST /api/orders/:id/print-bill` - Adisyon yazdır

### Masalar
- `GET /api/tables` - Tüm masalar
- `GET /api/tables/:id` - Masa detayı
- `PUT /api/tables/:id` - Masa güncelle

### Ürünler
- `GET /api/products` - Tüm ürünler
- `POST /api/products` - Yeni ürün
- `PUT /api/products/:id` - Ürün güncelle

### Raporlar
- `GET /api/reports/dashboard-stats` - Dashboard istatistikleri
- `GET /api/reports/daily` - Günlük rapor
- `GET /api/reports/weekly` - Haftalık rapor
- `GET /api/reports/monthly` - Aylık rapor

## 🎭 Kullanıcı Rolleri

### Admin
- Tüm sistem ayarlarına erişim
- Kullanıcı yönetimi
- Rapor ve analitik görüntüleme

### Manager
- Sipariş yönetimi
- Stok kontrolü
- Günlük raporlar

### Waiter (Garson)
- Sipariş alma ve güncelleme
- Masa durumu takibi
- Adisyon yazdırma

### Chef (Aşçı)
- Mutfak ekranı
- Sipariş durumu güncelleme

## 🖨️ Yazıcı Desteği

Sistem termal yazıcıları destekler:
- Fiş yazdırma
- Mutfak siparişi yazdırma
- USB ve Network yazıcı desteği

## 🔒 Güvenlik

- JWT tabanlı kimlik doğrulama
- Rol bazlı yetkilendirme
- CORS koruması
- SQL injection koruması

## 📊 Özellik Listesi

### ✅ Tamamlanan Özellikler
- [x] Kullanıcı girişi ve yetkilendirme
- [x] Masa yönetimi
- [x] Sipariş alma ve takibi
- [x] Mutfak ekranı
- [x] Stok yönetimi
- [x] Yazıcı entegrasyonu
- [x] Dashboard ve raporlar
- [x] Tablet arayüzü
- [x] Socket.IO real-time güncellemeler
- [x] Adisyon yazdırma

### 🔄 Geliştirme Aşamasında
- [ ] Mobil uygulama
- [ ] QR kod menü
- [ ] Online ödeme entegrasyonu

## 🆘 Destek

Herhangi bir sorun durumunda:
1. Log dosyalarını kontrol edin
2. Veritabanı bağlantısını doğrulayın
3. Environment variables'ları kontrol edin

## 📄 Lisans

Bu proje özel kullanım için geliştirilmiştir.

---

**RestoCafe** - Modern restaurant management made simple 🍽️ 