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
- Invalidation saat ada operasi yang mengubah stok/data product

Response GET mengandung field source:
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
3. Jika key ada -> return data source cache
4. Jika tidak ada -> ambil data dari DB
5. Response DB disimpan ke Redis dengan TTL
6. Response ke client dengan source db

## 4. Key Pattern yang Dipakai

Untuk endpoint product:
- cache:/api/products?page=1&limit=10
- cache:/api/products/1

Untuk metadata foto product:
- product:image:{id}

Contoh:
- product:image:1

Catatan:
- product:image:{id} dipakai oleh service upload foto product, bukan oleh cache middleware list/detail product.

## 5. Invalidation Cache

Pattern invalidasi utama:
- cache:/api/products*

Invalidasi dipanggil oleh:
- createProduct
- updateProduct
- deleteProduct
- uploadProductPhoto
- replaceProductPhoto
- deleteProductPhoto
- orders.checkout (karena stok produk berkurang)
- inventory-logs.adjust (karena stok produk berubah)

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

### Skenario cache hit/miss product
1. GET /api/products?page=1&limit=10 -> source db
2. GET lagi query yang sama -> source cache

### Skenario invalidasi oleh checkout
1. POST /api/orders/checkout -> sukses 201
2. PATCH /api/orders/:id/status ke completed saat payment masih pending -> gagal 400 (sesuai rule bisnis)
3. PATCH /api/transactions/:id/status ke paid -> sukses 200
4. PATCH /api/orders/:id/status ke completed -> sukses 200
5. GET /api/products?page=1&limit=10 -> source db (cache rebuild)
6. GET lagi query sama -> source cache

### Skenario invalidasi oleh inventory adjust
1. POST /api/inventory-logs/adjust -> sukses 201
2. GET /api/products/:id -> source db (cache rebuild)
3. GET lagi endpoint sama -> source cache

## 8. Redis CLI Cheatsheet

```bash
# lihat semua key cache produk
KEYS cache:/api/products*

# lihat key foto product
KEYS product:image:*

# baca cache list
GET "cache:/api/products?page=1&limit=10"

# baca metadata foto product
GET "product:image:1"

# cek TTL cache
TTL "cache:/api/products?page=1&limit=10"

# hapus key cache tertentu
DEL "cache:/api/products?page=1&limit=10"
```

## 9. Catatan Produksi

- Implementasi delete cache saat ini memakai KEYS, masih aman untuk skala kecil-menengah.
- Untuk skala besar, pertimbangkan SCAN agar lebih efisien.
- Jika Redis down, middleware tetap next() sehingga API tetap berjalan (graceful degradation).
