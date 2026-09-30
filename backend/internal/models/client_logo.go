package models

import "time"

type ClientLogo struct {
	ID        string    `json:"id" db:"id"`
	Name      string    `json:"name" db:"name"`
	LogoURL   string    `json:"logo_url" db:"logo_url"`
	SortOrder int       `json:"sort_order" db:"sort_order"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

type SiteSetting struct {
	Key       string    `json:"key" db:"key"`
	Value     []byte    `json:"value" db:"value"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}
