# Dokumentasi API Upload Product Foto

Base URL: {{base_url}}/api/products

Dokumen ini khusus endpoint upload, replace, dan delete foto product.
Implementasi menggunakan Multer memoryStorage + Cloudinary + metadata di Redis.

## 1. Endpoint Foto Product

| Method | Endpoint | Akses | Keterangan |
| --- | --- | --- | --- |
| POST | /api/products/photo/:id | Admin | Upload foto baru |
| PUT | /api/products/photo/:id | Admin | Ganti foto lama |
| DELETE | /api/products/photo/:id | Admin | Hapus foto |

Semua endpoint di atas membutuhkan:
- Authorization: Bearer <access_token>
- role admin

## 2. Mekanisme Penyimpanan Foto

- File diupload ke Cloudinary folder products.
- Metadata foto disimpan di Redis key: product:image:{id}
- Value Redis:
```json
{
  "url": "https://res.cloudinary.com/...",
  "public_id": "products/xxxx"
}
```
- Tabel products tidak memiliki kolom image_url/image_path, jadi metadata foto tidak disimpan di PostgreSQL.

## 3. Batasan Upload

Dari upload middleware saat ini:
- Maks ukuran file: 512 KB
- Format file yang diterima:
  - image/png
  - image/jpeg
  - image/jpg
  - image/webp
- Nama field multipart harus: image

Jika melanggar, response 400 dengan message sesuai error.

## 4. POST /api/products/photo/:id

Upload foto pertama untuk product.

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

Replace foto lama dengan foto baru.

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
- Jika metadata foto lama ada di Redis, backend akan hapus image lama di Cloudinary dulu.

## 6. DELETE /api/products/photo/:id

Hapus foto product dari Cloudinary dan Redis.

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

Urutan test:
1. ADMIN SIGNIN (Auth API) untuk mengisi access_token
2. CREATE NEW PRODUCT (Products API) untuk mengisi product_id
3. UPLOAD PRODUCT PHOTO
4. GET PRODUCT BY ID (cek field image)
5. REPLACE PRODUCT PHOTO
6. DELETE PRODUCT PHOTO

Variable yang harus diisi:
- url = http://localhost:5000/api
- image_path = path file lokal (contoh C:/Users/Acer/Pictures/test.jpg)

## 8. Troubleshooting

- 401 Unauthorized: token kosong/invalid
- 403 Forbidden: user bukan admin
- 400 File tidak ditemukan: field form-data bukan image atau belum pilih file
- 400 Product not found: product_id tidak ada di DB
- 400 Foto tidak ditemukan: coba upload dulu sebelum delete
