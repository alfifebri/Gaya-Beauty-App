package main

import (
	"fmt"
	"gaya-beauty-backend/internal/database"
	"gaya-beauty-backend/internal/handlers"
	"net/http"
	"os"
)

func main() {
	// 1. Konek Database
	db := database.ConnectDB()
	defer db.Close()

	// =================================================================
	// ☢️ PINTU DARURAT: RESET TOTAL & PERSIAPAN TABEL LENGKAP ☢️
	// Akses: [LinkKoyeb]/reset-db-now
	// =================================================================
	http.HandleFunc("/reset-db-now", func(w http.ResponseWriter, r *http.Request) {
		// A. USER: Hancurkan Tabel Lama & Bangun Baru (Ada Role)
		_, _ = db.Exec("DROP TABLE IF EXISTS users")
		queryUser := `
		CREATE TABLE users (
			id INT AUTO_INCREMENT PRIMARY KEY,
			full_name VARCHAR(100),
			email VARCHAR(100) UNIQUE NOT NULL,
			password VARCHAR(255) NOT NULL,
			role VARCHAR(50) DEFAULT 'admin',
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`
		_, errUser := db.Exec(queryUser)

		// B. PRODUK: Pastikan Tabel Produk Ada (Biar gak error pas upload)
		queryProduct := `
		CREATE TABLE IF NOT EXISTS products (
			id INT AUTO_INCREMENT PRIMARY KEY,
			name VARCHAR(255),
			price DECIMAL(10, 2),
			stock INT,
			category VARCHAR(100),
			description TEXT,
			image_url VARCHAR(255),
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`
		_, errProd := db.Exec(queryProduct)

		// C. ORDERS: Pastikan Tabel Order Ada
		queryOrder := `
		CREATE TABLE IF NOT EXISTS orders (
			id INT AUTO_INCREMENT PRIMARY KEY,
			customer_name VARCHAR(100),
			total_price DECIMAL(10, 2),
			status VARCHAR(50) DEFAULT 'Pending',
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`
		_, errOrder := db.Exec(queryOrder)

		// D. Lapor ke Layar Browser
		fmt.Fprintf(w, "=== STATUS RESET & PERSIAPAN DATABASE ===\n")
		fmt.Fprintf(w, "1. Reset Tabel User (Ada Role): %v (Nil = Sukses)\n", errUser)
		fmt.Fprintf(w, "2. Siapkan Tabel Products: %v (Nil = Sukses)\n", errProd)
		fmt.Fprintf(w, "3. Siapkan Tabel Orders: %v (Nil = Sukses)\n", errOrder)
		fmt.Fprintf(w, "\n✅ SEMUA TABEL SIAP! SILAKAN UPLOAD PRODUK SEPUASNYA!")
	})

	// =================================================================
	// 🕵️‍♂️ FITUR X-RAY CEK USER 🕵️‍♂️
	// Akses: [LinkKoyeb]/cek-user
	// =================================================================
	http.HandleFunc("/cek-user", func(w http.ResponseWriter, r *http.Request) {
		rows, err := db.Query("SELECT id, email, password, role FROM users")
		if err != nil {
			fmt.Fprintf(w, "Gagal ambil data: %v", err)
			return
		}
		defer rows.Close()

		w.Header().Set("Content-Type", "text/html")
		fmt.Fprintf(w, "<h1>🔍 HASIL X-RAY DATABASE:</h1>")
		fmt.Fprintf(w, "<table border='1' cellpadding='10'><tr><th>ID</th><th>Email</th><th>Role</th><th>Status Pw</th></tr>")
		
		found := false
		for rows.Next() {
			found = true
			var id int
			var email, password, role string
			rows.Scan(&id, &email, &password, &role)
			
			status := "✅ AMAN"
			if len(password) < 60 { status = "❌ RUSAK" }

			fmt.Fprintf(w, "<tr><td>%d</td><td>%s</td><td>%s</td><td>%s</td></tr>", id, email, role, status)
		}
		fmt.Fprintf(w, "</table>")
		if !found { fmt.Fprintf(w, "<h3>Database Kosong</h3>") }
	})

	// --- JALUR PUBLIK ---
	http.HandleFunc("/login", handlers.HandleLogin(db))
	http.HandleFunc("/register", handlers.HandleRegister(db))
	http.HandleFunc("/products", handlers.HandleProducts(db)) 
	http.HandleFunc("/checkout", handlers.HandleCheckout(db))

	// --- JALUR FILE GAMBAR ---
	http.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir("./uploads"))))

	// --- JALUR ADMIN (Middleware) ---
	http.HandleFunc("/orders", handlers.AuthMiddleware(handlers.HandleGetOrders(db)))
	http.HandleFunc("/orders/update", handlers.AuthMiddleware(handlers.HandleUpdateOrderStatus(db)))
	
	// INI DIA YANG PENTING BUAT UPLOAD PRODUK:
	http.HandleFunc("/products/create", handlers.AuthMiddleware(handlers.HandleCreateProduct(db)))
	http.HandleFunc("/products/update", handlers.AuthMiddleware(handlers.HandleUpdateProduct(db)))
	http.HandleFunc("/products/delete", handlers.AuthMiddleware(handlers.HandleDeleteProduct(db)))

	// --- SETUP PORT ---
	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	fmt.Println("Server ON di Port:", port)
	http.ListenAndServe(":"+port, nil)
}