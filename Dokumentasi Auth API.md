# Dokumentasi Auth API

Base URL auth: {{base_url}}/api/auth

Dokumen ini berisi auth flow utama dan ringkasan endpoint lanjutan yang sekarang sudah aktif di backend Frostmart.

## 1. Ringkasan Endpoint Auth

| Method | Endpoint | Akses | Keterangan |
| --- | --- | --- | --- |
| POST | /api/auth/local/signup | Public | Registrasi user baru |
| POST | /api/auth/local/signin | Public | Login user |
| POST | /api/auth/refresh-token | Public | Refresh access token |
| GET | /api/auth/user/me | Login | Ambil profil user |
| PUT | /api/auth/user/me | Login | Update profil user |
| DELETE | /api/auth/remove-session | Login | Logout (clear cookie) |

## 2. Ringkasan API Lanjutan (Aktif)

### Users API (admin only)
Base URL: {{base_url}}/api/users

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| GET | /api/users | List users + pagination + search |
| GET | /api/users/:id | Detail user |
| PATCH | /api/users/:id/role | Ubah role user (admin/user) |
| DELETE | /api/users/:id | Hapus user (tidak bisa hapus akun sendiri) |

### Orders API
Base URL: {{base_url}}/api/orders

| Method | Endpoint | Akses | Keterangan |
| --- | --- | --- | --- |
| POST | /api/orders/checkout | Login | Buat order + item + transaction |
| GET | /api/orders/my | Login | Ambil order milik sendiri |
| GET | /api/orders/:id | Login | Detail order (owner/admin) |
| GET | /api/orders | Admin | List semua order |
| PATCH | /api/orders/:id/status | Admin | Ubah status order |

Aturan bisnis order terbaru:
- Order tidak boleh diubah ke `paid` atau `completed` jika `transactions.payment_status` masih selain `paid`.

### Transactions API
Base URL: {{base_url}}/api/transactions

| Method | Endpoint | Akses | Keterangan |
| --- | --- | --- | --- |
| GET | /api/transactions/my | Login | Transaksi milik sendiri |
| GET | /api/transactions/:id | Login | Detail transaksi (owner/admin) |
| GET | /api/transactions | Admin | List semua transaksi |
| PATCH | /api/transactions/:id/status | Admin | Ubah payment_status |

### Inventory Logs API (admin only)
Base URL: {{base_url}}/api/inventory-logs

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| GET | /api/inventory-logs | List log stok (filter product_id opsional) |
| POST | /api/inventory-logs/adjust | Penyesuaian stok manual (IN/OUT) |

## 3. Cara Kerja Auth (Aktual)

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

## 4. Validasi Input Auth

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

## 5. Contoh Request Auth

### POST /api/auth/local/signup

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

### POST /api/auth/local/signin

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

### POST /api/auth/refresh-token

Sumber token refresh:
- cookie refresh_token, atau
- header x-refresh-token

Response 200:
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

### DELETE /api/auth/remove-session

Response 200:
```json
{
  "message": "Logged out successfully"
}
```

## 6. Setup Postman yang Direkomendasikan

Gunakan collection:
- Frostmart API.postman_collection.json

Variable penting:
- url = http://localhost:5000/api
- admin_email
- admin_password
- access_token
- user_id
- product_id
- order_id
- transaction_id
- image_path

Urutan test minimal:
1. ADMIN SIGNUP
2. Set role admin lewat SQL (jika masih user)
3. ADMIN SIGNIN
4. GET MY PROFILE
5. CREATE NEW PRODUCT
6. CHECKOUT (CREATE ORDER)
7. UPDATE ORDER STATUS TO COMPLETED (SHOULD FAIL IF PAYMENT PENDING)
8. UPDATE TRANSACTION STATUS (ADMIN) -> paid
9. UPDATE ORDER STATUS TO COMPLETED (AFTER PAYMENT PAID)
10. Lanjut test Users dan Inventory Logs

## 7. Cara Menjadikan User Admin

```sql
UPDATE users
SET role = 'admin'
WHERE email = 'admin@frostmart.local';
```

Setelah update role, signin ulang agar JWT memuat role terbaru.

## 8. Troubleshooting

- 404 Not Found:
  - pastikan pakai prefix /api, contoh benar: /api/auth/local/signin
- 401 Unauthorized:
  - token tidak terkirim atau invalid
- 403 Forbidden:
  - role user bukan admin untuk endpoint admin
- Server gagal start:
  - gunakan command npm run dev
