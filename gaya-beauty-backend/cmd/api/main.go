package main

import (
	"fmt"
	"gaya-beauty-backend/internal/database"
	"gaya-beauty-backend/internal/handlers"
	"net/http"
)

func main() {
	// 1. Konek Database
	db := database.ConnectDB()
	defer db.Close()

	// --- JALUR PUBLIK (Bisa Diakses Tanpa Login) ---
	http.HandleFunc("/login", handlers.HandleLogin(db))
	http.HandleFunc("/register", handlers.HandleRegister(db))
	http.HandleFunc("/products", handlers.HandleProducts(db)) // Buat user liat produk
	http.HandleFunc("/checkout", handlers.HandleCheckout(db)) // Buat user beli

	// --- JALUR FILE GAMBAR (Penting biar foto muncul) ---
	http.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir("./uploads"))))

	// --- JALUR ADMIN (Wajib Login / Pake Middleware) ---
	
	// Kelola Order
	http.HandleFunc("/orders", handlers.AuthMiddleware(handlers.HandleGetOrders(db)))
	http.HandleFunc("/orders/update", handlers.AuthMiddleware(handlers.HandleUpdateOrderStatus(db)))
	
	// Kelola Produk (CRUD) - Jalur ini SAMA PERSIS dengan di React
	http.HandleFunc("/products/create", handlers.AuthMiddleware(handlers.HandleCreateProduct(db)))
	http.HandleFunc("/products/update", handlers.AuthMiddleware(handlers.HandleUpdateProduct(db)))
	http.HandleFunc("/products/delete", handlers.AuthMiddleware(handlers.HandleDeleteProduct(db)))

	// Jalur Upload (Opsional, kalau butuh upload terpisah)
	http.HandleFunc("/upload", handlers.AuthMiddleware(handlers.HandleUpload))

	// --- JALANKAN SERVER ---
	fmt.Println("=====================================")
	fmt.Println(" Server Gaya Beauty ON: http://localhost:8081")
	fmt.Println("=====================================")
	
	err := http.ListenAndServe(":8081", nil)
	if err != nil {
		fmt.Printf(" Server Gagal Jalan: %v\n", err)
	}
}