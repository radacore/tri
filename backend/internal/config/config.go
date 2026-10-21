package config

import (
	"bufio"
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

// loadDotEnv membaca .env di working directory bila ada. Variabel yang sudah
// diset di environment tidak ditimpa (systemd EnvironmentFile tetap menang).
// Baris komentar, baris kosong, prefix "export ", dan kutip satu/ganda didukung.
func loadDotEnv(path string) {
	f, err := os.Open(path)
	if err != nil {
		return
	}
	defer f.Close()
	sc := bufio.NewScanner(f)
	for sc.Scan() {
		line := strings.TrimSpace(sc.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		line = strings.TrimPrefix(line, "export ")
		k, v, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		k = strings.TrimSpace(k)
		v = strings.TrimSpace(v)
		if len(v) >= 2 && (v[0] == '"' || v[0] == '\'') && v[len(v)-1] == v[0] {
			v = v[1 : len(v)-1]
		}
		if k == "" {
			continue
		}
		if _, exists := os.LookupEnv(k); !exists {
			_ = os.Setenv(k, v)
		}
	}
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
	loadDotEnv(".env")
	return &Config{
		DatabaseURL:       getenv("DATABASE_URL", "postgres://brandingpulse:changeme@localhost:5432/brandingpulse?sslmode=disable"),
		JWTSecret:         requireStrongSecret(),
		Port:              getenv("PORT", "8080"),
		FrontendURL:       getenv("FRONTEND_URL", "http://localhost:3000"),
		AllowedOrigins:    splitCSV(getenv("ALLOWED_ORIGINS", "http://localhost:4321,http://127.0.0.1:4321,http://localhost:5174,http://127.0.0.1:5174")),
		AdminEmail:        getenv("ADMIN_EMAIL", "admin@brandingpulse.co"),
		AdminPasswordHash: getenv("ADMIN_PASSWORD_HASH", ""),
		UploadDir:         getenv("UPLOAD_DIR", "uploads"),
	}
}
