# RecycleGo

Aplikasi edukasi dan reward untuk pemilahan sampah berbasis Node.js.

## Deskripsi

RecycleGo adalah platform yang mendorong masyarakat untuk melakukan pemilahan sampah dengan sistem reward dan edukasi. Aplikasi ini memungkinkan pengguna untuk mencatat aktivitas pemilahan sampah mereka, mendapatkan poin, dan menukarkan poin tersebut dengan berbagai hadiah. Selain itu, aplikasi ini juga menyediakan konten edukasi tentang pengelolaan sampah dan lingkungan.

## Fitur Utama

- **Autentikasi**: Sistem login dan registrasi pengguna
- **Pencatatan Aktivitas**: Pengguna dapat mencatat aktivitas pemilahan sampah mereka
- **Sistem Poin**: Pengguna mendapatkan poin berdasarkan jenis dan berat sampah yang dipilah
- **Reward**: Pengguna dapat menukarkan poin dengan berbagai hadiah
- **Edukasi**: Konten edukasi tentang pengelolaan sampah dan lingkungan
- **Admin Panel**: Panel admin untuk verifikasi aktivitas, mengelola reward, dan konten edukasi

## Teknologi

- **Backend**: Node.js, Express.js
- **Database**: MySQL dengan Sequelize ORM
- **Autentikasi**: JWT (JSON Web Token)
- **Keamanan**: Helmet, Rate Limiting, CORS

## Instalasi

1. Clone repositori ini
2. Install dependensi dengan menjalankan `npm install`
3. Buat database MySQL dengan nama `recyclego_db`
4. Konfigurasi file `.env` dengan kredensial database Anda
5. Jalankan aplikasi dengan perintah `npm start` atau `npm run dev` untuk mode development

## Struktur Proyek

```
├── config/
│   └── db.js            # Konfigurasi database
├── models/
│   ├── User.js          # Model pengguna
│   ├── Aktivitas.js     # Model aktivitas pemilahan sampah
│   ├── Reward.js        # Model reward dan klaim reward
│   └── Edukasi.js       # Model konten edukasi
├── routes/
│   ├── auth.js          # Rute autentikasi
│   ├── aktivitas.js     # Rute aktivitas pemilahan sampah
│   ├── reward.js        # Rute reward dan klaim reward
│   └── edukasi.js       # Rute konten edukasi
├── .env                 # File konfigurasi environment
├── package.json         # Dependensi proyek
└── server.js            # Entry point aplikasi
```

## API Endpoints

### Autentikasi
- `POST /api/auth/register` - Registrasi pengguna baru
- `POST /api/auth/login` - Login pengguna

### Aktivitas
- `GET /api/aktivitas/user` - Mendapatkan aktivitas pengguna
- `POST /api/aktivitas` - Menambahkan aktivitas baru
- `GET /api/aktivitas/admin` - Mendapatkan semua aktivitas (admin)
- `PATCH /api/aktivitas/:id/verify` - Verifikasi aktivitas (admin)

### Reward
- `GET /api/reward` - Mendapatkan semua reward
- `GET /api/reward/:id` - Mendapatkan detail reward
- `POST /api/reward/claim/:id` - Menukarkan poin dengan reward
- `GET /api/reward/claims/history` - Mendapatkan riwayat klaim reward

### Edukasi
- `GET /api/edukasi` - Mendapatkan semua konten edukasi
- `GET /api/edukasi/:id` - Mendapatkan detail konten edukasi
- `POST /api/edukasi/:id/read` - Menandai konten edukasi sudah dibaca

## Lisensi

ISC