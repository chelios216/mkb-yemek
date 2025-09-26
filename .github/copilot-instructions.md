# MKB Yemek Sistemi - Copilot Instructions

Bu proje QR kod tabanlı yemek dağıtım sistemidir.

## Proje Özellikleri
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS + Framer Motion (animasyonlar)
- **Backend**: Node.js + Express + PostgreSQL
- **QR Kod Okuma**: Web tabanlı kamera API
- **Cihaz Tanımlama**: Device fingerprinting + UUID
- **Admin Paneli**: Dashboard, raporlama, personel yönetimi

## Tasarım İlkeleri
- Sade ve şık modern tasarım
- Smooth animasyonlar (fade, slide, scale)
- Responsive mobile-first yaklaşım
- Dark/Light mode desteği
- Türkçe dil desteği

## Güvenlik
- JWT authentication
- Rate limiting
- Input validation
- HTTPS zorunlu

## Database Schema
- users (personeller)
- meal_records (yemek kayıtları) 
- settings (sistem ayarları)
- device_registrations (cihaz kayıtları)