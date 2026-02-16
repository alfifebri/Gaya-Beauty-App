package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"golang.org/x/crypto/bcrypt"
)

// Struktur Data buat Register
type CustomerRegisterRequest struct {
	FullName string `json:"full_name"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Phone    string `json:"phone"`
	Address  string `json:"address"`
}

// Struktur Data buat Login
type CustomerLoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// === 1. REGISTER CUSTOMER ===
func HandleCustomerRegister(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// A. Setup CORS (Wajib biar Frontend bisa akses)
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

		// B. Baca Data dari Frontend
		var req CustomerRegisterRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Format data salah", http.StatusBadRequest)
			return
		}

		// C. Hash Password (Biar aman, jangan simpan password asli!)
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			http.Error(w, "Gagal enkripsi password", http.StatusInternalServerError)
			return
		}

		// D. Masukin ke Database Aiven
		query := "INSERT INTO customers (full_name, email, password, phone, address) VALUES (?, ?, ?, ?, ?)"
		_, err = db.Exec(query, req.FullName, req.Email, string(hashedPassword), req.Phone, req.Address)

		if err != nil {
			// Cek kalau email udah ada
			http.Error(w, "Email sudah terdaftar atau error database", http.StatusConflict)
			return
		}

		json.NewEncoder(w).Encode(map[string]string{"message": "Register Berhasil! Silakan Login."})
	}
}

// === 2. LOGIN CUSTOMER ===
func HandleCustomerLogin(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// A. Setup CORS
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

		// B. Baca Data Login
		var req CustomerLoginRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Format data salah", http.StatusBadRequest)
			return
		}

		// C. Cari User di Database
		var id int
		var fullName, hashedPassword string
		query := "SELECT id, full_name, password FROM customers WHERE email = ?"
		err := db.QueryRow(query, req.Email).Scan(&id, &fullName, &hashedPassword)

		if err != nil {
			http.Error(w, "Email atau Password Salah", http.StatusUnauthorized)
			return
		}

		// D. Cek Password (Cocokin Hash)
		err = bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(req.Password))
		if err != nil {
			http.Error(w, "Email atau Password Salah", http.StatusUnauthorized)
			return
		}

		// E. Login Sukses! Kirim Data Customer Balik ke Frontend
		// Kita kirim ID dan Nama biar bisa disimpen di localStorage Frontend
		response := map[string]interface{}{
			"message": "Login Berhasil",
			"user": map[string]interface{}{
				"id":        id,
				"full_name": fullName,
				"email":     req.Email,
				"role":      "customer", // Penanda kalau ini customer
			},
		}
		json.NewEncoder(w).Encode(response)
	}
}