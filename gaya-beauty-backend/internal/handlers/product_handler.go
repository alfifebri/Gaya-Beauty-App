package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

// --- STRUCT DATA ---

type Product struct {
	ID          int     `json:"id"`
	Name        string  `json:"name"`
	Price       float64 `json:"price"`
	Stock       int     `json:"stock"`
	Description string  `json:"description"`
	ImageURL    string  `json:"image_url"`
	Category    string  `json:"category"`
}

type CheckoutRequest struct {
	CustomerName  string `json:"customer_name"`
	PaymentMethod string `json:"payment_method"`
	CartItems     []struct {
		ProductID int     `json:"product_id"`
		Quantity  int     `json:"quantity"`
		Price     float64 `json:"price"`
	} `json:"cart_items"`
	TotalPrice float64 `json:"total_price"`
}

type OrderResponse struct {
	ID            int     `json:"id"`
	CustomerName  string  `json:"customer_name"`
	TotalPrice    float64 `json:"total_price"`
	Status        string  `json:"status"`
	PaymentMethod string  `json:"payment_method"`
	CreatedAt     string  `json:"created_at"`
}

// --- 1. HANDLER AMBIL SEMUA PRODUK (Public) ---
func HandleProducts(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		if r.Method != "GET" {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		rows, err := db.Query("SELECT id, name, price, stock, description, image_url, category FROM products ORDER BY id DESC")
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var products []Product
		for rows.Next() {
			var p Product
			if err := rows.Scan(&p.ID, &p.Name, &p.Price, &p.Stock, &p.Description, &p.ImageURL, &p.Category); err != nil {
				continue
			}
			products = append(products, p)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(products)
	}
}

// --- 2. HANDLER TAMBAH PRODUK (Admin) ---
func HandleCreateProduct(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		// Parse Multipart Form (Max 10MB)
		err := r.ParseMultipartForm(10 << 20)
		if err != nil {
			http.Error(w, "File terlalu besar", http.StatusBadRequest)
			return
		}

		name := r.FormValue("name")
		price := r.FormValue("price")
		stock := r.FormValue("stock")
		category := r.FormValue("category")
		description := r.FormValue("description")

		// Proses Upload Gambar
		file, handler, err := r.FormFile("image")
		var imagePath string

		if err == nil {
			defer file.Close()
			// Bikin nama file unik
			filename := fmt.Sprintf("%d-%s", time.Now().Unix(), handler.Filename)
			
			// Pastikan folder uploads ada
			os.MkdirAll("./uploads", os.ModePerm)

			dst, err := os.Create("./uploads/" + filename)
			if err != nil {
				fmt.Println("❌ Gagal buat file:", err)
				http.Error(w, "Gagal simpan file", http.StatusInternalServerError)
				return
			}
			defer dst.Close()

			io.Copy(dst, file)
			imagePath = "http://localhost:8081/uploads/" + filename
		} else {
			// Gambar default kalau user gak upload
			imagePath = "https://via.placeholder.com/400?text=No+Image"
		}

		// Masukkan ke Database
		query := "INSERT INTO products (name, price, stock, category, description, image_url) VALUES (?, ?, ?, ?, ?, ?)"
		_, err = db.Exec(query, name, price, stock, category, description, imagePath)

		if err != nil {
			fmt.Println("❌ Gagal insert DB:", err)
			http.Error(w, "Gagal simpan ke database", http.StatusInternalServerError)
			return
		}

		fmt.Println("✅ Produk Baru:", name)
		w.Write([]byte(`{"message": "Produk berhasil ditambahkan!"}`))
	}
}

// --- 3. HANDLER UPDATE PRODUK (Admin - Edit) ---
func HandleUpdateProduct(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, PUT, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		r.ParseMultipartForm(10 << 20)

		id := r.FormValue("id")
		name := r.FormValue("name")
		price := r.FormValue("price")
		stock := r.FormValue("stock")
		category := r.FormValue("category")
		description := r.FormValue("description")

		// Cek Gambar Baru
		file, handler, err := r.FormFile("image")
		var imagePath string

		if err == nil {
			defer file.Close()
			filename := fmt.Sprintf("%d-%s", time.Now().Unix(), handler.Filename)
			dst, _ := os.Create("./uploads/" + filename)
			defer dst.Close()
			io.Copy(dst, file)
			imagePath = "http://localhost:8081/uploads/" + filename

			// Update dengan gambar baru
			_, err = db.Exec("UPDATE products SET name=?, price=?, stock=?, category=?, description=?, image_url=? WHERE id=?", 
				name, price, stock, category, description, imagePath, id)
		} else {
			// Update tanpa ganti gambar
			_, err = db.Exec("UPDATE products SET name=?, price=?, stock=?, category=?, description=? WHERE id=?", 
				name, price, stock, category, description, id)
		}

		if err != nil {
			fmt.Println("❌ Gagal Update:", err)
			http.Error(w, "Gagal update produk", http.StatusInternalServerError)
			return
		}

		fmt.Println("✅ Produk Updated ID:", id)
		w.Write([]byte(`{"message": "Produk berhasil diupdate!"}`))
	}
}

// --- 4. HANDLER HAPUS PRODUK (Admin) ---
func HandleDeleteProduct(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		id := r.URL.Query().Get("id")
		if id == "" {
			// Coba ambil dari form body kalau query params kosong
			id = r.FormValue("id")
		}

		if id == "" {
			http.Error(w, "ID produk wajib ada!", http.StatusBadRequest)
			return
		}

		_, err := db.Exec("DELETE FROM products WHERE id = ?", id)
		if err != nil {
			http.Error(w, "Gagal menghapus produk", http.StatusInternalServerError)
			return
		}

		fmt.Println("🗑️ Produk Dihapus ID:", id)
		w.Write([]byte(`{"message": "Produk berhasil dihapus!"}`))
	}
}

// --- 5. HANDLER CHECKOUT (User Beli) ---
func HandleCheckout(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		var req CheckoutRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Format data salah", http.StatusBadRequest)
			return
		}

		// Simpan Order Utama
		res, err := db.Exec("INSERT INTO orders (customer_name, total_price, payment_method, status) VALUES (?, ?, ?, 'Pending')", 
			req.CustomerName, req.TotalPrice, req.PaymentMethod)
		
		if err != nil {
			fmt.Println("❌ Gagal simpan order:", err)
			http.Error(w, "Gagal simpan order", http.StatusInternalServerError)
			return
		}

		orderID, _ := res.LastInsertId()

		// Simpan Detail Item & Kurangi Stok
		for _, item := range req.CartItems {
			db.Exec("INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)", 
				orderID, item.ProductID, item.Quantity, item.Price)
			
			// Kurangi stok
			db.Exec("UPDATE products SET stock = stock - ? WHERE id = ?", item.Quantity, item.ProductID)
		}

		fmt.Println("💰 Order Baru ID:", orderID, "dari", req.CustomerName)
		
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message": "Checkout Berhasil!",
			"order_id": orderID,
		})
	}
}

// --- 6. HANDLER LIHAT PESANAN (Admin) ---
func HandleGetOrders(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		rows, err := db.Query("SELECT id, customer_name, total_price, status, payment_method, created_at FROM orders ORDER BY id DESC")
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var orders []OrderResponse
		for rows.Next() {
			var o OrderResponse
			rows.Scan(&o.ID, &o.CustomerName, &o.TotalPrice, &o.Status, &o.PaymentMethod, &o.CreatedAt)
			orders = append(orders, o)
		}
		json.NewEncoder(w).Encode(orders)
	}
}

// --- 7. HANDLER UPDATE STATUS PESANAN (Admin) ---
func HandleUpdateOrderStatus(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "PUT, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		var req struct {
			OrderID int    `json:"order_id"`
			Status  string `json:"status"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Data tidak valid", http.StatusBadRequest)
			return
		}

		_, err := db.Exec("UPDATE orders SET status = ? WHERE id = ?", req.Status, req.OrderID)
		if err != nil {
			http.Error(w, "Gagal update database", http.StatusInternalServerError)
			return
		}

		fmt.Println("✅ Status Order #", req.OrderID, "->", req.Status)
		w.Write([]byte(`{"message": "Status berhasil diupdate!"}`))
	}
}

// --- 8. HANDLER UPLOAD SIMPLE (Opsional) ---
func HandleUpload(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	if r.Method != "POST" { return }

	file, header, _ := r.FormFile("image")
	defer file.Close()
	
	os.MkdirAll("./uploads", os.ModePerm)
	dst, _ := os.Create("./uploads/" + header.Filename)
	defer dst.Close()
	io.Copy(dst, file)

	url := "http://localhost:8081/uploads/" + header.Filename
	w.Write([]byte(`{"url": "` + url + `"}`))
}