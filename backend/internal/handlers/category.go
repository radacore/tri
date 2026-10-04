package handlers

import (
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ListCategories returns all categories with portfolio item counts (public).
func ListCategories(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		rows, err := pool.Query(r.Context(), `
			SELECT c.id, c.name, c.slug, c.sort_order, COUNT(p.id)
			FROM categories c
			LEFT JOIN portfolio_items p ON p.category = c.name AND p.published IS DISTINCT FROM FALSE
			GROUP BY c.id ORDER BY c.sort_order ASC, c.name ASC`)
		if err != nil {
			fail(w, http.StatusInternalServerError, "query failed")
			return
		}
		defer rows.Close()
		items := []map[string]any{}
		for rows.Next() {
			var id, name, slug string
			var sort, count int
			if err := rows.Scan(&id, &name, &slug, &sort, &count); err != nil {
				fail(w, http.StatusInternalServerError, "scan failed")
				return
			}
			items = append(items, map[string]any{
				"id": id, "name": name, "slug": slug,
				"sort_order": sort, "item_count": count,
			})
		}
		if items == nil {
			items = []map[string]any{}
		}
		ok(w, items)
	}
}

// AdminCreateCategory creates a category.
func AdminCreateCategory(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var b struct {
			Name      string `json:"name"`
			Slug      string `json:"slug"`
			SortOrder *int   `json:"sort_order"`
		}
		if !decodeJSON(w, r, &b) {
			return
		}
		b.Name = strings.TrimSpace(b.Name)
		if b.Name == "" {
			fail(w, http.StatusBadRequest, "name is required")
			return
		}
		if strings.TrimSpace(b.Slug) == "" {
			b.Slug = slugify(b.Name)
		}
		sort := 0
		if b.SortOrder != nil {
			sort = *b.SortOrder
		}
		var id string
		err := pool.QueryRow(r.Context(), `INSERT INTO categories (name, slug, sort_order) VALUES ($1,$2,$3) RETURNING id`, b.Name, b.Slug, sort).Scan(&id)
		if err != nil {
			fail(w, http.StatusBadRequest, "create failed (name/slug may already exist)")
			return
		}
		created(w, map[string]any{"id": id})
	}
}

// AdminUpdateCategory updates name/slug/sort_order (items follow by name).
func AdminUpdateCategory(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		var b map[string]any
		if !decodeJSON(w, r, &b) {
			return
		}
		var prev string
		if err := pool.QueryRow(r.Context(), `SELECT name FROM categories WHERE id=$1`, id).Scan(&prev); err != nil {
			fail(w, http.StatusNotFound, "category not found")
			return
		}
		allowed := map[string]string{"name": "name", "slug": "slug", "sort_order": "sort_order"}
		if err := genericUpdateNoTS(w, r, pool, "categories", id, b, allowed); err != nil {
			return
		}
		if name, ok := b["name"].(string); ok && strings.TrimSpace(name) != "" && name != prev {
			if _, err := pool.Exec(r.Context(), `UPDATE portfolio_items SET category=$1 WHERE category=$2`, strings.TrimSpace(name), prev); err != nil {
				fail(w, http.StatusInternalServerError, "failed to move items")
				return
			}
		}
		ok(w, map[string]any{"id": id})
	}
}

// AdminDeleteCategory deletes a category. Items must be moved first via
// ?reassign=<target name>, otherwise 400 to avoid orphans.
func AdminDeleteCategory(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		var name string
		if err := pool.QueryRow(r.Context(), `SELECT name FROM categories WHERE id=$1`, id).Scan(&name); err != nil {
			fail(w, http.StatusNotFound, "category not found")
			return
		}
		var n int
		if err := pool.QueryRow(r.Context(), `SELECT COUNT(*) FROM portfolio_items WHERE category=$1`, name).Scan(&n); err != nil {
			fail(w, http.StatusInternalServerError, "query failed")
			return
		}
		if target := strings.TrimSpace(r.URL.Query().Get("reassign")); target != "" {
			if _, err := pool.Exec(r.Context(), `UPDATE portfolio_items SET category=$1 WHERE category=$2`, target, name); err != nil {
				fail(w, http.StatusInternalServerError, "failed to move items")
				return
			}
		} else if n > 0 {
			fail(w, http.StatusBadRequest, "category has items; move them first (?reassign=Name)")
			return
		}
		genericDelete(w, r, pool, "categories", id)
	}
}

func slugify(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	var b strings.Builder
	prevDash := false
	for _, r := range s {
		switch {
		case r >= 'a' && r <= 'z', r >= '0' && r <= '9':
			b.WriteRune(r)
			prevDash = false
		default:
			if !prevDash {
				b.WriteRune('-')
				prevDash = true
			}
		}
	}
	return strings.Trim(b.String(), "-")
}
