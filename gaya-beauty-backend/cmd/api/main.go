package main

import (
	"fmt"
	"gaya-beauty-backend/internal/database"
	"gaya-beauty-backend/internal/handlers"
	"net/http"
	"os"
)

func main() {
	// 1. KONEK DATABASE
	db := database.ConnectDB()
	defer db.Close()

	// =================================================================
	// ☢️ PINTU DARURAT: RESET DB (UPDATED SCHEMA) ☢️
	// Akses: [LinkKoyeb]/reset-db-now
	// =================================================================
	http.HandleFunc("/reset-db-now", func(w http.ResponseWriter, r *http.Request) {
		// A. Hapus Tabel Lama (Urutan Penting karena Foreign Key)
		db.Exec("DROP TABLE IF EXISTS order_items")
		db.Exec("DROP TABLE IF EXISTS orders")
		db.Exec("DROP TABLE IF EXISTS products")
		db.Exec("DROP TABLE IF EXISTS users")

		// B. Tabel USERS
		queryUser := `
		CREATE TABLE users (
			id INT AUTO_INCREMENT PRIMARY KEY,
			full_name VARCHAR(100),
			email VARCHAR(100) UNIQUE NOT NULL,
			password VARCHAR(255) NOT NULL,
			role VARCHAR(50) DEFAULT 'admin',
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`
		if _, err := db.Exec(queryUser); err != nil { fmt.Fprintf(w, "Gagal User: %v\n", err) }

		// C. Tabel PRODUCTS
		queryProduct := `
		CREATE TABLE products (
			id INT AUTO_INCREMENT PRIMARY KEY,
			name VARCHAR(255),
			price DECIMAL(10, 2),
			stock INT,
			category VARCHAR(100),
			description TEXT,
			image_url VARCHAR(255),
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`
		if _, err := db.Exec(queryProduct); err != nil { fmt.Fprintf(w, "Gagal Product: %v\n", err) }

		// D. Tabel ORDERS (Struktur Baru)
		queryOrder := `
		CREATE TABLE orders (
			id INT AUTO_INCREMENT PRIMARY KEY,
			customer_id INT NOT NULL,
			customer_name VARCHAR(255),
			total_price DECIMAL(10, 2) NOT NULL,
			status VARCHAR(50) DEFAULT 'Pending',
			payment_method VARCHAR(50),
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`
		if _, err := db.Exec(queryOrder); err != nil { fmt.Fprintf(w, "Gagal Order: %v\n", err) }

		// E. Tabel ORDER_ITEMS (Struktur Baru)
		queryOrderItems := `
		CREATE TABLE order_items (
			id INT AUTO_INCREMENT PRIMARY KEY,
			order_id INT NOT NULL,
			product_id INT NOT NULL,
			quantity INT NOT NULL,
			price DECIMAL(10, 2) NOT NULL,
			FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
			FOREIGN KEY (product_id) REFERENCES products(id)
		)`
		if _, err := db.Exec(queryOrderItems); err != nil { fmt.Fprintf(w, "Gagal Order Items: %v\n", err) }

		fmt.Fprintf(w, "\n DATABASE BERHASIL DI-RESET DENGAN STRUKTUR BARU!")
	})

	// =================================================================
	// DAFTAR RUTE (ROUTING)
	// =================================================================

	// 1. PUBLIC ROUTES
	http.HandleFunc("/login", handlers.HandleLogin(db))
	http.HandleFunc("/register", handlers.HandleRegister(db))
	http.HandleFunc("/products", handlers.HandleProducts(db))
	http.HandleFunc("/checkout", handlers.HandleCheckout(db))
	
	// 2. CUSTOMER ROUTES
	http.HandleFunc("/customer/register", handlers.HandleCustomerRegister(db))
	http.HandleFunc("/customer/login", handlers.HandleCustomerLogin(db))
	http.HandleFunc("/my-orders", handlers.HandleGetMyOrders(db))
	http.HandleFunc("/complete-order", handlers.HandleCompleteOrder(db))

	// 3. ADMIN ROUTES (Protected)
	// Order Management
	http.HandleFunc("/orders", handlers.AuthMiddleware(handlers.HandleGetOrders(db)))
	http.HandleFunc("/orders/update", handlers.AuthMiddleware(handlers.HandleUpdateOrderStatus(db))) // Jalur Update Status

	// Product Management
	http.HandleFunc("/products/create", handlers.AuthMiddleware(handlers.HandleCreateProduct(db)))
	http.HandleFunc("/products/update", handlers.AuthMiddleware(handlers.HandleUpdateProduct(db)))
	http.HandleFunc("/products/delete", handlers.AuthMiddleware(handlers.HandleDeleteProduct(db)))

	// 4. STATIC FILES (Images)
	http.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir("./uploads"))))

	// =================================================================
	// START SERVER
	// =================================================================
	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}
	fmt.Println(" Server GAYA BEAUTY jalan di Port:", port)
	http.ListenAndServe(":"+port, nil)
}