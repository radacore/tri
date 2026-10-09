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

// limiterStore menyimpan bucket per-IP. Tiap middleware punya store sendiri
// supaya bucket login tidak habis terpakai oleh endpoint order (dan sebaliknya).
type limiterStore struct {
	mu       sync.Mutex
	visitors map[string]*visitor
}

func newLimiterStore() *limiterStore {
	s := &limiterStore{visitors: make(map[string]*visitor)}
	go func() {
		for {
			time.Sleep(time.Minute)
			s.mu.Lock()
			for ip, v := range s.visitors {
				if time.Since(v.lastSeen) > 5*time.Minute {
					delete(s.visitors, ip)
				}
			}
			s.mu.Unlock()
		}
	}()
	return s
}

func (s *limiterStore) get(ip string, perMin, burst int) *rate.Limiter {
	s.mu.Lock()
	defer s.mu.Unlock()
	v, ok := s.visitors[ip]
	if !ok {
		lim := rate.NewLimiter(rate.Every(time.Minute/time.Duration(perMin)), burst)
		v = &visitor{limiter: lim, lastSeen: time.Now()}
		s.visitors[ip] = v
		return lim
	}
	v.lastSeen = time.Now()
	return v.limiter
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

// rateLimit membangun middleware per-IP dengan kuota sendiri.
func rateLimit(perMin, burst int) func(http.Handler) http.Handler {
	store := newLimiterStore()
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if !store.get(clientIP(r), perMin, burst).Allow() {
				w.Header().Set("Content-Type", "application/json")
				w.Header().Set("Retry-After", "60")
				w.WriteHeader(http.StatusTooManyRequests)
				_, _ = w.Write([]byte(`{"error":"too many requests"}`))
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// RateLimitLogin limits login attempts to 5/minute per IP.
var RateLimitLogin = rateLimit(5, 5)

// RateLimitOrders limits order submissions to 10/minute per IP.
var RateLimitOrders = rateLimit(10, 10)
