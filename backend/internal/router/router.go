package router

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/jackc/pgx/v5/pgxpool"
	"logopulse/backend/internal/config"
	handlers "logopulse/backend/internal/handlers"
	mw "logopulse/backend/internal/middleware"
)

func New(pool *pgxpool.Pool, cfg *config.Config) http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.Logger, middleware.Recoverer, middleware.RealIP)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-Requested-With"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	r.Get("/api/v1/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"data":{"ok":true}}`))
	})

	// Serve uploaded files.
	r.Handle("/uploads/*", http.StripPrefix("/uploads/", http.FileServer(http.Dir(cfg.UploadDir))))

	r.Route("/api/v1", func(r chi.Router) {
		// Public orders
		r.Post("/orders", handlers.CreateOrder(pool, cfg))
		r.Get("/orders/{id}/status", handlers.GetOrderStatus(pool))

		// Public content
		r.Get("/portfolio", handlers.ListPortfolio(pool))
		r.Get("/portfolio/{id}", handlers.GetPortfolio(pool))
		r.Get("/case-studies", handlers.ListCaseStudies(pool))
		r.Get("/case-studies/{slug}", handlers.GetCaseStudy(pool))
		r.Get("/blog", handlers.ListBlogPosts(pool))
		r.Get("/blog/{slug}", handlers.GetBlogPost(pool))
		r.Get("/testimonials", handlers.ListTestimonials(pool))
		r.Get("/client-logos", handlers.ListClientLogos(pool))
		r.Get("/categories", handlers.ListCategories(pool))
		r.Get("/settings", handlers.GetPublicSettings(pool))

		// Auth (rate limited)
		r.With(mw.RateLimitLogin).Post("/auth/login", handlers.Login(pool, cfg))

		// Admin (JWT protected)
		r.Group(func(r chi.Router) {
			r.Use(mw.JWTAuth(cfg.JWTSecret))
			r.Get("/admin/dashboard", handlers.GetDashboardStats(pool))
			// Orders
			r.Post("/admin/orders", handlers.AdminCreateOrder(pool))
			r.Get("/admin/orders-summary", handlers.OrdersSummary(pool))
			r.Get("/admin/orders", handlers.AdminListOrders(pool))
			r.Put("/admin/orders/{id}", handlers.AdminUpdateOrder(pool))
			r.Delete("/admin/orders/{id}", handlers.AdminDeleteOrder(pool))
			// Portfolio
			r.Get("/admin/portfolio", handlers.AdminListPortfolio(pool))
			r.Post("/admin/portfolio", handlers.AdminCreatePortfolio(pool))
			r.Put("/admin/portfolio/{id}", handlers.AdminUpdatePortfolio(pool))
			r.Delete("/admin/portfolio/{id}", handlers.AdminDeletePortfolio(pool))
			// Case studies
			r.Get("/admin/case-studies", handlers.AdminListCaseStudies(pool))
			r.Post("/admin/case-studies", handlers.AdminCreateCaseStudy(pool))
			r.Put("/admin/case-studies/{id}", handlers.AdminUpdateCaseStudy(pool))
			r.Delete("/admin/case-studies/{id}", handlers.AdminDeleteCaseStudy(pool))
			// Blog
			r.Get("/admin/blog", handlers.AdminListBlogPosts(pool))
			r.Post("/admin/blog", handlers.AdminCreateBlogPost(pool))
			r.Put("/admin/blog/{id}", handlers.AdminUpdateBlogPost(pool))
			r.Delete("/admin/blog/{id}", handlers.AdminDeleteBlogPost(pool))
			// Testimonials
			r.Get("/admin/testimonials", handlers.AdminListTestimonials(pool))
			r.Post("/admin/testimonials", handlers.AdminCreateTestimonial(pool))
			r.Put("/admin/testimonials/{id}", handlers.AdminUpdateTestimonial(pool))
			r.Delete("/admin/testimonials/{id}", handlers.AdminDeleteTestimonial(pool))
			// Clients
			r.Get("/admin/clients", handlers.ListClientLogos(pool))
			r.Post("/admin/clients", handlers.AdminCreateClient(pool))
			r.Put("/admin/clients/{id}", handlers.AdminUpdateClient(pool))
			r.Delete("/admin/clients/{id}", handlers.AdminDeleteClient(pool))
			// Categories
			r.Get("/admin/categories", handlers.ListCategories(pool))
			r.Post("/admin/categories", handlers.AdminCreateCategory(pool))
			r.Put("/admin/categories/{id}", handlers.AdminUpdateCategory(pool))
			r.Delete("/admin/categories/{id}", handlers.AdminDeleteCategory(pool))
			// Upload + settings
			r.Post("/admin/upload", handlers.UploadFile(cfg))
			r.Get("/admin/settings", handlers.GetSettings(pool))
			r.Put("/admin/settings/{key}", handlers.UpdateSetting(pool))
		})
	})
	return r
}
