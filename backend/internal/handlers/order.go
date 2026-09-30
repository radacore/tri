package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"logopulse/backend/internal/config"
)

var tierAmounts = map[string]int{
	"starter":      4900,
	"professional": 14900,
	"premium":      39900,
}

// CreateOrder validates the brief, inserts a pending order and returns it.
// No payment gateway: customer sends the brief via WhatsApp/email afterwards
// (frontend builds the wa.me/mailto links). Payment is arranged manually.
func CreateOrder(pool *pgxpool.Pool, cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			CustomerName  string          `json:"customer_name"`
			Name          string          `json:"name"`
			Business      string          `json:"business"`
			Industry      string          `json:"industry"`
			Notes         string          `json:"notes"`
			CustomerEmail string          `json:"customer_email"`
			Email         string          `json:"email"`
			Contact       string          `json:"contact"`
			PackageTier   string          `json:"package_tier"`
			Tier          string          `json:"tier"`
			Plan          string          `json:"plan"`
			Brief         json.RawMessage `json:"brief"`
		}
		if !decodeJSON(w, r, &body) {
			return
		}
		name := firstNonEmpty(body.CustomerName, body.Name)
		contact := firstNonEmpty(body.CustomerEmail, body.Email, body.Contact)
		tier := strings.ToLower(firstNonEmpty(body.PackageTier, body.Tier, body.Plan))
		business := strings.TrimSpace(body.Business)
		if name == "" || business == "" || tier == "" {
			fail(w, http.StatusBadRequest, "name, business and package_tier are required")
			return
		}
		if contact == "" {
			fail(w, http.StatusBadRequest, "contact (email or WhatsApp) is required")
			return
		}
		if strings.Contains(contact, "@") && !strings.Contains(contact, ".") {
			fail(w, http.StatusBadRequest, "invalid email")
			return
		}
		amount, okTier := tierAmounts[tier]
		if !okTier {
			fail(w, http.StatusBadRequest, "package_tier must be starter|professional|premium")
			return
		}
		id := uuid.NewString()
		briefMap := map[string]any{
			"name": name, "business": business, "contact": contact,
			"industry": strings.TrimSpace(body.Industry), "notes": strings.TrimSpace(body.Notes),
		}
		if len(body.Brief) > 0 {
			var extra map[string]any
			if json.Unmarshal(body.Brief, &extra) == nil {
				for k, v := range extra {
					if _, exists := briefMap[k]; !exists {
						briefMap[k] = v
					}
				}
			}
		}
		brief, _ := json.Marshal(briefMap)
		ctx := r.Context()
		if _, err := pool.Exec(ctx, `INSERT INTO orders (id, customer_name, customer_email, package_tier, status, brief, amount, currency) VALUES ($1,$2,$3,$4,'pending',$5,$6,'USD')`, id, name, contact, tier, string(brief), amount); err != nil {
			fail(w, http.StatusInternalServerError, "failed to create order")
			return
		}
		if _, err := pool.Exec(ctx, `INSERT INTO order_status_history (order_id, from_status, to_status) VALUES ($1, NULL, 'pending')`, id); err != nil {
			// non-fatal
			_ = err
		}
		created(w, map[string]any{
			"id": id, "status": "pending", "amount": amount, "currency": "USD",
			"package_tier": tier,
		})
	}
}

func firstNonEmpty(v ...string) string {
	for _, s := range v {
		if strings.TrimSpace(s) != "" {
			return strings.TrimSpace(s)
		}
	}
	return ""
}

// GetOrderStatus is public: returns id + status (+ amount/tier).
func GetOrderStatus(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		var o struct {
			ID     string `json:"id"`
			Status string `json:"status"`
			Amount int    `json:"amount"`
			Tier   string `json:"package_tier"`
		}
		err := pool.QueryRow(r.Context(), `SELECT id, status, amount, package_tier FROM orders WHERE id=$1`, id).Scan(&o.ID, &o.Status, &o.Amount, &o.Tier)
		if err != nil {
			fail(w, http.StatusNotFound, "order not found")
			return
		}
		ok(w, o)
	}
}

// AdminListOrders with filter status/tier/search + pagination.
func AdminListOrders(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		page, limit, offset := pageLimit(r, 20)
		status := r.URL.Query().Get("status")
		tier := r.URL.Query().Get("tier")
		search := strings.TrimSpace(r.URL.Query().Get("search"))
		where := []string{"1=1"}
		args := []any{}
		if status != "" {
			args = append(args, status)
			where = append(where, fmt.Sprintf("status=$%d", len(args)))
		}
		if tier != "" {
			args = append(args, tier)
			where = append(where, fmt.Sprintf("package_tier=$%d", len(args)))
		}
		if search != "" {
			args = append(args, "%"+search+"%")
			where = append(where, fmt.Sprintf("(customer_name ILIKE $%d OR customer_email ILIKE $%d)", len(args), len(args)))
		}
		var total int64
		if err := pool.QueryRow(r.Context(), `SELECT COUNT(*) FROM orders WHERE `+strings.Join(where, " AND "), args...).Scan(&total); err != nil {
			fail(w, http.StatusInternalServerError, "query failed")
			return
		}
		args = append(args, limit, offset)
		q := `SELECT id, customer_name, customer_email, package_tier, status, brief, amount, currency, stripe_session, paid_at, created_at, updated_at FROM orders WHERE ` + strings.Join(where, " AND ") + fmt.Sprintf(` ORDER BY created_at DESC LIMIT $%d OFFSET $%d`, len(args)-1, len(args))
		rows, err := pool.Query(r.Context(), q, args...)
		if err != nil {
			fail(w, http.StatusInternalServerError, "query failed")
			return
		}
		defer rows.Close()
		type row struct {
			ID, CustomerName, CustomerEmail, PackageTier, Status string
			Brief                                                json.RawMessage
			Amount                                               int
			Currency                                             string
			StripeSession                                        *string
			PaidAt                                               *string
			CreatedAt, UpdatedAt                                 string
		}
		_ = row{}
		items := []map[string]any{}
		for rows.Next() {
			var id, cn, ce, pt, st, cur string
			var brief []byte
			var amt int
			var sess *string
			// scan paid_at/created/updated as strings via text
			var paidStr *string
			var cStr, uStr string
			if err := rows.Scan(&id, &cn, &ce, &pt, &st, &brief, &amt, &cur, &sess, &paidStr, &cStr, &uStr); err != nil {
				fail(w, http.StatusInternalServerError, "scan failed")
				return
			}
			m := map[string]any{
				"id": id, "customer_name": cn, "customer_email": ce,
				"package_tier": pt, "status": st, "amount": amt, "currency": cur,
				"created_at": cStr, "updated_at": uStr,
			}
			if len(brief) > 0 {
				var b any
				if json.Unmarshal(brief, &b) == nil {
					m["brief"] = b
				}
			}
			if sess != nil {
				m["stripe_session"] = *sess
			}
			if paidStr != nil {
				m["paid_at"] = *paidStr
			}
			items = append(items, m)
		}
		if items == nil {
			items = []map[string]any{}
		}
		okMeta(w, items, Meta{Page: page, Limit: limit, Total: &total})
	}
}

// AdminUpdateOrder updates status and appends order_status_history.
func AdminUpdateOrder(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		var body struct {
			Status string `json:"status"`
		}
		if !decodeJSON(w, r, &body) {
			return
		}
		body.Status = strings.ToLower(strings.TrimSpace(body.Status))
		valid := map[string]bool{"pending": true, "paid": true, "in_progress": true, "completed": true, "cancelled": true, "refunded": true}
		if !valid[body.Status] {
			fail(w, http.StatusBadRequest, "invalid status")
			return
		}
		ctx := r.Context()
		var prev string
		err := pool.QueryRow(ctx, `SELECT status FROM orders WHERE id=$1`, id).Scan(&prev)
		if err != nil {
			fail(w, http.StatusNotFound, "order not found")
			return
		}
		if body.Status == "paid" {
			_, err = pool.Exec(ctx, `UPDATE orders SET status='paid', paid_at=COALESCE(paid_at, NOW()), updated_at=NOW() WHERE id=$1`, id)
		} else {
			_, err = pool.Exec(ctx, `UPDATE orders SET status=$1, updated_at=NOW() WHERE id=$2`, body.Status, id)
		}
		if err != nil {
			fail(w, http.StatusInternalServerError, "update failed")
			return
		}
		_, _ = pool.Exec(ctx, `INSERT INTO order_status_history (order_id, from_status, to_status) VALUES ($1,$2,$3)`, id, prev, body.Status)
		// TODO: send status-change email via Resend.
		ok(w, map[string]any{"id": id, "status": body.Status})
	}
}

// AdminDeleteOrder removes an order.
func AdminDeleteOrder(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		ct, err := pool.Exec(r.Context(), `DELETE FROM orders WHERE id=$1`, id)
		if err != nil {
			fail(w, http.StatusInternalServerError, "delete failed")
			return
		}
		if ct.RowsAffected() == 0 {
			fail(w, http.StatusNotFound, "order not found")
			return
		}
		ok(w, map[string]any{"id": id, "deleted": true})
	}
}
