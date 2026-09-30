package handlers

import (
	"net/http"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

// genericUpdate builds a dynamic UPDATE with updated_at=NOW().
func genericUpdate(w http.ResponseWriter, r *http.Request, pool *pgxpool.Pool, table, id string, b map[string]any, allowed map[string]string) error {
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
		return errNoFields
	}
	args = append(args, id)
	q := `UPDATE ` + table + ` SET ` + strings.Join(set, ", ") + `, updated_at=NOW() WHERE id=$` + itoa(len(args))
	ct, err := pool.Exec(r.Context(), q, args...)
	if err != nil {
		fail(w, http.StatusInternalServerError, "update failed")
		return err
	}
	if ct.RowsAffected() == 0 {
		fail(w, http.StatusNotFound, "not found")
		return errNotFound
	}
	return nil
}

func genericUpdateNoTS(w http.ResponseWriter, r *http.Request, pool *pgxpool.Pool, table, id string, b map[string]any, allowed map[string]string) error {
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
		return errNoFields
	}
	args = append(args, id)
	q := `UPDATE ` + table + ` SET ` + strings.Join(set, ", ") + ` WHERE id=$` + itoa(len(args))
	ct, err := pool.Exec(r.Context(), q, args...)
	if err != nil {
		fail(w, http.StatusInternalServerError, "update failed")
		return err
	}
	if ct.RowsAffected() == 0 {
		fail(w, http.StatusNotFound, "not found")
		return errNotFound
	}
	return nil
}

func genericDelete(w http.ResponseWriter, r *http.Request, pool *pgxpool.Pool, table, id string) {
	ct, err := pool.Exec(r.Context(), `DELETE FROM `+table+` WHERE id=$1`, id)
	if err != nil {
		fail(w, http.StatusInternalServerError, "delete failed")
		return
	}
	if ct.RowsAffected() == 0 {
		fail(w, http.StatusNotFound, "not found")
		return
	}
	ok(w, map[string]any{"id": id, "deleted": true})
}

var (
	errNoFields = errString("no fields")
	errNotFound = errString("not found")
)

type errString string

func (e errString) Error() string { return string(e) }
