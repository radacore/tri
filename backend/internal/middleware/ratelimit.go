package middleware

import (
	"net"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

type visitor struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

var (
	visitors = make(map[string]*visitor)
	mu       sync.Mutex
)

// getLimiter returns a per-IP limiter (5 events/min burst 5).
func getLimiter(ip string) *rate.Limiter {
	mu.Lock()
	defer mu.Unlock()
	v, ok := visitors[ip]
	if !ok {
		lim := rate.NewLimiter(rate.Every(time.Minute/5), 5)
		visitors[ip] = &visitor{limiter: lim, lastSeen: time.Now()}
		return lim
	}
	v.lastSeen = time.Now()
	return v.limiter
}

func init() {
	go func() {
		for {
			time.Sleep(time.Minute)
			mu.Lock()
			for ip, v := range visitors {
				if time.Since(v.lastSeen) > 5*time.Minute {
					delete(visitors, ip)
				}
			}
			mu.Unlock()
		}
	}()
}

func clientIP(r *http.Request) string {
	// X-Forwarded-For hanya dipercaya di belakang proxy tepercaya
	// (compose menyetel TRUST_PROXY_HEADERS=1; nginx menimpa header).
	// Kalau langsung terekspos, tanpa ini siapa pun bisa memalsukan IP
	// dan melewati rate limit login.
	if os.Getenv("TRUST_PROXY_HEADERS") == "1" {
		if fwd := r.Header.Get("X-Forwarded-For"); fwd != "" {
			first := strings.TrimSpace(strings.Split(fwd, ",")[0])
			if ip := net.ParseIP(first); ip != nil {
				return ip.String()
			}
		}
	}
	ip, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return ip
}

// RateLimitLogin limits login attempts to 5/minute per IP.
func RateLimitLogin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !getLimiter(clientIP(r)).Allow() {
			http.Error(w, `{"error":"too many requests"}`, http.StatusTooManyRequests)
			return
		}
		next.ServeHTTP(w, r)
	})
}
