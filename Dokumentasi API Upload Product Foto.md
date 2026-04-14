# Dokumentasi API Upload Product Foto

Base URL: {{base_url}}/api/products

Dokumen ini menjelaskan endpoint upload, replace, dan delete foto product.
Implementasi memakai Multer memoryStorage + Cloudinary + metadata di Redis.

## 1. Endpoint Foto Product

| Method | Endpoint | Akses | Keterangan |
| --- | --- | --- | --- |
| POST | /api/products/photo/:id | Admin | Upload foto baru |
| PUT | /api/products/photo/:id | Admin | Ganti foto lama |
| DELETE | /api/products/photo/:id | Admin | Hapus foto |

Semua endpoint membutuhkan:
- Authorization: Bearer <access_token>
- role admin

## 2. Mekanisme Penyimpanan Foto

- File upload ke Cloudinary folder products.
- Metadata foto disimpan di Redis key product:image:{id}

Format metadata:
```json
{
  "url": "https://res.cloudinary.com/...",
  "public_id": "products/xxxx"
}
```

Catatan:
- Tabel products tidak punya kolom image_url/image_path.
- GET product by id akan mengambil metadata foto dari Redis key tersebut.

## 3. Batasan Upload

Dari upload middleware:
- Maks ukuran file: 512 KB
- MIME type yang diterima:
  - image/png
  - image/jpeg
  - image/jpg
  - image/webp
- Nama field multipart wajib: image

## 4. POST /api/products/photo/:id

Headers:
- Authorization: Bearer {{access_token}}

Body:
- form-data
- key: image (type File)

Contoh URL:
POST {{base_url}}/api/products/photo/{{product_id}}

Response 201:
```json
{
  "message": "Upload berhasil",
  "data": "https://res.cloudinary.com/.../products/....jpg"
}
```

Error umum 400:
```json
{ "message": "Ukuran file maksimal 512KB" }
{ "message": "Format file harus PNG, JPG, JPEG, WEBP" }
{ "message": "File tidak ditemukan" }
{ "message": "Product not found" }
```

## 5. PUT /api/products/photo/:id

Headers:
- Authorization: Bearer {{access_token}}

Body:
- form-data
- key: image (type File)

Contoh URL:
PUT {{base_url}}/api/products/photo/{{product_id}}

Response 200:
```json
{
  "message": "Foto diganti",
  "data": "https://res.cloudinary.com/.../products/....jpg"
}
```

Catatan:
- Jika foto lama ada, backend menghapus image lama di Cloudinary sebelum simpan metadata baru.

## 6. DELETE /api/products/photo/:id

Headers:
- Authorization: Bearer {{access_token}}

Contoh URL:
DELETE {{base_url}}/api/products/photo/{{product_id}}

Response 200:
```json
{
  "message": "Foto dihapus"
}
```

Jika belum ada foto di Redis:
```json
{
  "message": "Foto tidak ditemukan"
}
```

## 7. Alur Testing di Postman

Gunakan collection: Frostmart API.postman_collection.json

Urutan test disarankan:
1. ADMIN SIGNIN (isi access_token)
2. CREATE NEW PRODUCT (isi product_id)
3. UPLOAD PRODUCT PHOTO
4. GET PRODUCT BY ID (cek image)
5. REPLACE PRODUCT PHOTO
6. DELETE PRODUCT PHOTO
7. (Opsional integrasi order) CHECKOUT -> UPDATE TRANSACTION STATUS ke paid -> UPDATE ORDER STATUS ke completed

Catatan integrasi order:
- Jika setelah checkout langsung update order ke completed saat payment masih pending, API akan mengembalikan 400.

Variable penting:
- url = http://localhost:5000/api
- image_path = path file lokal (contoh C:/Users/Acer/Pictures/test.jpg)

## 8. Troubleshooting

- 401 Unauthorized: token kosong/invalid
- 403 Forbidden: user bukan admin
- 400 File tidak ditemukan: field form-data bukan image atau file belum dipilih
- 400 Product not found: product_id tidak ada di DB
- 400 Foto tidak ditemukan: lakukan upload dulu sebelum delete
