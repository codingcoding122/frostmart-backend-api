# Dokumentasi API Product

Base URL: {{base_url}}/api/products

Dokumen ini menjelaskan endpoint Product yang aktif di backend Frostmart.
Semua endpoint write membutuhkan access token user dengan role admin.

## 1. Ringkasan Endpoint Product

| Method | Endpoint | Akses | Keterangan |
| --- | --- | --- | --- |
| GET | /api/products | Public | List product (pagination + search + cache) |
| GET | /api/products/:id | Public | Detail product by id (cache) |
| POST | /api/products | Admin | Create product |
| PUT | /api/products/:id | Admin | Update product |
| DELETE | /api/products/:id | Admin | Delete product |

Catatan:
- GET endpoint menambahkan field source dari cache middleware: db atau cache.

## 2. Setup Postman

Gunakan collection: Frostmart API.postman_collection.json

Environment:
- base_url: http://localhost:5000
- url: http://localhost:5000/api
- access_token: diisi setelah signin
- product_id: diisi dari response create/get

## 3. Auth untuk Endpoint Admin

Header endpoint admin:
Authorization: Bearer <access_token>

Jika belum punya token:
1. POST /api/auth/local/signin
2. Ambil access token dari cookie atau environment variable

Jika status 403:
1. Pastikan role user = admin di tabel users
2. Signin ulang untuk refresh claim role di JWT

## 4. GET /api/products

Query params:
- page (default 1)
- limit (default 10, max 100)
- search (default string kosong)

Contoh:
GET {{base_url}}/api/products?page=1&limit=10&search=nugget

Response 200 (contoh):
```json
{
  "source": "db",
  "page": 1,
  "limit": 10,
  "search": "nugget",
  "total_pages": 1,
  "data": [
    {
      "id": 1,
      "name": "Frozen Nugget Premium",
      "description": "Nugget ayam beku premium",
      "price": 52000,
      "stock": 120,
      "created_at": "2026-04-13T10:00:00.000Z"
    }
  ]
}
```

## 5. GET /api/products/:id

Contoh:
GET {{base_url}}/api/products/{{product_id}}

Response 200:
```json
{
  "source": "db",
  "id": 1,
  "name": "Frozen Nugget Premium",
  "description": "Nugget ayam beku premium",
  "price": 52000,
  "stock": 120,
  "created_at": "2026-04-13T10:00:00.000Z",
  "image": {
    "url": "https://res.cloudinary.com/...",
    "public_id": "products/abcd1234"
  }
}
```

Jika product tidak ditemukan:
```json
{
  "message": "Product not found"
}
```

## 6. POST /api/products

Header:
- Authorization: Bearer {{access_token}}
- Content-Type: application/json

Body:
```json
{
  "name": "Frozen Nugget Premium",
  "description": "Nugget ayam beku premium",
  "price": 52000,
  "stock": 120
}
```

Response 201:
```json
{
  "id": 1,
  "name": "Frozen Nugget Premium",
  "description": "Nugget ayam beku premium",
  "price": 52000,
  "stock": 120,
  "created_at": "2026-04-13T10:00:00.000Z"
}
```

Validasi utama:
- name minimal 3 karakter
- price harus > 0
- stock integer >= 0

## 7. PUT /api/products/:id

Header:
- Authorization: Bearer {{access_token}}
- Content-Type: application/json

Body:
```json
{
  "name": "Updated Frozen Nugget",
  "description": "Updated frozen product",
  "price": 54000,
  "stock": 110
}
```

Response 200:
```json
{
  "id": 1,
  "name": "Updated Frozen Nugget",
  "description": "Updated frozen product",
  "price": 54000,
  "stock": 110,
  "created_at": "2026-04-13T10:00:00.000Z"
}
```

Jika id tidak ada:
```json
{
  "message": "Product is not found!"
}
```

## 8. DELETE /api/products/:id

Header:
- Authorization: Bearer {{access_token}}

Response 200:
```json
{
  "message": "Product deleted successfully"
}
```

Jika id tidak ada:
```json
{
  "message": "Product not found"
}
```

## 9. Integrasi dengan Order dan Inventory

Stok produk juga berubah melalui endpoint selain Product API:
- POST /api/orders/checkout
  - stok berkurang sesuai quantity order item
  - inventory_log otomatis ditulis dengan change_type OUT
- POST /api/inventory-logs/adjust
  - stok bisa ditambah (IN) atau dikurangi (OUT)

Aturan order status terkait payment:
- `PATCH /api/orders/:id/status` ke `paid` atau `completed` akan ditolak jika payment status transaksi order tersebut belum `paid`.
- Jalur yang benar: update payment status dulu via `PATCH /api/transactions/:id/status`, lalu update order status.

Artinya, untuk verifikasi stok akhir, cek setelah operasi checkout/adjust juga, bukan hanya setelah PUT /api/products/:id.

## 10. Error Reference

- 200: sukses GET/PUT/DELETE
- 201: sukses create
- 400: validasi gagal atau resource tidak ditemukan pada beberapa flow
- 401: token tidak ada/invalid
- 403: role tidak cukup (bukan admin)
- 404: khusus GET by id saat item tidak ditemukan

## 11. Catatan Penting

- Route aktif untuk product adalah /api/products.
- Cache aktif di GET list dan GET by id dengan TTL 60 detik.
- Data foto product tidak disimpan di kolom tabel products, tetapi di Redis key product:image:{id}.
