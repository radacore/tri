package handlers

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

func itoa(n int) string { return strconv.Itoa(n) }

// ListCaseStudies returns published case studies with pagination.
func ListCaseStudies(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		page, limit, offset := pageLimit(r, 12)
		var total int64
		if err := pool.QueryRow(r.Context(), `SELECT COUNT(*) FROM case_studies WHERE published=TRUE`).Scan(&total); err != nil {
			fail(w, http.StatusInternalServerError, "query failed")
			return
		}
		rows, err := pool.Query(r.Context(), `SELECT id, title, slug, industry, hero_image, content, published, created_at, updated_at FROM case_studies WHERE published=TRUE ORDER BY created_at DESC LIMIT $1 OFFSET $2`, limit, offset)
		if err != nil {
			fail(w, http.StatusInternalServerError, "query failed")
			return
		}
		defer rows.Close()
		items := []map[string]any{}
		for rows.Next() {
			var id, title, slug string
			var ind, hero, content *string
			var pub bool
			var ca, ua tsString
			if err := rows.Scan(&id, &title, &slug, &ind, &hero, &content, &pub, &ca, &ua); err != nil {
				fail(w, http.StatusInternalServerError, "scan failed")
				return
			}
			items = append(items, map[string]any{
				"id": id, "title": title, "slug": slug, "industry": strp(ind),
				"hero_image": strp(hero), "content": strp(content), "published": pub,
				"created_at": ca.String(), "updated_at": ua.String(),
			})
		}
		if items == nil {
			items = []map[string]any{}
		}
		okMeta(w, items, Meta{Page: page, Limit: limit, Total: &total})
	}
}

// GetCaseStudy returns one published case study by slug.
func GetCaseStudy(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		slug := chi.URLParam(r, "slug")
		var id, title string
		var ind, hero, content *string
		var pub bool
		var ca, ua tsString
		err := pool.QueryRow(r.Context(), `SELECT id, title, slug, industry, hero_image, content, published, created_at, updated_at FROM case_studies WHERE slug=$1 AND published=TRUE`, slug).Scan(&id, &title, &slug, &ind, &hero, &content, &pub, &ca, &ua)
		if err != nil {
			fail(w, http.StatusNotFound, "case study not found")
			return
		}
		ok(w, map[string]any{
			"id": id, "title": title, "slug": slug, "industry": strp(ind),
			"hero_image": strp(hero), "content": strp(content), "published": pub,
			"created_at": ca.String(), "updated_at": ua.String(),
		})
	}
}

// AdminListCaseStudies lists all (including drafts).
func AdminListCaseStudies(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		page, limit, offset := pageLimit(r, 20)
		var total int64
		if err := pool.QueryRow(r.Context(), `SELECT COUNT(*) FROM case_studies`).Scan(&total); err != nil {
			fail(w, http.StatusInternalServerError, "query failed")
			return
		}
		rows, err := pool.Query(r.Context(), `SELECT id, title, slug, industry, hero_image, content, published, created_at, updated_at FROM case_studies ORDER BY created_at DESC LIMIT $1 OFFSET $2`, limit, offset)
		if err != nil {
			fail(w, http.StatusInternalServerError, "query failed")
			return
		}
		defer rows.Close()
		items := []map[string]any{}
		for rows.Next() {
			var id, title, slug string
			var ind, hero, content *string
			var pub bool
			var ca, ua tsString
			if err := rows.Scan(&id, &title, &slug, &ind, &hero, &content, &pub, &ca, &ua); err != nil {
				fail(w, http.StatusInternalServerError, "scan failed")
				return
			}
			items = append(items, map[string]any{
				"id": id, "title": title, "slug": slug, "industry": strp(ind),
				"hero_image": strp(hero), "content": strp(content), "published": pub,
				"created_at": ca.String(), "updated_at": ua.String(),
			})
		}
		if items == nil {
			items = []map[string]any{}
		}
		okMeta(w, items, Meta{Page: page, Limit: limit, Total: &total})
	}
}

// AdminCreateCaseStudy creates a case study.
func AdminCreateCaseStudy(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var b struct {
			Title     string  `json:"title"`
			Slug      string  `json:"slug"`
			Industry  *string `json:"industry"`
			HeroImage *string `json:"hero_image"`
			Content   *string `json:"content"`
			Published *bool   `json:"published"`
		}
		if !decodeJSON(w, r, &b) {
			return
		}
		if b.Title == "" || b.Slug == "" {
			fail(w, http.StatusBadRequest, "title and slug are required")
			return
		}
		pub := false
		if b.Published != nil {
			pub = *b.Published
		}
		var id string
		err := pool.QueryRow(r.Context(), `INSERT INTO case_studies (title, slug, industry, hero_image, content, published) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`, b.Title, b.Slug, b.Industry, b.HeroImage, b.Content, pub).Scan(&id)
		if err != nil {
			fail(w, http.StatusConflict, "create failed (slug may exist)")
			return
		}
		created(w, map[string]any{"id": id})
	}
}

// AdminUpdateCaseStudy updates a case study by id.
func AdminUpdateCaseStudy(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		var b map[string]any
		if !decodeJSON(w, r, &b) {
			return
		}
		allowed := map[string]string{
			"title": "title", "slug": "slug", "industry": "industry",
			"hero_image": "hero_image", "content": "content", "published": "published",
		}
		if err := genericUpdate(w, r, pool, "case_studies", id, b, allowed); err != nil {
			return
		}
		ok(w, map[string]any{"id": id})
	}
}

// AdminDeleteCaseStudy deletes a case study by id.
func AdminDeleteCaseStudy(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		genericDelete(w, r, pool, "case_studies", chi.URLParam(r, "id"))
	}
}
