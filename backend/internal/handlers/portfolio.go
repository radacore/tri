package handlers

import (
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

func strp(s *string) any {
	if s == nil {
		return nil
	}
	return *s
}

// ListPortfolio returns published items with pagination + category filter.
func ListPortfolio(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		page, limit, offset := pageLimit(r, 12)
		category := r.URL.Query().Get("category")
		featured := r.URL.Query().Get("featured")
		args := []any{}
		where := "published = TRUE"
		if category != "" {
			args = append(args, category)
			where += ` AND category = $1`
		}
		countArgs := append([]any{}, args...)
		var total int64
		if err := pool.QueryRow(r.Context(), `SELECT COUNT(*) FROM portfolio_items WHERE `+where, countArgs...).Scan(&total); err != nil {
			fail(w, http.StatusInternalServerError, "query failed")
			return
		}
		q := `SELECT id, title, category, image_url, description, featured, published, sort_order, created_at, updated_at FROM portfolio_items WHERE ` + where
		if featured == "true" {
			q += ` AND featured = TRUE`
		}
		args = append(args, limit, offset)
		q += ` ORDER BY sort_order ASC, created_at DESC LIMIT $` + itoa(len(args)-1) + ` OFFSET $` + itoa(len(args))
		rows, err := pool.Query(r.Context(), q, args...)
		if err != nil {
			fail(w, http.StatusInternalServerError, "query failed")
			return
		}
		defer rows.Close()
		items := []map[string]any{}
		for rows.Next() {
			var id, title, image string
			var cat, desc *string
			var feat, pub bool
			var sort int
			var ca, ua tsString
			if err := rows.Scan(&id, &title, &cat, &image, &desc, &feat, &pub, &sort, &ca, &ua); err != nil {
				fail(w, http.StatusInternalServerError, "scan failed")
				return
			}
			items = append(items, map[string]any{
				"id": id, "title": title, "category": strp(cat), "image_url": image,
				"description": strp(desc), "featured": feat, "published": pub,
				"sort_order": sort, "created_at": ca.String(), "updated_at": ua.String(),
			})
		}
		if items == nil {
			items = []map[string]any{}
		}
		okMeta(w, items, Meta{Page: page, Limit: limit, Total: &total})
	}
}

// AdminListPortfolio lists all items including drafts.
func AdminListPortfolio(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		page, limit, offset := pageLimit(r, 50)
		var total int64
		if err := pool.QueryRow(r.Context(), `SELECT COUNT(*) FROM portfolio_items`).Scan(&total); err != nil {
			fail(w, http.StatusInternalServerError, "query failed")
			return
		}
		rows, err := pool.Query(r.Context(), `SELECT id, title, category, image_url, description, featured, published, sort_order, created_at, updated_at FROM portfolio_items ORDER BY sort_order ASC, created_at DESC LIMIT $1 OFFSET $2`, limit, offset)
		if err != nil {
			fail(w, http.StatusInternalServerError, "query failed")
			return
		}
		defer rows.Close()
		items := []map[string]any{}
		for rows.Next() {
			var id, title, image string
			var cat, desc *string
			var feat, pub bool
			var sort int
			var ca, ua tsString
			if err := rows.Scan(&id, &title, &cat, &image, &desc, &feat, &pub, &sort, &ca, &ua); err != nil {
				fail(w, http.StatusInternalServerError, "scan failed")
				return
			}
			items = append(items, map[string]any{
				"id": id, "title": title, "category": strp(cat), "image_url": image,
				"description": strp(desc), "featured": feat, "published": pub,
				"sort_order": sort, "created_at": ca.String(), "updated_at": ua.String(),
			})
		}
		if items == nil {
			items = []map[string]any{}
		}
		okMeta(w, items, Meta{Page: page, Limit: limit, Total: &total})
	}
}

// GetPortfolio returns one item by id.
func GetPortfolio(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		var m map[string]any
		var pid, title, image string
		var cat, desc *string
		var feat, pub bool
		var sort int
		var ca, ua tsString
		err := pool.QueryRow(r.Context(), `SELECT id, title, category, image_url, description, featured, published, sort_order, created_at, updated_at FROM portfolio_items WHERE id=$1`, id).Scan(&pid, &title, &cat, &image, &desc, &feat, &pub, &sort, &ca, &ua)
		if err != nil {
			fail(w, http.StatusNotFound, "portfolio item not found")
			return
		}
		m = map[string]any{
			"id": pid, "title": title, "category": strp(cat), "image_url": image,
			"description": strp(desc), "featured": feat, "published": pub,
			"sort_order": sort, "created_at": ca.String(), "updated_at": ua.String(),
		}
		ok(w, m)
	}
}

// AdminCreatePortfolio creates a portfolio item.
func AdminCreatePortfolio(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var b struct {
			Title       string  `json:"title"`
			Category    *string `json:"category"`
			ImageURL    string  `json:"image_url"`
			Description *string `json:"description"`
			Featured    *bool   `json:"featured"`
			Published   *bool   `json:"published"`
			SortOrder   *int    `json:"sort_order"`
		}
		if !decodeJSON(w, r, &b) {
			return
		}
		if strings.TrimSpace(b.Title) == "" || strings.TrimSpace(b.ImageURL) == "" {
			fail(w, http.StatusBadRequest, "title and image_url are required")
			return
		}
		feat, pub, sort := false, true, 0
		if b.Featured != nil {
			feat = *b.Featured
		}
		if b.Published != nil {
			pub = *b.Published
		}
		if b.SortOrder != nil {
			sort = *b.SortOrder
		}
		var id string
		err := pool.QueryRow(r.Context(), `INSERT INTO portfolio_items (title, category, image_url, description, featured, published, sort_order) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`, b.Title, b.Category, b.ImageURL, b.Description, feat, pub, sort).Scan(&id)
		if err != nil {
			fail(w, http.StatusInternalServerError, "create failed")
			return
		}
		created(w, map[string]any{"id": id})
	}
}

// AdminUpdatePortfolio updates a portfolio item.
func AdminUpdatePortfolio(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		var b map[string]any
		if !decodeJSON(w, r, &b) {
			return
		}
		allowed := map[string]string{
			"title": "title", "category": "category", "image_url": "image_url",
			"description": "description", "featured": "featured",
			"published": "published", "sort_order": "sort_order",
		}
		set := []string{}
		args := []any{}
		for k, col := range allowed {
			if v, present := b[k]; present {
				args = append(args, v)
				set = append(set, col+`=$`+itoa(len(args)))
			}
		}
		if len(set) == 0 {
			fail(w, http.StatusBadRequest, "no fields to update")
			return
		}
		args = append(args, id)
		q := `UPDATE portfolio_items SET ` + strings.Join(set, ", ") + `, updated_at=NOW() WHERE id=$` + itoa(len(args))
		ct, err := pool.Exec(r.Context(), q, args...)
		if err != nil {
			fail(w, http.StatusInternalServerError, "update failed")
			return
		}
		if ct.RowsAffected() == 0 {
			fail(w, http.StatusNotFound, "portfolio item not found")
			return
		}
		ok(w, map[string]any{"id": id})
	}
}

// AdminDeletePortfolio deletes a portfolio item.
func AdminDeletePortfolio(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		ct, err := pool.Exec(r.Context(), `DELETE FROM portfolio_items WHERE id=$1`, id)
		if err != nil {
			fail(w, http.StatusInternalServerError, "delete failed")
			return
		}
		if ct.RowsAffected() == 0 {
			fail(w, http.StatusNotFound, "portfolio item not found")
			return
		}
		ok(w, map[string]any{"id": id, "deleted": true})
	}
}
