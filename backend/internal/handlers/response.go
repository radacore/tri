package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"
)

type Meta struct {
	Page  int    `json:"page"`
	Limit int    `json:"limit"`
	Total *int64 `json:"total,omitempty"`
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func ok(w http.ResponseWriter, data any) {
	writeJSON(w, http.StatusOK, map[string]any{"data": data})
}

func okMeta(w http.ResponseWriter, data any, meta Meta) {
	writeJSON(w, http.StatusOK, map[string]any{"data": data, "meta": meta})
}

func created(w http.ResponseWriter, data any) {
	writeJSON(w, http.StatusCreated, map[string]any{"data": data})
}

func fail(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]any{"error": msg})
}

func pageLimit(r *http.Request, defLimit int) (page, limit, offset int) {
	page = 1
	limit = defLimit
	if v := r.URL.Query().Get("page"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			page = n
		}
	}
	if v := r.URL.Query().Get("limit"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			limit = n
		}
	}
	if limit > 100 {
		limit = 100
	}
	offset = (page - 1) * limit
	return page, limit, offset
}

func decodeJSON(w http.ResponseWriter, r *http.Request, dst any) bool {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	if err := dec.Decode(dst); err != nil {
		fail(w, http.StatusBadRequest, "invalid JSON body")
		return false
	}
	return true
}

// tsString menerima kolom timestamptz (NULL-able) menjadi string RFC3339.
// pgx tidak bisa scan timestamptz langsung ke string, jadi semua handler
// list/detail memakai tipe ini untuk created_at/updated_at/paid_at dsb.
type tsString struct{ s string }

func (t *tsString) Scan(v any) error {
	switch x := v.(type) {
	case nil:
		t.s = ""
	case time.Time:
		t.s = x.UTC().Format(time.RFC3339)
	case string:
		t.s = x
	case []byte:
		t.s = string(x)
	default:
		t.s = fmt.Sprint(v)
	}
	return nil
}

func (t tsString) String() string { return t.s }
