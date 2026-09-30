package models

import (
	"encoding/json"
	"time"
)

type Order struct {
	ID            string          `json:"id" db:"id"`
	CustomerName  string          `json:"customer_name" db:"customer_name"`
	CustomerEmail string          `json:"customer_email" db:"customer_email"`
	PackageTier   string          `json:"package_tier" db:"package_tier"`
	Status        string          `json:"status" db:"status"`
	Brief         json.RawMessage `json:"brief,omitempty" db:"brief"`
	Amount        int             `json:"amount" db:"amount"`
	Currency      string          `json:"currency" db:"currency"`
	StripeSession *string         `json:"stripe_session,omitempty" db:"stripe_session"`
	PaidAt        *time.Time      `json:"paid_at,omitempty" db:"paid_at"`
	CreatedAt     time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time       `json:"updated_at" db:"updated_at"`
}

type OrderStatusHistory struct {
	ID         string    `json:"id" db:"id"`
	OrderID    string    `json:"order_id" db:"order_id"`
	FromStatus *string   `json:"from_status,omitempty" db:"from_status"`
	ToStatus   string    `json:"to_status" db:"to_status"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
}
