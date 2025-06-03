package routes

import (
	"post-comments-service/backend/controllers"

	"github.com/gorilla/mux"
	httpSwagger "github.com/swaggo/http-swagger"
)

func SetupRoutes() *mux.Router {
	router := mux.NewRouter()

	router.HandleFunc("/posts", controllers.CreatePost).Methods("POST")
	router.HandleFunc("/comments", controllers.CreateComment).Methods("POST")
	router.HandleFunc("/posts/like", controllers.LikePost).Methods("POST")
	router.HandleFunc("/posts/unlike", controllers.UnlikePost).Methods("POST")
	router.HandleFunc("/posts/get", controllers.GetPostWithLikes).Methods("GET")
	router.HandleFunc("/comments/get", controllers.GetCommentsByPostID).Methods("GET")
	router.HandleFunc("/posts/all", controllers.GetAllPosts).Methods("GET")

	// Swagger endpoint
	router.PathPrefix("/swagger/").Handler(httpSwagger.WrapHandler)

	return router
}
