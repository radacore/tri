package middleware

import (
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

func JWTAuth(secret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			h := r.Header.Get("Authorization")
			tok := strings.TrimPrefix(h, "Bearer ")
			if tok == "" || tok == h {
				http.Error(w, "unauthorized", http.StatusUnauthorized)
				return
			}
			_, err := jwt.Parse(tok, func(t *jwt.Token) (any, error) { return []byte(secret), nil })
			if err != nil {
				http.Error(w, "unauthorized", http.StatusUnauthorized)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
