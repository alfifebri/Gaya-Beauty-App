package database

import (
	"database/sql"
	"fmt"
	"log"
	"os" // <--- PENTING: Buat baca settingan Cloud

	_ "github.com/go-sql-driver/mysql"
)

func ConnectDB() *sql.DB {
	// 1. Cek apakah ada settingan "DB_DSN" dari Cloud (Render/Aiven)?
	dsn := os.Getenv("DB_DSN")

	// 2. Kalau KOSONG, berarti lagi di Laptop (Localhost)
	if dsn == "" {
		// PENTING: Tetap pake port 3307 sesuai XAMPP lo!
		dsn = "root:@tcp(127.0.0.1:3307)/gaya_beauty_db?parseTime=true"
		fmt.Println("Mode: Localhost (Laptop - Port 3307)")
	} else {
		// Kalau ada isinya, berarti lagi di Cloud
		fmt.Println("Mode: Cloud (Server)")
	}

	// 3. Buka Koneksi
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		log.Fatal("Gagal koneksi database:", err)
	}

	// 4. Cek Ping (Pastikan nyambung)
	err = db.Ping()
	if err != nil {
		log.Fatal("Database tidak merespon:", err)
	}

	// --- 5. AUTO MIGRATE (BIKIN TABEL OTOMATIS) ---
	// Ini penting biar di Aiven nanti tabelnya langsung jadi!
	
	// Tabel Users
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

    // Tabel Products (Gue tambahin sekalian biar aman di Cloud!)
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
    
    // Tabel Orders (Biar lengkap sekalian!)
    queryOrders := `
    CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_name VARCHAR(100),
        total_price DECIMAL(10,2),
        payment_method VARCHAR(50),
        status VARCHAR(20) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`

    if _, err := db.Exec(queryOrders); err != nil {
        log.Fatal("Gagal membuat tabel orders:", err)
    }

	fmt.Println("✅ Berhasil konek ke Database & Semua Tabel Ready!")
	return db
}