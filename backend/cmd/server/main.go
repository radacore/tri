package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"logopulse/backend/internal/config"
	"logopulse/backend/internal/database"
	"logopulse/backend/internal/handlers"
	"logopulse/backend/internal/router"
)

func main() {
	cfg := config.Load()
	if err := os.MkdirAll(cfg.UploadDir, 0o755); err != nil {
		log.Fatalf("uploads dir: %v", err)
	}
	pool, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := pool.Ping(ctx); err != nil {
		log.Printf("WARN: db ping failed: %v", err)
	} else {
		handlers.EnsureSeedAdmin(pool, cfg)
	}

	h := router.New(pool, cfg)
	if r, ok := h.(*chi.Mux); ok {
		log.Println("registered routes:")
		_ = chi.Walk(r, func(method, route string, _ http.Handler, _ ...func(http.Handler) http.Handler) error {
			log.Printf("  %s %s", method, route)
			return nil
		})
	}

	srv := &http.Server{Addr: ":" + cfg.Port, Handler: h}
	go func() {
		log.Printf("API listening on :%s (uploads: %s)", cfg.Port, cfg.UploadDir)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal(err)
		}
	}()
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop
	log.Println("shutting down...")
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Printf("shutdown error: %v", err)
	}
}
