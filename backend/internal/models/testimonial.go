package models

import "time"

type Testimonial struct {
	ID        string    `json:"id" db:"id"`
	Name      string    `json:"name" db:"name"`
	Position  *string   `json:"position,omitempty" db:"position"`
	Company   *string   `json:"company,omitempty" db:"company"`
	PhotoURL  *string   `json:"photo_url,omitempty" db:"photo_url"`
	Quote     string    `json:"quote" db:"quote"`
	Rating    int16     `json:"rating" db:"rating"`
	Featured  bool      `json:"featured" db:"featured"`
	Published bool      `json:"published" db:"published"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}
