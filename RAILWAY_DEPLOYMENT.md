# 🚀 Railway Deployment Rehberi

Bu rehber RestoCafe projesini Railway platformunda nasıl deploy edeceğinizi açıklar.

## 📋 Ön Gereksinimler

1. [Railway](https://railway.app) hesabı
2. GitHub hesabı
3. Bu repository'nin fork'u veya kopyası

## 🛠️ Deployment Adımları

### 1. Railway Hesabı Oluşturma
- [Railway.app](https://railway.app) adresine gidin
- GitHub hesabınızla giriş yapın
- Yeni proje oluşturun

### 2. PostgreSQL Veritabanı Ekleme
1. Railway dashboard'da "New" butonuna tıklayın
2. "Database" seçeneğini seçin
3. "PostgreSQL" seçin
4. Veritabanı oluşturulduktan sonra connection string'i kopyalayın

### 3. Backend Deployment
1. Railway dashboard'da "New" → "GitHub Repo" seçin
2. Bu repository'yi seçin
3. Root directory'yi seçin (backend değil, ana dizin)

### 4. Environment Variables Ayarlama
Railway dashboard'da Variables sekmesine gidin ve şu değişkenleri ekleyin:

```env
# Zorunlu Değişkenler
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=production
PORT=5000

# Frontend URL (deploy edildikten sonra güncelleyin)
FRONTEND_URL=https://your-app-name.railway.app

# CORS Origins
CORS_ORIGINS=https://your-app-name.railway.app

# Opsiyonel Değişkenler
JWT_EXPIRES_IN=12h
ENABLE_PRINTER=false
SESSION_SECRET=your-session-secret
```

### 5. Build ve Deploy Ayarları
Railway otomatik olarak şu ayarları kullanacak:
- **Build Command:** `npm run build`
- **Start Command:** `npm start`
- **Port:** Environment variable'dan PORT değeri

### 6. Domain Ayarlama
1. Railway dashboard'da "Settings" sekmesine gidin
2. "Domains" bölümünde custom domain ekleyebilir veya Railway subdomain'i kullanabilirsiniz
3. FRONTEND_URL environment variable'ını yeni domain ile güncelleyin

## 🔧 Önemli Notlar

### Database Migration
İlk deployment'tan sonra veritabanı migration'ları çalıştırmanız gerekebilir:

1. Railway dashboard'da terminal açın
2. Şu komutları çalıştırın:
```bash
cd backend
npx prisma migrate deploy
npx prisma db seed
```

### Environment Variables Güvenliği
- JWT_SECRET için güçlü, rastgele bir string kullanın
- Production'da debug modunu kapatın
- Hassas bilgileri asla kod içinde bırakmayın

### Monitoring ve Logs
- Railway dashboard'da "Deployments" sekmesinden build loglarını takip edin
- "Metrics" sekmesinden performans metriklerini izleyin
- Hata durumunda logs'ları kontrol edin

## 🚨 Troubleshooting

### Build Hatası
```bash
# Package.json scripts'lerini kontrol edin
# Node.js version'ını kontrol edin (>=18.0.0)
```

### Database Connection Hatası
```bash
# DATABASE_URL'nin doğru formatda olduğunu kontrol edin
# PostgreSQL service'inin çalıştığını kontrol edin
```

### Port Hatası
```bash
# PORT environment variable'ının ayarlandığını kontrol edin
# app.js'de process.env.PORT kullanıldığını kontrol edin
```

## 📱 Frontend Deployment (Ayrı Servis)

Frontend'i ayrı bir Railway service olarak deploy etmek için:

1. Yeni bir Railway service oluşturun
2. Frontend klasörünü root olarak seçin
3. Environment variables:
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app/api
NEXT_PUBLIC_SOCKET_URL=https://your-backend-url.railway.app
```

## 🔄 Otomatik Deployment

Railway, GitHub repository'nizde değişiklik olduğunda otomatik olarak yeniden deploy eder.

## 📞 Destek

Deployment sırasında sorun yaşarsanız:
1. Railway documentation'ını kontrol edin
2. GitHub Issues'da sorun bildirin
3. Railway Discord community'sine katılın

---

**RestoCafe** - Railway'de kolay deployment! 🚂 