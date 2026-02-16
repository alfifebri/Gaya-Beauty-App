package handlers

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

// --- KONFIGURASI CLOUDINARY (GANTI INI!) ---
const (
	CloudName = "dyeme4myg" // Contoh: dyeme4myg
	ApiKey    = "644544511683593"    // Contoh: 1234567890
	ApiSecret = "rR2OlZ0VLwsCYcHqi5jQrCu85yU" // Contoh: abcde_12345
)

// --- FUNGSI HELPER UPLOAD KE CLOUDINARY ---
func uploadToCloudinary(file io.Reader, filename string) (string, error) {
	ctx := context.Background()

	// 1. Buat Koneksi ke Cloudinary
	cld, err := cloudinary.NewFromParams(CloudName, ApiKey, ApiSecret)
	if err != nil {
		return "", fmt.Errorf("gagal konek cloudinary: %v", err)
	}

	// 2. Upload File
	// Kita pake nama file unik biar gak ketimpa
	uniqueFilename := fmt.Sprintf("gaya-beauty/%d-%s", time.Now().Unix(), filename)

	resp, err := cld.Upload.Upload(ctx, file, uploader.UploadParams{
		PublicID: uniqueFilename,
		Folder:   "gaya_beauty_products", // Nama folder di Cloudinary
	})

	if err != nil {
		return "", fmt.Errorf("gagal upload ke cloudinary: %v", err)
	}

	// 3. Balikin URL HTTPS yang aman
	return resp.SecureURL, nil
}

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

		// Proses Upload Gambar ke Cloudinary
		file, handler, err := r.FormFile("image")
		var imagePath string

		if err == nil {
			defer file.Close()
			
			// 🔥 UPLOAD KE CLOUDINARY 🔥
			fmt.Println("Mengupload ke Cloudinary...", handler.Filename)
			uploadedURL, err := uploadToCloudinary(file, handler.Filename)
			
			if err != nil {
				fmt.Println("❌ Gagal Upload Cloudinary:", err)
				http.Error(w, "Gagal upload gambar ke cloud", http.StatusInternalServerError)
				return
			}
			
			imagePath = uploadedURL
			fmt.Println("✅ Sukses Upload:", imagePath)
		} else {
			// Gambar default kalau user gak upload
			imagePath = "https://placehold.co/400?text=No+Image"
		}

		// Masukkan ke Database (Simpan Link Cloudinary)
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
			
			// 🔥 UPLOAD KE CLOUDINARY (Lagi) 🔥
			fmt.Println("Mengupload Update ke Cloudinary...", handler.Filename)
			uploadedURL, err := uploadToCloudinary(file, handler.Filename)

			if err != nil {
				fmt.Println("❌ Gagal Upload Update:", err)
				http.Error(w, "Gagal upload gambar update", http.StatusInternalServerError)
				return
			}
			
			imagePath = uploadedURL
			
			// Update dengan gambar baru (Link Cloudinary)
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

		res, err := db.Exec("INSERT INTO orders (customer_name, total_price, payment_method, status) VALUES (?, ?, ?, 'Pending')", 
			req.CustomerName, req.TotalPrice, req.PaymentMethod)
		
		if err != nil {
			fmt.Println("❌ Gagal simpan order:", err)
			http.Error(w, "Gagal simpan order", http.StatusInternalServerError)
			return
		}

		orderID, _ := res.LastInsertId()

		for _, item := range req.CartItems {
			db.Exec("INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)", 
				orderID, item.ProductID, item.Quantity, item.Price)
			
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

// --- 8. HANDLER UPLOAD SIMPLE (Biar Gak Error di Main) ---
// Ini udah gak dipake sebenernya, tapi dibiarin biar main.go gak error
func HandleUpload(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	// Kosongin aja karena kita udah pake Cloudinary di handler produk
	w.Write([]byte(`{"message": "Upload via Handler Produk ya!"}`))
}