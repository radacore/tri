package handlers

import (
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ListClientLogos returns all client logos ordered by sort_order.
func ListClientLogos(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		page, limit, offset := pageLimit(r, 50)
		var total int64
		if err := pool.QueryRow(r.Context(), `SELECT COUNT(*) FROM client_logos`).Scan(&total); err != nil {
			fail(w, http.StatusInternalServerError, "query failed")
			return
		}
		rows, err := pool.Query(r.Context(), `SELECT id, name, logo_url, sort_order, created_at FROM client_logos ORDER BY sort_order ASC, created_at DESC LIMIT $1 OFFSET $2`, limit, offset)
		if err != nil {
			fail(w, http.StatusInternalServerError, "query failed")
			return
		}
		defer rows.Close()
		items := []map[string]any{}
		for rows.Next() {
			var id, name, logo string
			var sort int
			var ca string
			if err := rows.Scan(&id, &name, &logo, &sort, &ca); err != nil {
				fail(w, http.StatusInternalServerError, "scan failed")
				return
			}
			items = append(items, map[string]any{
				"id": id, "name": name, "logo_url": logo, "sort_order": sort, "created_at": ca,
			})
		}
		if items == nil {
			items = []map[string]any{}
		}
		okMeta(w, items, Meta{Page: page, Limit: limit, Total: &total})
	}
}

// AdminCreateClient creates a client logo.
func AdminCreateClient(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var b struct {
			Name      string `json:"name"`
			LogoURL   string `json:"logo_url"`
			SortOrder *int   `json:"sort_order"`
		}
		if !decodeJSON(w, r, &b) {
			return
		}
		if strings.TrimSpace(b.Name) == "" || strings.TrimSpace(b.LogoURL) == "" {
			fail(w, http.StatusBadRequest, "name and logo_url are required")
			return
		}
		sort := 0
		if b.SortOrder != nil {
			sort = *b.SortOrder
		}
		var id string
		err := pool.QueryRow(r.Context(), `INSERT INTO client_logos (name, logo_url, sort_order) VALUES ($1,$2,$3) RETURNING id`, b.Name, b.LogoURL, sort).Scan(&id)
		if err != nil {
			fail(w, http.StatusInternalServerError, "create failed")
			return
		}
		created(w, map[string]any{"id": id})
	}
}

// AdminUpdateClient updates a client logo by id.
func AdminUpdateClient(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		var b map[string]any
		if !decodeJSON(w, r, &b) {
			return
		}
		allowed := map[string]string{"name": "name", "logo_url": "logo_url", "sort_order": "sort_order"}
		if err := genericUpdateNoTS(w, r, pool, "client_logos", id, b, allowed); err != nil {
			return
		}
		ok(w, map[string]any{"id": id})
	}
}

// AdminDeleteClient deletes a client logo by id.
func AdminDeleteClient(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		genericDelete(w, r, pool, "client_logos", chi.URLParam(r, "id"))
	}
}
