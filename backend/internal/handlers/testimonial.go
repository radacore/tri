package handlers

import (
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ListTestimonials returns published testimonials with pagination.
func ListTestimonials(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		page, limit, offset := pageLimit(r, 12)
		featured := r.URL.Query().Get("featured")
		where := "published = TRUE"
		if featured == "true" {
			where += " AND featured = TRUE"
		}
		var total int64
		if err := pool.QueryRow(r.Context(), `SELECT COUNT(*) FROM testimonials WHERE `+where).Scan(&total); err != nil {
			fail(w, http.StatusInternalServerError, "query failed")
			return
		}
		rows, err := pool.Query(r.Context(), `SELECT id, name, position, company, photo_url, quote, rating, featured, published, created_at FROM testimonials WHERE `+where+` ORDER BY created_at DESC LIMIT $1 OFFSET $2`, limit, offset)
		if err != nil {
			fail(w, http.StatusInternalServerError, "query failed")
			return
		}
		defer rows.Close()
		items := []map[string]any{}
		for rows.Next() {
			var id, name, quote string
			var pos, comp, photo *string
			var rating int16
			var feat, pub bool
			var ca tsString
			if err := rows.Scan(&id, &name, &pos, &comp, &photo, &quote, &rating, &feat, &pub, &ca); err != nil {
				fail(w, http.StatusInternalServerError, "scan failed")
				return
			}
			items = append(items, map[string]any{
				"id": id, "name": name, "position": strp(pos), "company": strp(comp),
				"photo_url": strp(photo), "quote": quote, "rating": rating,
				"featured": feat, "published": pub, "created_at": ca.String(),
			})
		}
		if items == nil {
			items = []map[string]any{}
		}
		okMeta(w, items, Meta{Page: page, Limit: limit, Total: &total})
	}
}

// AdminListTestimonials lists all testimonials.
func AdminListTestimonials(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		page, limit, offset := pageLimit(r, 20)
		var total int64
		if err := pool.QueryRow(r.Context(), `SELECT COUNT(*) FROM testimonials`).Scan(&total); err != nil {
			fail(w, http.StatusInternalServerError, "query failed")
			return
		}
		rows, err := pool.Query(r.Context(), `SELECT id, name, position, company, photo_url, quote, rating, featured, published, created_at FROM testimonials ORDER BY created_at DESC LIMIT $1 OFFSET $2`, limit, offset)
		if err != nil {
			fail(w, http.StatusInternalServerError, "query failed")
			return
		}
		defer rows.Close()
		items := []map[string]any{}
		for rows.Next() {
			var id, name, quote string
			var pos, comp, photo *string
			var rating int16
			var feat, pub bool
			var ca tsString
			if err := rows.Scan(&id, &name, &pos, &comp, &photo, &quote, &rating, &feat, &pub, &ca); err != nil {
				fail(w, http.StatusInternalServerError, "scan failed")
				return
			}
			items = append(items, map[string]any{
				"id": id, "name": name, "position": strp(pos), "company": strp(comp),
				"photo_url": strp(photo), "quote": quote, "rating": rating,
				"featured": feat, "published": pub, "created_at": ca.String(),
			})
		}
		if items == nil {
			items = []map[string]any{}
		}
		okMeta(w, items, Meta{Page: page, Limit: limit, Total: &total})
	}
}

// AdminCreateTestimonial creates a testimonial.
func AdminCreateTestimonial(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var b struct {
			Name      string  `json:"name"`
			Position  *string `json:"position"`
			Company   *string `json:"company"`
			PhotoURL  *string `json:"photo_url"`
			Quote     string  `json:"quote"`
			Rating    *int16  `json:"rating"`
			Featured  *bool   `json:"featured"`
			Published *bool   `json:"published"`
		}
		if !decodeJSON(w, r, &b) {
			return
		}
		if strings.TrimSpace(b.Name) == "" || strings.TrimSpace(b.Quote) == "" {
			fail(w, http.StatusBadRequest, "name and quote are required")
			return
		}
		rating := int16(5)
		if b.Rating != nil {
			rating = *b.Rating
		}
		feat, pub := false, true
		if b.Featured != nil {
			feat = *b.Featured
		}
		if b.Published != nil {
			pub = *b.Published
		}
		var id string
		err := pool.QueryRow(r.Context(), `INSERT INTO testimonials (name, position, company, photo_url, quote, rating, featured, published) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`, b.Name, b.Position, b.Company, b.PhotoURL, b.Quote, rating, feat, pub).Scan(&id)
		if err != nil {
			fail(w, http.StatusInternalServerError, "create failed")
			return
		}
		created(w, map[string]any{"id": id})
	}
}

// AdminUpdateTestimonial updates a testimonial by id.
func AdminUpdateTestimonial(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		var b map[string]any
		if !decodeJSON(w, r, &b) {
			return
		}
		allowed := map[string]string{
			"name": "name", "position": "position", "company": "company",
			"photo_url": "photo_url", "quote": "quote", "rating": "rating",
			"featured": "featured", "published": "published",
		}
		if err := genericUpdate(w, r, pool, "testimonials", id, b, allowed); err != nil {
			return
		}
		ok(w, map[string]any{"id": id})
	}
}

// AdminDeleteTestimonial deletes a testimonial by id.
func AdminDeleteTestimonial(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		genericDelete(w, r, pool, "testimonials", chi.URLParam(r, "id"))
	}
}
