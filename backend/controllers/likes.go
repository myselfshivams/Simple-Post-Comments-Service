package controllers

import (
	"context"
	"encoding/json"
	"net/http"
	"post-comments-service/backend/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func LikePost(w http.ResponseWriter, r *http.Request) {
	type likeRequest struct {
		PostID string `json:"post_id"`
		UserID string `json:"user_id"`
	}

	var req likeRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request body: "+err.Error(), http.StatusBadRequest)
		return
	}

	postID, err := primitive.ObjectIDFromHex(req.PostID)
	if err != nil {
		http.Error(w, "Invalid PostID", http.StatusBadRequest)
		return
	}

	filter := bson.M{"_id": postID}
	update := bson.M{
		"$addToSet": bson.M{"likes": req.UserID}, // adds only if not present
	}

	result, err := postCollection.UpdateOne(context.Background(), filter, update)
	if err != nil {
		http.Error(w, "Failed to like post: "+err.Error(), http.StatusInternalServerError)
		return
	}

	if result.MatchedCount == 0 {
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Post liked successfully"))
}

func UnlikePost(w http.ResponseWriter, r *http.Request) {
	type unlikeRequest struct {
		PostID string `json:"post_id"`
		UserID string `json:"user_id"`
	}

	var req unlikeRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request body: "+err.Error(), http.StatusBadRequest)
		return
	}

	postID, err := primitive.ObjectIDFromHex(req.PostID)
	if err != nil {
		http.Error(w, "Invalid PostID", http.StatusBadRequest)
		return
	}

	filter := bson.M{"_id": postID}
	update := bson.M{
		"$pull": bson.M{"likes": req.UserID}, // remove userID from likes
	}

	result, err := postCollection.UpdateOne(context.Background(), filter, update)
	if err != nil {
		http.Error(w, "Failed to unlike post: "+err.Error(), http.StatusInternalServerError)
		return
	}

	if result.MatchedCount == 0 {
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Post unliked successfully"))
}

func GetPostWithLikes(w http.ResponseWriter, r *http.Request) {
	postIDStr := r.URL.Query().Get("postID")
	if postIDStr == "" {
		http.Error(w, "postID query parameter required", http.StatusBadRequest)
		return
	}

	postID, err := primitive.ObjectIDFromHex(postIDStr)
	if err != nil {
		http.Error(w, "Invalid postID", http.StatusBadRequest)
		return
	}

	var post models.Post
	err = postCollection.FindOne(context.Background(), bson.M{"_id": postID}).Decode(&post)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			http.Error(w, "Post not found", http.StatusNotFound)
		} else {
			http.Error(w, "Error fetching post: "+err.Error(), http.StatusInternalServerError)
		}
		return
	}

	type response struct {
		Post      models.Post `json:"post"`
		LikeCount int         `json:"like_count"`
	}

	resp := response{
		Post:      post,
		LikeCount: len(post.Likes),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
