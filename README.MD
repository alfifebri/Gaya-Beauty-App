# Gaya Beauty - Fullstack E-Commerce

Aplikasi E-Commerce modern yang dibangun dengan arsitektur Fullstack: **Golang (Backend)** dan **React.js (Frontend)**. Project ini mensimulasikan toko online kosmetik dengan fitur manajemen produk, pembayaran via transfer/COD, dan integrasi WhatsApp Gateway.

## Tech Stack

**Backend:**
* **Language:** Go (Golang)
* **Database:** MySQL
* **Auth:** JWT (JSON Web Token) & Bcrypt
* **Driver:** Go-MySQL-Driver
* **Router:** Gorilla Mux (atau Standard Library)

**Frontend:**
* **Framework:** React.js (Vite)
* **Styling:** Tailwind CSS
* **Icons:** React Icons
* **HTTP Client:** Axios

---

## Fitur Utama

### User (Pelanggan)
* **Katalog Produk:** Melihat daftar produk kecantikan dengan gambar & harga real-time.
* **Detail Produk:** Deskripsi lengkap & status stok.
* **Checkout System:**
    * Pilihan Pembayaran: Transfer Bank (BCA, BRI, Mandiri) atau COD.
    * **WhatsApp Automation:** Order otomatis terkirim ke WhatsApp Admin dengan format rapi.

### Admin (Dashboard)
* **Secure Login:** Sistem autentikasi admin.
* **Dashboard Monitoring:** Melihat ringkasan pesanan masuk.
* **Manajemen Pesanan:** Update status order (Pending ➝ Lunas ➝ Dikirim).
* **Manajemen Produk (CRUD):**
    * Tambah Produk Baru (Upload Gambar).
    * Edit Harga/Stok.
    * Hapus Produk.

---

## Cara Menjalankan Project (Localhost)

### 1. Setup Backend (Go)
```bash
cd gaya-beauty-backend
# Pastikan MySQL sudah jalan dan database 'gaya_beauty_db' sudah dibuat
go mod tidy
go run cmd/api/main.go
# Server berjalan di: http://localhost:8081

## 2. Setup Frontend (React)
cd gaya-beauty-frontend
npm install
npm run dev
# Server berjalan di: http://localhost:5173

### Struktur Project
gaya-beauty-app/
├── gaya-beauty-backend/  # API & Logic Server (Go)
├── gaya-beauty-frontend/ # User Interface (React)
└── .gitignore             # Keamanan Project
└── README.md             # Dokumentasi Project