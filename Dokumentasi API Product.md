# Dokumentasi API Product

Base URL: {{base_url}}/api/products

Dokumen ini menjelaskan endpoint Product utama yang aktif di backend Frostmart.
Semua endpoint write membutuhkan access token user dengan role admin.

## 1. Ringkasan Endpoint

| Method | Endpoint | Akses | Keterangan |
| --- | --- | --- | --- |
| GET | /api/products | Public | List product (pagination + search + cache) |
| GET | /api/products/:id | Public | Detail product by id (cache) |
| POST | /api/products | Admin | Create product |
| PUT | /api/products/:id | Admin | Update product |
| DELETE | /api/products/:id | Admin | Delete product |

Catatan:
- Endpoint upload foto didokumentasikan di file terpisah: Dokumentasi API Upload Product Foto.md.
- GET endpoint akan menambahkan field source dari cache middleware: db atau cache.

## 2. Setup Postman

Gunakan collection: Frostmart API.postman_collection.json

Environment yang dipakai:
- base_url: http://localhost:5000
- url: http://localhost:5000/api (khusus collection Frostmart API)
- access_token: diisi otomatis setelah signin atau isi manual
- product_id: diisi dari response create/get

## 3. Auth untuk Endpoint Admin

Endpoint admin membutuhkan header:
Authorization: Bearer <access_token>

Jika belum punya token:
1. POST /api/auth/local/signin
2. Ambil access token dari cookie access_token atau dari variable Postman

Jika masih 403:
1. Pastikan role user = admin di tabel users
2. Signin ulang agar claim role di JWT ter-update

## 4. GET /api/products

Query params:
- page (default 1)
- limit (default 10, max 100)
- search (default string kosong)

Contoh:
GET {{base_url}}/api/products?page=1&limit=10&search=nugget

Response 200 (contoh cache miss):
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

## 9. Error Reference

- 200: sukses GET/PUT/DELETE
- 201: sukses create
- 400: validasi gagal atau resource tidak ditemukan pada beberapa flow
- 401: token tidak ada/invalid
- 403: role tidak cukup (bukan admin)
- 404: khusus GET by id saat item tidak ditemukan

## 10. Catatan Penting

- Route aktif untuk product adalah /api/products, bukan /products.
- Cache aktif di GET list dan GET by id dengan TTL 60 detik.
- Data foto product tidak disimpan di kolom tabel products, tetapi di Redis key product:image:{id}.
