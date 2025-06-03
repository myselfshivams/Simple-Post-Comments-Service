package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type Post struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID    string             `bson:"user_id" json:"user_id"` //  6-8 hex characters + "@itshivam.in"
	Title     string             `bson:"title" json:"title"`
	Content   string             `bson:"content" json:"content"`
	CreatedAt int64              `bson:"created_at" json:"created_at"`
	Likes     []string           `bson:"likes" json:"likes"`
}
