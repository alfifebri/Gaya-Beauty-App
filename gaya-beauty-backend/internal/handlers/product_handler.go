package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
)

// --- STRUKTUR DATA PRODUK ---
type Product struct {
	ID          int     `json:"id"`
	Name        string  `json:"name"`
	Price       float64 `json:"price"`
	Stock       int     `json:"stock"`
	Category    string  `json:"category"`
	Description string  `json:"description"`
	ImageURL    string  `json:"image_url"`
}

// =========================================================
// 1. AMBIL SEMUA PRODUK (PUBLIC)
// =========================================================
func HandleProducts(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Setup CORS
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Content-Type", "application/json")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		// Query ke Database
		rows, err := db.Query("SELECT id, name, price, stock, category, description, image_url FROM products ORDER BY id DESC")
		if err != nil {
			http.Error(w, "Gagal ambil data produk", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var products []Product
		for rows.Next() {
			var p Product
			// Pakai sql.NullString biar aman kalau ada data kosong
			var desc, img sql.NullString
			
			// Scan data dari database ke variabel
			if err := rows.Scan(&p.ID, &p.Name, &p.Price, &p.Stock, &p.Category, &desc, &img); err != nil {
				continue
			}

			if desc.Valid { p.Description = desc.String }
			if img.Valid { p.ImageURL = img.String } else { p.ImageURL = "https://placehold.co/400?text=No+Image" }
			
			products = append(products, p)
		}

		// Kalau kosong, balikin array kosong [] biar frontend gak error
		if products == nil { products = []Product{} }
		json.NewEncoder(w).Encode(products)
	}
}

// =========================================================
// 2. TAMBAH PRODUK BARU (ADMIN ONLY)
// =========================================================
func HandleCreateProduct(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Content-Type", "application/json")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		// Baca JSON dari Body (Simple & Clean)
		var p Product
		if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
			http.Error(w, "Data JSON tidak valid", http.StatusBadRequest)
			return
		}

		// Validasi Sederhana
		if p.Name == "" || p.Price <= 0 {
			http.Error(w, "Nama dan Harga wajib diisi!", http.StatusBadRequest)
			return
		}

		// Simpan ke Database
		query := `INSERT INTO products (name, price, stock, category, description, image_url, created_at) 
				  VALUES (?, ?, ?, ?, ?, ?, NOW())`
		
		_, err := db.Exec(query, p.Name, p.Price, p.Stock, p.Category, p.Description, p.ImageURL)
		
		if err != nil {
			http.Error(w, fmt.Sprintf("Gagal simpan ke database: %v", err), http.StatusInternalServerError)
			return
		}

		json.NewEncoder(w).Encode(map[string]string{"message": "Produk berhasil ditambahkan!"})
	}
}

// =========================================================
// 3. UPDATE PRODUK (ADMIN ONLY)
// =========================================================
func HandleUpdateProduct(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, PUT, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Content-Type", "application/json")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		var p Product
		if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
			http.Error(w, "Data JSON error", http.StatusBadRequest)
			return
		}

		query := `UPDATE products SET name=?, price=?, stock=?, category=?, description=?, image_url=? WHERE id=?`
		_, err := db.Exec(query, p.Name, p.Price, p.Stock, p.Category, p.Description, p.ImageURL, p.ID)
		
		if err != nil {
			http.Error(w, "Gagal update produk", http.StatusInternalServerError)
			return
		}

		json.NewEncoder(w).Encode(map[string]string{"message": "Produk berhasil diupdate!"})
	}
}

// =========================================================
// 4. HAPUS PRODUK (ADMIN ONLY)
// =========================================================
func HandleDeleteProduct(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Content-Type", "application/json")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		// Ambil ID dari Query Param (?id=1) atau Body JSON
		idStr := r.URL.Query().Get("id")
		var id int
		var err error

		if idStr != "" {
			id, err = strconv.Atoi(idStr)
		} else {
			// Coba ambil dari body kalau query kosong
			var req struct { ID int `json:"id"` }
			json.NewDecoder(r.Body).Decode(&req)
			id = req.ID
		}

		if id == 0 || err != nil {
			http.Error(w, "ID Produk tidak valid", http.StatusBadRequest)
			return
		}

		_, err = db.Exec("DELETE FROM products WHERE id = ?", id)
		if err != nil {
			http.Error(w, "Gagal hapus produk", http.StatusInternalServerError)
			return
		}

		json.NewEncoder(w).Encode(map[string]string{"message": "Produk berhasil dihapus!"})
	}
}