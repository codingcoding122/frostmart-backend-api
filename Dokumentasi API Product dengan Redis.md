# Dokumentasi API Product dengan Redis

Dokumen ini menjelaskan implementasi caching Redis pada endpoint Product di backend Frostmart.

## 1. Ringkasan Implementasi

Cache middleware dipasang pada:
- GET /api/products
- GET /api/products/:id

Strategi cache:
- Cache key: cache:${req.originalUrl}
- TTL default: 60 detik
- Cache-aside pattern
- Invalidation pada semua operasi write product (create/update/delete/upload/replace/delete foto)

Response GET akan mengandung field source:
- source: "db" saat cache miss
- source: "cache" saat cache hit

## 2. Konfigurasi Environment Redis

Isi .env:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USERNAME=
REDIS_PASSWORD=
```

Untuk Redis cloud:
```env
REDIS_HOST=<host>
REDIS_PORT=<port>
REDIS_USERNAME=default
REDIS_PASSWORD=<password>
```

## 3. Alur Cache

1. Request GET masuk
2. Middleware cek key cache:${req.originalUrl}
3. Jika ada data -> return source cache
4. Jika tidak ada -> lanjut ke service/repository DB
5. Sebelum kirim response, data disimpan ke Redis
6. Response dikirim dengan source db

## 4. Key Pattern yang Dipakai

Untuk data endpoint product:
- cache:/api/products?page=1&limit=10
- cache:/api/products/1

Untuk metadata foto product:
- product:image:{id}

Contoh:
- product:image:1

Catatan penting:
- Key product:image:{id} bukan key cache middleware. Key ini dipakai service foto product untuk menyimpan URL + public_id Cloudinary.

## 5. Invalidation Cache

Service product memanggil invalidate cache pattern:
- cache:/api/products*

Invalidasi dipanggil saat:
- createProduct
- updateProduct
- deleteProduct
- uploadProductPhoto
- replaceProductPhoto
- deleteProductPhoto

## 6. Endpoint yang Tercache

### GET /api/products

Contoh response:
```json
{
  "source": "cache",
  "page": 1,
  "limit": 10,
  "search": "",
  "total_pages": 2,
  "data": []
}
```

### GET /api/products/:id

Contoh response:
```json
{
  "source": "db",
  "id": 1,
  "name": "Frozen Nugget",
  "description": "Nugget ayam beku",
  "price": 50000,
  "stock": 100,
  "image": {
    "url": "https://res.cloudinary.com/...",
    "public_id": "products/abc"
  }
}
```

## 7. Testing Cepat di Postman

Gunakan collection Frostmart API.postman_collection.json.

Skenario cache hit/miss:
1. GET /api/products?page=1&limit=10 -> source db
2. GET lagi query yang sama -> source cache
3. POST /api/products (admin) -> invalidasi cache
4. GET lagi query yang sama -> source db

Skenario foto + invalidasi:
1. POST /api/products/photo/:id
2. GET /api/products/:id -> source db (cache dibangun ulang)
3. GET lagi endpoint sama -> source cache

## 8. Redis CLI Cheatsheet

```bash
# lihat semua key cache
KEYS cache:*

# lihat key foto product
KEYS product:image:*

# baca cache list
GET "cache:/api/products?page=1&limit=10"

# baca metadata foto product
GET "product:image:1"

# cek TTL cache
TTL "cache:/api/products?page=1&limit=10"

# hapus semua cache product
DEL "cache:/api/products?page=1&limit=10"
```

## 9. Catatan Produksi

- Implementasi delete cache saat ini memakai KEYS; aman untuk skala kecil-menengah.
- Untuk skala besar, pertimbangkan SCAN agar lebih aman untuk production load tinggi.
- Jika Redis down, middleware tetap next() sehingga API tetap berjalan (graceful degradation).
