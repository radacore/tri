package models

import "time"

type BlogPost struct {
	ID              string     `json:"id" db:"id"`
	Title           string     `json:"title" db:"title"`
	Slug            string     `json:"slug" db:"slug"`
	Content         *string    `json:"content,omitempty" db:"content"`
	Category        *string    `json:"category,omitempty" db:"category"`
	ThumbnailURL    *string    `json:"thumbnail_url,omitempty" db:"thumbnail_url"`
	MetaTitle       *string    `json:"meta_title,omitempty" db:"meta_title"`
	MetaDescription *string    `json:"meta_description,omitempty" db:"meta_description"`
	Published       bool       `json:"published" db:"published"`
	PublishedAt     *time.Time `json:"published_at,omitempty" db:"published_at"`
	CreatedAt       time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at" db:"updated_at"`
}
