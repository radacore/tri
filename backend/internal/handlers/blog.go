package handlers

import (
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ListBlogPosts returns published posts with pagination + category filter.
func ListBlogPosts(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		page, limit, offset := pageLimit(r, 12)
		category := r.URL.Query().Get("category")
		where := "published = TRUE"
		args := []any{}
		if category != "" {
			args = append(args, category)
			where += " AND category = $1"
		}
		var total int64
		if err := pool.QueryRow(r.Context(), `SELECT COUNT(*) FROM blog_posts WHERE `+where, args...).Scan(&total); err != nil {
			fail(w, http.StatusInternalServerError, "query failed")
			return
		}
		args = append(args, limit, offset)
		q := `SELECT id, title, slug, content, category, thumbnail_url, meta_title, meta_description, published, published_at, created_at, updated_at FROM blog_posts WHERE ` + where + ` ORDER BY COALESCE(published_at, created_at) DESC LIMIT $` + itoa(len(args)-1) + ` OFFSET $` + itoa(len(args))
		rows, err := pool.Query(r.Context(), q, args...)
		if err != nil {
			fail(w, http.StatusInternalServerError, "query failed")
			return
		}
		defer rows.Close()
		items := []map[string]any{}
		for rows.Next() {
			var id, title, slug string
			var content, cat, thumb, mt, md *string
			var pub bool
			var pat, ca, ua tsString
			if err := rows.Scan(&id, &title, &slug, &content, &cat, &thumb, &mt, &md, &pub, &pat, &ca, &ua); err != nil {
				fail(w, http.StatusInternalServerError, "scan failed")
				return
			}
			items = append(items, map[string]any{
				"id": id, "title": title, "slug": slug, "content": strp(content),
				"category": strp(cat), "thumbnail_url": strp(thumb),
				"meta_title": strp(mt), "meta_description": strp(md),
				"published": pub, "published_at": pat.String(),
				"created_at": ca.String(), "updated_at": ua.String(),
			})
		}
		if items == nil {
			items = []map[string]any{}
		}
		okMeta(w, items, Meta{Page: page, Limit: limit, Total: &total})
	}
}

// GetBlogPost returns one published post by slug.
func GetBlogPost(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		slug := chi.URLParam(r, "slug")
		var id, title string
		var content, cat, thumb, mt, md *string
		var pub bool
		var pat, ca, ua tsString
		err := pool.QueryRow(r.Context(), `SELECT id, title, slug, content, category, thumbnail_url, meta_title, meta_description, published, published_at, created_at, updated_at FROM blog_posts WHERE slug=$1 AND published=TRUE`, slug).Scan(&id, &title, &slug, &content, &cat, &thumb, &mt, &md, &pub, &pat, &ca, &ua)
		if err != nil {
			fail(w, http.StatusNotFound, "blog post not found")
			return
		}
		ok(w, map[string]any{
			"id": id, "title": title, "slug": slug, "content": strp(content),
			"category": strp(cat), "thumbnail_url": strp(thumb),
			"meta_title": strp(mt), "meta_description": strp(md),
			"published": pub, "published_at": pat.String(),
			"created_at": ca.String(), "updated_at": ua.String(),
		})
	}
}

// AdminListBlogPosts lists all posts.
func AdminListBlogPosts(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		page, limit, offset := pageLimit(r, 20)
		var total int64
		if err := pool.QueryRow(r.Context(), `SELECT COUNT(*) FROM blog_posts`).Scan(&total); err != nil {
			fail(w, http.StatusInternalServerError, "query failed")
			return
		}
		rows, err := pool.Query(r.Context(), `SELECT id, title, slug, content, category, thumbnail_url, meta_title, meta_description, published, published_at, created_at, updated_at FROM blog_posts ORDER BY created_at DESC LIMIT $1 OFFSET $2`, limit, offset)
		if err != nil {
			fail(w, http.StatusInternalServerError, "query failed")
			return
		}
		defer rows.Close()
		items := []map[string]any{}
		for rows.Next() {
			var id, title, slug string
			var content, cat, thumb, mt, md *string
			var pub bool
			var pat, ca, ua tsString
			if err := rows.Scan(&id, &title, &slug, &content, &cat, &thumb, &mt, &md, &pub, &pat, &ca, &ua); err != nil {
				fail(w, http.StatusInternalServerError, "scan failed")
				return
			}
			items = append(items, map[string]any{
				"id": id, "title": title, "slug": slug, "content": strp(content),
				"category": strp(cat), "thumbnail_url": strp(thumb),
				"meta_title": strp(mt), "meta_description": strp(md),
				"published": pub, "published_at": pat.String(),
				"created_at": ca.String(), "updated_at": ua.String(),
			})
		}
		if items == nil {
			items = []map[string]any{}
		}
		okMeta(w, items, Meta{Page: page, Limit: limit, Total: &total})
	}
}

// AdminCreateBlogPost creates a blog post.
func AdminCreateBlogPost(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var b struct {
			Title           string  `json:"title"`
			Slug            string  `json:"slug"`
			Content         *string `json:"content"`
			Category        *string `json:"category"`
			ThumbnailURL    *string `json:"thumbnail_url"`
			MetaTitle       *string `json:"meta_title"`
			MetaDescription *string `json:"meta_description"`
			Published       *bool   `json:"published"`
		}
		if !decodeJSON(w, r, &b) {
			return
		}
		if strings.TrimSpace(b.Title) == "" || strings.TrimSpace(b.Slug) == "" {
			fail(w, http.StatusBadRequest, "title and slug are required")
			return
		}
		pub := false
		if b.Published != nil {
			pub = *b.Published
		}
		var id string
		var q string
		if pub {
			q = `INSERT INTO blog_posts (title, slug, content, category, thumbnail_url, meta_title, meta_description, published, published_at) VALUES ($1,$2,$3,$4,$5,$6,$7,TRUE,NOW()) RETURNING id`
		} else {
			q = `INSERT INTO blog_posts (title, slug, content, category, thumbnail_url, meta_title, meta_description, published) VALUES ($1,$2,$3,$4,$5,$6,$7,FALSE) RETURNING id`
		}
		err := pool.QueryRow(r.Context(), q, b.Title, b.Slug, b.Content, b.Category, b.ThumbnailURL, b.MetaTitle, b.MetaDescription).Scan(&id)
		if err != nil {
			fail(w, http.StatusConflict, "create failed (slug may exist)")
			return
		}
		created(w, map[string]any{"id": id})
	}
}

// AdminUpdateBlogPost updates a blog post by id.
func AdminUpdateBlogPost(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		var b map[string]any
		if !decodeJSON(w, r, &b) {
			return
		}
		if pub, present := b["published"]; present {
			if on, _ := pub.(bool); on {
				b["published_at"] = "NOW()"
			}
		}
		allowed := map[string]string{
			"title": "title", "slug": "slug", "content": "content", "category": "category",
			"thumbnail_url": "thumbnail_url", "meta_title": "meta_title",
			"meta_description": "meta_description", "published": "published",
		}
		// handle published_at sentinel
		var setNow bool
		if v, present := b["published_at"]; present {
			if s, _ := v.(string); s == "NOW()" {
				setNow = true
			}
			delete(b, "published_at")
		}
		set := []string{}
		args := []any{}
		for k, col := range allowed {
			if v, present := b[k]; present {
				args = append(args, v)
				set = append(set, col+`=$`+itoa(len(args)))
			}
		}
		if setNow {
			set = append(set, "published_at=NOW()")
		}
		if len(set) == 0 {
			fail(w, http.StatusBadRequest, "no fields to update")
			return
		}
		args = append(args, id)
		q := `UPDATE blog_posts SET ` + strings.Join(set, ", ") + `, updated_at=NOW() WHERE id=$` + itoa(len(args))
		ct, err := pool.Exec(r.Context(), q, args...)
		if err != nil {
			fail(w, http.StatusInternalServerError, "update failed")
			return
		}
		if ct.RowsAffected() == 0 {
			fail(w, http.StatusNotFound, "blog post not found")
			return
		}
		ok(w, map[string]any{"id": id})
	}
}

// AdminDeleteBlogPost deletes a blog post by id.
func AdminDeleteBlogPost(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		genericDelete(w, r, pool, "blog_posts", chi.URLParam(r, "id"))
	}
}
