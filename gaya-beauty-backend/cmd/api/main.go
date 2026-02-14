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
	// 🚑 PINTU DARURAT (RESET DATABASE VIA BROWSER) 🚑
	// =================================================================
	http.HandleFunc("/reset-db-now", func(w http.ResponseWriter, r *http.Request) {
		// A. Perlebar Password (Biar hash muat)
		_, err1 := db.Exec("ALTER TABLE users MODIFY password VARCHAR(255)")
		
		// B. Paksa Default Role jadi Admin
		_, err2 := db.Exec("ALTER TABLE users MODIFY role VARCHAR(50) DEFAULT 'admin'")
		
		// C. Hapus Semua User (Biar bersih dari data error)
		_, err3 := db.Exec("DELETE FROM users")

		// D. Lapor ke Layar Browser
		fmt.Fprintf(w, "Status Perbaikan:\n")
		fmt.Fprintf(w, "1. Perlebar Kolom Password: %v (Nil = Sukses)\n", err1)
		fmt.Fprintf(w, "2. Set Default Admin: %v (Nil = Sukses)\n", err2)
		fmt.Fprintf(w, "3. Hapus User Lama: %v (Nil = Sukses)\n", err3)
		fmt.Fprintf(w, "\n✅ SELESAI! SEKARANG BUKA /signup DAN DAFTAR ULANG!")
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