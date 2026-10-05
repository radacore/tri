package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"brandingpulse/backend/internal/config"
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
			Target        string          `json:"target"`
			Vibes         []string        `json:"vibes"`
			Colors        []string        `json:"colors"`
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
			"industry": strings.TrimSpace(body.Industry), "target": strings.TrimSpace(body.Target),
			"vibes": body.Vibes, "colors": body.Colors,
			"notes": strings.TrimSpace(body.Notes),
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
		q := `SELECT id, customer_name, customer_email, customer_phone, package_tier, status, stage, brief, amount, currency, stripe_session, paid_at, notes, payment_proof, deliverables, created_at, updated_at FROM orders WHERE ` + strings.Join(where, " AND ") + fmt.Sprintf(` ORDER BY created_at DESC LIMIT $%d OFFSET $%d`, len(args)-1, len(args))
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
			var id, cn, ce, pt, st, stage, cur string
			var phone, notes, proof *string
			var brief []byte
			var amt int
			var sess *string
			var delivs []string
			// scan paid_at/created/updated as strings via text
			var paidStr, cStr, uStr tsString
			if err := rows.Scan(&id, &cn, &ce, &phone, &pt, &st, &stage, &brief, &amt, &cur, &sess, &paidStr, &notes, &proof, &delivs, &cStr, &uStr); err != nil {
				fail(w, http.StatusInternalServerError, "scan failed")
				return
			}
			m := map[string]any{
				"id": id, "customer_name": cn, "customer_email": ce,
				"customer_phone": strp(phone), "package_tier": pt, "status": st, "stage": stage, "amount": amt, "currency": cur,
				"notes": strp(notes), "payment_proof": strp(proof), "deliverables": delivs,
				"created_at": cStr.String(), "updated_at": uStr.String(),
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
			if paidStr.String() != "" {
				m["paid_at"] = paidStr.String()
			}
			items = append(items, m)
		}
		if items == nil {
			items = []map[string]any{}
		}
		attachOrderHistory(r.Context(), pool, items)
		okMeta(w, items, Meta{Page: page, Limit: limit, Total: &total})
	}
}

// attachOrderHistory mengisi m["history"] untuk tiap order sekaligus.
func attachOrderHistory(ctx context.Context, pool *pgxpool.Pool, items []map[string]any) {
	ids := make([]string, 0, len(items))
	byID := map[string]map[string]any{}
	for _, m := range items {
		if id, _ := m["id"].(string); id != "" {
			ids = append(ids, id)
			byID[id] = m
		}
	}
	if len(ids) == 0 {
		return
	}
	rows, err := pool.Query(ctx, `SELECT order_id, from_status, to_status, stage_to, note, created_at FROM order_status_history WHERE order_id = ANY($1) ORDER BY created_at ASC`, ids)
	if err != nil {
		return
	}
	defer rows.Close()
	for rows.Next() {
		var oid string
		var from, stageTo, note *string
		var to string
		var at tsString
		if err := rows.Scan(&oid, &from, &to, &stageTo, &note, &at); err != nil {
			continue
		}
		m := byID[oid]
		if m == nil {
			continue
		}
		h := map[string]any{"at": at.String(), "status": to, "stage": strp(stageTo), "note": strp(note)}
		if from != nil {
			h["from"] = *from
		}
		cur, _ := m["history"].([]map[string]any)
		m["history"] = append(cur, h)
	}
}

// AdminUpdateOrder updates status, contact/proof/deliverables and appends history.
func AdminUpdateOrder(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		var body struct {
			Status       *string  `json:"status"`
			Stage        *string  `json:"stage"`
			Note         *string  `json:"note"`
			Deliverables []string `json:"deliverables"`
			PaymentProof *string  `json:"payment_proof"`
			Phone        *string  `json:"customer_phone"`
			Notes        *string  `json:"notes"`
		}
		if !decodeJSON(w, r, &body) {
			return
		}
		ctx := r.Context()
		var prev string
		err := pool.QueryRow(ctx, `SELECT status FROM orders WHERE id=$1`, id).Scan(&prev)
		if err != nil {
			fail(w, http.StatusNotFound, "order not found")
			return
		}
		stageTo := ""
		if body.Stage != nil {
			stageTo = strings.ToLower(strings.TrimSpace(*body.Stage))
			validStage := map[string]bool{"brief": true, "concepts": true, "revision": true, "delivery": true, "done": true}
			if !validStage[stageTo] {
				fail(w, http.StatusBadRequest, "invalid stage")
				return
			}
			if _, err := pool.Exec(ctx, `UPDATE orders SET stage=$1, updated_at=NOW() WHERE id=$2`, stageTo, id); err != nil {
				fail(w, http.StatusInternalServerError, "update failed")
				return
			}
		}
		if body.Status != nil {
			st := strings.ToLower(strings.TrimSpace(*body.Status))
			valid := map[string]bool{"pending": true, "paid": true, "in_progress": true, "revision": true, "completed": true, "delivered": true, "cancelled": true, "refunded": true}
			if !valid[st] {
				fail(w, http.StatusBadRequest, "invalid status")
				return
			}
			if st == "paid" {
				_, err = pool.Exec(ctx, `UPDATE orders SET status='paid', paid_at=COALESCE(paid_at, NOW()), stage=CASE WHEN stage='brief' THEN 'concepts' ELSE stage END, updated_at=NOW() WHERE id=$1`, id)
				if err == nil && stageTo == "" {
					_, _ = pool.Exec(ctx, `INSERT INTO order_status_history (order_id, from_status, to_status, stage_to, note) VALUES ($1,'pending','paid','concepts','accepted, moved to concepts')`, id)
				}
			} else {
				_, err = pool.Exec(ctx, `UPDATE orders SET status=$1, updated_at=NOW() WHERE id=$2`, st, id)
			}
			if err != nil {
				fail(w, http.StatusInternalServerError, "update failed")
				return
			}
			var note *string
			if body.Note != nil && strings.TrimSpace(*body.Note) != "" {
				note = body.Note
			}
			_, _ = pool.Exec(ctx, `INSERT INTO order_status_history (order_id, from_status, to_status, note) VALUES ($1,$2,$3,$4)`, id, prev, st, note)
			prev = st
		}
		if stageTo != "" {
			note := "moved to " + stageTo + " via kanban"
			if body.Note != nil && strings.TrimSpace(*body.Note) != "" {
				note = strings.TrimSpace(*body.Note)
			}
			_, _ = pool.Exec(ctx, `INSERT INTO order_status_history (order_id, from_status, to_status, stage_to, note) VALUES ($1,$2,$2,$3,$4)`, id, prev, stageTo, note)
		}
		if body.Deliverables != nil {
			if _, err := pool.Exec(ctx, `UPDATE orders SET deliverables=$1, updated_at=NOW() WHERE id=$2`, body.Deliverables, id); err != nil {
				fail(w, http.StatusInternalServerError, "update failed")
				return
			}
		}
		if body.PaymentProof != nil {
			if _, err := pool.Exec(ctx, `UPDATE orders SET payment_proof=NULLIF($1,''), updated_at=NOW() WHERE id=$2`, strings.TrimSpace(*body.PaymentProof), id); err != nil {
				fail(w, http.StatusInternalServerError, "update failed")
				return
			}
		}
		if body.Phone != nil {
			if _, err := pool.Exec(ctx, `UPDATE orders SET customer_phone=NULLIF($1,''), updated_at=NOW() WHERE id=$2`, strings.TrimSpace(*body.Phone), id); err != nil {
				fail(w, http.StatusInternalServerError, "update failed")
				return
			}
		}
		if body.Notes != nil {
			if _, err := pool.Exec(ctx, `UPDATE orders SET notes=NULLIF($1,''), updated_at=NOW() WHERE id=$2`, strings.TrimSpace(*body.Notes), id); err != nil {
				fail(w, http.StatusInternalServerError, "update failed")
				return
			}
		}
		ok(w, map[string]any{"id": id, "status": prev})
	}
}

// AdminCreateOrder mencatat transaksi manual (order via WA yang tidak lewat form).
func AdminCreateOrder(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var b struct {
			CustomerName  string   `json:"customer_name"`
			CustomerEmail string   `json:"customer_email"`
			Phone         string   `json:"customer_phone"`
			PackageTier   string   `json:"package_tier"`
			AmountUSD     *float64 `json:"amount_usd"`
			Brief         string   `json:"brief"`
			Notes         string   `json:"notes"`
			MarkPaid      bool     `json:"mark_paid"`
		}
		if !decodeJSON(w, r, &b) {
			return
		}
		name := strings.TrimSpace(b.CustomerName)
		tier := strings.ToLower(strings.TrimSpace(b.PackageTier))
		amount, okTier := tierAmounts[tier]
		if !okTier {
			fail(w, http.StatusBadRequest, "package_tier must be starter|professional|premium")
			return
		}
		if b.AmountUSD != nil && *b.AmountUSD > 0 {
			amount = int(*b.AmountUSD * 100)
		}
		if name == "" {
			fail(w, http.StatusBadRequest, "customer_name is required")
			return
		}
		id := uuid.NewString()
		briefMap := map[string]any{"name": name, "contact": strings.TrimSpace(b.CustomerEmail), "notes": strings.TrimSpace(b.Brief)}
		brief, _ := json.Marshal(briefMap)
		st := "pending"
		if b.MarkPaid {
			st = "paid"
		}
		paidExpr := "NULL"
		if st == "paid" {
			paidExpr = "NOW()"
		}
		ctx := r.Context()
		if _, err := pool.Exec(ctx, `INSERT INTO orders (id, customer_name, customer_email, customer_phone, package_tier, status, brief, amount, currency, notes, paid_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'USD',$9,`+paidExpr+`)`,
			id, name, strings.TrimSpace(b.CustomerEmail), strings.TrimSpace(b.Phone), tier, st, string(brief), amount, strings.TrimSpace(b.Notes)); err != nil {
			fail(w, http.StatusInternalServerError, "failed to create order")
			return
		}
		_, _ = pool.Exec(ctx, `INSERT INTO order_status_history (order_id, from_status, to_status, note) VALUES ($1,NULL,$2,'input manual')`, id, st)
		created(w, map[string]any{"id": id, "status": st, "amount": amount})
	}
}

// OrdersSummary rekap transaksi: total, per status, per tier, follow-up.
func OrdersSummary(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		from := strings.TrimSpace(r.URL.Query().Get("from"))
		to := strings.TrimSpace(r.URL.Query().Get("to"))
		args := []any{}
		where := "1=1"
		if from != "" {
			args = append(args, from)
			where += fmt.Sprintf(" AND created_at >= $%d::date", len(args))
		}
		if to != "" {
			args = append(args, to)
			where += fmt.Sprintf(" AND created_at < ($%d::date + INTERVAL '1 day')", len(args))
		}
		ctx := r.Context()
		var totalOrders int64
		var totalRevenue int64
		_ = pool.QueryRow(ctx, `SELECT COUNT(*), COALESCE(SUM(amount) FILTER (WHERE status IN ('paid','in_progress','revision','completed','delivered')),0) FROM orders WHERE `+where, args...).Scan(&totalOrders, &totalRevenue)
		byStatus := []map[string]any{}
		rows, err := pool.Query(ctx, `SELECT status, COUNT(*), COALESCE(SUM(amount),0) FROM orders WHERE `+where+` GROUP BY status ORDER BY COUNT(*) DESC`, args...)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var st string
				var c, rev int64
				if err := rows.Scan(&st, &c, &rev); err == nil {
					byStatus = append(byStatus, map[string]any{"status": st, "count": c, "revenue_cents": rev})
				}
			}
		}
		byTier := []map[string]any{}
		rows2, err := pool.Query(ctx, `SELECT package_tier, COUNT(*), COALESCE(SUM(amount) FILTER (WHERE status IN ('paid','in_progress','revision','completed','delivered')),0) FROM orders WHERE `+where+` GROUP BY package_tier ORDER BY COUNT(*) DESC`, args...)
		if err == nil {
			defer rows2.Close()
			for rows2.Next() {
				var tier string
				var c, rev int64
				if err := rows2.Scan(&tier, &c, &rev); err == nil {
					byTier = append(byTier, map[string]any{"tier": tier, "count": c, "revenue_cents": rev})
				}
			}
		}
		var followup int64
		_ = pool.QueryRow(ctx, `SELECT COUNT(*) FROM orders WHERE status='pending' AND created_at < NOW() - INTERVAL '24 hours'`).Scan(&followup)
		ok(w, map[string]any{
			"total_orders": totalOrders, "total_revenue_cents": totalRevenue,
			"by_status": byStatus, "by_tier": byTier, "pending_followup": followup,
		})
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
