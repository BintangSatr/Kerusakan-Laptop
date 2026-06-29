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
4. Jalankan server:
   ```bash
   node server.js
5. API akan berjalan di http://localhost:3000

---

##📊 Metode Diagnosis

Sistem menggunakan perhitungan CF (Certainty Factor) dengan 3 tahap:

1. CF Pakar (nilai dari tabel damage_symptoms dan cf_rule)

2. CF User (bobot keyakinan user saat menjawab: yes=1.0, probably_yes=0.8, dont_know=0.4, probably_not=0.2, no=0.0)

3. Kombinasi CF (Shortliffe & Buchanan) → CF_combined = CF_old + CF_new * (1 - CF_old)

Hasil akhir ditampilkan dalam bentuk persentase (%).

##👨‍💻 Author
Bintang Satria – GitHub

##📝 Lisensi

MIT License

---

### ✅ Step 4: Push Final ke GitHub

```bash
git add README.md
git commit -m "Final: Add README and complete project documentation"
git push origin main
