package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type Comment struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	PostID    primitive.ObjectID `bson:"post_id" json:"post_id"`
	Content   string             `bson:"content" json:"content"` // Supports Markdown/HTML
	CreatedAt int64              `bson:"created_at" json:"created_at"`
}
