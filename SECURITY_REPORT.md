# Laporan Keamanan Aplikasi RecycleGo

## Pendahuluan

Laporan ini menjelaskan implementasi keamanan pada application layer untuk aplikasi RecycleGo dengan sistem multi-user. Fokus utama adalah pada keamanan di level aplikasi untuk melindungi data pengguna dan mencegah berbagai jenis serangan umum pada aplikasi web.

## Fitur Keamanan yang Diimplementasikan

### 1. Autentikasi dan Manajemen Sesi

#### JWT (JSON Web Token) dengan Refresh Token
- **Access Token**: Token dengan masa aktif pendek (15 menit) untuk mengurangi risiko jika token dicuri.
- **Refresh Token**: Token dengan masa aktif lebih panjang (7 hari) yang disimpan di database dan dapat digunakan untuk mendapatkan access token baru.
- **Token Versioning**: Setiap user memiliki token_version yang diincrement saat logout, sehingga semua refresh token sebelumnya menjadi tidak valid.

#### Proteksi Brute Force
- **Rate Limiting**: Membatasi jumlah percobaan login (5 kali dalam 15 menit).
- **Account Locking**: Mengunci akun setelah 5 kali percobaan login gagal selama 15 menit.
- **Random Delay**: Menambahkan delay acak pada respons autentikasi untuk mencegah timing attacks.

### 2. Validasi dan Sanitasi Input

#### Express Validator
- Validasi format input (email, username, password).
- Validasi panjang dan kompleksitas password (minimal 8 karakter, harus mengandung huruf besar, huruf kecil, dan angka).
- Escape dan trim input untuk mencegah injeksi.

#### Sanitasi Input
- Middleware sanitasi yang membersihkan input dari karakter berbahaya.
- Escape karakter khusus HTML untuk mencegah XSS.

### 3. Perlindungan terhadap SQL Injection

#### Penggunaan ORM (Sequelize)
- Parameterized queries melalui Sequelize untuk mencegah SQL injection.
- Data binding otomatis yang mencegah injeksi langsung ke query SQL.

### 4. XSS Protection

#### XSS-Clean Middleware
- Implementasi middleware xss-clean untuk membersihkan input dari script berbahaya.
- Sanitasi output untuk mencegah eksekusi script di browser pengguna.

#### Content Security Policy
- Helmet middleware untuk menerapkan Content Security Policy yang membatasi sumber daya yang dapat dimuat oleh browser.

### 5. CSRF Protection

#### Token-based CSRF Protection
- Implementasi CSRF token yang harus disertakan dalam setiap request modifikasi data (POST, PUT, DELETE).
- Validasi token untuk memastikan request berasal dari aplikasi yang sah.

### 6. Enkripsi Password

#### Bcrypt
- Enkripsi password menggunakan bcrypt dengan salt 12 rounds.
- Implementasi hooks di model User untuk otomatis mengenkripsi password saat create dan update.

### 7. Role-Based Access Control

#### Multi-level User Roles
- Implementasi tiga level user: user, moderator, dan admin.
- Middleware untuk memverifikasi role pada endpoint tertentu.
- Middleware untuk memverifikasi kepemilikan resource.

### 8. HTTP Security Headers

#### Helmet Middleware
- Implementasi Helmet untuk menambahkan berbagai HTTP security headers.
- X-XSS-Protection, X-Content-Type-Options, Strict-Transport-Security, dll.

### 9. Rate Limiting

#### Express Rate Limit
- Rate limiting global untuk semua endpoint (100 request per 15 menit).
- Rate limiting khusus untuk endpoint sensitif seperti login (5 request per 15 menit).

## Rekomendasi Keamanan Tambahan

1. **Implementasi HTTPS**: Pastikan aplikasi berjalan di HTTPS untuk enkripsi data dalam transit.
2. **Two-Factor Authentication (2FA)**: Tambahkan opsi 2FA untuk lapisan keamanan tambahan.
3. **Audit Logging**: Implementasikan logging untuk aktivitas sensitif untuk deteksi dan investigasi insiden keamanan.
4. **Regular Security Updates**: Pastikan semua dependencies selalu diperbarui untuk menghindari kerentanan.
5. **Penetration Testing**: Lakukan pengujian penetrasi secara berkala untuk mengidentifikasi kerentanan baru.

## Kesimpulan

Aplikasi RecycleGo telah diimplementasikan dengan berbagai lapisan keamanan pada application layer untuk melindungi data pengguna dan mencegah serangan umum. Implementasi ini mencakup autentikasi yang aman, validasi input, perlindungan terhadap injeksi, dan kontrol akses berbasis peran. Dengan terus memperbarui dan mengevaluasi keamanan aplikasi, RecycleGo dapat memberikan pengalaman yang aman bagi penggunanya.