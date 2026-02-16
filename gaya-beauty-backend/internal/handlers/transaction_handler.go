package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
)

// Struktur Data yang dikirim dari Frontend (Home.jsx)
type CheckoutRequest struct {
	CustomerID    int            `json:"customer_id"`
	CustomerName  string         `json:"customer_name"`
	PaymentMethod string         `json:"payment_method"`
	TotalPrice    float64        `json:"total_price"`
	CartItems     []CartItemData `json:"cart_items"`
}

// struktur data untuk setiap item di keranjang belanjaan
type CartItemData struct {
	ProductID int     `json:"product_id"`
	Quantity  int     `json:"quantity"`
	Price     float64 `json:"price"`
}

// === 1. HANDLE CHECKOUT (PROSES BELI) ===
func HandleCheckout(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// 1. SETUP CORS
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		if r.Method != "POST" {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// 2. BACA DATA
		var req CheckoutRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Data belanjaan error/tidak lengkap", http.StatusBadRequest)
			return
		}

		// 3. MULAI TRANSAKSI
		tx, err := db.Begin()
		if err != nil {
			http.Error(w, "Gagal memulai transaksi", http.StatusInternalServerError)
			return
		}

		// 4. SIMPAN ORDER HEADER
		res, err := tx.Exec("INSERT INTO orders (customer_id, total_price, status, created_at) VALUES (?, ?, 'Pending', NOW())",
			req.CustomerID, req.TotalPrice)

		if err != nil {
			tx.Rollback()
			log.Println("Error Insert Order:", err)
			http.Error(w, "Gagal membuat pesanan", http.StatusInternalServerError)
			return
		}

		orderID, _ := res.LastInsertId()

		// 5. LOOPING BARANG & POTONG STOK
		for _, item := range req.CartItems {
			// Masukin ke order_items
			_, err := tx.Exec("INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
				orderID, item.ProductID, item.Quantity, item.Price)

			if err != nil {
				tx.Rollback()
				log.Println("Error Insert Item:", err)
				http.Error(w, "Gagal menyimpan rincian barang", http.StatusInternalServerError)
				return
			}

			// Potong Stok
			_, err = tx.Exec("UPDATE products SET stock = stock - ? WHERE id = ?", item.Quantity, item.ProductID)
			if err != nil {
				tx.Rollback()
				log.Println("Error Update Stok:", err)
				http.Error(w, "Gagal update stok (Mungkin barang habis)", http.StatusInternalServerError)
				return
			}
		}

		// 6. COMMIT TRANSAKSI
		if err := tx.Commit(); err != nil {
			http.Error(w, "Gagal finalisasi transaksi", http.StatusInternalServerError)
			return
		}

		json.NewEncoder(w).Encode(map[string]interface{}{
			"message":  "Checkout Berhasil!",
			"order_id": orderID,
			"status":   "Pending",
		})
	}
} // <--- INI DIA YANG TADI HILANG! (Penutup HandleCheckout)

// === 2. AMBIL PESANAN SAYA (KHUSUS CUSTOMER) ===
func HandleGetMyOrders(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")

		customerID := r.URL.Query().Get("user_id")

		rows, err := db.Query("SELECT id, total_price, status, created_at FROM orders WHERE customer_id = ? ORDER BY created_at DESC", customerID)
		if err != nil {
			http.Error(w, "Gagal ambil data", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var orders []map[string]interface{}
		for rows.Next() {
			var id int
			var totalPrice float64
			var status, createdAt string
			rows.Scan(&id, &totalPrice, &status, &createdAt)

			orders = append(orders, map[string]interface{}{
				"id":          id,
				"total_price": totalPrice,
				"status":      status,
				"created_at":  createdAt,
			})
		}

		// PENTING: Kalau kosong, inisialisasi biar jadi [] bukan null
		if orders == nil {
			orders = []map[string]interface{}{}
		}

		json.NewEncoder(w).Encode(orders)
	}
}

// === 3. CUSTOMER KONFIRMASI TERIMA BARANG ===
func HandleCompleteOrder(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		var req struct {
			OrderID int `json:"order_id"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Data salah", http.StatusBadRequest)
			return
		}

		_, err := db.Exec("UPDATE orders SET status = 'Selesai' WHERE id = ?", req.OrderID)
		if err != nil {
			http.Error(w, "Gagal update status", http.StatusInternalServerError)
			return
		}

		json.NewEncoder(w).Encode(map[string]string{"message": "Terima kasih! Pesanan selesai."})
	}
}