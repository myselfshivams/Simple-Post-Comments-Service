# Post-Comments Service

---

### 🚀 Project Overview  
A simple app where users create posts and comment with rich text support. Like/unlike posts, see comment counts, and enjoy smooth UI.

---

### 🛠️ Features  
- Create posts & add comments  
- Comments support **bold**, *italic*, [links](https://)  
- Like/unlike posts with live counts  
- RESTful API backend with `/swagger/` docs  
- Responsive UI built with Next.js & Tailwind CSS  

---

### ⚙️ Tech Stack  

| Layer     | Technology          |
| --------- | ------------------- |
| Frontend  | Next.js, React      |
| Styling   | Tailwind CSS        |
| Backend   | Golang              |
| Database  | MongoDB             |
| Deployment| Vercel (frontend), Nginx on Ubuntu (backend) |

### 📝 API Endpoints  

| Endpoint            | Method | Description             |
|---------------------|--------|-------------------------|
| `/posts`            | POST   | Create post             |
| `/posts/get`        | GET    | Get post by ID          |
| `/posts/all`        | GET    | Get All posts           |
| `/posts/like`       | POST   | Like/unlike a post      |
| `/posts/unlike`     | POST  | Unlike a post      |
| `/comments`         | POST   | Add comment             |
| `/comments/get`     | GET    | Get comments for post   |
| `/swagger/`         | GET    | API documentation       |


### 📦 Setup & Run Locally 

**Backend**  
```bash
cd backend
go mod download
go run main.go
```

- It will run on: `http://localhost:8080`

**Frontend**  
```bash
cd frontend
npm install
npm run dev
```
- It will run on: `http://localhost:3000`

### Data Storage

We use **MongoDB**, a flexible NoSQL database, to store posts and comments as JSON-like documents. Its schema-less design allows easy updates and efficient retrieval of posts with their comments, making it ideal for this service.


### 🧩 Architecture
- Next.js frontend consumes backend REST APIs
- Backend stores posts, comments, likes in DB
- Markdown-powered comments with live updates
- Nginx as reverse proxy in production

### Deployment Links
- Frontend on Vercel: https://post-comment-service.itshivam.in/
- Backend on Ubuntu + Nginx: https://backend-post-comment-service.itshivam.in/
- API docs: https://backend-post-comment-service.itshivam.in/swagger/

