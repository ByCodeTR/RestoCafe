#!/bin/bash

# Backend dizinine git
cd backend

# Dependencies'leri yükle
npm install

# Prisma generate
npx prisma generate

# Ana dizindeki app.js'i backend'den çalıştır
node ../app.js 