# Dokumentasi & Tutorial: File Upload dengan Multer + Cloudinary di Express.js (ES Module)

> Stack: **Node.js**, **Express.js**, **Multer**, **Cloudinary**, **PostgreSQL (pg)**  
> Module system: **ES Module (`"type": "module"`)**

---

## Daftar Isi

- [Struktur Folder](#struktur-folder)
- [Instalasi](#instalasi)
- [Konfigurasi Environment](#konfigurasi-environment)
- [Penjelasan Setiap File](#penjelasan-setiap-file)
  - [src/config/cloudinary.config.js](#srcconfigcloudinаryconfigjs)
  - [src/config/db.config.js](#srcconfigdbconfigjs)
  - [src/middleware/upload.middleware.js](#srcmiddlewareuploadmiddlewarejs)
  - [src/middleware/handleUploadError.js](#srcmiddlewarehandleuploaderrorjs)
  - [src/utils/cloudinary.js](#srcutilscloudinаryjs)
  - [src/modules/menu/menu.routes.js](#srcmodulesmenumenuroutesjs)
  - [src/modules/menu/menu.controller.js](#srcmodulesmenucontrollerjs)
  - [src/modules/menu/menu.service.js](#srcmodulesmenuservicejs)
  - [src/modules/menu/menu.repository.js](#srcmodulesmenurepositoryjs)
- [Skema Database](#skema-database)
- [Alur Kerja Upload Gambar](#alur-kerja-upload-gambar)
- [Alur Error Handling Upload](#alur-error-handling-upload)
- [API Reference](#api-reference)
- [Testing dengan Postman](#testing-dengan-postman)
- [Checklist Testing](#checklist-testing)
- [Tips & Catatan Penting](#tips--catatan-penting)

---

## Struktur Folder

```
project-root/
├── .env
├── package.json
└── src/
    ├── server.js
    ├── config/
    │   ├── cloudinary.config.js
    │   └── db.config.js
    ├── middleware/
    │   ├── upload.middleware.js
    │   ├── handleUploadError.js        ← middleware baru
    │   ├── auth.middleware.js
    │   └── authorizeRoles.js
    ├── utils/
    │   └── cloudinary.js
    └── modules/
        └── menu/
            ├── menu.routes.js
            ├── menu.controller.js
            ├── menu.service.js
            ├── menu.repository.js
            └── menu.validation.js
```

---

## Instalasi

```bash
# 1. Inisialisasi project dengan ES Module
npm init -y

# Tambahkan "type": "module" di package.json

# 2. Install dependencies
npm install express multer cloudinary dotenv pg

# 3. (Opsional) Install dev dependencies
npm install -D nodemon
```

`package.json`:

```json
{
  "type": "module",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  }
}
```

---

## Konfigurasi Environment

Buat file `.env` di root project:

```env
# Server
PORT=3000

# Database PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/nama_database

# Cloudinary
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
```

> **Cara mendapatkan kredensial Cloudinary:**
>
> 1. Daftar/login di [cloudinary.com](https://cloudinary.com)
> 2. Buka **Dashboard**
> 3. Salin `Cloud Name`, `API Key`, dan `API Secret`

---

## Penjelasan Setiap File

### `src/config/cloudinary.config.js`

Menginisialisasi koneksi ke Cloudinary menggunakan kredensial dari `.env`.

```js
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
```

**Penjelasan:**

- `v2 as cloudinary` — menggunakan Cloudinary SDK versi 2.
- `cloudinary.config({...})` — menyuntikkan kredensial agar semua operasi upload/delete terautentikasi.
- File ini hanya perlu di-import sekali; instance-nya dipakai ulang di seluruh aplikasi.

---

### `src/config/db.config.js`

Konfigurasi koneksi PostgreSQL menggunakan connection pooling.

```js
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});
```

**Penjelasan:**

- `pg` adalah CommonJS module, sehingga harus di-import dengan `import pkg from "pg"` lalu di-destructure.
- `Pool` mengelola koneksi secara efisien tanpa membuka koneksi baru setiap query.

---

### `src/middleware/upload.middleware.js`

Middleware Multer untuk memvalidasi dan menampung file di memori.

```js
import multer from "multer";

const storage = multer.memoryStorage();

const allowedMimeTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Format file harus PNG, JPG, JPEG, WEBP"), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 512 * 1024, // Maksimal 512 KB
  },
  fileFilter,
});

export default upload;
```

**Penjelasan:**

| Opsi              | Nilai             | Keterangan                                               |
| ----------------- | ----------------- | -------------------------------------------------------- |
| `storage`         | `memoryStorage()` | File disimpan di RAM sebagai `Buffer`, **bukan** di disk |
| `limits.fileSize` | `512 * 1024`      | Maksimal 512 KB per file                                 |
| `fileFilter`      | callback          | Hanya izinkan PNG, JPG, JPEG, WEBP                       |

> **Mengapa `memoryStorage`?**  
> File langsung diteruskan ke Cloudinary via stream (`upload_stream`). Tidak perlu menulis file ke disk, lebih cepat dan tidak mengotori server.

---

### `src/middleware/handleUploadError.js`

Middleware wrapper yang menangkap error dari Multer dan mengubahnya menjadi response JSON yang rapi.

```js
import multer from "multer";

export const handleUploadError = (middleware) => {
  return (req, res, next) => {
    middleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            message: "Ukuran file maksimal 512KB",
          });
        }
      }

      if (err) {
        return res.status(400).json({
          message: err.message,
        });
      }

      next();
    });
  };
};
```

**Penjelasan mendalam:**

Multer secara default melempar error ke Express error handler global (`app.use((err, req, res, next) => {...})`). Masalahnya, jika tidak ada error handler global, error Multer akan menyebabkan response 500 tanpa pesan yang jelas.

`handleUploadError` adalah **Higher-Order Function** — fungsi yang menerima fungsi lain sebagai argumen dan mengembalikan fungsi baru.

```
handleUploadError(upload.single("image"))
       │
       │  menerima middleware Multer sebagai argumen
       ▼
  mengembalikan middleware baru (req, res, next)
       │
       │  menjalankan middleware Multer di dalamnya
       ▼
  jika Multer melempar error → tangkap di sini → kirim JSON 400
  jika tidak ada error      → panggil next() → lanjut ke controller
```

**Jenis error yang ditangani:**

| Kondisi           | Kelas Error          | Kode              | Response                                   |
| ----------------- | -------------------- | ----------------- | ------------------------------------------ |
| File > 512 KB     | `multer.MulterError` | `LIMIT_FILE_SIZE` | `"Ukuran file maksimal 512KB"`             |
| Format file salah | `Error` biasa        | —                 | `"Format file harus PNG, JPG, JPEG, WEBP"` |
| Error lainnya     | `Error` biasa        | —                 | Pesan dari `err.message`                   |

**Mengapa tidak pakai global error handler di `server.js`?**

Pendekatan `handleUploadError` lebih baik karena:

- Error ditangani **tepat di route yang bersangkutan**, bukan di tempat lain.
- Tidak perlu menambahkan `app.use(errorHandler)` terakhir di `server.js`.
- Lebih mudah dikustomisasi per-route jika ada kebutuhan berbeda.

---

### `src/utils/cloudinary.js`

Fungsi utilitas untuk upload dan hapus gambar di Cloudinary.

```js
import cloudinary from "../config/cloudinary.config.js";

export const uploadImage = (buffer) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: "menus" }, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      })
      .end(buffer);
  });
};

export const deleteImage = async (publicId) => {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId);
};
```

**`uploadImage(buffer)`** — upload dari Buffer ke Cloudinary via stream. Mengembalikan `result` berisi:

- `result.secure_url` — URL HTTPS untuk ditampilkan di frontend.
- `result.public_id` — ID unik di Cloudinary untuk keperluan hapus gambar.

**`deleteImage(publicId)`** — menghapus gambar dari Cloudinary. Guard `if (!publicId) return` mencegah error jika menu belum punya gambar.

---

### `src/modules/menu/menu.routes.js`

```js
import { Router } from "express";
import * as menuController from "./menu.controller.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { authorizeRoles } from "../../middleware/authorizeRoles.js";
import upload from "../../middleware/upload.middleware.js";
import { handleUploadError } from "../../middleware/handleUploadError.js";

const router = Router();

// FOTO (lebih spesifik dulu)
router.post(
  "/photo/:id",
  handleUploadError(upload.single("image")),
  menuController.uploadPhoto,
);
router.put(
  "/photo/:id",
  handleUploadError(upload.single("image")),
  menuController.replacePhoto,
);
router.delete("/photo/:id", menuController.deletePhoto);

// CREATE
router.post(
  "/",
  authMiddleware,
  authorizeRoles(["admin"]),
  menuController.createMenu,
);

// UPDATE
router.put(
  "/:id",
  authMiddleware,
  authorizeRoles(["admin"]),
  menuController.updateMenu,
);

// GET ALL
router.get("/", menuController.getMenus);
router.get("/:id", menuController.getMenuById);

// DELETE
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles(["admin"]),
  menuController.deleteMenu,
);

export default router;
```

**Perubahan dari versi sebelumnya:**

| Sebelum                                    | Sesudah                                                       |
| ------------------------------------------ | ------------------------------------------------------------- |
| `upload.single("image")` langsung di route | `handleUploadError(upload.single("image"))` membungkus Multer |

Middleware dieksekusi berurutan per route:

```
POST /photo/:id
  → handleUploadError(upload.single("image"))   ← validasi & upload file
  → menuController.uploadPhoto                  ← proses bisnis & response
```

> **Urutan route penting!**  
> `/photo/:id` harus didefinisikan **sebelum** `/:id` agar Express tidak salah mencocokkan path `/photo/123` sebagai `/:id` dengan nilai `"photo"`.

---

### `src/modules/menu/menu.controller.js`

```js
export const uploadPhoto = async (req, res) => {
  try {
    const url = await uploadMenuPhoto(req.params.id, req.file);
    res.status(201).json({ message: "Upload berhasil", data: url });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const replacePhoto = async (req, res) => {
  try {
    const url = await replaceMenuPhoto(req.params.id, req.file);
    res.json({ message: "Foto diganti", data: url });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deletePhoto = async (req, res) => {
  try {
    await deleteMenuPhoto(req.params.id);
    res.json({ message: "Foto dihapus" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
```

**`req.file`** — objek yang diisi oleh Multer setelah `handleUploadError` berjalan sukses:

| Property       | Tipe   | Keterangan                        |
| -------------- | ------ | --------------------------------- |
| `fieldname`    | string | Nama field di form (`"image"`)    |
| `originalname` | string | Nama file asli dari client        |
| `mimetype`     | string | MIME type (`image/jpeg`, dll.)    |
| `size`         | number | Ukuran file dalam byte            |
| `buffer`       | Buffer | Isi file (karena `memoryStorage`) |

---

### `src/modules/menu/menu.service.js`

```js
import { deleteImage, uploadImage } from "../../utils/cloudinary.js";
import * as menuRepository from "./menu.repository.js";

export const uploadMenuPhoto = async (id, file) => {
  if (!file) throw new Error("File tidak ditemukan");
  const menu = await getMenuById(id);
  const result = await uploadImage(file.buffer);
  await menuRepository.updateMenuImage(id, result.secure_url, result.public_id);
  return result.secure_url;
};

export const replaceMenuPhoto = async (id, file) => {
  if (!file) throw new Error("File tidak ditemukan");
  const menu = await getMenuById(id);
  await deleteImage(menu.image_path); // hapus foto lama
  const result = await uploadImage(file.buffer); // upload foto baru
  await menuRepository.updateMenuImage(id, result.secure_url, result.public_id);
  return result.secure_url;
};

export const deleteMenuPhoto = async (id) => {
  const menu = await getMenuById(id);
  if (!menu) throw new Error("Menu tidak ditemukan");
  await deleteImage(menu.image_path);
  await menuRepository.removeMenuImage(id);
};
```

> **Catatan:** `deleteMenuPhoto` tidak lagi memiliki pengecekan `if (!file)` karena endpoint DELETE memang tidak menerima file — yang dihapus adalah gambar yang sudah tersimpan di database berdasarkan `id`.

---

### `src/modules/menu/menu.repository.js`

```js
export const updateMenuImage = async (id, image_url, image_path) => {
  await db.query(
    `UPDATE menus SET image_url = $1, image_path = $2 WHERE id = $3`,
    [image_url, image_path, id],
  );
};

export const removeMenuImage = async (id) => {
  await db.query(
    `UPDATE menus SET image_url = NULL, image_path = NULL WHERE id = $1`,
    [id],
  );
};
```

> **`image_path`** menyimpan `public_id` dari Cloudinary (contoh: `menus/abcdef`), bukan path lokal. Kolom ini dibutuhkan untuk memanggil `deleteImage` saat foto diganti atau dihapus.

---

## Skema Database

```sql
CREATE TABLE menus (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  description  TEXT,
  price        INTEGER NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  image_path   TEXT,        -- Menyimpan public_id dari Cloudinary
  image_url    TEXT,        -- URL HTTPS dari Cloudinary
  created_at   TIMESTAMP DEFAULT NOW(),
  is_deleted   BOOLEAN DEFAULT FALSE
);
```

| Kolom        | Isi                    | Contoh                                                            |
| ------------ | ---------------------- | ----------------------------------------------------------------- |
| `image_url`  | URL publik gambar      | `https://res.cloudinary.com/demo/image/upload/v123/menus/abc.jpg` |
| `image_path` | `public_id` Cloudinary | `menus/abc`                                                       |

---

## Alur Kerja Upload Gambar

```
Client (Form Data)
       │
       │  POST /menus/photo/:id
       │  Content-Type: multipart/form-data
       │  field: image = [file]
       ▼
handleUploadError(upload.single("image"))
  ├── Multer memproses file
  │     ├── Validasi MIME type (fileFilter)
  │     ├── Validasi ukuran (≤ 512 KB)
  │     └── Simpan ke req.file.buffer (RAM)
  └── Jika ada error → res.status(400).json({ message })
       │
       ▼ (jika tidak ada error)
menuController.uploadPhoto
  └── memanggil uploadMenuPhoto(req.params.id, req.file)
       │
       ▼
menuService.uploadMenuPhoto
  ├── Cek file ada (req.file)
  ├── Cek menu ada di DB (getMenuById)
  ├── uploadImage(file.buffer) → Cloudinary
  │     └── upload_stream → kirim buffer → dapat result
  └── updateMenuImage(id, secure_url, public_id) → DB
       │
       ▼
Response 201 JSON
  { "message": "Upload berhasil", "data": "https://..." }
```

---

## Alur Error Handling Upload

```
handleUploadError(upload.single("image"))
       │
       ├── File > 512 KB
       │     └── MulterError: LIMIT_FILE_SIZE
       │           → 400 { "message": "Ukuran file maksimal 512KB" }
       │
       ├── Format file salah (bukan PNG/JPG/JPEG/WEBP)
       │     └── Error dari fileFilter
       │           → 400 { "message": "Format file harus PNG, JPG, JPEG, WEBP" }
       │
       ├── Error Multer lainnya
       │     └── err.message
       │           → 400 { "message": "..." }
       │
       └── Tidak ada error
             → next() → lanjut ke controller
```

---

## API Reference

### POST `/menus/photo/:id` — Upload Foto

Upload foto pertama untuk menu.

|              |                                             |
| ------------ | ------------------------------------------- |
| Method       | `POST`                                      |
| URL          | `/menus/photo/:id`                          |
| Content-Type | `multipart/form-data`                       |
| Auth         | Tidak diperlukan                            |
| Middleware   | `handleUploadError(upload.single("image"))` |

**Path Parameter**

| Parameter | Tipe | Keterangan |
| --------- | ---- | ---------- |
| `id`      | UUID | ID menu    |

**Form Data**

| Field   | Type | Wajib | Keterangan                      |
| ------- | ---- | ----- | ------------------------------- |
| `image` | File | ✅    | PNG/JPG/JPEG/WEBP, maks. 512 KB |

**Response 201:**

```json
{
  "message": "Upload berhasil",
  "data": "https://res.cloudinary.com/nama_cloud/image/upload/v123/menus/abc.jpg"
}
```

**Response 400:**

```json
{ "message": "Format file harus PNG, JPG, JPEG, WEBP" }
{ "message": "Ukuran file maksimal 512KB" }
{ "message": "File tidak ditemukan" }
```

---

### PUT `/menus/photo/:id` — Ganti Foto

Mengganti foto lama dengan foto baru. Foto lama otomatis dihapus dari Cloudinary.

|              |                                             |
| ------------ | ------------------------------------------- |
| Method       | `PUT`                                       |
| URL          | `/menus/photo/:id`                          |
| Content-Type | `multipart/form-data`                       |
| Middleware   | `handleUploadError(upload.single("image"))` |

**Form Data**

| Field   | Type | Wajib | Keterangan       |
| ------- | ---- | ----- | ---------------- |
| `image` | File | ✅    | File gambar baru |

**Response 200:**

```json
{
  "message": "Foto diganti",
  "data": "https://res.cloudinary.com/nama_cloud/image/upload/v987/menus/new.jpg"
}
```

---

### DELETE `/menus/photo/:id` — Hapus Foto

Menghapus foto dari Cloudinary dan mengosongkan `image_url` / `image_path` di database.

|        |                    |
| ------ | ------------------ |
| Method | `DELETE`           |
| URL    | `/menus/photo/:id` |
| Body   | Tidak ada          |

**Response 200:**

```json
{ "message": "Foto dihapus" }
```

---

### POST `/menus` — Buat Menu

|              |                      |
| ------------ | -------------------- |
| Method       | `POST`               |
| URL          | `/menus`             |
| Auth         | Bearer Token (Admin) |
| Content-Type | `application/json`   |

**Body:**

```json
{
  "name": "Nasi Goreng Spesial",
  "description": "Nasi goreng dengan telur dan ayam",
  "price": 25000
}
```

**Response 201:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Nasi Goreng Spesial",
  "description": "Nasi goreng dengan telur dan ayam",
  "price": 25000,
  "is_available": true,
  "image_url": null,
  "image_path": null,
  "created_at": "2025-01-01T10:00:00.000Z",
  "is_deleted": false
}
```

---

### PUT `/menus/:id` — Update Menu

**Body:**

```json
{
  "name": "Nasi Goreng Jumbo",
  "description": "Porsi besar",
  "price": 35000,
  "is_available": true
}
```

**Response 200:** data menu yang sudah diperbarui.

---

### GET `/menus` — Daftar Menu (Pagination)

| Query Param | Default | Keterangan              |
| ----------- | ------- | ----------------------- |
| `page`      | `1`     | Halaman saat ini        |
| `limit`     | `20`    | Jumlah data per halaman |

**Response 200:**

```json
{
  "page": 1,
  "limit": 10,
  "total_pages": 5,
  "data": [...]
}
```

---

### GET `/menus/:id` — Detail Menu

**Response 200:**

```json
{
  "id": "550e8400-...",
  "name": "Nasi Goreng Spesial",
  "price": 25000,
  "image_url": "https://res.cloudinary.com/...",
  "image_path": "menus/abc"
}
```

**Response 404:**

```json
{ "message": "Menu not found" }
```

---

### DELETE `/menus/:id` — Hapus Menu (Soft Delete)

**Response 200:**

```json
{ "message": "Menu deleted successfully" }
```

---

## Testing dengan Postman

### Persiapan

**1. Buat Environment**

Buka Postman → **Environments** → **New** → beri nama `Dev Local`:

| Variable   | Current Value                       |
| ---------- | ----------------------------------- |
| `BASE_URL` | `http://localhost:3000`             |
| `MENU_ID`  | _(kosong, diisi setelah buat menu)_ |

Aktifkan environment di pojok kanan atas Postman.

**2. Buat Collection**

**New Collection** → beri nama `Menu API`.

---

### Urutan Testing yang Benar

```
1. POST /menus              → Buat menu, catat ID
2. POST /menus/photo/:id   → Upload foto pertama
3. GET  /menus/:id          → Verifikasi image_url terisi
4. PUT  /menus/photo/:id   → Ganti foto
5. GET  /menus/:id          → Verifikasi image_url berubah
6. DELETE /menus/photo/:id → Hapus foto
7. GET  /menus/:id          → Verifikasi image_url = null
8. DELETE /menus/:id        → Hapus menu
```

---

### 1. Buat Menu

| Field  | Value                |
| ------ | -------------------- |
| Method | `POST`               |
| URL    | `{{BASE_URL}}/menus` |

**Tab Headers:**

```
Content-Type   →  application/json
Authorization  →  Bearer <token>
```

**Tab Body → raw → JSON:**

```json
{
  "name": "Nasi Goreng Spesial",
  "description": "Nasi goreng dengan telur dan ayam kampung",
  "price": 25000
}
```

**Response 201:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  ...
}
```

> Salin nilai `id` → isi ke variabel `MENU_ID` di Environment Postman.

---

### 2. Upload Foto Pertama

| Field  | Value                                  |
| ------ | -------------------------------------- |
| Method | `POST`                                 |
| URL    | `{{BASE_URL}}/menus/photo/{{MENU_ID}}` |

**Tab Body → form-data:**

| Key     | Type                                            | Value                           |
| ------- | ----------------------------------------------- | ------------------------------- |
| `image` | **File** _(ubah dari Text ke File di dropdown)_ | Pilih file gambar dari komputer |

> ⚠️ Wajib ubah type dari `Text` ke `File` di dropdown kolom Key, baru bisa memilih file.

**Response 201:**

```json
{
  "message": "Upload berhasil",
  "data": "https://res.cloudinary.com/nama_cloud/image/upload/v123/menus/abc.jpg"
}
```

**Kemungkinan error setelah ditangani `handleUploadError`:**

| Response                                   | Penyebab                                 |
| ------------------------------------------ | ---------------------------------------- |
| `"Ukuran file maksimal 512KB"`             | File > 512 KB — kompres gambar dulu      |
| `"Format file harus PNG, JPG, JPEG, WEBP"` | File bukan gambar yang diizinkan         |
| `"File tidak ditemukan"`                   | Field `image` kosong / type masih `Text` |
| `"Menu tidak ditemukan"`                   | `MENU_ID` salah atau menu belum dibuat   |

---

### 3. Verifikasi Upload

| Field  | Value                            |
| ------ | -------------------------------- |
| Method | `GET`                            |
| URL    | `{{BASE_URL}}/menus/{{MENU_ID}}` |

**Response 200** — pastikan `image_url` dan `image_path` sudah terisi:

```json
{
  "image_url": "https://res.cloudinary.com/nama_cloud/image/upload/v123/menus/abc.jpg",
  "image_path": "menus/abc"
}
```

> Buka URL `image_url` di browser untuk memastikan gambar benar-benar terupload.

---

### 4. Ganti Foto

| Field  | Value                                  |
| ------ | -------------------------------------- |
| Method | `PUT`                                  |
| URL    | `{{BASE_URL}}/menus/photo/{{MENU_ID}}` |

**Tab Body → form-data:**

| Key     | Type     | Value                      |
| ------- | -------- | -------------------------- |
| `image` | **File** | Pilih file gambar **baru** |

**Response 200:**

```json
{
  "message": "Foto diganti",
  "data": "https://res.cloudinary.com/nama_cloud/image/upload/v987/menus/newimage.jpg"
}
```

Nilai `data` harus berbeda dari upload pertama → foto lama sudah dihapus dari Cloudinary dan diganti yang baru.

---

### 5. Hapus Foto

| Field  | Value                                  |
| ------ | -------------------------------------- |
| Method | `DELETE`                               |
| URL    | `{{BASE_URL}}/menus/photo/{{MENU_ID}}` |
| Body   | Tidak ada                              |

**Response 200:**

```json
{ "message": "Foto dihapus" }
```

Ulangi GET `/menus/{{MENU_ID}}` → `image_url` dan `image_path` harus `null`.

---

### 6. Daftar Menu

| Field  | Value                |
| ------ | -------------------- |
| Method | `GET`                |
| URL    | `{{BASE_URL}}/menus` |

**Tab Params:**

| Key     | Value |
| ------- | ----- |
| `page`  | `1`   |
| `limit` | `10`  |

---

### 7. Update Data Menu

| Field  | Value                            |
| ------ | -------------------------------- |
| Method | `PUT`                            |
| URL    | `{{BASE_URL}}/menus/{{MENU_ID}}` |

**Tab Headers:**

```
Content-Type   →  application/json
Authorization  →  Bearer <token>
```

**Tab Body → raw → JSON:**

```json
{
  "name": "Nasi Goreng Jumbo",
  "description": "Porsi jumbo untuk 2 orang",
  "price": 35000,
  "is_available": true
}
```

---

### 8. Hapus Menu

| Field  | Value                            |
| ------ | -------------------------------- |
| Method | `DELETE`                         |
| URL    | `{{BASE_URL}}/menus/{{MENU_ID}}` |

**Tab Headers:**

```
Authorization  →  Bearer <token>
```

**Response 200:**

```json
{ "message": "Menu deleted successfully" }
```

---

### Skenario Negative Test (Error Cases)

**A. Upload file bukan gambar**

Body form-data → `image` (File) → pilih file `.pdf` atau `.txt`

```json
{ "message": "Format file harus PNG, JPG, JPEG, WEBP" }
```

**B. Upload file > 512 KB**

Pilih gambar berukuran di atas 512 KB.

```json
{ "message": "Ukuran file maksimal 512KB" }
```

> Error ini sekarang ditangani oleh `handleUploadError`, bukan global error handler, sehingga response-nya selalu JSON 400 yang konsisten.

**C. Upload tanpa field `image`**

Kirim Body form-data kosong (tanpa field apapun).

```json
{ "message": "File tidak ditemukan" }
```

**D. Upload ke menu yang tidak ada**

Ganti URL: `{{BASE_URL}}/menus/photo/00000000-0000-0000-0000-000000000000`

```json
{ "message": "Menu not found" }
```

**E. Hapus foto menu yang tidak punya foto**

Hapus foto dari menu yang `image_path`-nya sudah `null`. Tidak akan error karena `deleteImage` memiliki guard `if (!publicId) return`.

---

## Checklist Testing

| No  | Skenario                               | Method | Endpoint           | Expected Status           |
| --- | -------------------------------------- | ------ | ------------------ | ------------------------- |
| 1   | Buat menu baru                         | POST   | `/menus`           | 201                       |
| 2   | Upload foto (format valid, ukuran oke) | POST   | `/menus/photo/:id` | 201                       |
| 3   | Verifikasi image_url tersimpan         | GET    | `/menus/:id`       | 200, `image_url` terisi   |
| 4   | Ganti foto                             | PUT    | `/menus/photo/:id` | 200, URL berubah          |
| 5   | Verifikasi foto terganti               | GET    | `/menus/:id`       | 200, `image_url` URL baru |
| 6   | Hapus foto                             | DELETE | `/menus/photo/:id` | 200                       |
| 7   | Verifikasi foto terhapus               | GET    | `/menus/:id`       | 200, `image_url` = null   |
| 8   | Upload file bukan gambar               | POST   | `/menus/photo/:id` | 400, pesan format         |
| 9   | Upload file > 512 KB                   | POST   | `/menus/photo/:id` | 400, pesan ukuran         |
| 10  | Upload tanpa field image               | POST   | `/menus/photo/:id` | 400, file tidak ditemukan |
| 11  | Upload ke menu tidak ada               | POST   | `/menus/photo/:id` | 400/404                   |
| 12  | Update data menu                       | PUT    | `/menus/:id`       | 200                       |
| 13  | Hapus menu                             | DELETE | `/menus/:id`       | 200, soft delete          |
| 14  | Cek menu terhapus                      | GET    | `/menus`           | Menu tidak muncul         |

---

## Tips & Catatan Penting

### 1. Selalu Simpan `public_id` di Database

`public_id` (kolom `image_path`) **wajib disimpan** agar gambar lama bisa dihapus saat diganti. Tanpa ini, gambar orphan akan menumpuk di Cloudinary dan menambah storage usage.

### 2. `handleUploadError` vs Global Error Handler

|             | `handleUploadError`             | Global Error Handler  |
| ----------- | ------------------------------- | --------------------- |
| Posisi      | Inline di route                 | Akhir `server.js`     |
| Cakupan     | Hanya route yang menggunakannya | Semua route           |
| Kustomisasi | Per-route                       | Satu untuk semua      |
| Rekomendasi | ✅ Lebih fleksibel              | Sebagai fallback saja |

### 3. Gunakan `memoryStorage` untuk Cloudinary

`diskStorage` mengharuskan membaca file dari disk dan menghapusnya manual. `memoryStorage` langsung mem-pipe buffer ke Cloudinary via `upload_stream`.

### 4. Validasi File di Dua Lapisan

- **Multer** (`fileFilter`) — validasi MIME type sebelum file masuk memori.
- **Cloudinary** — menolak file yang bukan gambar valid.

Dua lapisan ini mencegah file berbahaya masuk ke server maupun storage.

### 5. Transformasi Gambar On-the-Fly via URL

```
# Resize 400x400 dan crop
https://res.cloudinary.com/demo/image/upload/w_400,h_400,c_fill/menus/sample.jpg

# Auto format (WebP untuk browser yang mendukung)
https://res.cloudinary.com/demo/image/upload/f_auto/menus/sample.jpg

# Gabungan: resize + auto format + auto quality
https://res.cloudinary.com/demo/image/upload/w_400,h_400,c_fill,f_auto,q_auto/menus/sample.jpg
```

### 6. Folder di Cloudinary

Ganti nama folder `"menus"` di `uploadImage` sesuai kebutuhan:

```js
cloudinary.uploader.upload_stream({ folder: "products" }, callback);
cloudinary.uploader.upload_stream({ folder: "users/avatars" }, callback);
```
