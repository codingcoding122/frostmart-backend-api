# Dokumentasi Auth API

Base URL: {{base_url}}/api/auth

Dokumen ini menjelaskan endpoint autentikasi yang aktif di backend Frostmart.

## 1. Ringkasan Endpoint Auth

| Method | Endpoint | Akses | Keterangan |
| --- | --- | --- | --- |
| POST | /api/auth/local/signup | Public | Registrasi user baru |
| POST | /api/auth/local/signin | Public | Login user |
| POST | /api/auth/refresh-token | Public | Refresh access token |
| GET | /api/auth/user/me | Login | Ambil profil user |
| PUT | /api/auth/user/me | Login | Update profil user |
| DELETE | /api/auth/remove-session | Login | Logout (clear cookie) |

## 2. Cara Kerja Auth (Aktual)

- Access token: JWT, expired 1 jam.
- Refresh token: JWT stateless, expired default 7 hari.
- Refresh token diverifikasi signature + payload type=refresh.
- Tidak ada tabel refresh_tokens di DB.
- Cookie yang dipakai:
  - access_token
  - refresh_token

Catatan local dev:
- Cookie diset secure=true. Pada HTTP lokal, beberapa client/browser bisa tidak mengirim cookie.
- Solusi testing: kirim Authorization header Bearer token, atau kirim refresh lewat x-refresh-token.

## 3. Validasi Input

### Signup
- name: string, min 3, max 225
- email: format email
- password: min 6

### Signin
- email: format email
- password: min 6

### Update Me
- name: string, min 3, max 225 (required)
- email: optional
- password: optional, min 6

## 4. POST /api/auth/local/signup

Body:
```json
{
  "name": "Frostmart Admin",
  "email": "admin@frostmart.local",
  "password": "Admin12345"
}
```

Response 201:
```json
{
  "user": {
    "id": 1,
    "name": "Frostmart Admin",
    "email": "admin@frostmart.local",
    "password": "$2b$10$...",
    "role": "user",
    "created_at": "2026-04-13T10:00:00.000Z"
  }
}
```

Kemungkinan error 400:
```json
{ "message": "Email already used" }
```

## 5. POST /api/auth/local/signin

Body:
```json
{
  "email": "admin@frostmart.local",
  "password": "Admin12345"
}
```

Response 200:
```json
{
  "user": {
    "id": 1,
    "name": "Frostmart Admin",
    "email": "admin@frostmart.local",
    "password": "$2b$10$...",
    "role": "admin",
    "created_at": "2026-04-13T10:00:00.000Z"
  }
}
```

Kemungkinan error 400:
```json
{ "message": "Invalid credentials" }
```

## 6. POST /api/auth/refresh-token

Sumber token refresh:
- cookie refresh_token, atau
- header x-refresh-token

Headers (opsional jika tidak pakai cookie):
- x-refresh-token: <refresh_token>

Response 200:
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

Error umum 403:
```json
{ "message": "Refresh token required" }
{ "message": "Invalid refresh token" }
{ "message": "User not found" }
```

## 7. GET /api/auth/user/me

Headers:
- Authorization: Bearer <access_token>

Response 200:
```json
{
  "id": 1,
  "name": "Frostmart Admin",
  "email": "admin@frostmart.local",
  "role": "admin"
}
```

Response 401:
- jika token tidak ada atau invalid

## 8. PUT /api/auth/user/me

Headers:
- Authorization: Bearer <access_token>
- Content-Type: application/json

Body contoh:
```json
{
  "name": "Frostmart Admin Updated",
  "email": "admin@frostmart.local",
  "password": "Admin123456"
}
```

Response 200:
```json
{
  "id": 1,
  "name": "Frostmart Admin Updated",
  "email": "admin@frostmart.local",
  "role": "admin"
}
```

## 9. DELETE /api/auth/remove-session

Headers:
- Authorization: Bearer <access_token>

Response 200:
```json
{
  "message": "Logged out successfully"
}
```

Catatan:
- Logout di implementasi saat ini bersifat stateless (clear cookie).

## 10. Cara Menjadikan User Admin

Setelah signup:
```sql
UPDATE users
SET role = 'admin'
WHERE email = 'admin@frostmart.local';
```

Setelah update role, signin ulang agar JWT memuat role terbaru.

## 11. Setup Postman yang Direkomendasikan

Gunakan collection:
- Frostmart API.postman_collection.json

Variable penting:
- url = http://localhost:5000/api
- admin_email
- admin_password
- access_token

Urutan test auth:
1. ADMIN SIGNUP
2. Ubah role user jadi admin di DB
3. ADMIN SIGNIN (access_token otomatis disimpan)
4. GET MY PROFILE

## 12. Troubleshooting

- 404 Not Found:
  - pastikan pakai prefix /api, contoh benar: /api/auth/local/signin
- 401 Unauthorized:
  - token tidak terkirim atau invalid
- 403 Forbidden (di endpoint product admin):
  - role user bukan admin
- Server gagal start:
  - gunakan command npm run dev (bukan nppm run dev)
