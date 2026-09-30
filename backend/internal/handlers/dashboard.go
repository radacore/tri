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
		ok(w, map[string]any{
			"total_orders":  stats.TotalOrders,
			"revenue_cents": stats.RevenueCents,
			"pending_count": stats.PendingCount,
			"recent_orders": recent,
		})
	}
}
