package config

import "os"

type Config struct {
	DatabaseURL       string
	JWTSecret         string
	Port              string
	FrontendURL       string
	AdminEmail        string
	AdminPasswordHash string
	UploadDir         string
}

func getenv(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

func Load() *Config {
	return &Config{
		DatabaseURL:       getenv("DATABASE_URL", "postgres://logopulse:changeme@localhost:5432/logopulse?sslmode=disable"),
		JWTSecret:         getenv("JWT_SECRET", "changeme"),
		Port:              getenv("PORT", "8080"),
		FrontendURL:       getenv("FRONTEND_URL", "http://localhost:3000"),
		AdminEmail:          getenv("ADMIN_EMAIL", "admin@logopulse.co"),
		AdminPasswordHash:   getenv("ADMIN_PASSWORD_HASH", ""),
		UploadDir:           getenv("UPLOAD_DIR", "uploads"),
	}
}
