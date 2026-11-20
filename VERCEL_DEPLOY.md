# Panduan Deploy Rekap Kas ke Vercel Serverless + Supabase

Panduan langkah-demi-langkah untuk melakukan deployment aplikasi Laravel 13 (Inertia.js React) ke **Vercel Serverless** dengan database **Supabase PostgreSQL**.

---

## 1. Migrasi Database ke Supabase (Sekali Saja dari Lokal)

Karena Vercel berjalan secara serverless (read-only filesystem tanpa persistent terminal), seluruh migrasi database dijalankan dari terminal lokal ke Supabase:

1. Pastikan koneksi Supabase di file `.env` lokal Anda sudah mengarah ke **Session Pooler (IPv4)**:
   ```env
   DB_CONNECTION=pgsql
   DB_HOST=aws-0-ap-southeast-1.pooler.supabase.com
   DB_PORT=5432
   DB_DATABASE=postgres
   DB_USERNAME=postgres.[PROJECT_REF_ANDA]
   DB_PASSWORD=[PASSWORD_DATABASE_ANDA]
   DB_SSLMODE=require
   ```
2. Jalankan perintah migrasi di terminal lokal:
   ```bash
   php artisan config:clear
   php artisan migrate --force
   ```

---

## 2. Compile Frontend Asset & Push ke GitHub

Aset frontend (Inertia React + Tailwind) telah di-build secara lokal dan dilacak oleh Git agar langsung disajikan secara instan via Vercel Global Edge CDN:

```bash
# 1. Compile bundle frontend production
npm run build

# 2. Stage dan commit seluruh konfigurasi Vercel
git add .
git commit -m "chore: setup vercel serverless php and supabase pooler"

# 3. Push ke repository GitHub
git push origin main
```

---

## 3. Import Project di Vercel Dashboard

1. Buka [Vercel Dashboard](https://vercel.com/dashboard) dan klik **Add New...** → **Project**.
2. Pilih repository GitHub `rekap-kas`.
3. Pada **Framework Preset**, biarkan bernilai **Other** (karena `vercel.json` telah mengonfigurasi `framework: null`).
4. Buka bagian **Environment Variables** dan masukkan variabel-variabel berikut:

### Tabel Environment Variables (Wajib di Vercel Dashboard)

| Nama Variabel | Contoh Nilai | Keterangan |
|---|---|---|
| `APP_NAME` | `Rekap Kas` | Nama aplikasi |
| `APP_ENV` | `production` | Environment aplikasi |
| `APP_KEY` | `base64:...` | Ambil dari file `.env` lokal atau jalankan `php artisan key:generate --show` |
| `APP_DEBUG` | `false` | Matikan debug mode di production |
| `APP_URL` | `https://nama-project.vercel.app` | Domain Vercel tanpa trailing slash (`/`) |
| `DB_CONNECTION` | `pgsql` | Driver database PostgreSQL |
| `DB_HOST` | `aws-0-ap-southeast-1.pooler.supabase.com` | **PENTING**: Gunakan host **Session Pooler (IPv4)** Supabase, BUKAN direct `db...` |
| `DB_PORT` | `5432` | Port Session Pooler Supabase |
| `DB_DATABASE` | `postgres` | Nama database default Supabase |
| `DB_USERNAME` | `postgres.[PROJECT_REF]` | Format username pooler Supabase |
| `DB_PASSWORD` | `[PASSWORD_SUPABASE]` | Password database Supabase |
| `DB_SSLMODE` | `require` | Wajib SSL untuk koneksi Supabase |
| `DB_EMULATE_PREPARES`| `false` | Biarkan `false` pada port 5432 (Session Mode) |
| `SESSION_DRIVER` | `cookie` | Stateless session berbasis cookie terenkripsi |
| `SESSION_SECURE_COOKIE` | `true` | Cookie hanya dikirim melalui koneksi HTTPS |
| `CACHE_STORE` | `array` | Cache in-memory untuk runtime serverless |
| `CLASS_TREASURER_KEY` | `[KEY_RAHASIA]` | Key autentikasi serah terima jabatan bendahara |

> [!IMPORTANT]
> **Mengapa wajib menggunakan Pooler (IPv4)?**  
> Vercel Serverless Functions berkomunikasi melalui jaringan IPv4. Alamat Direct Connection Supabase (`db.<project-ref>.supabase.co`) hanya mendukung IPv6 dan akan mengalami kegagalan resolusi host (`could not translate host name`). Gunakan selalu host pooler: `aws-0-[region].pooler.supabase.com`.

---

## 4. Finalisasi Domain dan Redeploy

1. Klik tombol **Deploy**.
2. Setelah deployment pertama selesai, salin domain resmi yang diberikan oleh Vercel (contoh: `https://rekap-kas-xi.vercel.app`).
3. Masuk ke **Settings** → **Environment Variables** di Vercel Dashboard, pastikan nilai `APP_URL` telah disesuaikan dengan domain tersebut tanpa garis miring di akhir.
4. Buka tab **Deployments**, klik tanda titik tiga pada deployment terbaru, lalu pilih **Redeploy** agar konfigurasi `APP_URL` terbaru aktif.
5. Akses website Anda — seluruh navigasi Inertia.js, asset Vite, dan mutasi kas Supabase kini aktif secara serverless.
