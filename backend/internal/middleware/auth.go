package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const emailKey contextKey = "auth_email"

// EmailFromContext mengembalikan email user dari token yang sudah divalidasi.
func EmailFromContext(ctx context.Context) string {
	if v, _ := ctx.Value(emailKey).(string); v != "" {
		return v
	}
	return ""
}

// JWTAuth menolak request tanpa Bearer token yang valid.
// - Algoritma dikunci ke HS256 (menutup confusion/alg=none).
// - Klaim exp/nbf/iat divalidasi (default jwt/v5).
// - Email user disimpan di context agar handler tahu siapa yang login.
func JWTAuth(secret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			h := r.Header.Get("Authorization")
			tok := strings.TrimPrefix(h, "Bearer ")
			if tok == "" || tok == h {
				http.Error(w, "unauthorized", http.StatusUnauthorized)
				return
			}
			parsed, err := jwt.Parse(tok, func(t *jwt.Token) (any, error) {
				if t.Method != jwt.SigningMethodHS256 {
					return nil, jwt.ErrTokenSignatureInvalid
				}
				return []byte(secret), nil
			})
			if err != nil || !parsed.Valid {
				http.Error(w, "unauthorized", http.StatusUnauthorized)
				return
			}
			if claims, ok := parsed.Claims.(jwt.MapClaims); ok {
				if email, _ := claims["email"].(string); email != "" {
					r = r.WithContext(context.WithValue(r.Context(), emailKey, email))
				}
			}
			next.ServeHTTP(w, r)
		})
	}
}
