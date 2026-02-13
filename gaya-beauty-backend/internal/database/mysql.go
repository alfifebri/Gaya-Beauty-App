package database

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/go-sql-driver/mysql"
)

func ConnectDB() *sql.DB {
	// Pake port 3307 sesuai screenshot XAMPP lo tadi
	dsn := "root:@tcp(127.0.0.1:3307)/gaya_beauty_db"
	
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		log.Fatal("Gagal koneksi database:", err)
	}

	// Cek apakah database beneran bisa dijangkau
	err = db.Ping()
	if err != nil {
		log.Fatal("Database tidak merespon:", err)
	}

	// --- INI BAGIAN BUAT BIKIN TABEL OTOMATIS ---
	query := `
	CREATE TABLE IF NOT EXISTS users (
		id INT AUTO_INCREMENT PRIMARY KEY,
		full_name VARCHAR(100) NOT NULL,
		email VARCHAR(100) NOT NULL UNIQUE,
		password VARCHAR(255) NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);`

	// Eksekusi perintah bikin tabel
	_, err = db.Exec(query)
	if err != nil {
		log.Fatal("Gagal membuat tabel users:", err)
	}

	fmt.Println("Berhasil konek ke gaya_beauty_db & Tabel Ready!")
	return db
}