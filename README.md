# 🍽️ REST API — Frostmart
REST API sederhana dengan autentikasi JWT, role-based authorization, dan manajemen product. Dibangun dengan Express.js dan PostgreSQL.

## Tech Stack

- **Runtime:** Node.js (ESModule)
- **Framework:** Express.js v5
- **Database:** PostgreSQL (via `pg` Pool)
- **Auth:** JWT · Bcrypt · Passport Local · Crypto
- **Security:** Helmet · CORS · express-xss-sanitizer
- **Validation:** Zod
- **Dev Tools:** Nodemon · ESLint

---

## Fitur

- Registrasi & login dengan email/password
- JWT access token (1 jam) + refresh token rotation (7 hari)
- Token disimpan di HTTP-only cookie
- Role-based authorization (`user` / `admin`)
- Multi-device logout
- CRUD product dengan pagination & search
- Request logging

---

## Struktur Folder

```
src/
├── config/
│   ├── db.config.js        # Koneksi PostgreSQL (Pool)
│   └── passport.config.js  # Passport Local Strategy
├── middleware/
│   ├── auth.middleware.js   # Verifikasi JWT
│   ├── authorizeRoles.js   # Cek role user
│   └── logger.middleware.js
├── modules/
│   ├── auth/               # Register, login, refresh, logout
│   └── product/            # CRUD product
└── utils/
    ├── jwt.js              # Generate access & refresh token
    └── cookie.js           # Set cookie helper
```

---

## Instalasi

### Prasyarat

- Node.js >= 18
- PostgreSQL >= 14

### Langkah

**1. Clone repository**

```bash
git clone https://github.com/username/nama-repo.git
cd nama-repo
```

**2. Install dependencies**

```bash
npm install
```

**3. Konfigurasi environment**

```bash
cp .env.example .env
```

Buka `.env` dan isi nilainya:

```env
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/nama_db
JWT_SECRET=ganti_dengan_string_random_panjang
```

**4. Buat database & jalankan schema**

```bash
psql -U postgres -c "CREATE DATABASE nama_db;"
psql -U postgres -d nama_db -f db.sql
```

**5. Jalankan server**

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

Server berjalan di `http://localhost:5000`

---

## Environment Variables

| Variable       | Contoh             | Keterangan                            |
| -------------- | ------------------ | ------------------------------------- |
| `PORT`         | `5000`             | Port server                           |
| `DATABASE_URL` | `postgresql://...` | Connection string PostgreSQL          |
| `JWT_SECRET`   | `random-string`    | Secret untuk signing JWT access token |

---

## API Endpoints

### Auth — `/api/auth`

| Method   | Endpoint          | Akses    | Keterangan           |
| -------- | ----------------- | -------- | -------------------- |
| `POST`   | `/local/signup`   | Public   | Registrasi akun baru |
| `POST`   | `/local/signin`   | Public   | Login                |
| `POST`   | `/refresh-token`  | Public   | Rotate refresh token |
| `GET`    | `/user/me`        | 🔒 Login | Profil user          |
| `PUT`    | `/user/me`        | 🔒 Login | Update profil        |
| `DELETE` | `/remove-session` | 🔒 Login | Logout               |

### Product — `/api/products`

| Method   | Endpoint | Akses    | Keterangan               |
| -------- | -------- | -------- | ------------------------ |
| `GET`    | `/`      | Public   | Semua product (paginated + search) |
| `GET`    | `/:id`   | Public   | Detail product                      |
| `POST`   | `/`      | 🔒 Admin | Buat product baru                   |
| `PUT`    | `/:id`   | 🔒 Admin | Update product                      |
| `DELETE` | `/:id`   | 🔒 Admin | Hapus product                       |

> Dokumentasi lengkap tiap endpoint tersedia di [`Dokumentasi Auth API.md`](./Dokumentasi%20Auth%20API.md) dan [`Dokumentasi API Product.md`](./Dokumentasi%20API%20Product.md).

---

## Scripts

```bash
npm run dev       # Jalankan dengan nodemon (development)
npm start         # Jalankan tanpa nodemon (production)
npm run lint      # Cek lint error
npm run lint:fix  # Auto-fix lint error
```

---

## Catatan

- **Delete product** — data product dihapus langsung dari tabel `products`
- **Role admin** — set manual via SQL: `UPDATE users SET role='admin' WHERE email='...';`, lalu login ulang
- **Cookie** — menggunakan `httpOnly`, `secure`, `sameSite: lax`; pastikan testing via HTTPS di production
- **CORS** — saat ini hanya mengizinkan `http://localhost:5173`; ubah di `server.js` sesuai kebutuhan
