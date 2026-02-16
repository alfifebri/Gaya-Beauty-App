package handlers

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

// --- KONFIGURASI CLOUDINARY ---
const (
	CloudName = "dyeme4myg"
	ApiKey    = "644544511683593"
	ApiSecret = "rR2OlZ0VLwsCYcHqi5jQrCu85yU"
)

// --- FUNGSI HELPER UPLOAD ---
func uploadToCloudinary(file io.Reader, filename string) (string, error) {
	ctx := context.Background()
	cld, err := cloudinary.NewFromParams(CloudName, ApiKey, ApiSecret)
	if err != nil {
		return "", fmt.Errorf("gagal konek cloudinary: %v", err)
	}

	uniqueFilename := fmt.Sprintf("gaya-beauty/%d-%s", time.Now().Unix(), filename)
	resp, err := cld.Upload.Upload(ctx, file, uploader.UploadParams{
		PublicID: uniqueFilename,
		Folder:   "gaya_beauty_products",
	})

	if err != nil {
		return "", fmt.Errorf("gagal upload ke cloudinary: %v", err)
	}
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

// Struct untuk Response Order di Admin (Biar main.go gak error)
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

		if products == nil {
			products = []Product{}
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

		r.ParseMultipartForm(10 << 20)

		name := r.FormValue("name")
		price := r.FormValue("price")
		stock := r.FormValue("stock")
		category := r.FormValue("category")
		description := r.FormValue("description")

		file, handler, err := r.FormFile("image")
		var imagePath string

		if err == nil {
			defer file.Close()
			uploadedURL, err := uploadToCloudinary(file, handler.Filename)
			if err != nil {
				http.Error(w, "Gagal upload gambar", http.StatusInternalServerError)
				return
			}
			imagePath = uploadedURL
		} else {
			imagePath = "https://placehold.co/400?text=No+Image"
		}

		query := "INSERT INTO products (name, price, stock, category, description, image_url) VALUES (?, ?, ?, ?, ?, ?)"
		_, err = db.Exec(query, name, price, stock, category, description, imagePath)

		if err != nil {
			http.Error(w, "Gagal insert DB", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"message": "Produk berhasil ditambahkan!"})
	}
}

// --- 3. HANDLER UPDATE PRODUK (Admin) ---
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
		
		file, handler, err := r.FormFile("image")
		var query string
		var args []interface{}

		if err == nil {
			defer file.Close()
			url, _ := uploadToCloudinary(file, handler.Filename)
			query = "UPDATE products SET name=?, price=?, stock=?, category=?, description=?, image_url=? WHERE id=?"
			args = []interface{}{r.FormValue("name"), r.FormValue("price"), r.FormValue("stock"), r.FormValue("category"), r.FormValue("description"), url, id}
		} else {
			query = "UPDATE products SET name=?, price=?, stock=?, category=?, description=? WHERE id=?"
			args = []interface{}{r.FormValue("name"), r.FormValue("price"), r.FormValue("stock"), r.FormValue("category"), r.FormValue("description"), id}
		}

		_, err = db.Exec(query, args...)
		if err != nil {
			http.Error(w, "Gagal update", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"message": "Produk berhasil diupdate!"})
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
		if id == "" { id = r.FormValue("id") }

		idInt, _ := strconv.Atoi(id)
		
		_, err := db.Exec("DELETE FROM products WHERE id = ?", idInt)
		if err != nil {
			http.Error(w, "Gagal hapus", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"message": "Produk berhasil dihapus!"})
	}
}

// --- 5. HANDLER LIHAT SEMUA PESANAN (Admin Dashboard) ---
// WAJIB ADA: Biar main.go gak error nyari HandleGetOrders
func HandleGetOrders(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" { w.WriteHeader(http.StatusOK); return }

		// Query join customers biar dapet nama pembeli asli
		query := `
			SELECT o.id, c.full_name, o.total_price, o.status, 'Manual/COD', o.created_at 
			FROM orders o
			LEFT JOIN customers c ON o.customer_id = c.id
			ORDER BY o.created_at DESC`

		rows, err := db.Query(query)
		if err != nil {
			// Fallback kalau tabel customers belum ada/error join
			rows, _ = db.Query("SELECT id, 'Guest', total_price, status, 'Manual/COD', created_at FROM orders ORDER BY id DESC")
		}
		defer rows.Close()

		var orders []OrderResponse
		for rows.Next() {
			var o OrderResponse
			var custName sql.NullString // Handle nama kosong/null
			rows.Scan(&o.ID, &custName, &o.TotalPrice, &o.Status, &o.PaymentMethod, &o.CreatedAt)
			
			if custName.Valid {
				o.CustomerName = custName.String
			} else {
				o.CustomerName = "Guest/Deleted"
			}
			orders = append(orders, o)
		}
		
		if orders == nil { orders = []OrderResponse{} }
		json.NewEncoder(w).Encode(orders)
	}
}

// --- 6. HANDLER UPDATE STATUS PESANAN (Admin) ---
// WAJIB ADA: Biar main.go gak error nyari HandleUpdateOrderStatus
func HandleUpdateOrderStatus(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "PUT, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		var req struct {
			OrderID int    `json:"order_id"`
			Status  string `json:"status"`
		}
		json.NewDecoder(r.Body).Decode(&req)

		_, err := db.Exec("UPDATE orders SET status = ? WHERE id = ?", req.Status, req.OrderID)
		if err != nil {
			http.Error(w, "Gagal update", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"message": "Status berhasil diupdate!"})
	}
}