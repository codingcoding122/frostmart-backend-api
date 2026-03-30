# Dokumentasi REST API — Auth & Authorization

> Stack: Express.js · PostgreSQL · JWT · Bcrypt · Passport Local · Crypto · CORS · Helmet · XSS Sanitizer

---

## Daftar Isi

1. [Struktur Folder](#1-struktur-folder)
2. [Environment Variables](#2-environment-variables)
3. [Database Schema](#3-database-schema)
4. [Keamanan Server (server.js)](#4-keamanan-server-serverjs)
5. [Auth — Cara Kerja](#5-auth--cara-kerja)
   - [Bcrypt — Hash Password](#51-bcrypt--hash-password)
   - [JWT — Access Token](#52-jwt--access-token)
   - [Crypto — Refresh Token](#53-crypto--refresh-token)
   - [Cookie — Penyimpanan Token](#54-cookie--penyimpanan-token)
   - [Passport Local — Strategi Login](#55-passport-local--strategi-login)
   - [Refresh Token Rotation](#56-refresh-token-rotation)
6. [Authorization — Role Guard](#6-authorization--role-guard)
7. [Auth Middleware](#7-auth-middleware)
8. [Setup Postman](#8-setup-postman)
9. [API Reference](#9-api-reference)
   - [Auth Routes](#91-auth-routes)
   - [Menu Routes](#92-menu-routes)
10. [Alur Lengkap: Login → Akses Protected Route](#10-alur-lengkap-login--akses-protected-route)
11. [Contoh Penggunaan di Postman](#11-contoh-penggunaan-di-postman)

---

## 1. Struktur Folder

```
.
├── .env
├── .env.example
├── db.sql
├── package.json
└── src/
    ├── server.js
    ├── config/
    │   ├── db.config.js        # Koneksi PostgreSQL (Pool)
    │   └── passport.config.js  # Passport Local Strategy
    ├── middleware/
    │   ├── auth.middleware.js   # Verifikasi JWT
    │   ├── authorizeRoles.js   # Cek role user
    │   └── logger.middleware.js
    ├── modules/
    │   ├── auth/
    │   │   ├── auth.controller.js
    │   │   ├── auth.service.js
    │   │   ├── auth.repository.js
    │   │   ├── auth.routes.js
    │   │   └── auth.validation.js
    │   └── menu/
    │       ├── menu.controller.js
    │       ├── menu.service.js
    │       ├── menu.repository.js
    │       ├── menu.routes.js
    │       └── menu.validation.js
    └── utils/
        ├── jwt.js    # Generate access token & refresh token
        └── cookie.js # Set cookie ke response
```

---

## 2. Environment Variables

Salin `.env.example` → `.env`, lalu isi nilainya:

```env
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
JWT_SECRET=ganti_dengan_secret_yang_panjang_dan_random
JWT_REFRESH_SECRET=refresh_secret   # (opsional, saat ini belum dipakai)
ACCESS_TOKEN_EXPIRES=1h
REFRESH_TOKEN_EXPIRES=7d
```

> ⚠️ **Jangan commit file `.env` ke Git.**

---

## 3. Database Schema

Terdapat 3 tabel utama:

```sql
-- Tabel user
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT,            -- NULL jika OAuth (Google)
  role TEXT DEFAULT 'user', -- 'user' | 'admin'
  provider TEXT DEFAULT 'local', -- 'local' | 'google'
  created_at TIMESTAMP DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Tabel menu
CREATE TABLE menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Tabel refresh token (multi-device)
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

Kolom `is_deleted` digunakan untuk **soft delete** — data tidak benar-benar dihapus dari database.

---

## 4. Keamanan Server (server.js)

```js
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(helmet());
app.use(xss());
app.use(cookieParser());
```

| Middleware     | Fungsi                                                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `cors`         | Hanya izinkan request dari origin tertentu (`localhost:5173`). `credentials: true` wajib agar cookie dikirim cross-origin. |
| `helmet`       | Set HTTP security headers otomatis (CSP, X-Frame-Options, dll).                                                            |
| `xss()`        | Sanitasi semua input dari `req.body`, `req.query`, `req.params` — mencegah XSS injection.                                  |
| `cookieParser` | Parse cookie dari request, sehingga `req.cookies` bisa diakses.                                                            |

---

## 5. Auth — Cara Kerja

### 5.1 Bcrypt — Hash Password

`bcrypt` digunakan untuk **hash password** sebelum disimpan ke database. Password tidak pernah disimpan dalam bentuk plain text.

```js
// Saat signup — hash password
const hash = await bcrypt.hash(data.password, 10);
// angka 10 = salt rounds (makin tinggi makin aman, tapi lebih lambat)

// Saat signin — bandingkan input dengan hash di DB
const valid = await bcrypt.compare(data.password, user.password);
// mengembalikan true/false
```

**Mengapa bcrypt?**

- Hash satu arah — tidak bisa di-decrypt
- Setiap hash unik meski password sama (karena salt)
- Tahan terhadap brute-force karena sengaja dibuat lambat

---

### 5.2 JWT — Access Token

JWT (JSON Web Token) digunakan sebagai **access token** untuk autentikasi stateless.

```js
// utils/jwt.js
export const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role }, // payload yang disimpan di token
    process.env.JWT_SECRET, // secret key untuk signing
    { expiresIn: "1h" }, // token expired dalam 1 jam
  );
};
```

**Struktur JWT:** `header.payload.signature`

- **Payload** berisi: `id`, `role`, `iat` (issued at), `exp` (expiry)
- **Signature** membuktikan token tidak dimanipulasi
- Token **tidak dienkripsi** — jangan simpan data sensitif di payload
- Expired dalam **1 jam** — setelah itu harus refresh

---

### 5.3 Crypto — Refresh Token

Refresh token **bukan JWT** — ini adalah string random yang disimpan di database.

```js
// utils/jwt.js
export const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString("hex"); // 128 karakter hex
};
```

**Mengapa bukan JWT?**

- Refresh token perlu bisa **dicabut** (revoke) sewaktu-waktu
- Dengan menyimpan di DB, kita bisa hapus token untuk logout
- JWT stateless — tidak bisa dicabut tanpa blacklist

---

### 5.4 Cookie — Penyimpanan Token

Kedua token disimpan di **HTTP-only cookie**, bukan `localStorage`.

```js
// utils/cookie.js
res.cookie("access_token", accessToken, {
  httpOnly: true, // tidak bisa diakses JS di browser (mencegah XSS theft)
  secure: true, // hanya dikirim via HTTPS
  sameSite: "lax", // proteksi CSRF
  maxAge: 60 * 60 * 1000, // 1 jam (ms)
});

res.cookie("refresh_token", refreshToken, {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 hari
});
```

**Mengapa `httpOnly`?**

- JavaScript di browser tidak bisa membaca cookie ini
- Jika ada XSS attack, token tetap aman

**Alternatif:** Token juga bisa dikirim via header `Authorization: Bearer <token>` atau `x-refresh-token` — berguna untuk klien non-browser (mobile app).

---

### 5.5 Passport Local — Strategi Login

Passport Local disetup tapi **tidak dipakai langsung** di routes saat ini — logic verifikasi dipindah ke `auth.service.js`. Config passport tersedia jika ingin digunakan.

```js
// config/passport.config.js
passport.use(
  new LocalStrategy(
    { usernameField: "email", passwordField: "password" },
    async (email, password, done) => {
      const user = await db.query("SELECT * FROM users WHERE email=$1", [
        email,
      ]);
      if (!user.rows.length) return done(null, false); // user tidak ada

      const valid = await bcrypt.compare(password, user.rows[0].password);
      if (!valid) return done(null, false); // password salah

      return done(null, user.rows[0]); // sukses
    },
  ),
);
```

---

### 5.6 Refresh Token Rotation

Setiap kali refresh, token lama **dihapus** dan token baru **dibuat**. Ini mencegah token dicuri dan dipakai berkali-kali.

```
Client                          Server
  |                               |
  |--- POST /refresh-token -----> |
  |    (kirim refresh_token)      |
  |                               | 1. Cek token di DB → valid
  |                               | 2. Hapus token lama dari DB
  |                               | 3. Buat access token baru (JWT)
  |                               | 4. Buat refresh token baru (crypto)
  |                               | 5. Simpan refresh token baru ke DB
  |<-- access_token (cookie) ---- |
  |<-- refresh_token (cookie) --- |
```

Implementasi di `auth.service.js`:

```js
export const refreshToken = async (oldToken) => {
  const existing = await repo.findRefreshToken(oldToken);
  if (!existing) throw new Error("Invalid refresh token");

  await repo.deleteRefreshToken(existing.id); // hapus lama
  const user = await repo.findUserById(existing.user_id);
  return await createSession(user); // buat session baru
};
```

---

## 6. Authorization — Role Guard

Setelah autentikasi, beberapa route hanya boleh diakses role tertentu.

```js
// middleware/authorizeRoles.js
export const authorizeRoles = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) return res.sendStatus(401);

    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: insufficient role" });
    }

    next();
  };
};
```

**Penggunaan di route:**

```js
router.post(
  "/",
  authMiddleware,
  authorizeRoles(["admin"]),
  controller.createMenu,
);
//            ↑ cek JWT dulu    ↑ lalu cek role
```

| Status             | Arti                              |
| ------------------ | --------------------------------- |
| `401 Unauthorized` | Tidak ada token / token invalid   |
| `403 Forbidden`    | Token valid tapi role tidak cukup |

---

## 7. Auth Middleware

Middleware ini memverifikasi JWT di setiap request ke protected route.

```js
// middleware/auth.middleware.js
export const authMiddleware = (req, res, next) => {
  // Ambil token dari cookie ATAU header Authorization
  const token =
    req.cookies.access_token || req.headers.authorization?.split(" ")[1];

  if (!token) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, iat, exp }
    next();
  } catch {
    return res.sendStatus(401); // token expired atau invalid
  }
};
```

Setelah middleware ini, `req.user` berisi payload dari JWT dan bisa dipakai di controller:

```js
const userId = req.user.id;
const userRole = req.user.role;
```

---

## 8. Setup Postman

### 8.1 Buat Environment

Buat environment baru di Postman agar URL dan token tidak perlu diketik ulang.

1. Klik ikon **Environments** (mata) di sidebar kiri → **Add**
2. Beri nama misalnya `REST API Local`
3. Tambahkan variabel berikut:

| Variable        | Initial Value           | Current Value           |
| --------------- | ----------------------- | ----------------------- |
| `base_url`      | `http://localhost:5000` | `http://localhost:5000` |
| `access_token`  | _(kosong)_              | _(diisi otomatis)_      |
| `refresh_token` | _(kosong)_              | _(diisi otomatis)_      |

4. Klik **Save**, lalu aktifkan environment tersebut (pilih dari dropdown kanan atas).

---

### 8.2 Auto-Simpan Token dengan Scripts

Agar token tersimpan otomatis setelah login/signup, tambahkan script berikut di tab **Scripts → Post-response** pada request Signup dan Signin:

```js
// Scripts → Post-response (untuk Signup & Signin)
const res = pm.response.json();

// Simpan access_token dari header cookie (jika pakai cookie)
// Atau dari response body jika server kirim token di body
const cookies = pm.cookies;
if (cookies.has("access_token")) {
  pm.environment.set("access_token", cookies.get("access_token"));
}
if (cookies.has("refresh_token")) {
  pm.environment.set("refresh_token", cookies.get("refresh_token"));
}
```

> **Catatan:** Karena server menggunakan `httpOnly` cookie, Postman bisa membaca cookie tersebut secara otomatis selama fitur **"Automatically follow redirects"** dan **cookie jar** aktif (default aktif).

---

### 8.3 Kirim Token di Protected Route

Untuk route yang butuh autentikasi 🔒, ada dua cara:

**Cara 1 — Pakai Cookie (otomatis jika sudah login)**
Postman menyimpan cookie dari response sebelumnya secara otomatis. Tidak perlu setting tambahan.

**Cara 2 — Pakai Header Authorization (manual)**
Di tab **Headers** pada request:

```
Key   : Authorization
Value : Bearer {{access_token}}
```

Atau di tab **Auth** → pilih **Bearer Token** → masukkan `{{access_token}}`.

---

### 8.4 Kirim Refresh Token via Header

Jika cookie tidak terkirim otomatis, kirim refresh token via header:

```
Key   : x-refresh-token
Value : {{refresh_token}}
```

---

## 9. API Reference

### 9.1 Auth Routes

Base URL: `{{base_url}}/api/auth`

---

#### `POST /api/auth/local/signup`

Daftar akun baru. Otomatis login setelah signup.

**Postman:**

- Method: `POST`
- URL: `{{base_url}}/api/auth/local/signup`
- Tab **Body** → `raw` → `JSON`

```json
{
  "name": "Budi Santoso",
  "email": "budi@example.com",
  "password": "rahasia123"
}
```

**Response `201`:**

```json
{
  "user": {
    "id": "uuid",
    "name": "Budi Santoso",
    "email": "budi@example.com",
    "role": "user"
  }
}
```

Cookie `access_token` dan `refresh_token` otomatis di-set di cookie jar Postman.

---

#### `POST /api/auth/local/signin`

Login dengan email & password.

**Postman:**

- Method: `POST`
- URL: `{{base_url}}/api/auth/local/signin`
- Tab **Body** → `raw` → `JSON`

```json
{
  "email": "budi@example.com",
  "password": "rahasia123"
}
```

**Response `200`:**

```json
{
  "user": { "id": "uuid", "email": "budi@example.com", "role": "user" }
}
```

---

#### `POST /api/auth/refresh-token`

Perbarui access token menggunakan refresh token.

**Postman:**

- Method: `POST`
- URL: `{{base_url}}/api/auth/refresh-token`
- Tab **Headers** (jika tidak pakai cookie):

```
x-refresh-token : {{refresh_token}}
```

**Response `200`:**

```json
{
  "accessToken": "eyJ..."
}
```

Cookie baru otomatis di-set.

---

#### `GET /api/auth/user/me` 🔒

Ambil data profil user yang sedang login.

**Postman:**

- Method: `GET`
- URL: `{{base_url}}/api/auth/user/me`
- Tab **Auth** → `Bearer Token` → Value: `{{access_token}}`

**Response `200`:**

```json
{
  "id": "uuid",
  "email": "budi@example.com",
  "role": "user"
}
```

---

#### `PUT /api/auth/user/me` 🔒

Update profil sendiri.

**Postman:**

- Method: `PUT`
- URL: `{{base_url}}/api/auth/user/me`
- Tab **Auth** → `Bearer Token` → `{{access_token}}`
- Tab **Body** → `raw` → `JSON`

```json
{
  "name": "Budi Update",
  "email": "budi-baru@example.com",
  "password": "passwordbaru"
}
```

**Response `200`:** Data user yang sudah diupdate.

---

#### `DELETE /api/auth/remove-session` 🔒

Logout. Hapus refresh token dari database.

**Postman:**

- Method: `DELETE`
- URL: `{{base_url}}/api/auth/remove-session`
- Tab **Auth** → `Bearer Token` → `{{access_token}}`

Untuk logout semua device, tambahkan query param:

- Tab **Params** → Key: `all` → Value: `true`
- URL jadi: `{{base_url}}/api/auth/remove-session?all=true`

**Response `200`:**

```json
{ "message": "Logged out successfully" }
```

---

### 9.2 Menu Routes

Base URL: `{{base_url}}/api/menus`

---

#### `GET /api/menus` (Public)

Ambil semua menu dengan pagination.

**Postman:**

- Method: `GET`
- URL: `{{base_url}}/api/menus`
- Tab **Params** (opsional):

| Key     | Value |
| ------- | ----- |
| `page`  | `1`   |
| `limit` | `10`  |

**Response `200`:**

```json
{
  "page": 1,
  "limit": 10,
  "total_pages": 5,
  "data": [
    {
      "id": "uuid",
      "name": "Nasi Goreng",
      "price": 25000,
      "is_available": true
    }
  ]
}
```

---

#### `GET /api/menus/:id` (Public)

Ambil detail menu berdasarkan ID.

**Postman:**

- Method: `GET`
- URL: `{{base_url}}/api/menus/isi-uuid-disini`

**Response `200`:** Object menu. `404` jika tidak ditemukan.

---

#### `POST /api/menus` 🔒 Admin Only

Buat menu baru.

**Postman:**

- Method: `POST`
- URL: `{{base_url}}/api/menus`
- Tab **Auth** → `Bearer Token` → `{{access_token}}`
- Tab **Body** → `raw` → `JSON`

```json
{
  "name": "Mie Ayam",
  "description": "Mie ayam spesial",
  "price": 18000
}
```

**Response `201`:** Data menu yang baru dibuat.

---

#### `PUT /api/menus/:id` 🔒 Admin Only

Update menu berdasarkan ID.

**Postman:**

- Method: `PUT`
- URL: `{{base_url}}/api/menus/isi-uuid-disini`
- Tab **Auth** → `Bearer Token` → `{{access_token}}`
- Tab **Body** → `raw` → `JSON`

```json
{
  "name": "Mie Ayam Spesial",
  "description": "Versi upgrade",
  "price": 22000,
  "is_available": true
}
```

**Response `200`:** Data menu yang sudah diupdate.

---

#### `DELETE /api/menus/:id` 🔒 Admin Only

Soft delete menu (`is_deleted` → `true`).

**Postman:**

- Method: `DELETE`
- URL: `{{base_url}}/api/menus/isi-uuid-disini`
- Tab **Auth** → `Bearer Token` → `{{access_token}}`

**Response `200`:**

```json
{ "message": "Menu deleted successfully" }
```

---

## 10. Alur Lengkap: Login → Akses Protected Route

```
1. Client kirim POST /api/auth/local/signin
        ↓
2. Controller parse & validasi body (zod)
        ↓
3. Service: cari user by email → compare password (bcrypt)
        ↓
4. Jika valid → createSession():
   - generateAccessToken(user)  → JWT (1 jam)
   - generateRefreshToken()     → random hex (crypto)
   - Simpan refresh token ke DB
        ↓
5. setCookies(res, { accessToken, refreshToken })
        ↓
6. Postman simpan cookie di cookie jar otomatis
        ↓
7. Client akses GET /api/auth/user/me
   → kirim token via cookie ATAU header Authorization
        ↓
8. authMiddleware:
   - Baca cookie access_token / header Authorization
   - jwt.verify() → decode payload
   - Set req.user = { id, role }
        ↓
9. Controller: gunakan req.user.id untuk ambil data
```

---

## 11. Contoh Penggunaan di Postman

### Urutan Request yang Benar

Ikuti urutan ini saat testing pertama kali:

1. **Signup** → `POST /api/auth/local/signup` — buat akun baru
2. **Signin** → `POST /api/auth/local/signin` — login, cookie tersimpan otomatis
3. **Me** → `GET /api/auth/user/me` — pastikan token berfungsi
4. **Get Menus** → `GET /api/menus` — test public route
5. **Create Menu** → `POST /api/menus` — test protected + admin route
6. **Refresh** → `POST /api/auth/refresh-token` — rotate token
7. **Logout** → `DELETE /api/auth/remove-session` — hapus sesi

---

### Tips Postman

**Simpan sebagai Collection**
Buat satu Collection bernama `REST API Auth` dan kelompokkan request ke dalam folder `Auth` dan `Menu`.

**Atur role admin untuk testing**
Route admin tidak bisa diakses dengan role `user`. Jalankan query ini langsung ke database:

```sql
UPDATE users SET role='admin' WHERE email='budi@test.com';
```

Lalu login ulang agar JWT baru berisi role `admin`.

**Cek cookie di Postman**
Klik ikon **Cookies** (di bawah tombol Send) untuk melihat `access_token` dan `refresh_token` yang tersimpan dari response sebelumnya.

**Jika cookie tidak terkirim**
Pastikan domain di cookie jar cocok. Buka **Manage Cookies** → cek ada entry untuk `localhost`. Alternatifnya, gunakan header `Authorization: Bearer {{access_token}}` secara manual.

---

> 🔒 = Route membutuhkan autentikasi (access token)  
> Semua variabel `{{access_token}}`, `{{refresh_token}}`, `{{base_url}}` mengacu pada Environment Postman yang sudah dibuat di [Section 8](#8-setup-postman).
