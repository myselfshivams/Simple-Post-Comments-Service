package main

import (
	"log"
	"net/http"
	"post-comments-service/backend/config"
	"post-comments-service/backend/controllers"
	"post-comments-service/backend/routes"

	"github.com/rs/cors"
)

func main() {
	client := config.ConnectDB()
	controllers.InitCommentCollection(client)
	controllers.InitPostCollection(client)
	router := routes.SetupRoutes()
	// CORS
	c := cors.New(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE"},
	})

	handler := c.Handler(router)

	log.Println("Server running on port 8080")
	log.Fatal(http.ListenAndServe(":8080", handler))
}
