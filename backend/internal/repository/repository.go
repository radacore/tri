package repository

import (
	"context"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"brandingpulse/backend/internal/models"
)

func Pagination(r interface {
	Query() map[string][]string
}) (page, limit int) {
	return 1, 12
}

// ParsePageLimit parses page/limit query params with sane bounds.
func ParsePageLimit(pageStr, limitStr string) (page, limit, offset int) {
	page = atoiOr(pageStr, 1)
	limit = atoiOr(limitStr, 12)
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 12
	}
	if limit > 100 {
		limit = 100
	}
	offset = (page - 1) * limit
	return page, limit, offset
}

func atoiOr(s string, def int) int {
	if s == "" {
		return def
	}
	var n int
	if _, err := fmt.Sscanf(strings.TrimSpace(s), "%d", &n); err != nil {
		return def
	}
	return n
}

type DashboardStats struct {
	TotalOrders   int64 `json:"total_orders"`
	RevenueCents  int64 `json:"revenue_cents"`
	PendingCount  int64 `json:"pending_count"`
	PublishedBlog int64 `json:"published_blog,omitempty"`
}

func GetDashboardStats(ctx context.Context, pool *pgxpool.Pool) (DashboardStats, []models.Order, error) {
	var s DashboardStats
	if err := pool.QueryRow(ctx, `SELECT COUNT(*) FROM orders`).Scan(&s.TotalOrders); err != nil {
		return s, nil, err
	}
	if err := pool.QueryRow(ctx, `SELECT COALESCE(SUM(amount),0) FROM orders WHERE status='paid'`).Scan(&s.RevenueCents); err != nil {
		return s, nil, err
	}
	if err := pool.QueryRow(ctx, `SELECT COUNT(*) FROM orders WHERE status='pending'`).Scan(&s.PendingCount); err != nil {
		return s, nil, err
	}
	rows, err := pool.Query(ctx, `SELECT id, customer_name, customer_email, package_tier, status, brief, amount, currency, stripe_session, paid_at, created_at, updated_at FROM orders ORDER BY created_at DESC LIMIT 5`)
	if err != nil {
		return s, nil, err
	}
	defer rows.Close()
	recent, err := scanOrders(rows)
	if err != nil {
		return s, nil, err
	}
	return s, recent, nil
}

func scanOrders(rows pgx.Rows) ([]models.Order, error) {
	var out []models.Order
	for rows.Next() {
		var o models.Order
		if err := rows.Scan(&o.ID, &o.CustomerName, &o.CustomerEmail, &o.PackageTier, &o.Status, &o.Brief, &o.Amount, &o.Currency, &o.StripeSession, &o.PaidAt, &o.CreatedAt, &o.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, o)
	}
	if out == nil {
		out = []models.Order{}
	}
	return out, rows.Err()
}
