package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// GetSettings returns all site_settings (admin).
func GetSettings(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// no-store: nilai sering berubah dari admin, jangan di-cache browser/CDN
		w.Header().Set("Cache-Control", "no-store")
		rows, err := pool.Query(r.Context(), `SELECT key, value, updated_at FROM site_settings`)
		if err != nil {
			fail(w, http.StatusInternalServerError, "query failed")
			return
		}
		defer rows.Close()
		out := map[string]any{}
		for rows.Next() {
			var k string
			var v []byte
			var ua tsString
			if err := rows.Scan(&k, &v, &ua); err != nil {
				fail(w, http.StatusInternalServerError, "scan failed")
				return
			}
			var decoded any
			if json.Unmarshal(v, &decoded) == nil {
				out[k] = decoded
			} else {
				out[k] = string(v)
			}
		}
		if out == nil {
			out = map[string]any{}
		}
		ok(w, out)
	}
}

// publicSettingsAllowlist: hanya key ini yang boleh dibaca publik (C2).
// Key baru TIDAK otomatis publik — daftarkan eksplisit bila memang konten marketing.
var publicSettingsAllowlist = map[string]bool{
	"sections": true, "hero_images": true, "media": true, "pages": true,
	"pricing": true, "hero": true, "footer": true, "testimonials": true,
	"clients": true, "order": true, "contact": true, "about": true,
	"legal": true, "identity": true,
}

// GetPublicSettings returns allowlisted site_settings for public consumption.
func GetPublicSettings(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "no-store")
		rows, err := pool.Query(r.Context(), `SELECT key, value FROM site_settings`)
		if err != nil {
			failErr(w, r, http.StatusInternalServerError, "query failed", err)
			return
		}
		defer rows.Close()
		out := map[string]any{}
		for rows.Next() {
			var k string
			var v []byte
			if err := rows.Scan(&k, &v); err != nil {
				continue
			}
			if !publicSettingsAllowlist[k] {
				continue
			}
			var decoded any
			if json.Unmarshal(v, &decoded) == nil {
				out[k] = decoded
			} else {
				out[k] = string(v)
			}
		}
		if out == nil {
			out = map[string]any{}
		}
		ok(w, out)
	}
}

// UpdateSetting upserts a single site_settings key.
func UpdateSetting(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		key := chi.URLParam(r, "key")
		if key == "" {
			fail(w, http.StatusBadRequest, "key is required")
			return
		}
		var v any
		r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
		if err := json.NewDecoder(r.Body).Decode(&v); err != nil {
			fail(w, http.StatusBadRequest, "invalid JSON body")
			return
		}
		// support envelope {value: ...} or raw value
		if m, isMap := v.(map[string]any); isMap {
			if inner, present := m["value"]; present && len(m) == 1 {
				v = inner
			}
		}
		raw, err := json.Marshal(v)
		if err != nil {
			fail(w, http.StatusBadRequest, "invalid value")
			return
		}
		// H3: gabung objek (jsonb ||) agar update satu field tak menghapus lainnya.
		// Kirim {"replace": true, "value": ...} untuk menimpa penuh secara eksplisit.
		replace := false
		if m, isMap := v.(map[string]any); isMap {
			if r, _ := m["replace"].(bool); r {
				replace = true
				if inner, present := m["value"]; present {
					v = inner
				}
				raw, _ = json.Marshal(v)
			}
		}
		var execErr error
		if replace {
			_, execErr = pool.Exec(r.Context(), `INSERT INTO site_settings (key, value, updated_at) VALUES ($1, $2::jsonb, NOW()) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=NOW()`, key, string(raw))
		} else {
			_, execErr = pool.Exec(r.Context(), `INSERT INTO site_settings (key, value, updated_at) VALUES ($1, $2::jsonb, NOW()) ON CONFLICT (key) DO UPDATE SET value = COALESCE(site_settings.value, '{}'::jsonb) || EXCLUDED.value, updated_at=NOW()`, key, string(raw))
		}
		if execErr != nil {
			failErr(w, r, http.StatusInternalServerError, "update failed", execErr)
			return
		}
		ok(w, map[string]any{"key": key, "value": v})
	}
}
