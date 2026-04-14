# REST API Frostmart

Backend REST API untuk Frostmart dengan autentikasi JWT, manajemen produk, checkout order, transaksi pembayaran, manajemen user admin, dan inventory log.

## Tech Stack

- Runtime: Node.js (ES Module)
- Framework: Express.js
- Database: PostgreSQL (`pg` Pool)
- Auth: JWT, Bcrypt, Passport
- Cache: Redis
- Upload: Multer + Cloudinary
- Validation: Zod
- Security: Helmet, CORS, express-xss-sanitizer

## Fitur Utama

- Authentication: register, login, refresh token, logout
- Manage users (admin)
- Get dan manage products
- Upload/replace/delete foto product
- Checkout order + order items
- Manage orders
- Manage transactions
- Guard bisnis order vs payment status (order tidak bisa `paid/completed` jika payment belum `paid`)
- Inventory logs + stock adjustment
- Redis caching untuk endpoint GET product

## Struktur Module

```txt
src/modules/
    auth/
    product/
    users/
    orders/
    transactions/
    inventory-logs/
```

## Instalasi

### Prasyarat

- Node.js >= 18
- PostgreSQL >= 14
- Redis (lokal/cloud)

### Langkah

1. Install dependencies

```bash
npm install
```

2. Buat file `.env` dari `.env.example`, lalu isi variabel.

3. Buat database dan jalankan schema:

```bash
psql -U postgres -c "CREATE DATABASE frostmart_db;"
psql -U postgres -d frostmart_db -f frostmart_db.sql
```

4. Jalankan server:

```bash
npm run dev
```

Server default: `http://localhost:5000`

## Environment Variables

```env
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/frostmart_db

JWT_SECRET=replace_this_secret
JWT_REFRESH_SECRET=replace_this_refresh_secret
REFRESH_TOKEN_EXPIRES=7d

CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USERNAME=
REDIS_PASSWORD=
```

## API Ringkasan

### Auth API (`/api/auth`)

- `POST /local/signup`
- `POST /local/signin`
- `POST /refresh-token`
- `GET /user/me`
- `PUT /user/me`
- `DELETE /remove-session`

### Users API (`/api/users`) - admin only

- `GET /`
- `GET /:id`
- `PATCH /:id/role`
- `DELETE /:id`

### Product API (`/api/products`)

- Public:
    - `GET /`
    - `GET /:id`
- Admin:
    - `POST /`
    - `PUT /:id`
    - `DELETE /:id`
    - `POST /photo/:id`
    - `PUT /photo/:id`
    - `DELETE /photo/:id`

### Orders API (`/api/orders`)

- Login user:
    - `POST /checkout`
    - `GET /my`
    - `GET /:id` (owner/admin)
- Admin:
    - `GET /`
    - `PATCH /:id/status`

Catatan rule:
- Status order ke `paid` atau `completed` hanya bisa jika status transaksi terkait sudah `paid`.

### Transactions API (`/api/transactions`)

- Login user:
    - `GET /my`
    - `GET /:id` (owner/admin)
- Admin:
    - `GET /`
    - `PATCH /:id/status`

### Inventory Logs API (`/api/inventory-logs`) - admin only

- `GET /`
- `POST /adjust`

## Postman Collection

Gunakan file:
- `Frostmart API.postman_collection.json`

Variable environment utama:
- `url` = `http://localhost:5000/api`
- `admin_email`
- `admin_password`
- `access_token`
- `product_id`
- `user_id`
- `order_id`
- `transaction_id`
- `image_path`

Urutan testing penting (order + transaction):
1. `ADMIN SIGNIN`
2. `CREATE NEW PRODUCT`
3. `CHECKOUT (CREATE ORDER)`
4. `UPDATE ORDER STATUS TO COMPLETED (SHOULD FAIL IF PAYMENT PENDING)`
5. `UPDATE TRANSACTION STATUS (ADMIN)` dengan `payment_status = paid`
6. `UPDATE ORDER STATUS TO COMPLETED (AFTER PAYMENT PAID)`

## Scripts

```bash
npm run dev
npm start
npm run lint
npm run lint:fix
```

## Dokumentasi Detail

- `Dokumentasi API Lengkap Frostmart.md`
- `Dokumentasi Auth API.md`
- `Dokumentasi API Product.md`
- `Dokumentasi API Upload Product Foto.md`
- `Dokumentasi API Product dengan Redis.md`

## Catatan

- Untuk endpoint admin, user harus role `admin`.
- Setelah ubah role user via SQL, login ulang agar claim role di JWT ikut update.
- Cookie auth diset `secure: true`, jadi pada local HTTP ada kasus cookie tidak terkirim di client tertentu.
- Order status `paid/completed` wajib didahului payment status `paid` agar status data konsisten.
