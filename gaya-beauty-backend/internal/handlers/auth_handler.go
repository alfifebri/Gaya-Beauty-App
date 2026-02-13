package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var jwtKey = []byte("rahasia_gaya_beauty_2026")

type AuthRequest struct {
	FullName string `json:"full_name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

// 1. HANDLER REGISTER
func HandleRegister(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// --- IZIN CORS ---
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == "OPTIONS" { return }

		var req AuthRequest
		json.NewDecoder(r.Body).Decode(&req)

		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			http.Error(w, "Gagal proses password", http.StatusInternalServerError)
			return
		}

		query := "INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, 'customer')"
		_, err = db.Exec(query, req.FullName, req.Email, string(hashedPassword))
		
		if err != nil {
			fmt.Println(" Gagal daftar:", err)
			http.Error(w, "Email sudah terdaftar!", http.StatusBadRequest)
			return
		}

		w.Write([]byte(`{"message": "Daftar berhasil, silakan login!"}`))
	}
}

// 2. HANDLER LOGIN
func HandleLogin(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// --- IZIN CORS (DIPERKUAT) ---
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		// Handle Preflight Request dari Browser
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		fmt.Println(" Ada request login masuk...")

		var req AuthRequest
		err := json.NewDecoder(r.Body).Decode(&req)
		if err != nil {
			fmt.Println(" Error Decode JSON:", err)
			http.Error(w, "Data tidak valid", http.StatusBadRequest)
			return
		}

		fmt.Println(" Email dicari:", req.Email)

		var dbPassword, role string
		// Ambil data dari DB
		err = db.QueryRow("SELECT password, role FROM users WHERE email = ?", req.Email).Scan(&dbPassword, &role)
		
		if err != nil {
			if err == sql.ErrNoRows {
				fmt.Println(" Email TIDAK ADA di database!")
			} else {
				fmt.Println(" Error Database:", err)
			}
			http.Error(w, "Email atau Password salah!", http.StatusUnauthorized)
			return
		}

		// Cek Password
		err = bcrypt.CompareHashAndPassword([]byte(dbPassword), []byte(req.Password))
		if err != nil {
			fmt.Println(" Password SALAH Bos!")
			http.Error(w, "Email atau Password salah!", http.StatusUnauthorized)
			return
		}

		// Bikin Token JWT
		expirationTime := time.Now().Add(24 * time.Hour)
		claims := &jwt.RegisteredClaims{
			Subject:   req.Email,
			ExpiresAt: jwt.NewNumericDate(expirationTime),
		}
		token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
		tokenString, _ := token.SignedString(jwtKey)

		fmt.Println(" Login Berhasil buat:", req.Email)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"token": tokenString,
			"role":  role,
		})
	}
}

// 3. MIDDLEWARE
func AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Token tidak ditemukan!", http.StatusUnauthorized)
			return
		}

		tokenString := strings.Replace(authHeader, "Bearer ", "", 1)
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return jwtKey, nil
		})

		if err != nil || !token.Valid {
			http.Error(w, "Token tidak valid!", http.StatusUnauthorized)
			return
		}

		next.ServeHTTP(w, r)
	}
}

