package controllers

import (
	"context"
	"encoding/json"
	"math/rand"
	"net/http"
	"post-comments-service/backend/models"
	"regexp"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

var postCollection *mongo.Collection

func InitPostCollection(client *mongo.Client) {
	postCollection = client.Database("postcomments").Collection("posts")
}

var userIDRegex = regexp.MustCompile(`^[a-z0-9]{7}@itshivam\.in$`)

const letterBytes = "abcdefghijklmnopqrstuvwxyz0123456789"

func generateUserID() string {
	rand.Seed(time.Now().UnixNano())
	b := make([]byte, 7)
	for i := range b {
		b[i] = letterBytes[rand.Intn(len(letterBytes))]
	}
	return string(b) + "@itshivam.in"
}

func isValidUserID(userID string) bool {
	return userIDRegex.MatchString(userID)
}

func CreatePost(w http.ResponseWriter, r *http.Request) {
	var post models.Post
	err := json.NewDecoder(r.Body).Decode(&post)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if post.UserID == "" {
		post.UserID = generateUserID()
	} else {
		if !isValidUserID(post.UserID) {
			http.Error(w, "Invalid userid format", http.StatusBadRequest)
			return
		}
	}

	post.ID = primitive.NewObjectID()
	post.CreatedAt = time.Now().Unix()

	_, err = postCollection.InsertOne(context.Background(), post)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(post)
}

func GetAllPosts(w http.ResponseWriter, r *http.Request) {
	cursor, err := postCollection.Find(context.Background(), bson.M{})
	if err != nil {
		http.Error(w, "Error fetching posts: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer cursor.Close(context.Background())

	var posts []models.Post
	if err = cursor.All(context.Background(), &posts); err != nil {
		http.Error(w, "Error decoding posts: "+err.Error(), http.StatusInternalServerError)
		return
	}

	response := struct {
		Posts      []models.Post `json:"posts"`
		TotalPosts int           `json:"total_posts"`
	}{
		Posts:      posts,
		TotalPosts: len(posts),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
