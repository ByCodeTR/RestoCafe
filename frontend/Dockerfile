# Node.js 18 Alpine image kullan
FROM node:18-alpine

# Çalışma dizinini ayarla
WORKDIR /app

# Package dosyalarını kopyala
COPY package*.json ./

# Bağımlılıkları yükle
RUN npm ci

# Uygulama dosyalarını kopyala
COPY . .

# Next.js uygulamasını build et
RUN npm run build

# Port'u expose et
EXPOSE 3000

# Uygulama başlatma komutu
CMD ["npm", "start"] 