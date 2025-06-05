# Node.js 18 Alpine image kullan
FROM node:18-alpine

# Çalışma dizinini ayarla
WORKDIR /app

# Package dosyalarını kopyala
COPY package*.json ./

# Bağımlılıkları yükle
RUN npm ci --only=production

# Prisma CLI'yi global olarak yükle
RUN npm install -g prisma

# Uygulama dosyalarını kopyala
COPY . .

# Prisma client'ı generate et
RUN npx prisma generate

# Port'u expose et
EXPOSE 5000

# Uygulama başlatma komutu
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"] 