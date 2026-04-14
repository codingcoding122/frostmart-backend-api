# Dokumentasi API Lengkap Frostmart

## 1. Informasi Umum

- Base URL API: http://localhost:5000/api
- Collection Postman: Frostmart API.postman_collection.json
- Content-Type utama: application/json
- Auth: Bearer token pada header Authorization

Hak akses:
- Public: tanpa token
- Login: token user/admin
- Admin: token dengan role admin

## 2. Format Response

Format contoh yang diminta:

{
  "status": "success",
  "data": [
    { "id": 1, "name": "Sabun cuci muka", "price": 120000, "stock": 500 }
  ],
  "message": "ok"
}

Catatan penting:
- Response aktual backend saat ini belum semua memakai pembungkus status-data-message seperti format di atas.
- Contoh response per endpoint di bawah menampilkan response aktual dari server saat ini.

## 3. AUTH API

### 3.1 Register
- URL: /auth/local/signup
- Method: POST
- Akses: Public
- Headers: Content-Type: application/json
- Body:
{
  "name": "Admin Frostmart",
  "email": "admin@frostmart.local",
  "password": "Admin12345"
}
- Success 201:
{
  "user": {
    "id": 1,
    "name": "Admin Frostmart",
    "email": "admin@frostmart.local",
    "role": "user"
  }
}
- Error 400:
{
  "message": "Email already used"
}

Postman test script:
pm.test("Status 201 atau 400", function () {
  pm.expect(pm.response.code).to.be.oneOf([201, 400]);
});

### 3.2 Login
- URL: /auth/local/signin
- Method: POST
- Akses: Public
- Headers: Content-Type: application/json
- Body:
{
  "email": "admin@frostmart.local",
  "password": "Admin12345"
}
- Success 200:
{
  "user": {
    "id": 1,
    "name": "Admin Frostmart",
    "email": "admin@frostmart.local",
    "role": "admin"
  }
}
- Error 400:
{
  "message": "Invalid credentials"
}

Postman test script:
pm.test("Status 200", function () {
  pm.response.to.have.status(200);
});

### 3.3 Refresh Token
- URL: /auth/refresh-token
- Method: POST
- Akses: Public
- Headers opsional: x-refresh-token
- Body: tidak wajib
- Success 200:
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
- Error 403:
{
  "message": "Refresh token required"
}

### 3.4 Get Me
- URL: /auth/user/me
- Method: GET
- Akses: Login
- Headers: Authorization: Bearer <access_token>
- Success 200:
{
  "id": 1,
  "name": "Admin Frostmart",
  "email": "admin@frostmart.local",
  "role": "admin"
}
- Error 401: Unauthorized

### 3.5 Update Me
- URL: /auth/user/me
- Method: PUT
- Akses: Login
- Headers:
  - Authorization: Bearer <access_token>
  - Content-Type: application/json
- Body:
{
  "name": "Admin Updated",
  "email": "admin@frostmart.local",
  "password": "Admin123456"
}
- Success 200:
{
  "id": 1,
  "name": "Admin Updated",
  "email": "admin@frostmart.local",
  "role": "admin"
}
- Error 400:
{
  "message": "Invalid input"
}

### 3.6 Logout
- URL: /auth/remove-session
- Method: DELETE
- Akses: Login
- Headers: Authorization: Bearer <access_token>
- Success 200:
{
  "message": "Logged out successfully"
}
- Error 401: Unauthorized

## 4. USERS API (ADMIN)

### 4.1 Get Users
- URL: /users?page=1&limit=10&search=
- Method: GET
- Akses: Admin
- Headers: Authorization: Bearer <access_token>
- Success 200:
{
  "page": 1,
  "limit": 10,
  "search": "",
  "total_pages": 1,
  "data": [
    { "id": 1, "name": "Admin", "email": "admin@x.com", "role": "admin" }
  ]
}
- Error 401: Unauthorized
- Error 403:
{
  "message": "Forbidden: insufficient role"
}

### 4.2 Get User By ID
- URL: /users/:id
- Method: GET
- Akses: Admin
- Headers: Authorization
- Success 200:
{
  "id": 2,
  "name": "Norma",
  "email": "norma@gmail.com",
  "role": "user"
}
- Error 404:
{
  "message": "User not found"
}

### 4.3 Update User Role
- URL: /users/:id/role
- Method: PATCH
- Akses: Admin
- Headers:
  - Authorization
  - Content-Type: application/json
- Body:
{
  "role": "admin"
}
- Success 200: user yang sudah diupdate
- Error 400: validasi role atau user tidak valid

### 4.4 Delete User
- URL: /users/:id
- Method: DELETE
- Akses: Admin
- Headers: Authorization
- Success 200:
{
  "message": "User deleted successfully"
}
- Error 400:
{
  "message": "Cannot delete your own account"
}
- Error 404:
{
  "message": "User not found"
}

## 5. PRODUCT API

### 5.1 Get Products
- URL: /products?page=1&limit=10&search=
- Method: GET
- Akses: Public
- Success 200:
{
  "source": "db",
  "page": 1,
  "limit": 10,
  "search": "",
  "total_pages": 1,
  "data": [
    { "id": 1, "name": "Frozen Nugget", "price": 50000, "stock": 100 }
  ]
}
- Error 400:
{
  "message": "Invalid query"
}

### 5.2 Get Product By ID
- URL: /products/:id
- Method: GET
- Akses: Public
- Success 200: detail product
- Error 404:
{
  "message": "Product not found"
}

### 5.3 Create Product
- URL: /products
- Method: POST
- Akses: Admin
- Headers:
  - Authorization
  - Content-Type: application/json
- Body:
{
  "name": "Frozen Nugget Premium",
  "description": "Nugget ayam beku premium",
  "price": 52000,
  "stock": 120
}
- Success 201: object product baru
- Error 400:
{
  "message": "Name is required min. 3 chars!"
}
- Error 401: Unauthorized
- Error 403: Forbidden

### 5.4 Update Product
- URL: /products/:id
- Method: PUT
- Akses: Admin
- Headers:
  - Authorization
  - Content-Type: application/json
- Body sama seperti create
- Success 200: object product terupdate
- Error 400:
{
  "message": "Product is not found!"
}

### 5.5 Delete Product
- URL: /products/:id
- Method: DELETE
- Akses: Admin
- Headers: Authorization
- Success 200:
{
  "message": "Product deleted successfully"
}
- Error 400:
{
  "message": "Product not found"
}

### 5.6 Upload Product Photo
- URL: /products/photo/:id
- Method: POST
- Akses: Admin
- Headers: Authorization
- Body: form-data, key image tipe file
- Success 201:
{
  "message": "Upload berhasil",
  "data": "https://res.cloudinary.com/..."
}
- Error 400:
{
  "message": "Ukuran file maksimal 512KB"
}

### 5.7 Replace Product Photo
- URL: /products/photo/:id
- Method: PUT
- Akses: Admin
- Headers: Authorization
- Body: form-data image
- Success 200:
{
  "message": "Foto diganti",
  "data": "https://res.cloudinary.com/..."
}
- Error 400: file/product tidak valid

### 5.8 Delete Product Photo
- URL: /products/photo/:id
- Method: DELETE
- Akses: Admin
- Headers: Authorization
- Success 200:
{
  "message": "Foto dihapus"
}
- Error 400:
{
  "message": "Foto tidak ditemukan"
}

## 6. ORDERS API

### 6.1 Checkout
- URL: /orders/checkout
- Method: POST
- Akses: Login
- Headers:
  - Authorization
  - Content-Type: application/json
- Body:
{
  "payment_method": "cash",
  "items": [
    { "product_id": 1, "quantity": 1 }
  ]
}
- Success 201:
{
  "order": {
    "id": 10,
    "user_id": 2,
    "total_price": 50000,
    "status": "pending",
    "items": [
      { "product_id": 1, "quantity": 1, "price": 50000 }
    ]
  },
  "transaction": {
    "id": 7,
    "order_id": 10,
    "payment_method": "cash",
    "payment_status": "pending"
  }
}
- Error 400:
{
  "message": "Insufficient stock for product id 1"
}
- Error 401: Unauthorized

Postman test script:
pm.test("Status 201", function () {
  pm.response.to.have.status(201);
});
const json = pm.response.json();
if (json.order && json.order.id) pm.environment.set("order_id", json.order.id);
if (json.transaction && json.transaction.id) pm.environment.set("transaction_id", json.transaction.id);

### 6.2 Get My Orders
- URL: /orders/my
- Method: GET
- Akses: Login
- Headers: Authorization
- Success 200: array order milik user
- Error 401: Unauthorized

### 6.3 Get Order By ID
- URL: /orders/:id
- Method: GET
- Akses: Login (owner/admin)
- Headers: Authorization
- Success 200: detail order + items
- Error 403:
{
  "message": "Forbidden"
}
- Error 404:
{
  "message": "Order not found"
}

### 6.4 Get All Orders
- URL: /orders
- Method: GET
- Akses: Admin
- Headers: Authorization
- Success 200: array semua order
- Error 403: Forbidden

### 6.5 Update Order Status
- URL: /orders/:id/status
- Method: PATCH
- Akses: Admin
- Headers:
  - Authorization
  - Content-Type: application/json
- Body:
{
  "status": "completed"
}
- Success 200: object order terupdate
- Error 400:
{
  "message": "Order cannot be marked paid/completed while payment status is not paid"
}
- Error 404:
{
  "message": "Order not found"
}

Aturan bisnis:
- Status order paid/completed hanya boleh jika payment_status transaksi terkait sudah paid.

## 7. TRANSACTIONS API

### 7.1 Get My Transactions
- URL: /transactions/my
- Method: GET
- Akses: Login
- Headers: Authorization
- Success 200: array transaksi user
- Error 401: Unauthorized

### 7.2 Get Transaction By ID
- URL: /transactions/:id
- Method: GET
- Akses: Login (owner/admin)
- Headers: Authorization
- Success 200: detail transaksi
- Error 403:
{
  "message": "Forbidden"
}
- Error 404:
{
  "message": "Transaction not found"
}

### 7.3 Get All Transactions
- URL: /transactions
- Method: GET
- Akses: Admin
- Headers: Authorization
- Success 200: array transaksi
- Error 403: Forbidden

### 7.4 Update Transaction Status
- URL: /transactions/:id/status
- Method: PATCH
- Akses: Admin
- Headers:
  - Authorization
  - Content-Type: application/json
- Body:
{
  "payment_status": "paid"
}
- Success 200: object transaksi terupdate
- Error 404:
{
  "message": "Transaction not found"
}

Postman test script:
pm.test("Status 200", function () {
  pm.response.to.have.status(200);
});
const json = pm.response.json();
pm.expect(json.payment_status).to.eql("paid");

## 8. INVENTORY LOGS API

### 8.1 Get Inventory Logs
- URL: /inventory-logs?page=1&limit=20&product_id=1
- Method: GET
- Akses: Admin
- Headers: Authorization
- Success 200:
{
  "page": 1,
  "limit": 20,
  "product_id": 1,
  "total_pages": 1,
  "data": [
    { "id": 1, "product_id": 1, "change_type": "OUT", "quantity": 1 }
  ]
}
- Error 400: query tidak valid
- Error 403: Forbidden

### 8.2 Adjust Inventory
- URL: /inventory-logs/adjust
- Method: POST
- Akses: Admin
- Headers:
  - Authorization
  - Content-Type: application/json
- Body:
{
  "product_id": 1,
  "change_type": "IN",
  "quantity": 5,
  "description": "Restock manual"
}
- Success 201:
{
  "product": {
    "id": 1,
    "stock": 105
  },
  "log": {
    "id": 20,
    "product_id": 1,
    "change_type": "IN",
    "quantity": 5,
    "description": "Restock manual (by user #1)"
  }
}
- Error 400:
{
  "message": "Stock cannot be negative"
}

## 9. Postman Test Script Ringkas Per Endpoint

Template script endpoint sukses:
pm.test("Status sesuai", function () {
  pm.expect(pm.response.code).to.be.oneOf([200, 201]);
});

Template script endpoint validasi data:
const json = pm.response.json();
pm.test("Memiliki message atau data", function () {
  pm.expect(json).to.be.an("object");
});

Template script endpoint expected error:
pm.test("Status error sesuai", function () {
  pm.expect(pm.response.code).to.be.oneOf([400, 401, 403, 404]);
});

## 10. Urutan Testing End-to-End yang Disarankan

1. ADMIN SIGNUP
2. Ubah role user jadi admin di DB (sekali saja)
3. ADMIN SIGNIN
4. CREATE NEW PRODUCT
5. CHECKOUT (CREATE ORDER)
6. UPDATE ORDER STATUS TO COMPLETED (SHOULD FAIL IF PAYMENT PENDING)
7. UPDATE TRANSACTION STATUS (ADMIN) ke paid
8. UPDATE ORDER STATUS TO COMPLETED (AFTER PAYMENT PAID)
9. GET INVENTORY LOGS (ADMIN)
10. UPLOAD/REPLACE/DELETE PRODUCT PHOTO