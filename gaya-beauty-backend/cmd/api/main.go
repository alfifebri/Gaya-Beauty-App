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
	// ☢️ PINTU DARURAT 1: RESET TOTAL (DESTROY & REBUILD) ☢️
	// Akses: [LinkKoyeb]/reset-db-now
	// =================================================================
	http.HandleFunc("/reset-db-now", func(w http.ResponseWriter, r *http.Request) {
		// A. HANCURKAN TABEL LAMA (Karena strukturnya salah/kurang kolom)
		_, errDrop := db.Exec("DROP TABLE IF EXISTS users")

		// B. BANGUN TABEL BARU (Lengkap dengan Role & Password Panjang)
		queryCreate := `
		CREATE TABLE users (
			id INT AUTO_INCREMENT PRIMARY KEY,
			full_name VARCHAR(100),
			email VARCHAR(100) UNIQUE NOT NULL,
			password VARCHAR(255) NOT NULL,
			role VARCHAR(50) DEFAULT 'admin',
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`
		_, errCreate := db.Exec(queryCreate)

		// C. Lapor ke Layar Browser
		fmt.Fprintf(w, "=== STATUS RESET TOTAL (BANGUN ULANG) ===\n")
		fmt.Fprintf(w, "1. Hancurkan Tabel Lama: %v (Nil = Sukses)\n", errDrop)
		fmt.Fprintf(w, "2. Bangun Tabel Baru (Ada Role & Password 255): %v (Nil = Sukses)\n", errCreate)
		fmt.Fprintf(w, "\n✅ SELESAI! TABEL UDAH SEMPURNA. SEKARANG BUKA /signup DAN DAFTAR ULANG!")
	})

	// =================================================================
	// 🕵️‍♂️ PINTU DARURAT 2: X-RAY CEK USER (Intip Data) 🕵️‍♂️
	// Akses: [LinkKoyeb]/cek-user
	// =================================================================
	http.HandleFunc("/cek-user", func(w http.ResponseWriter, r *http.Request) {
		// Sekarang query ini pasti berhasil karena tabel baru udah punya 'role'
		rows, err := db.Query("SELECT id, email, password, role FROM users")
		if err != nil {
			fmt.Fprintf(w, "Gagal ambil data (Mungkin tabel belum di-reset?): %v", err)
			return
		}
		defer rows.Close()

		w.Header().Set("Content-Type", "text/html")
		fmt.Fprintf(w, "<h1>🔍 HASIL X-RAY DATABASE:</h1>")
		fmt.Fprintf(w, "<table border='1' cellpadding='10' style='border-collapse: collapse;'>")
		fmt.Fprintf(w, "<tr style='background-color: #f2f2f2;'><th>ID</th><th>Email</th><th>Role</th><th>Panjang Password (Hash)</th><th>Status</th></tr>")
		
		found := false
		for rows.Next() {
			found = true
			var id int
			var email, password, role string
			rows.Scan(&id, &email, &password, &role)
			
			// Cek Panjang Password
			panjang := len(password)
			status := "<b style='color:green'>✅ SEHAT (AMAN)</b>"
			if panjang < 60 {
				status = "<b style='color:red'>❌ RUSAK (KEPOTONG)</b>"
			}

			fmt.Fprintf(w, "<tr><td>%d</td><td>%s</td><td>%s</td><td>%d Karakter</td><td>%s</td></tr>", id, email, role, panjang, status)
		}
		fmt.Fprintf(w, "</table>")

		if !found {
			fmt.Fprintf(w, "<h3>⚠️ DATABASE KOSONG (Belum ada user, silakan daftar dulu!)</h3>")
		}
	})

	// =================================================================

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