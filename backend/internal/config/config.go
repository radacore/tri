package config

import (
	"log"
	"os"
	"strings"
)

type Config struct {
	DatabaseURL       string
	JWTSecret         string
	Port              string
	FrontendURL       string
	AllowedOrigins    []string
	AdminEmail        string
	AdminPasswordHash string
	UploadDir         string
}

func splitCSV(s string) []string {
	out := []string{}
	for _, p := range strings.Split(s, ",") {
		if v := strings.TrimSpace(p); v != "" {
			out = append(out, v)
		}
	}
	return out
}

func getenv(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

var weakSecrets = map[string]bool{
	"": true, "changeme": true, "dev-secret": true, "secret": true,
	"password": true, "test": true, "123456": true,
}

// requireStrongSecret menolak secret kosong, lemah, atau < 32 karakter.
// Tidak ada bypass: instance lokal pun wajib memakai secret kuat via JWT_SECRET.
func requireStrongSecret() string {
	s := os.Getenv("JWT_SECRET")
	if weakSecrets[strings.ToLower(strings.TrimSpace(s))] || len(s) < 32 {
		log.Fatal("FATAL: JWT_SECRET harus diisi string acak >= 32 karakter (lihat .env.example).")
	}
	return s
}

func Load() *Config {
	return &Config{
		DatabaseURL:       getenv("DATABASE_URL", "postgres://logopulse:changeme@localhost:5432/logopulse?sslmode=disable"),
		JWTSecret:         requireStrongSecret(),
		Port:              getenv("PORT", "8080"),
		FrontendURL:       getenv("FRONTEND_URL", "http://localhost:3000"),
		AllowedOrigins:    splitCSV(getenv("ALLOWED_ORIGINS", "http://localhost:4321,http://127.0.0.1:4321,http://localhost:5174,http://127.0.0.1:5174")),
		AdminEmail:        getenv("ADMIN_EMAIL", "admin@logopulse.co"),
		AdminPasswordHash: getenv("ADMIN_PASSWORD_HASH", ""),
		UploadDir:         getenv("UPLOAD_DIR", "uploads"),
	}
}
