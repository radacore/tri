package handlers

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
	"brandingpulse/backend/internal/config"
)

func findUser(ctx context.Context, pool *pgxpool.Pool, email string) (id, hash, name, role string, found bool) {
	err := pool.QueryRow(ctx, `SELECT id, password, COALESCE(name,''), COALESCE(role,'admin') FROM users WHERE email=$1`, email).Scan(&id, &hash, &name, &role)
	if err != nil {
		return "", "", "", "", false
	}
	return id, hash, name, role, true
}

// Login validates email+password with bcrypt and returns a JWT HS256 valid 24h.
func Login(pool *pgxpool.Pool, cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			Email    string `json:"email"`
			Password string `json:"password"`
		}
		if !decodeJSON(w, r, &body) {
			return
		}
		if body.Email == "" || body.Password == "" {
			fail(w, http.StatusBadRequest, "email and password are required")
			return
		}
		ctx := r.Context()
		id, hash, name, role, found := findUser(ctx, pool, body.Email)
		if !found && body.Email == cfg.AdminEmail {
			envHash := os.Getenv("ADMIN_PASSWORD_HASH")
			if envHash == "" {
				envHash = cfg.AdminPasswordHash
			}
			if envHash == "" {
				fail(w, http.StatusUnauthorized, "invalid credentials")
				return
			}
			hash = envHash
			id, name, role, found = "seed-admin", "Admin", "admin", true
		}
		if !found {
			fail(w, http.StatusUnauthorized, "invalid credentials")
			return
		}
		if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(body.Password)); err != nil {
			fail(w, http.StatusUnauthorized, "invalid credentials")
			return
		}
		now := time.Now()
		tok := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
			"sub":   id,
			"email": body.Email,
			"role":  role,
			"iat":   now.Unix(),
			"exp":   now.Add(24 * time.Hour).Unix(),
		})
		signed, err := tok.SignedString([]byte(cfg.JWTSecret))
		if err != nil {
			fail(w, http.StatusInternalServerError, "failed to sign token")
			return
		}
		_ = pool
		ok(w, map[string]any{
			"token":      signed,
			"expires_in": 86400,
			"user": map[string]any{
				"id": id, "email": body.Email, "name": name, "role": role,
			},
		})
	}
}

// EnsureSeedAdmin inserts the admin user when missing and ADMIN_PASSWORD_HASH is set.
func EnsureSeedAdmin(pool *pgxpool.Pool, cfg *config.Config) {
	hash := cfg.AdminPasswordHash
	if hash == "" {
		hash = os.Getenv("ADMIN_PASSWORD_HASH")
	}
	if hash == "" {
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var exists bool
	if err := pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM users WHERE email=$1)`, cfg.AdminEmail).Scan(&exists); err != nil || exists {
		return
	}
	if _, err := pool.Exec(ctx, `INSERT INTO users (email, password, name, role) VALUES ($1,$2,'Admin','admin')`, cfg.AdminEmail, hash); err != nil {
		log.Printf("WARN: seed admin failed: %v", err)
	}
}

var _ = pgxpool.Pool{}
