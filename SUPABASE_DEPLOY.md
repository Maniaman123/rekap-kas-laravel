# Panduan Deploy Rekap Kas → Supabase + Cloud (Render / Koyeb / Fly.io)

> [!IMPORTANT]
> Ikuti urutan langkah ini secara berurutan. Jangan push ke cloud sebelum koneksi database berhasil diuji di lokal.

---

## 1. Ambil Kredensial Supabase

1. Buka **[supabase.com/dashboard](https://supabase.com/dashboard)** → pilih project.
2. Navigasi ke **Project Settings → Database → Connection Pooler**.
3. Pilih mode:
   | Mode | Port | Kapan Digunakan |
   |---|---|---|
   | **Session Mode** | `5432` | Default — full prepared-statement support |
   | **Transaction Mode** | `6543` | Cocok untuk serverless (tambah `DB_PGBOUNCER=true`) |
4. Salin nilai-nilai berikut:

   | Variabel | Sumber di Dashboard |
   |---|---|
   | `DB_HOST` | Host (contoh: `aws-0-ap-southeast-1.pooler.supabase.com`) |
   | `DB_PORT` | `5432` (Session) atau `6543` (Transaction) |
   | `DB_DATABASE` | `postgres` |
   | `DB_USERNAME` | `postgres.[project-ref]` |
   | `DB_PASSWORD` | Password database (buat di **Database → Database Password**) |

---

## 2. Uji Koneksi dari Terminal Lokal

Sebelum deploy, pastikan migrasi berjalan dari mesin lokal:

```bash
# 1. Buat .env sementara dari template
cp .env.example .env

# 2. Isi variabel Supabase di .env (gunakan nilai dari langkah 1)
#    DB_CONNECTION=pgsql
#    DB_HOST=aws-0-ap-southeast-1.pooler.supabase.com
#    DB_PORT=5432
#    DB_DATABASE=postgres
#    DB_USERNAME=postgres.[project-ref]
#    DB_PASSWORD=YOUR_SUPABASE_PASSWORD
#    DB_SSLMODE=require

# 3. Generate APP_KEY jika belum ada
php artisan key:generate

# 4. Cek status migrasi (tidak merusak data)
php artisan migrate:status

# 5. Jalankan migrasi ke Supabase
php artisan migrate --force
```

> [!CAUTION]
> `php artisan migrate:fresh` akan **DROP SEMUA TABEL**. Gunakan hanya di environment development, **bukan** di database Supabase production.

---

## 3. Variabel Environment untuk Cloud Host

Paste seluruh blok ini ke panel **Environment Variables** di Render / Koyeb / Fly.io:

```env
APP_NAME="Rekap Kas"
APP_ENV=production
APP_KEY=base64:GENERATE_VIA_php_artisan_key_generate
APP_DEBUG=false
APP_URL=https://your-app-domain.com

LOG_CHANNEL=stderr
LOG_LEVEL=warning

# ── Supabase PostgreSQL ──────────────────────────────────────
DB_CONNECTION=pgsql
DB_HOST=aws-0-ap-southeast-1.pooler.supabase.com
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=postgres.[project-ref]
DB_PASSWORD=YOUR_SUPABASE_PASSWORD
DB_SSLMODE=require
DB_PGBOUNCER=false

# Aktifkan jika pakai Transaction Mode port 6543:
# DB_PORT=6543
# DB_PGBOUNCER=true

# ── Session & Cache (database driver agar stateless-ready) ───
SESSION_DRIVER=database
SESSION_LIFETIME=120
CACHE_STORE=database
QUEUE_CONNECTION=database

# ── Enkripsi Bendahara ───────────────────────────────────────
CLASS_TREASURER_KEY=YOUR_SECRET_KEY
```

> [!TIP]
> Jalankan `php artisan key:generate --show` di lokal untuk mendapatkan nilai `APP_KEY` yang benar, lalu copy hasilnya.

---

## 4. Deploy Docker Image

### Render / Koyeb
1. Set **Dockerfile path** → `Dockerfile` (di root project).
2. Set semua environment variables dari langkah 3.
3. Set **Port** → `8080`.
4. Deploy — entrypoint otomatis menjalankan `migrate --force` saat container start.

### Fly.io
```bash
fly launch --dockerfile Dockerfile --no-deploy
fly secrets set APP_KEY="base64:..." DB_PASSWORD="..." CLASS_TREASURER_KEY="..."
fly deploy
```

---

## 5. Verifikasi Pasca-Deploy

```bash
# Cek health endpoint Laravel
curl -I https://your-app-domain.com/up

# Expected: HTTP/2 200

# Cek log container (Render/Fly)
fly logs          # Fly.io
# atau dari dashboard Render → Logs
```

> [!NOTE]
> Jika muncul error `SSL SYSCALL EOF detected`, pastikan `DB_SSLMODE=require` sudah ter-set dan port yang digunakan sesuai dengan mode yang dipilih (5432 Session / 6543 Transaction).

