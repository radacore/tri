package models

import "time"

type PortfolioItem struct {
	ID          string    `json:"id" db:"id"`
	Title       string    `json:"title" db:"title"`
	Category    *string   `json:"category,omitempty" db:"category"`
	ImageURL    string    `json:"image_url" db:"image_url"`
	Description *string   `json:"description,omitempty" db:"description"`
	Featured    bool      `json:"featured" db:"featured"`
	Published   bool      `json:"published" db:"published"`
	SortOrder   int       `json:"sort_order" db:"sort_order"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}
