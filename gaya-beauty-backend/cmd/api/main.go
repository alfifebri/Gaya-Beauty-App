package main

import (
	"fmt"
	"gaya-beauty-backend/internal/database"
	"gaya-beauty-backend/internal/handlers"
	"net/http"
	"os" 
)

func main() {
	// 1. Konek Database (Akan otomatis pilih Local atau Cloud)
	db := database.ConnectDB()
	defer db.Close()

	// =================================================================
	// 🛠️ MANTRA PERBAIKAN DATABASE (AUTO FIX) 🛠️
	// Bagian ini akan otomatis memperbaiki tabel users lo di Aiven
	// =================================================================
	fmt.Println("🚀 SEDANG MEMPERBAIKI STRUKTUR DATABASE...")

	// 1. Perlebar wadah password jadi 255 karakter (PENTING: Biar hash gak kepotong!)
	_, errFix := db.Exec("ALTER TABLE users MODIFY password VARCHAR(255)")
	if errFix != nil {
		fmt.Println("⚠️ Info Alter Password:", errFix) 
	} else {
		fmt.Println("✅ Sukses: Kolom Password diperlebar jadi 255!")
	}

	// 2. Ubah default role jadi admin (Biar daftar langsung jadi bos)
	_, errFix = db.Exec("ALTER TABLE users MODIFY role VARCHAR(50) DEFAULT 'admin'")
	if errFix != nil {
		fmt.Println("⚠️ Info Alter Role:", errFix)
	} else {
		fmt.Println("✅ Sukses: Default Role sekarang Admin!")
	}

	// 3. Hapus user lama yang "cacat" (Opsional, biar bersih)
	_, errFix = db.Exec("DELETE FROM users")
	if errFix != nil {
		fmt.Println("⚠️ Info Delete Users:", errFix)
	} else {
		fmt.Println("✅ Sukses: User lama (yang error) sudah dihapus bersih!")
	}
	fmt.Println("=================================================================")

	// --- JALUR PUBLIK ---
	http.HandleFunc("/login", handlers.HandleLogin(db))
	http.HandleFunc("/register", handlers.HandleRegister(db))
	http.HandleFunc("/products", handlers.HandleProducts(db))
	http.HandleFunc("/checkout", handlers.HandleCheckout(db)) // <-- Pastikan handler ini ada

	// --- JALUR FILE GAMBAR ---
	http.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir("./uploads"))))

	// --- JALUR ADMIN ---
	// Pastikan middleware & handler ini sudah dibuat di folder handlers
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