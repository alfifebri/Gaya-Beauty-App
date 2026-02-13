package main

import (
	"fmt"
	"gaya-beauty-backend/internal/database"
	"gaya-beauty-backend/internal/handlers"
	"net/http"
	"os" // <--- Penting buat baca Port Render
)

func main() {
	// 1. Konek Database (Akan otomatis pilih Local atau Cloud)
	db := database.ConnectDB()
	defer db.Close()

	// --- JALUR PUBLIK ---
	http.HandleFunc("/login", handlers.HandleLogin(db))
	http.HandleFunc("/register", handlers.HandleRegister(db))
	http.HandleFunc("/products", handlers.HandleProducts(db))
	http.HandleFunc("/checkout", handlers.HandleCheckout(db))

	// --- JALUR FILE GAMBAR ---
	http.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir("./uploads"))))

	// --- JALUR ADMIN ---
	http.HandleFunc("/orders", handlers.AuthMiddleware(handlers.HandleGetOrders(db)))
	http.HandleFunc("/orders/update", handlers.AuthMiddleware(handlers.HandleUpdateOrderStatus(db)))
	
	http.HandleFunc("/products/create", handlers.AuthMiddleware(handlers.HandleCreateProduct(db)))
	http.HandleFunc("/products/update", handlers.AuthMiddleware(handlers.HandleUpdateProduct(db)))
	http.HandleFunc("/products/delete", handlers.AuthMiddleware(handlers.HandleDeleteProduct(db)))

	// --- SETUP PORT (UPDATE PENTING DISINI) ---
	port := os.Getenv("PORT")
	if port == "" {
		port = "8081" // Kalau di laptop, pake 8081
	}

	fmt.Println("=====================================")
	fmt.Printf(" Server Gaya Beauty ON di Port: %s\n", port)
	fmt.Println("=====================================")
	
	// Jalankan server di port yang ditentukan
	err := http.ListenAndServe(":"+port, nil)
	if err != nil {
		fmt.Printf(" Server Gagal Jalan: %v\n", err)
	}
}