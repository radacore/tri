package handlers

import (
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
	"logopulse/backend/internal/repository"
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
		ok(w, map[string]any{
			"total_orders":     stats.TotalOrders,
			"revenue_cents":    stats.RevenueCents,
			"pending_count":    stats.PendingCount,
			"recent_orders":    recent,
			"orders_by_status": byStatus,
			"featured_count":   featured,
			"new_customers":    customers,
		})
	}
}
