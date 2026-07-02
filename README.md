# 🖥️ Sistem Pakar Diagnosis Kerusakan Laptop API

API untuk mendiagnosis kerusakan laptop menggunakan metode **Forward Chaining** dan **Certainty Factor (CF)** dengan pendekatan **CF Pakar × CF User + Kombinasi** (metode Shortliffe & Buchanan).

---

## 🚀 Live API
Akses API yang sudah terdeploy di Vercel:  
🔗 [https://kerusakan-laptop.vercel.app](https://kerusakan-laptop.vercel.app)

---

## ✨ Fitur Utama
- **Autentikasi** (Register, Login, JWT, Guest Session)
- **Interactive Q&A** (Tanya jawab seperti Akinator, 1 pertanyaan per langkah)
- **Diagnosis** (Forward Chaining + Certainty Factor)
- **Feedback** (Konfirmasi kebenaran hasil diagnosis)
- **User Profile** (Lihat & update profil, ganti password, riwayat, favorit)
- **Admin Panel** (CRUD gejala, kerusakan, aturan, solusi, monitoring konsultasi)

---

## 🛠️ Teknologi
- **Backend:** Node.js, Express.js
- **Database:** Supabase (PostgreSQL)
- **Autentikasi:** JWT (JSON Web Token)
- **Deploy:** Vercel (Serverless)

---

## 📋 Cara Menjalankan Lokal

1. Clone repository:
    ```bash
   git clone https://github.com/BintangSatr/kerusakan-laptop.git
   cd kerusakan-laptop

2. Install dependencies:
    ```bash
    npm install

3. Buat file .env di root folder, isi dengan:
    SUPABASE_URL=your-supabase-url
    SUPABASE_KEY=your-supabase-anon-key
    JWT_SECRET=your-jwt-secret
    PORT=3000

4. Jalankan Server:
    node server.js

5. API akan berjalan di http://localhost:3000