package models

import "time"

type CaseStudy struct {
	ID        string    `json:"id" db:"id"`
	Title     string    `json:"title" db:"title"`
	Slug      string    `json:"slug" db:"slug"`
	Industry  *string   `json:"industry,omitempty" db:"industry"`
	HeroImage *string   `json:"hero_image,omitempty" db:"hero_image"`
	Content   *string   `json:"content,omitempty" db:"content"`
	Published bool      `json:"published" db:"published"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}
