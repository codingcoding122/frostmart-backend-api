# Dokumentasi API Menu

> Base URL: `{{base_url}}/api/menus`  
> Semua route admin membutuhkan `access_token` yang didapat setelah login.

---

## Daftar Isi

1. [Setup Postman](#1-setup-postman)
2. [Ringkasan Endpoint](#2-ringkasan-endpoint)
3. [GET /api/menus — Ambil Semua Menu](#3-get-apimenus--ambil-semua-menu)
4. [GET /api/menus/:id — Ambil Menu by ID](#4-get-apimenusid--ambil-menu-by-id)
5. [POST /api/menus — Buat Menu Baru](#5-post-apimenus--buat-menu-baru)
6. [PUT /api/menus/:id — Update Menu](#6-put-apimenusid--update-menu)
7. [DELETE /api/menus/:id — Hapus Menu](#7-delete-apimenusid--hapus-menu)
8. [Error Reference](#8-error-reference)

---

## 1. Setup Postman

Sebelum mulai, pastikan sudah:

### Environment Variables

Buat environment `REST API Local` dengan variabel berikut:

| Variable       | Value                                         |
| -------------- | --------------------------------------------- |
| `base_url`     | `http://localhost:5000`                       |
| `access_token` | _(diisi otomatis setelah login)_              |
| `menu_id`      | _(isi manual setelah dapat ID dari response)_ |

### Login Dulu

Route `POST`, `PUT`, dan `DELETE` pada menu membutuhkan token admin. Lakukan login terlebih dahulu:

1. Jalankan `POST {{base_url}}/api/auth/local/signin`
2. Pastikan cookie `access_token` tersimpan di cookie jar Postman
3. Atau simpan token ke variabel environment `access_token`

### Set Role Admin

Route create, update, delete hanya bisa diakses oleh user dengan role `admin`. Jika belum, jalankan query ini di database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'email-kamu@example.com';
```

Lalu **login ulang** agar JWT baru berisi role `admin`.

---

## 2. Ringkasan Endpoint

| Method   | Endpoint         | Akses    | Keterangan                   |
| -------- | ---------------- | -------- | ---------------------------- |
| `GET`    | `/api/menus`     | Public   | Ambil semua menu (paginated) |
| `GET`    | `/api/menus/:id` | Public   | Ambil menu by ID             |
| `POST`   | `/api/menus`     | 🔒 Admin | Buat menu baru               |
| `PUT`    | `/api/menus/:id` | 🔒 Admin | Update menu                  |
| `DELETE` | `/api/menus/:id` | 🔒 Admin | Soft delete menu             |

---

## 3. GET /api/menus — Ambil Semua Menu

Mengambil daftar semua menu yang aktif (`is_deleted = false`) dengan pagination.

### Postman

| Field  | Value                    |
| ------ | ------------------------ |
| Method | `GET`                    |
| URL    | `{{base_url}}/api/menus` |
| Auth   | Tidak perlu              |

### Query Params (Opsional)

Di tab **Params**, tambahkan:

| Key     | Value | Keterangan                                      |
| ------- | ----- | ----------------------------------------------- |
| `page`  | `1`   | Halaman ke berapa (default: 1)                  |
| `limit` | `10`  | Jumlah item per halaman (default: 10, max: 100) |

Contoh URL dengan params:

```
GET {{base_url}}/api/menus?page=1&limit=5
```

### Response Sukses `200`

```json
{
  "page": 1,
  "limit": 10,
  "total_pages": 3,
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "Nasi Goreng",
      "description": "Nasi goreng spesial dengan telur",
      "price": 25000,
      "is_available": true,
      "image_path": null,
      "image_url": null,
      "created_at": "2025-01-15T08:00:00.000Z",
      "is_deleted": false
    },
    {
      "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "name": "Mie Ayam",
      "description": "Mie ayam dengan pangsit",
      "price": 18000,
      "is_available": true,
      "image_path": null,
      "image_url": null,
      "created_at": "2025-01-15T08:05:00.000Z",
      "is_deleted": false
    }
  ]
}
```

### Penjelasan Field Response

| Field                 | Tipe    | Keterangan                          |
| --------------------- | ------- | ----------------------------------- |
| `page`                | number  | Halaman saat ini                    |
| `limit`               | number  | Jumlah item yang diminta            |
| `total_pages`         | number  | Total halaman yang tersedia         |
| `data`                | array   | Daftar menu                         |
| `data[].id`           | UUID    | ID unik menu                        |
| `data[].price`        | integer | Harga dalam satuan rupiah           |
| `data[].is_available` | boolean | Apakah menu tersedia                |
| `data[].is_deleted`   | boolean | Selalu `false` (soft delete filter) |

### Navigasi Halaman

Untuk pindah halaman, ubah nilai `page`:

```
GET {{base_url}}/api/menus?page=2&limit=10
GET {{base_url}}/api/menus?page=3&limit=10
```

---

## 4. GET /api/menus/:id — Ambil Menu by ID

Mengambil detail satu menu berdasarkan UUID-nya.

### Postman

| Field  | Value                                |
| ------ | ------------------------------------ |
| Method | `GET`                                |
| URL    | `{{base_url}}/api/menus/{{menu_id}}` |
| Auth   | Tidak perlu                          |

**Cara isi `menu_id`:**

- Salin `id` dari response GET semua menu
- Simpan ke variabel environment `menu_id`, atau
- Tempel langsung ke URL: `{{base_url}}/api/menus/a1b2c3d4-e5f6-7890-abcd-ef1234567890`

### Response Sukses `200`

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Nasi Goreng",
  "description": "Nasi goreng spesial dengan telur",
  "price": 25000,
  "is_available": true,
  "image_path": null,
  "image_url": null,
  "created_at": "2025-01-15T08:00:00.000Z",
  "is_deleted": false
}
```

### Response Error `404`

```json
{
  "message": "Menu not found"
}
```

---

## 5. POST /api/menus — Buat Menu Baru

Membuat menu baru. Hanya bisa diakses oleh user dengan role `admin`.

### Postman

| Field  | Value                    |
| ------ | ------------------------ |
| Method | `POST`                   |
| URL    | `{{base_url}}/api/menus` |
| Auth   | Bearer Token             |
| Body   | raw → JSON               |

**Tab Auth:**

- Type: `Bearer Token`
- Token: `{{access_token}}`

**Tab Body → raw → JSON:**

```json
{
  "name": "Soto Ayam",
  "description": "Soto ayam kuah bening khas Jawa",
  "price": 15000
}
```

### Validasi Input

| Field         | Tipe   | Wajib | Aturan                    |
| ------------- | ------ | ----- | ------------------------- |
| `name`        | string | ✅    | Min 3 karakter            |
| `description` | string | ❌    | Boleh kosong              |
| `price`       | number | ✅    | Harus angka positif (> 0) |

### Response Sukses `201`

```json
{
  "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "name": "Soto Ayam",
  "description": "Soto ayam kuah bening khas Jawa",
  "price": 15000,
  "is_available": true,
  "image_path": null,
  "image_url": null,
  "created_at": "2025-03-30T10:00:00.000Z",
  "is_deleted": false
}
```

### Response Error

**`400` — Validasi gagal (contoh: name terlalu pendek)**

```json
{
  "message": "Name is required min. 3 chars!"
}
```

**`400` — Price bukan angka positif**

```json
{
  "message": "Price must be greater than 0!"
}
```

**`401` — Tidak ada token**

```json
401 Unauthorized
```

**`403` — Token valid tapi bukan admin**

```json
{
  "message": "Forbidden: insufficient role"
}
```

### Contoh Lengkap di Postman

```
Method : POST
URL    : http://localhost:5000/api/menus

Tab Headers:
  Content-Type : application/json

Tab Auth:
  Type  : Bearer Token
  Token : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Tab Body (raw, JSON):
{
  "name": "Soto Ayam",
  "description": "Soto ayam kuah bening khas Jawa",
  "price": 15000
}
```

---

## 6. PUT /api/menus/:id — Update Menu

Mengupdate data menu yang sudah ada. Hanya bisa diakses oleh `admin`.

### Postman

| Field  | Value                                |
| ------ | ------------------------------------ |
| Method | `PUT`                                |
| URL    | `{{base_url}}/api/menus/{{menu_id}}` |
| Auth   | Bearer Token                         |
| Body   | raw → JSON                           |

**Tab Auth:**

- Type: `Bearer Token`
- Token: `{{access_token}}`

**Tab Body → raw → JSON:**

```json
{
  "name": "Soto Ayam Spesial",
  "description": "Soto ayam dengan lauk lengkap",
  "price": 20000,
  "is_available": true
}
```

### Validasi Input

| Field          | Tipe    | Wajib | Aturan              |
| -------------- | ------- | ----- | ------------------- |
| `name`         | string  | ✅    | Min 3 karakter      |
| `description`  | string  | ❌    | Boleh kosong        |
| `price`        | number  | ✅    | Harus angka positif |
| `is_available` | boolean | ✅    | `true` atau `false` |

> ⚠️ **Semua field wajib diisi kecuali `description`.** Ini adalah full update (bukan partial/PATCH).

### Response Sukses `200`

```json
{
  "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "name": "Soto Ayam Spesial",
  "description": "Soto ayam dengan lauk lengkap",
  "price": 20000,
  "is_available": true,
  "image_path": null,
  "image_url": null,
  "created_at": "2025-03-30T10:00:00.000Z",
  "is_deleted": false
}
```

### Response Error

**`400` — Menu tidak ditemukan**

```json
{
  "message": "Menu is not found!"
}
```

**`400` — Validasi gagal**

```json
{
  "message": "Price must be greater than 0!"
}
```

**`401` / `403`** — Sama seperti endpoint POST di atas.

### Nonaktifkan Menu (Tanpa Hapus)

Untuk menonaktifkan menu tanpa menghapusnya, set `is_available: false`:

```json
{
  "name": "Soto Ayam Spesial",
  "description": "Soto ayam dengan lauk lengkap",
  "price": 20000,
  "is_available": false
}
```

Menu tetap ada di database tapi tidak tampil sebagai "tersedia".

---

## 7. DELETE /api/menus/:id — Hapus Menu

Menghapus menu secara **soft delete** — data tidak benar-benar dihapus dari database, hanya `is_deleted` di-set menjadi `true`. Menu tidak akan muncul di GET `/api/menus` setelah ini.

### Postman

| Field  | Value                                |
| ------ | ------------------------------------ |
| Method | `DELETE`                             |
| URL    | `{{base_url}}/api/menus/{{menu_id}}` |
| Auth   | Bearer Token                         |
| Body   | Tidak perlu                          |

**Tab Auth:**

- Type: `Bearer Token`
- Token: `{{access_token}}`

### Response Sukses `200`

```json
{
  "message": "Menu deleted successfully"
}
```

### Response Error

**`400` — Menu tidak ditemukan**

```json
{
  "message": "Menu not found"
}
```

**`401` / `403`** — Sama seperti endpoint POST di atas.

### Catatan Soft Delete

Menu yang sudah dihapus (`is_deleted = true`):

- Tidak muncul di `GET /api/menus`
- Masih ada di database (bisa dipulihkan manual via SQL)
- `GET /api/menus/:id` masih bisa mengembalikan data tersebut karena query tidak filter `is_deleted`

Untuk melihat atau memulihkan menu yang terhapus, lakukan langsung di database:

```sql
-- Lihat semua menu termasuk yang terhapus
SELECT * FROM menus WHERE is_deleted = true;

-- Pulihkan menu
UPDATE menus SET is_deleted = false WHERE id = 'uuid-menu-disini';
```

---

## 8. Error Reference

### HTTP Status Code

| Code  | Arti                  | Kapan Terjadi                                   |
| ----- | --------------------- | ----------------------------------------------- |
| `200` | OK                    | Request berhasil                                |
| `201` | Created               | Data berhasil dibuat                            |
| `400` | Bad Request           | Validasi gagal / data tidak ditemukan           |
| `401` | Unauthorized          | Token tidak ada atau sudah expired              |
| `403` | Forbidden             | Token valid tapi role tidak cukup (bukan admin) |
| `404` | Not Found             | Resource tidak ditemukan                        |
| `500` | Internal Server Error | Error tidak terduga di server                   |

### Troubleshooting Umum

**Token expired (`401`)**

Access token berlaku 1 jam. Jika expired:

1. Jalankan `POST /api/auth/refresh-token`
2. Cookie `access_token` baru akan di-set otomatis
3. Coba request sebelumnya lagi

**Forbidden (`403`) padahal sudah login**

Berarti role user bukan `admin`. Cek dengan:

```
GET {{base_url}}/api/auth/user/me
```

Jika `role` bukan `admin`, update di database dan login ulang.

**`400` padahal body sudah benar**

Pastikan:

- Tab Body pilih `raw` dan format `JSON` (bukan `Text`)
- Header `Content-Type: application/json` terisi (Postman biasanya otomatis)
- Tidak ada typo di nama field (`name`, `price`, `description`, `is_available`)
- `price` dikirim sebagai **number**, bukan string (`18000` bukan `"18000"`)

---

> 🔒 = Membutuhkan token admin  
> Variabel `{{base_url}}`, `{{access_token}}`, `{{menu_id}}` mengacu pada Environment Postman.
