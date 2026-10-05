package handlers

import (
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"brandingpulse/backend/internal/repository"
)

// GetDashboardStats returns totals + recent 5 orders.
func GetDashboardStats(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		stats, recent, err := repository.GetDashboardStats(r.Context(), pool)
		if err != nil {
			fail(w, http.StatusInternalServerError, "query failed")
			return
		}
		ctx := r.Context()
		type statusRow struct {
			Status string `json:"status"`
			Count  int64  `json:"count"`
		}
		byStatus := []statusRow{}
		if rows, err := pool.Query(ctx, `SELECT status, COUNT(*) FROM orders GROUP BY status ORDER BY COUNT(*) DESC`); err == nil {
			defer rows.Close()
			for rows.Next() {
				var s statusRow
				if err := rows.Scan(&s.Status, &s.Count); err == nil {
					byStatus = append(byStatus, s)
				}
			}
		}
		var featured, customers int64
		_ = pool.QueryRow(ctx, `SELECT COUNT(*) FROM portfolio_items WHERE featured=TRUE`).Scan(&featured)
		_ = pool.QueryRow(ctx, `SELECT COUNT(DISTINCT customer_email) FROM orders`).Scan(&customers)
		type weekRow struct {
			Week  string `json:"week"`
			Cents int64  `json:"revenue_cents"`
		}
		byWeek := []weekRow{}
		revMap := map[string]int64{}
		if rows, err := pool.Query(ctx, `SELECT to_char(date_trunc('week', created_at), 'YYYY-MM-DD'), COALESCE(SUM(amount) FILTER (WHERE status IN ('paid','in_progress','revision','completed','delivered')),0) FROM orders WHERE created_at >= date_trunc('week', NOW()) - INTERVAL '7 weeks' GROUP BY 1`); err == nil {
			defer rows.Close()
			for rows.Next() {
				var wk string
				var rev int64
				if err := rows.Scan(&wk, &rev); err == nil {
					revMap[wk] = rev
				}
			}
		}
		monday := time.Now().AddDate(0, 0, -int((int(time.Now().Weekday())+6)%7))
		monday = time.Date(monday.Year(), monday.Month(), monday.Day(), 0, 0, 0, 0, monday.Location())
		for i := 7; i >= 0; i-- {
			key := monday.AddDate(0, 0, -7*i).Format("2006-01-02")
			byWeek = append(byWeek, weekRow{Week: key, Cents: revMap[key]})
		}
		ok(w, map[string]any{
			"total_orders":     stats.TotalOrders,
			"revenue_cents":    stats.RevenueCents,
			"pending_count":    stats.PendingCount,
			"recent_orders":    recent,
			"orders_by_status": byStatus,
			"revenue_by_week":  byWeek,
			"featured_count":   featured,
			"new_customers":    customers,
		})
	}
}
