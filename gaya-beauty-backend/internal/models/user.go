package models

import "time"

// User struct ini bakal jadi representasi tabel 'users' di database
type User struct {
	ID        uint      `json:"id"`
	FullName  string    `json:"full_name"`
	Email     string    `json:"email"`
	Password  string    `json:"-"` 
	CreatedAt time.Time `json:"created_at"`
}