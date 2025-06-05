#!/bin/bash

# Backend dependencies'lerini yükle
cd backend
npm install

# Prisma generate
npx prisma generate

# Ana dizine dön ve uygulamayı başlat
cd ..
node app.js 