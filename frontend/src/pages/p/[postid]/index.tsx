"use client";

import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  FaArrowLeft,
  FaHeart,
  FaRegHeart,
  FaCommentDots,
  FaBold,
  FaItalic,
  FaLink,
} from "react-icons/fa";
import { API_BASE_URL } from "@/utils/api";

type Post = {
  id: string;
  user_id: string; 
  title: string;
  content: string;
  created_at: number;
  likes: string[] | null;
};

type Comment = {
  user_id: string; 
  id: string;
  post_id: string;
  content: string;
  created_at: number;
};

const PostDetailPage = () => {
  const router = useRouter();
  const { postid } = router.query;
  const postId = Array.isArray(postid) ? postid[0] : postid || "";

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [sessionId, setSessionId] = useState<string>("");
  const [newComment, setNewComment] = useState("");
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [markdownHelpVisible, setMarkdownHelpVisible] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const generateSessionId = () => {
    return Math.random().toString(36).substring(2, 9);
  };

  useEffect(() => {
    const stored = localStorage.getItem("sessionId");
    if (stored) {
      setSessionId(stored);
    } else {
      const newSid = generateSessionId();
      localStorage.setItem("sessionId", newSid);
      setSessionId(newSid);
    }
  }, []);

  useEffect(() => {
    if (!sessionId || !postId) return;

    const fetchData = async () => {
      try {
        const postRes = await fetch(
          `${API_BASE_URL}/posts/get?postID=${postId}`
        );
        if (!postRes.ok) throw new Error("Failed to fetch post");
        const postData = await postRes.json();
        const fetchedPost: Post = postData.post;
        setPost(fetchedPost);

        const initialLikes: string[] = fetchedPost.likes || [];
        setLikeCount(postData.like_count ?? initialLikes.length);
        setIsLiked(initialLikes.includes(`${sessionId}@itshivam.in`));

        const commentsRes = await fetch(
          `${API_BASE_URL}/comments/get?postID=${postId}`
        );
        if (!commentsRes.ok) throw new Error("Failed to fetch comments");
        const commentsData = await commentsRes.json();
        setComments(commentsData.comments || []);
        setCommentCount(commentsData.comment_count || 0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sessionId, postId]);

  const handleLike = async () => {
    if (!post) return;
    try {
      await fetch(`${API_BASE_URL}/posts/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: post.id,
          user_id: `${sessionId}@itshivam.in`,
        }),
      });
      const toggled = !isLiked;
      setIsLiked(toggled);
      setLikeCount(toggled ? likeCount + 1 : likeCount - 1);
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !post) return;
    try {
      const res = await fetch(`${API_BASE_URL}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: post.id,
          content: newComment,
          user_id: `${sessionId}@itshivam.in`,
        }),
      });
      if (!res.ok) throw new Error("Failed to post comment");
      const created: Comment = await res.json();
      setComments((prev) => [...prev, created]);
      setCommentCount((c) => c + 1);
      setNewComment("");
      setIsEditing(false);
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  const formatText = (formatType: "bold" | "italic" | "link") => {
    let markdownSyntax = "";
    switch (formatType) {
      case "bold":
        markdownSyntax = "**bold text**";
        break;
      case "italic":
        markdownSyntax = "*italic text*";
        break;
      case "link":
        markdownSyntax = "[link text](https://)";
        break;
    }
    setNewComment((prev) => prev + markdownSyntax);
    setIsEditing(true);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  if (loading)
    return <div className="text-center py-10">Loading...</div>;
  if (!post)
    return <div className="text-center py-10">Post not found.</div>;

  const uploaderPrefix = post.user_id?.split("@")[0] || "";
  const postDisplayName =
    uploaderPrefix === sessionId ? "You" : `user-${uploaderPrefix}`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => router.push("/")}
        className="mb-6 text-blue-600 hover:text-blue-800 flex items-center gap-2"
      >
        <FaArrowLeft className="text-base" />
        Back to feed
      </button>

      {/* Post Card */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8 space-y-4">
        {/* Uploader Info */}
        <div className="flex items-center gap-3">
          <img
            src="/profile/1.png"
            alt="Profile"
            className="w-10 h-10 rounded-full object-cover"
          />
          <span className="text-sm font-medium text-gray-700">
            {postDisplayName}
          </span>
        </div>

        {/* Title & Timestamp */}
        <div className="flex justify-between items-start">
          <h1 className="text-2xl font-bold text-gray-800">
            {post.title}
          </h1>
          <span className="text-sm text-gray-500">
            {format(
              new Date(post.created_at * 1000),
              "MMM d, yyyy HH:mm"
            )}
          </span>
        </div>

        {/* Content */}
        <div className="mt-2 prose text-black max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content}
          </ReactMarkdown>
        </div>

        {/* Actions: Like & Comment Count */}
        <div className="flex mt-4 space-x-6 text-gray-500">
          {/* Like Button */}
          <button
            onClick={handleLike}
            className={`flex items-center space-x-1 transition-colors ${
              isLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"
            }`}
          >
            {isLiked ? <FaHeart /> : <FaRegHeart />}
            <span>{likeCount}</span>
          </button>

          {/* Comment Count */}
          <div className="flex items-center space-x-1 text-gray-500">
            <FaCommentDots />
            <span>{commentCount}</span>
          </div>
        </div>
      </div>

      {/* Comment Form */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-black">
            Add a comment
          </h2>
          <button
            onClick={() => setMarkdownHelpVisible((vis) => !vis)}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <FaCommentDots />
            {markdownHelpVisible ? "Hide Help" : "Markdown Help"}
          </button>
        </div>

        {markdownHelpVisible && (
          <div className="bg-gray-200 p-4 rounded-lg mb-4 text-sm text-black">
            <div className="flex space-x-2 mb-2">
              <button
                type="button"
                onClick={() => formatText("bold")}
                className="p-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                <FaBold />
              </button>
              <button
                type="button"
                onClick={() => formatText("italic")}
                className="p-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                <FaItalic />
              </button>
              <button
                type="button"
                onClick={() => formatText("link")}
                className="p-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                <FaLink />
              </button>
            </div>
            <p className="mb-2">
              Use <strong>**bold text**</strong>,{" "}
              <em>*italic text*</em>, or{" "}
              <a
                href="https://itshivam.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                [link](https://)
              </a>
              .
            </p>
            <p>Markdown supported in comments.</p>
          </div>
        )}

        {isEditing ? (
          <form onSubmit={handleCommentSubmit} className="space-y-4">
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => formatText("bold")}
                className="p-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                <FaBold />
              </button>
              <button
                type="button"
                onClick={() => formatText("italic")}
                className="p-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                <FaItalic />
              </button>
              <button
                type="button"
                onClick={() => formatText("link")}
                className="p-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                <FaLink />
              </button>
            </div>

            <textarea
              ref={textareaRef}
              placeholder="Write your comment"
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              rows={4}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />

            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Post Comment
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setNewComment("");
                }}
                className="border border-gray-300 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors text-black"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-black hover:border-blue-500 hover:text-blue-500 transition-colors"
          >
            + Add a comment
          </button>
        )}
      </div>

      {/* Comments List */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-700">
          Comments ({commentCount})
        </h2>

        {comments.length === 0 ? (
          <p className="text-gray-500 text-center py-10">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => {
            const commenterPrefix = comment.user_id?.split("@")[0] || "";
            const commentDisplayName =
              commenterPrefix === sessionId
                ? "You"
                : `user-${commenterPrefix}`;

            return (
              <div
                key={comment.id}
                className="bg-white rounded-xl shadow-md p-6 space-y-2"
              >
                <div className="flex items-center gap-3">
                  <img
                    src="/profile/1.png"
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="flex justify-between w-full items-center">
                    <span className="text-sm font-medium text-gray-700">
                      {commentDisplayName}
                    </span>
                    <span className="text-sm text-gray-500">
                      {format(
                        new Date(comment.created_at * 1000),
                        "MMM d, yyyy HH:mm"
                      )}
                    </span>
                  </div>
                </div>
                <div className="prose prose-sm max-w-none text-black">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {comment.content}
                  </ReactMarkdown>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PostDetailPage;
