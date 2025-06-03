package controllers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"post-comments-service/backend/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

var commentCollection *mongo.Collection

func InitCommentCollection(client *mongo.Client) {
	commentCollection = client.Database("postcomments").Collection("comments")
}

// CreateComment godoc
// @Summary Create a new comment on a post
// @Description Add a comment to a specific post by postID
// @Tags comments
// @Accept json
// @Produce json
// @Param comment body models.Comment true "Comment object"
// @Success 200 {object} models.Comment
// @Failure 400 {string} string "Invalid input or missing PostID"
// @Failure 500 {string} string "Server error while saving comment"
// @Router /comments [post]

func CreateComment(w http.ResponseWriter, r *http.Request) {
	if commentCollection == nil {
		http.Error(w, "Database not initialized", http.StatusInternalServerError)
		return
	}
	var comment models.Comment

	err := json.NewDecoder(r.Body).Decode(&comment)
	if err != nil {
		http.Error(w, "Invalid input: "+err.Error(), http.StatusBadRequest)
		return
	}

	if comment.PostID.IsZero() {
		http.Error(w, "PostID is required", http.StatusBadRequest)
		return
	}

	comment.ID = primitive.NewObjectID()
	comment.CreatedAt = time.Now().Unix()

	_, err = commentCollection.InsertOne(context.Background(), comment)
	if err != nil {
		http.Error(w, "Failed to save comment: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(comment)
}

// GetCommentsByPostID godoc
// @Summary Get all comments for a specific post
// @Description Retrieve all comments linked to the given postID
// @Tags comments
// @Accept json
// @Produce json
// @Param postID query string true "Post ID in hex format"
// @Failure 400 {string} string "Missing or invalid postID"
// @Failure 500 {string} string "Server error while fetching comments"
// @Router /comments/get [get]

func GetCommentsByPostID(w http.ResponseWriter, r *http.Request) {
	postIDStr := r.URL.Query().Get("postID")
	if postIDStr == "" {
		http.Error(w, "postID query parameter is required", http.StatusBadRequest)
		return
	}

	postID, err := primitive.ObjectIDFromHex(postIDStr)
	if err != nil {
		http.Error(w, "Invalid postID", http.StatusBadRequest)
		return
	}

	filter := bson.M{"post_id": postID}

	cursor, err := commentCollection.Find(context.Background(), filter)
	if err != nil {
		http.Error(w, "Error fetching comments: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer cursor.Close(context.Background())

	var comments []models.Comment
	if err = cursor.All(context.Background(), &comments); err != nil {
		http.Error(w, "Error decoding comments: "+err.Error(), http.StatusInternalServerError)
		return
	}

	response := struct {
		PostID       string           `json:"postID"`
		Comments     []models.Comment `json:"comments"`
		CommentCount int              `json:"comment_count"`
	}{
		PostID:       postIDStr,
		Comments:     comments,
		CommentCount: len(comments),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
