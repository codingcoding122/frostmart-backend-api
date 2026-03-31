# Dokumentasi Redis Caching di Express.js (ES Module)

> Tambahan dokumentasi untuk integrasi **Redis** sebagai caching layer pada project Multer + Cloudinary.  
> Stack tambahan: **Redis**, **node-redis (v4)**

---

## Daftar Isi

- [Apa itu Redis Caching di Project Ini](#apa-itu-redis-caching-di-project-ini)
- [Instalasi Redis Dev dengan Docker](#instalasi-redis-dev-dengan-docker)
- [Redis Basic: Query Langsung di CLI](#redis-basic-query-langsung-di-cli)
- [Instalasi Package](#instalasi-package)
- [Konfigurasi Environment](#konfigurasi-environment)
- [Penjelasan Setiap File](#penjelasan-setiap-file)
  - [src/config/redis.config.js](#srcconfigredisconfigjs)
  - [src/utils/cache.js](#srcutilscachejs)
  - [src/middleware/cache.middleware.js](#srcmiddlewarecachemiddlewarejs)
  - [src/modules/menu/menu.service.js](#srcmodulesmenuservicejs-perubahan)
  - [src/modules/menu/menu.routes.js](#srcmodulesmenuroutesjs-perubahan)
- [Alur Kerja Cache](#alur-kerja-cache)
- [Alur Cache Invalidation](#alur-cache-invalidation)
- [API Reference dengan Keterangan Cache](#api-reference-dengan-keterangan-cache)
- [Testing dengan Postman](#testing-dengan-postman)
- [Checklist Testing Cache](#checklist-testing-cache)
- [Tips & Catatan Penting](#tips--catatan-penting)

---

## Apa itu Redis Caching di Project Ini

Redis digunakan sebagai **cache layer** untuk endpoint GET. Tujuannya:

- Mengurangi query ke PostgreSQL untuk data yang sering dibaca.
- Mempercepat response time — data diambil dari memori Redis, bukan dari disk database.
- Cache otomatis **diinvalidasi** (dihapus) setiap kali ada operasi yang mengubah data (create, update, delete, upload/replace/delete foto).

**Strategi yang dipakai: Cache-Aside (Lazy Loading)**

```
Request masuk
    │
    ├── Ada di cache? → Kembalikan dari Redis (source: "cache")
    │
    └── Tidak ada?   → Ambil dari DB → Simpan ke Redis → Kembalikan (source: "db")
```

**TTL (Time To Live):** Cache otomatis kedaluwarsa setelah **60 detik** (bisa dikustomisasi per route).

---

## Instalasi Redis Dev dengan Docker

### Prasyarat

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) sudah terinstall dan berjalan.

### Jalankan Redis Container

```bash
# Jalankan Redis versi terbaru, expose ke port 6379 di localhost
docker run -d \
  --name redis-dev \
  -p 6379:6379 \
  redis:latest

# Verifikasi container berjalan
docker ps
```

Outputnya akan seperti ini:

```
CONTAINER ID   IMAGE          COMMAND                  STATUS         PORTS
a1b2c3d4e5f6   redis:latest   "docker-entrypoint.s…"   Up 2 minutes   0.0.0.0:6379->6379/tcp
```

### Konfigurasi `.env` untuk Redis Lokal (Docker)

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USERNAME=
REDIS_PASSWORD=
```

> Untuk Redis lokal tanpa auth, `REDIS_USERNAME` dan `REDIS_PASSWORD` bisa dikosongkan.

### Perintah Manajemen Container

```bash
# Stop Redis
docker stop redis-dev

# Start Redis lagi
docker start redis-dev

# Hapus container (data hilang)
docker rm -f redis-dev

# Lihat log Redis
docker logs redis-dev

# Restart
docker restart redis-dev
```

### Opsional: Redis dengan Password

```bash
docker run -d \
  --name redis-dev \
  -p 6379:6379 \
  redis:latest \
  redis-server --requirepass "password123"
```

Lalu update `.env`:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USERNAME=default
REDIS_PASSWORD=password123
```

---

## Redis Basic: Query Langsung di CLI

Masuk ke Redis CLI di dalam container:

```bash
docker exec -it redis-dev redis-cli
```

Jika Redis pakai password:

```bash
docker exec -it redis-dev redis-cli -a password123
# atau setelah masuk CLI:
AUTH password123
```

### Perintah Dasar

**SET — Simpan data**

```bash
# SET key value
SET nama "Budi"

# SET dengan TTL (expire dalam detik)
SET nama "Budi" EX 60

# SET hanya jika key belum ada
SET nama "Budi" NX
```

**GET — Ambil data**

```bash
GET nama
# Output: "Budi"

# Jika key tidak ada
GET key_tidak_ada
# Output: (nil)
```

**DEL — Hapus data**

```bash
# Hapus 1 key
DEL nama

# Hapus beberapa key sekaligus
DEL key1 key2 key3
```

**KEYS — Cari key berdasarkan pattern**

```bash
# Cari semua key yang diawali "cache:"
KEYS cache:*

# Cari semua key yang mengandung "menus"
KEYS *menus*

# Semua key (hati-hati di production)
KEYS *
```

**TTL — Cek sisa waktu key**

```bash
TTL nama
# Output: 45  → masih 45 detik lagi
# Output: -1  → tidak ada TTL (permanen)
# Output: -2  → key tidak ada
```

**EXISTS — Cek apakah key ada**

```bash
EXISTS nama
# Output: 1 (ada) atau 0 (tidak ada)
```

**EXPIRE — Set TTL pada key yang sudah ada**

```bash
EXPIRE nama 120
# Menambahkan TTL 120 detik pada key "nama"
```

**PERSIST — Hapus TTL (jadikan permanen)**

```bash
PERSIST nama
```

**FLUSHDB — Hapus semua key di database aktif**

```bash
FLUSHDB
# ⚠️ Hati-hati: menghapus SEMUA data
```

**INFO — Lihat info Redis server**

```bash
INFO server
INFO memory
INFO stats
```

---

### Query Cache Project Ini di CLI

Setelah aplikasi berjalan dan ada request GET, cek cache yang terbentuk:

```bash
# Lihat semua cache yang tersimpan
KEYS cache:*

# Contoh output:
# 1) "cache:/api/menus?page=1&limit=10"
# 2) "cache:/api/menus/550e8400-e29b-41d4-a716-446655440000"

# Lihat isi cache (data JSON)
GET "cache:/api/menus?page=1&limit=10"

# Lihat sisa TTL cache
TTL "cache:/api/menus?page=1&limit=10"

# Hapus cache tertentu secara manual
DEL "cache:/api/menus?page=1&limit=10"

# Hapus semua cache sekaligus
KEYS cache:*
# lalu:
DEL cache:/api/menus cache:/api/menus/...
# atau pakai FLUSHDB jika hanya dev
FLUSHDB
```

---

## Instalasi Package

```bash
npm install redis
```

> Package yang digunakan adalah **`redis` (node-redis v4)**, bukan `ioredis`.  
> node-redis v4 mendukung ES Module dan `await redisClient.connect()` secara native.

---

## Konfigurasi Environment

Tambahkan ke file `.env`:

```env
# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USERNAME=
REDIS_PASSWORD=
```

**Untuk Redis cloud (misal Upstash, Redis Cloud):**

```env
REDIS_HOST=redis-12345.c1.us-east-1-2.ec2.cloud.redislabs.com
REDIS_PORT=12345
REDIS_USERNAME=default
REDIS_PASSWORD=your_password_here
```

---

## Penjelasan Setiap File

### `src/config/redis.config.js`

Membuat dan mengekspor instance Redis client yang sudah terkoneksi.

```js
import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

export const redisClient = createClient({
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
});

redisClient.on("error", (err) => {
  console.error("Redis error:", err);
});

await redisClient.connect();
```

**Penjelasan:**

| Bagian                         | Keterangan                                                   |
| ------------------------------ | ------------------------------------------------------------ |
| `createClient({...})`          | Membuat instance Redis client dengan konfigurasi dari `.env` |
| `redisClient.on("error", ...)` | Menangkap error koneksi tanpa crash aplikasi                 |
| `await redisClient.connect()`  | Membuka koneksi ke Redis saat file pertama kali di-import    |

> **Catatan:** `await` di top-level hanya bisa digunakan di ES Module (`"type": "module"`). Ini salah satu alasan proyek menggunakan ES Module.

---

### `src/utils/cache.js`

Fungsi utilitas untuk operasi cache: get, set, dan delete.

```js
import { redisClient } from "../config/redis.config.js";

export const getCache = async (key) => {
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
};

export const setCache = async (key, value, ttl = 60) => {
  await redisClient.set(key, JSON.stringify(value), {
    EX: ttl, // detik
  });
};

export const deleteCache = async (pattern) => {
  const keys = await redisClient.keys(pattern);
  if (keys.length > 0) {
    await redisClient.del(keys);
  }
};
```

**Penjelasan per fungsi:**

**`getCache(key)`**

- Mengambil data dari Redis berdasarkan key.
- Data di Redis disimpan sebagai string JSON, maka di-`JSON.parse` saat diambil.
- Mengembalikan `null` jika key tidak ditemukan atau sudah kedaluwarsa.

**`setCache(key, value, ttl)`**

- Menyimpan data ke Redis dengan `JSON.stringify`.
- `EX: ttl` — key otomatis terhapus setelah `ttl` detik (default: 60 detik).

**`deleteCache(pattern)`**

- Mencari semua key yang cocok dengan pattern (misal `cache:/api/menus*`).
- Menghapus semua key yang ditemukan sekaligus.
- Guard `if (keys.length > 0)` mencegah error `DEL` dengan array kosong.

> ⚠️ **Hati-hati `KEYS` di production:** Perintah `KEYS` memblokir Redis sementara saat mencari. Untuk data besar di production, gunakan `SCAN` sebagai alternatif yang non-blocking. Untuk skala project ini, `KEYS` masih aman.

---

### `src/middleware/cache.middleware.js`

Middleware yang secara otomatis meng-cache response GET dan mengembalikannya dari cache di request berikutnya.

```js
import { getCache, setCache } from "../utils/cache.js";

export const cacheMiddleware = (ttl = 60) => {
  return async (req, res, next) => {
    try {
      const key = `cache:${req.originalUrl}`;

      // Cek apakah data sudah ada di cache
      const cached = await getCache(key);
      if (cached) {
        return res.json({
          source: "cache",
          ...cached,
        });
      }

      // Intercept res.json untuk menyimpan response ke cache
      const originalJson = res.json.bind(res);

      res.json = async (data) => {
        await setCache(key, data, ttl);
        return originalJson({
          source: "db",
          ...data,
        });
      };

      next();
    } catch (err) {
      next(); // Jika Redis error, tetap lanjut ke controller (graceful degradation)
    }
  };
};
```

**Penjelasan mendalam:**

**Cache Key**

```js
const key = `cache:${req.originalUrl}`;
```

`req.originalUrl` berisi path + query string lengkap, contoh:

- `/api/menus?page=1&limit=10` → key: `cache:/api/menus?page=1&limit=10`
- `/api/menus/550e8400-...` → key: `cache:/api/menus/550e8400-...`

Setiap kombinasi halaman/filter otomatis punya cache terpisah.

**Intercept `res.json`**

```js
const originalJson = res.json.bind(res);

res.json = async (data) => {
  await setCache(key, data, ttl); // simpan ke Redis
  return originalJson({ source: "db", ...data }); // kirim response asli
};
```

Teknik ini menggantikan method `res.json` dengan versi baru yang menyimpan data ke Redis **sebelum** mengirim response ke client. Setelah disimpan, method asli (`originalJson`) dipanggil untuk mengirim response.

**Field `source`**

Response akan memiliki field tambahan `source`:

- `"cache"` — data berasal dari Redis
- `"db"` — data berasal dari database (dan baru disimpan ke cache)

**Graceful Degradation**

```js
} catch (err) {
  next(); // Redis error → tetap lanjut ke controller
}
```

Jika Redis mati atau error, request tetap diproses normal ke database. Aplikasi tidak crash hanya karena cache tidak tersedia.

---

### `src/modules/menu/menu.service.js` (Perubahan)

Tambahan fungsi `invalidateMenusCache` yang dipanggil setiap kali data berubah.

```js
import { deleteCache } from "../../utils/cache.js";

// Hapus semua cache yang berhubungan dengan menus
const invalidateMenusCache = async (id = null) => {
  await deleteCache("cache:/api/menus*");
};
```

**Kapan cache diinvalidasi:**

| Operasi        | Fungsi Service           | Invalidate Cache |
| -------------- | ------------------------ | ---------------- |
| Buat menu      | `createMenu`             | ✅               |
| Update menu    | `updateMenu`             | ✅               |
| Hapus menu     | `deleteMenu`             | ✅               |
| Upload foto    | `uploadMenuPhoto`        | ✅               |
| Ganti foto     | `replaceMenuPhoto`       | ✅               |
| Hapus foto     | `deleteMenuPhoto`        | ✅               |
| Get menu by ID | `getMenuById`            | ❌ (hanya baca)  |
| Get semua menu | `getMenusWithPagination` | ❌ (hanya baca)  |

Pattern `cache:/api/menus*` menghapus **semua** cache yang key-nya diawali `cache:/api/menus`, termasuk semua halaman pagination dan semua detail menu.

---

### `src/modules/menu/menu.routes.js` (Perubahan)

```js
import { cacheMiddleware } from "../../middleware/cache.middleware.js";

// GET ALL — dengan cache 60 detik
router.get("/", cacheMiddleware(60), menuController.getMenus);

// GET BY ID — dengan cache 60 detik
router.get("/:id", cacheMiddleware(60), menuController.getMenuById);
```

Middleware dieksekusi berurutan:

```
GET /menus?page=1&limit=10
  → cacheMiddleware(60)    ← cek Redis, intercept res.json
  → menuController.getMenus ← query DB jika cache miss
```

Route lain (POST, PUT, DELETE) **tidak menggunakan** `cacheMiddleware` karena operasi write tidak perlu di-cache.

---

## Alur Kerja Cache

### Cache Hit (Data Ada di Redis)

```
Client
  │  GET /api/menus?page=1&limit=10
  ▼
cacheMiddleware
  │  key = "cache:/api/menus?page=1&limit=10"
  │  getCache(key) → Redis
  │  Redis: key ADA → kembalikan data
  ▼
Response langsung dari Redis
  { "source": "cache", "page": 1, "data": [...] }
  ✅ Controller TIDAK dieksekusi, DB TIDAK diquery
```

### Cache Miss (Data Belum Ada di Redis)

```
Client
  │  GET /api/menus?page=1&limit=10
  ▼
cacheMiddleware
  │  getCache(key) → Redis
  │  Redis: key TIDAK ADA → lanjut
  │  intercept res.json
  ▼
menuController.getMenus
  │  query PostgreSQL
  ▼
res.json(data) — versi ter-intercept
  │  setCache(key, data, 60) → simpan ke Redis
  │  originalJson({ source: "db", ...data })
  ▼
Response dari DB
  { "source": "db", "page": 1, "data": [...] }
  ✅ Data tersimpan di Redis untuk request berikutnya
```

### Cache Invalidation (Data Berubah)

```
Client
  │  POST/PUT/DELETE /api/menus (atau foto)
  ▼
Controller → Service
  │  Proses bisnis (create/update/delete)
  │  invalidateMenusCache()
  │    └── deleteCache("cache:/api/menus*")
  │          └── KEYS cache:/api/menus* → DEL semua
  ▼
Response sukses
  ✅ Cache lama terhapus, request GET berikutnya akan ambil dari DB
```

---

## API Reference dengan Keterangan Cache

### GET `/menus` — Daftar Menu

|           |                                   |
| --------- | --------------------------------- |
| Method    | `GET`                             |
| URL       | `/menus`                          |
| Cache     | ✅ TTL 60 detik                   |
| Cache Key | `cache:/api/menus?page=X&limit=Y` |

**Query Parameter**

| Parameter | Default | Keterangan       |
| --------- | ------- | ---------------- |
| `page`    | `1`     | Halaman          |
| `limit`   | `20`    | Data per halaman |

**Response 200 — dari DB (pertama kali):**

```json
{
  "source": "db",
  "page": 1,
  "limit": 10,
  "total_pages": 5,
  "data": [...]
}
```

**Response 200 — dari Cache (request berikutnya):**

```json
{
  "source": "cache",
  "page": 1,
  "limit": 10,
  "total_pages": 5,
  "data": [...]
}
```

---

### GET `/menus/:id` — Detail Menu

|           |                                 |
| --------- | ------------------------------- |
| Method    | `GET`                           |
| URL       | `/menus/:id`                    |
| Cache     | ✅ TTL 60 detik                 |
| Cache Key | `cache:/api/menus/550e8400-...` |

**Response 200 — dari DB:**

```json
{
  "source": "db",
  "id": "550e8400-...",
  "name": "Nasi Goreng",
  "price": 25000,
  "image_url": "https://res.cloudinary.com/..."
}
```

**Response 200 — dari Cache:**

```json
{
  "source": "cache",
  "id": "550e8400-...",
  "name": "Nasi Goreng",
  "price": 25000,
  "image_url": "https://res.cloudinary.com/..."
}
```

---

### POST `/menus` — Buat Menu

|                  |                                  |
| ---------------- | -------------------------------- |
| Cache            | ❌ Tidak di-cache                |
| Invalidasi Cache | ✅ Menghapus `cache:/api/menus*` |

---

### PUT `/menus/:id` — Update Menu

|                  |                                  |
| ---------------- | -------------------------------- |
| Cache            | ❌ Tidak di-cache                |
| Invalidasi Cache | ✅ Menghapus `cache:/api/menus*` |

---

### DELETE `/menus/:id` — Hapus Menu

|                  |                                  |
| ---------------- | -------------------------------- |
| Cache            | ❌ Tidak di-cache                |
| Invalidasi Cache | ✅ Menghapus `cache:/api/menus*` |

---

### POST/PUT/DELETE `/menus/photo/:id` — Operasi Foto

|                  |                                  |
| ---------------- | -------------------------------- |
| Cache            | ❌ Tidak di-cache                |
| Invalidasi Cache | ✅ Menghapus `cache:/api/menus*` |

---

## Testing dengan Postman

### Persiapan

**Environment Variables:**

| Variable   | Value                     |
| ---------- | ------------------------- |
| `BASE_URL` | `http://localhost:3000`   |
| `MENU_ID`  | _(isi setelah buat menu)_ |

---

### Test 1: Verifikasi Cache Miss → Cache Hit

Tujuan: memastikan request pertama mengambil dari DB, request kedua dari cache.

**Step 1 — Request pertama (Cache Miss)**

| Field  | Value                                |
| ------ | ------------------------------------ |
| Method | `GET`                                |
| URL    | `{{BASE_URL}}/menus?page=1&limit=10` |

**Response yang diharapkan:**

```json
{
  "source": "db",
  "page": 1,
  "limit": 10,
  "total_pages": 2,
  "data": [...]
}
```

Field `"source": "db"` → data dari PostgreSQL, cache baru dibuat.

**Step 2 — Request kedua (Cache Hit)**

Kirim request yang **sama persis** lagi tanpa mengubah apapun.

**Response yang diharapkan:**

```json
{
  "source": "cache",
  "page": 1,
  "limit": 10,
  "total_pages": 2,
  "data": [...]
}
```

Field `"source": "cache"` → data dari Redis ✅

---

### Test 2: Cache Terpisah per Query String

**Request A:**

```
GET {{BASE_URL}}/menus?page=1&limit=10
```

Cache key: `cache:/api/menus?page=1&limit=10`

**Request B:**

```
GET {{BASE_URL}}/menus?page=2&limit=10
```

Cache key: `cache:/api/menus?page=2&limit=10`

Kedua request memiliki cache **terpisah**. Request B pertama kali akan `"source": "db"`, kemudian `"source": "cache"` di request berikutnya.

---

### Test 3: Cache Hit pada GET by ID

**Step 1 — Request pertama:**

| Field  | Value                            |
| ------ | -------------------------------- |
| Method | `GET`                            |
| URL    | `{{BASE_URL}}/menus/{{MENU_ID}}` |

Response: `"source": "db"`

**Step 2 — Request kedua:**

Kirim request yang sama.

Response: `"source": "cache"` ✅

---

### Test 4: Cache Invalidasi setelah Update Menu

**Step 1** — GET list menu, catat `"source": "cache"` (pastikan sudah di-cache):

```
GET {{BASE_URL}}/menus?page=1&limit=10
→ "source": "cache"
```

**Step 2** — Update data menu:

```
PUT {{BASE_URL}}/menus/{{MENU_ID}}
Body: { "name": "Nama Baru", "price": 99000, "description": "...", "is_available": true }
```

**Step 3** — GET list menu lagi:

```
GET {{BASE_URL}}/menus?page=1&limit=10
→ "source": "db"   ✅ cache lama sudah dihapus, data fresh dari DB
```

**Step 4** — GET list menu sekali lagi:

```
GET {{BASE_URL}}/menus?page=1&limit=10
→ "source": "cache"   ✅ cache baru sudah terbentuk
```

---

### Test 5: Cache Invalidasi setelah Upload Foto

**Step 1** — GET detail menu (pastikan cache terbentuk):

```
GET {{BASE_URL}}/menus/{{MENU_ID}}
→ "source": "cache"
```

**Step 2** — Upload foto:

```
POST {{BASE_URL}}/menus/photo/{{MENU_ID}}
Body: form-data, image = [file gambar]
```

**Step 3** — GET detail menu lagi:

```
GET {{BASE_URL}}/menus/{{MENU_ID}}
→ "source": "db"   ✅ cache lama dihapus
→ image_url sudah terisi dengan URL Cloudinary baru
```

---

### Test 6: Cache Expired Otomatis (TTL)

**Step 1** — GET menu untuk membuat cache:

```
GET {{BASE_URL}}/menus?page=1&limit=10
→ "source": "db"
```

**Step 2** — Cek di Redis CLI:

```bash
docker exec -it redis-dev redis-cli
TTL "cache:/api/menus?page=1&limit=10"
# Output: 58  (atau angka mendekati 60)
```

**Step 3** — Tunggu 60 detik.

**Step 4** — GET menu lagi:

```
GET {{BASE_URL}}/menus?page=1&limit=10
→ "source": "db"   ✅ cache sudah expired, ambil dari DB lagi
```

---

### Test 7: Graceful Degradation (Redis Mati)

**Step 1** — Stop container Redis:

```bash
docker stop redis-dev
```

**Step 2** — GET menu:

```
GET {{BASE_URL}}/menus?page=1&limit=10
```

**Response yang diharapkan:** tetap `200` dengan data normal (tanpa field `source`), karena `cacheMiddleware` melakukan `next()` saat Redis error.

**Step 3** — Start Redis lagi:

```bash
docker start redis-dev
```

> Aplikasi tidak crash saat Redis tidak tersedia — ini adalah **graceful degradation**.

---

### Cek Cache Langsung di Redis CLI

Buka terminal baru saat aplikasi berjalan:

```bash
docker exec -it redis-dev redis-cli

# Lihat semua cache yang terbentuk
KEYS cache:*

# Lihat isi cache daftar menu
GET "cache:/api/menus?page=1&limit=10"

# Lihat sisa TTL
TTL "cache:/api/menus?page=1&limit=10"

# Hapus cache tertentu secara manual
DEL "cache:/api/menus?page=1&limit=10"

# Hapus semua cache (untuk reset testing)
FLUSHDB
```

---

## Checklist Testing Cache

| No  | Skenario                       | Cara Test                                    | Expected                                     |
| --- | ------------------------------ | -------------------------------------------- | -------------------------------------------- |
| 1   | Cache Miss (pertama kali)      | GET `/menus`                                 | `"source": "db"`                             |
| 2   | Cache Hit (kedua kali)         | GET `/menus` lagi                            | `"source": "cache"`                          |
| 3   | Cache terpisah per query       | GET `?page=1` vs `?page=2`                   | Masing-masing `"source": "db"` pertama kali  |
| 4   | Cache Hit GET by ID            | GET `/menus/:id` dua kali                    | Pertama `db`, kedua `cache`                  |
| 5   | Invalidasi setelah create menu | POST `/menus` → GET `/menus`                 | GET pertama setelah create: `"source": "db"` |
| 6   | Invalidasi setelah update menu | PUT `/menus/:id` → GET `/menus`              | `"source": "db"`                             |
| 7   | Invalidasi setelah delete menu | DELETE `/menus/:id` → GET `/menus`           | `"source": "db"`                             |
| 8   | Invalidasi setelah upload foto | POST `/menus/photo/:id` → GET `/menus/:id`   | `"source": "db"`, `image_url` terisi         |
| 9   | Invalidasi setelah ganti foto  | PUT `/menus/photo/:id` → GET `/menus/:id`    | `"source": "db"`, `image_url` berubah        |
| 10  | Invalidasi setelah hapus foto  | DELETE `/menus/photo/:id` → GET `/menus/:id` | `"source": "db"`, `image_url` = null         |
| 11  | TTL expired otomatis           | Tunggu 60 detik → GET lagi                   | `"source": "db"`                             |
| 12  | Graceful degradation           | Stop Redis → GET `/menus`                    | Response 200 normal (tanpa `source`)         |
| 13  | Verifikasi di Redis CLI        | `KEYS cache:*` setelah GET                   | Key `cache:/api/menus*` muncul               |
| 14  | Manual delete cache di CLI     | `DEL "cache:/api/menus..."` → GET            | `"source": "db"`                             |

---

## Tips & Catatan Penting

### 1. Prefix Key Cache

Selalu gunakan prefix pada key cache (`cache:`) agar mudah diidentifikasi dan di-invalidasi:

```js
const key = `cache:${req.originalUrl}`;
// Hasil: "cache:/api/menus?page=1&limit=10"
```

Prefix memudahkan query pattern `KEYS cache:*` dan mencegah konflik dengan key lain.

### 2. TTL Harus Disesuaikan

TTL 60 detik cocok untuk data yang sering berubah. Sesuaikan berdasarkan kebutuhan:

```js
router.get("/", cacheMiddleware(60), menuController.getMenus); // 1 menit
router.get("/:id", cacheMiddleware(300), menuController.getMenuById); // 5 menit
```

Data yang jarang berubah (misal konfigurasi) bisa TTL lebih lama (3600 = 1 jam).

### 3. Field `source` untuk Debugging

Field `source: "cache"` / `source: "db"` sangat berguna saat development untuk memastikan cache bekerja. Di production, bisa dihapus dari response jika tidak ingin diekspos ke client:

```js
// Di cache.middleware.js, hapus field source jika tidak diperlukan
return originalJson(data); // tanpa spread source
```

### 4. Invalidasi Agresif vs Selektif

Project ini menggunakan invalidasi **agresif** — semua cache menus dihapus setiap kali ada perubahan apapun:

```js
await deleteCache("cache:/api/menus*"); // hapus semua
```

Untuk skala lebih besar, pertimbangkan invalidasi **selektif** — hanya hapus cache yang relevan:

```js
await deleteCache(`cache:/api/menus/${id}`); // hapus cache menu tertentu saja
await deleteCache("cache:/api/menus?*"); // hapus semua halaman list
```

### 5. `KEYS` vs `SCAN` di Production

`KEYS pattern` memblokir Redis sementara — berbahaya untuk dataset besar. Untuk production dengan banyak data:

```js
// Ganti deleteCache dengan implementasi SCAN
const deleteCache = async (pattern) => {
  let cursor = 0;
  do {
    const result = await redisClient.scan(cursor, {
      MATCH: pattern,
      COUNT: 100,
    });
    cursor = result.cursor;
    if (result.keys.length > 0) {
      await redisClient.del(result.keys);
    }
  } while (cursor !== 0);
};
```

Untuk project skala kecil-menengah, implementasi `KEYS` saat ini sudah cukup.

### 6. Top-level `await` di `redis.config.js`

```js
await redisClient.connect(); // top-level await
```

Ini hanya bisa digunakan di ES Module. Pastikan `package.json` memiliki `"type": "module"`. Jika menggunakan CommonJS, bungkus dalam fungsi async:

```js
// CommonJS — tidak berlaku untuk project ini
(async () => {
  await redisClient.connect();
})();
```
