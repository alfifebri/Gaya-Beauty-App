package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/go-sql-driver/mysql"
)

func ConnectDB() *sql.DB {
	// 1. Cek settingan Cloud
	dsn := os.Getenv("DB_DSN")

	// 2. Kalau KOSONG = Localhost
	if dsn == "" {
		dsn = "root:@tcp(127.0.0.1:3307)/gaya_beauty_db?parseTime=true"
		fmt.Println("Mode: Localhost (Laptop - Port 3307)")
	} else {
		fmt.Println("Mode: Cloud (Server)")
	}

	// 3. Buka Koneksi
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		log.Fatal("Gagal koneksi database:", err)
	}

	// 4. Cek Ping
	err = db.Ping()
	if err != nil {
		log.Fatal("Database tidak merespon:", err)
	}

	// --- 5. AUTO MIGRATE (UPDATE SYARAT 2) ---

	// A. Tabel Users (Admin)
	queryUsers := `
	CREATE TABLE IF NOT EXISTS users (
		id INT AUTO_INCREMENT PRIMARY KEY,
		full_name VARCHAR(100) NOT NULL,
		email VARCHAR(100) NOT NULL UNIQUE,
		password VARCHAR(255) NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);`
	if _, err := db.Exec(queryUsers); err != nil {
		log.Fatal("Gagal membuat tabel users:", err)
	}

	// B. Tabel Products
	queryProducts := `
	CREATE TABLE IF NOT EXISTS products (
		id INT AUTO_INCREMENT PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		price DECIMAL(10,2) NOT NULL,
		stock INT NOT NULL,
		category VARCHAR(100),
		description TEXT,
		image_url VARCHAR(255)
	);`
	if _, err := db.Exec(queryProducts); err != nil {
		log.Fatal("Gagal membuat tabel products:", err)
	}

	// --- BARU: SYARAT 2 (TRANSAKSI & CUSTOMER) ---

	// C. Tabel Customers (Pembeli)
	queryCustomers := `
	CREATE TABLE IF NOT EXISTS customers (
		id INT AUTO_INCREMENT PRIMARY KEY,
		full_name VARCHAR(100) NOT NULL,
		email VARCHAR(100) NOT NULL UNIQUE,
		password VARCHAR(255) NOT NULL,
		phone VARCHAR(20),
		address TEXT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);`
	if _, err := db.Exec(queryCustomers); err != nil {
		log.Fatal("Gagal membuat tabel customers:", err)
	}

	// D. Tabel Carts (Keranjang Belanja)
	queryCarts := `
	CREATE TABLE IF NOT EXISTS carts (
		id INT AUTO_INCREMENT PRIMARY KEY,
		customer_id INT NOT NULL,
		product_id INT NOT NULL,
		quantity INT NOT NULL DEFAULT 1,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
		FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
	);`
	if _, err := db.Exec(queryCarts); err != nil {
		log.Fatal("Gagal membuat tabel carts:", err)
	}

	// E. Tabel Orders (Pesanan - Versi Update)
	// Kita drop table orders lama kalau strukturnya beda, tapi karena database Aiven lo kosong/baru, aman langsung create.
	// Kalau error, uncomment baris ini:
	// _, _ = db.Exec("DROP TABLE IF EXISTS orders") 

	queryOrders := `
	CREATE TABLE IF NOT EXISTS orders (
		id INT AUTO_INCREMENT PRIMARY KEY,
		customer_id INT NOT NULL,
		total_price DECIMAL(10,2) NOT NULL,
		status VARCHAR(20) DEFAULT 'pending', -- pending, paid, shipped, done, cancelled
		snap_token VARCHAR(255), -- Buat Midtrans nanti
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
	);`
	if _, err := db.Exec(queryOrders); err != nil {
		log.Fatal("Gagal membuat tabel orders:", err)
	}

	// F. Tabel Order Items (Rincian Barang per Order)
	queryOrderItems := `
	CREATE TABLE IF NOT EXISTS order_items (
		id INT AUTO_INCREMENT PRIMARY KEY,
		order_id INT NOT NULL,
		product_id INT NOT NULL,
		quantity INT NOT NULL,
		price DECIMAL(10,2) NOT NULL, -- Harga saat beli (buat histori)
		FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
		FOREIGN KEY (product_id) REFERENCES products(id)
	);`
	if _, err := db.Exec(queryOrderItems); err != nil {
		log.Fatal("Gagal membuat tabel order_items:", err)
	}

	fmt.Println("✅ Database Terkoneksi & Tabel Syarat 2 SIAP!")
	return db
}