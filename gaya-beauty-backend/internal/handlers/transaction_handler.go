package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
)

// === STRUKTUR DATA (Disesuaikan Frontend) ===
type CheckoutRequest struct {
	CustomerID    int            `json:"customer_id"`
	CustomerName  string         `json:"customer_name"` // BARU
	PaymentMethod string         `json:"payment_method"` // BARU
	TotalPrice    float64        `json:"total_price"`
	CartItems     []CartItemData `json:"cart_items"`
}

type CartItemData struct {
	ProductID int     `json:"product_id"`
	Quantity  int     `json:"quantity"`
	Price     float64 `json:"price"`
}

type OrderResponse struct {
	ID            int             `json:"id"`
	CustomerName  string          `json:"customer_name"`
	PaymentMethod string          `json:"payment_method"`
	TotalPrice    float64         `json:"total_price"`
	Status        string          `json:"status"`
	CreatedAt     string          `json:"created_at"`
	Items         []OrderItemResp `json:"items"` // BIAR ADMIN LIAT BARANGNYA
}

type OrderItemResp struct {
	ProductName string `json:"product_name"`
	Quantity    int    `json:"quantity"`
}

// =========================================================
// 1. HANDLE CHECKOUT (CUSTOMER BELI)
// =========================================================
func HandleCheckout(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		
		// Decode Data
		var req CheckoutRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Data tidak lengkap", http.StatusBadRequest)
			return
		}

		// Mulai Transaksi Database
		tx, err := db.Begin()
		if err != nil {
			http.Error(w, "Server Error", http.StatusInternalServerError)
			return
		}

		// INSERT KE ORDERS (LENGKAP)
		res, err := tx.Exec(`
			INSERT INTO orders (customer_id, customer_name, payment_method, total_price, status, created_at) 
			VALUES (?, ?, ?, ?, 'Pending', NOW())`,
			req.CustomerID, req.CustomerName, req.PaymentMethod, req.TotalPrice)
		
		if err != nil {
			tx.Rollback()
			log.Println("Gagal Insert Order:", err)
			http.Error(w, "Gagal membuat pesanan", http.StatusInternalServerError)
			return
		}

		orderID, _ := res.LastInsertId()

		// LOOPING ITEMS
		for _, item := range req.CartItems {
			// Insert Item
			_, err := tx.Exec(`INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)`,
				orderID, item.ProductID, item.Quantity, item.Price)
			
			if err != nil {
				tx.Rollback()
				http.Error(w, "Gagal insert item", http.StatusInternalServerError)
				return
			}

			// Potong Stok
			_, err = tx.Exec(`UPDATE products SET stock = stock - ? WHERE id = ?`, item.Quantity, item.ProductID)
			if err != nil {
				tx.Rollback()
				http.Error(w, "Stok habis", http.StatusInternalServerError)
				return
			}
		}

		tx.Commit()
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message": "Checkout Berhasil!", 
			"order_id": orderID,
		})
	}
}

// =========================================================
// 2. GET ALL ORDERS (KHUSUS ADMIN) - FITUR BARU
// =========================================================
func HandleGetOrders(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		// Ambil Semua Order
		rows, err := db.Query("SELECT id, customer_name, payment_method, total_price, status, created_at FROM orders ORDER BY created_at DESC")
		if err != nil {
			http.Error(w, "Gagal ambil order", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var orders []OrderResponse

		for rows.Next() {
			var o OrderResponse
			rows.Scan(&o.ID, &o.CustomerName, &o.PaymentMethod, &o.TotalPrice, &o.Status, &o.CreatedAt)

			// AMBIL DETAIL ITEM BUAT TIAP ORDER (JOIN KE PRODUCTS BIAR DAPET NAMA)
			itemRows, _ := db.Query(`
				SELECT p.name, oi.quantity 
				FROM order_items oi 
				JOIN products p ON oi.product_id = p.id 
				WHERE oi.order_id = ?`, o.ID)
			
			var items []OrderItemResp
			for itemRows.Next() {
				var i OrderItemResp
				itemRows.Scan(&i.ProductName, &i.Quantity)
				items = append(items, i)
			}
			itemRows.Close()

			o.Items = items
			orders = append(orders, o)
		}

		if orders == nil { orders = []OrderResponse{} }
		json.NewEncoder(w).Encode(orders)
	}
}

// =========================================================
// 3. UPDATE STATUS ORDER (ADMIN) - FITUR BARU
// =========================================================
func HandleUpdateOrderStatus(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		var req struct {
			OrderID int    `json:"order_id"`
			Status  string `json:"status"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Data json error", http.StatusBadRequest)
			return
		}

		_, err := db.Exec("UPDATE orders SET status = ? WHERE id = ?", req.Status, req.OrderID)
		if err != nil {
			http.Error(w, "Gagal update database", http.StatusInternalServerError)
			return
		}

		json.NewEncoder(w).Encode(map[string]string{"message": "Status berhasil diupdate!"})
	}
}

// =========================================================
// 4. GET MY ORDERS (CUSTOMER)
// =========================================================
func HandleGetMyOrders(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		customerID := r.URL.Query().Get("user_id")

		rows, err := db.Query("SELECT id, total_price, status, created_at FROM orders WHERE customer_id = ? ORDER BY created_at DESC", customerID)
		if err != nil {
			http.Error(w, "Error database", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var orders []map[string]interface{}
		for rows.Next() {
			var id int
			var total float64
			var status, created string
			rows.Scan(&id, &total, &status, &created)
			orders = append(orders, map[string]interface{}{
				"id": id, "total_price": total, "status": status, "created_at": created,
			})
		}

		if orders == nil { orders = []map[string]interface{}{} }
		json.NewEncoder(w).Encode(orders)
	}
}

// =========================================================
// 5. COMPLETE ORDER (CUSTOMER TERIMA BARANG)
// =========================================================
func HandleCompleteOrder(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		var req struct { OrderID int `json:"order_id"` }
		json.NewDecoder(r.Body).Decode(&req)
		db.Exec("UPDATE orders SET status = 'Selesai' WHERE id = ?", req.OrderID)
		json.NewEncoder(w).Encode(map[string]string{"message": "Pesanan Selesai"})
	}
}