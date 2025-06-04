"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  FaHeart,
  FaRegHeart,
  FaComment,
  FaShare,
  FaBookmark,
  FaRegBookmark,
} from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import { API_BASE_URL } from "@/utils/api";
import Image from "next/image";

type Post = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: number;
  likes: string[] | null;
};

type CommentCountResponse = {
  postID: string;
  comments: any[];
  comment_count: number;
};

type PostWithCount = Post & {
  like_count: number;
  comment_count: number;
};

const generateSessionId = () => {
  return Math.random().toString(36).substring(2, 9);
};

const HomePage = () => {
  const [posts, setPosts] = useState<PostWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string>("");
  const [newPost, setNewPost] = useState({ title: "", content: "" });
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [processingLikes, setProcessingLikes] = useState<Set<string>>(new Set());

  useEffect(() => {
    const storedSession = localStorage.getItem("sessionId");
    if (storedSession) {
      setSessionId(storedSession);
    } else {
      const newSession = generateSessionId();
      localStorage.setItem("sessionId", newSession);
      setSessionId(newSession);
    }

    const storedBookmarks = localStorage.getItem("bookmarkedPosts");
    if (storedBookmarks) {
      setBookmarkedIds(JSON.parse(storedBookmarks));
    }
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    const fetchPosts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/posts/all`);
        const data = await response.json();

        const postsWithCounts: PostWithCount[] = await Promise.all(
          data.posts.map(async (post: Post) => {
            const likeCount = post.likes ? post.likes.length : 0;
            const commentCount = await fetchCommentCount(post.id);
            return { ...post, like_count: likeCount, comment_count: commentCount };
          })
        );

        // Sort by created_at descending
        postsWithCounts.sort((a, b) => b.created_at - a.created_at);

        // Move bookmarked posts to top
        const bookmarkedPosts = postsWithCounts.filter((p) =>
          bookmarkedIds.includes(p.id)
        );
        const otherPosts = postsWithCounts.filter(
          (p) => !bookmarkedIds.includes(p.id)
        );
        setPosts([...bookmarkedPosts, ...otherPosts]);
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [sessionId, bookmarkedIds]);

  const fetchCommentCount = async (postId: string): Promise<number> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/comments/get?postID=${postId}`
      );
      const data: CommentCountResponse = await response.json();
      return data.comment_count || 0;
    } catch (error) {
      console.error("Error fetching comments:", error);
      return 0;
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      toast.error("Please enter both title and content.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newPost.title,
          content: newPost.content,
          user_id: `${sessionId}@itshivam.in`,
        }),
      });

      if (response.ok) {
        const createdPost: Post = await response.json();
        const likeCount = 0;
        const commentCount = 0;
        setPosts((prev) => [
          { ...createdPost, like_count: likeCount, comment_count: commentCount },
          ...prev,
        ]);
        setNewPost({ title: "", content: "" });
        toast.success("Post created!");
      } else {
        toast.error("Failed to create post.");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post.");
    }
  };

  const handleLike = async (postId: string) => {
    if (processingLikes.has(postId)) return;

    setProcessingLikes((prev) => {
      const newSet = new Set(prev);
      newSet.add(postId);
      return newSet;
    });

    try {
      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      const wasLiked = post.likes?.includes(`${sessionId}@itshivam.in`);

      await fetch(`${API_BASE_URL}/posts/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: postId,
          user_id: `${sessionId}@itshivam.in`,
        }),
      });

      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            const newLikes = wasLiked
              ? p.likes?.filter((u) => u !== `${sessionId}@itshivam.in`) || []
              : [...(p.likes || []), `${sessionId}@itshivam.in`];
            toast.success(wasLiked ? "Unliked!" : "Liked!");
            return {
              ...p,
              likes: newLikes,
              like_count: wasLiked ? p.like_count - 1 : p.like_count + 1,
            };
          }
          return p;
        })
      );
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Failed to toggle like.");
    } finally {
      setProcessingLikes((prev) => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  };

  const handleShare = (postId: string) => {
    const url = `${window.location.origin}/p/${postId}`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Link copied to clipboard"))
      .catch(() => toast.error("Failed to copy link"));
  };

  const toggleBookmark = (postId: string) => {
    setBookmarkedIds((prev) => {
      let updated: string[];
      if (prev.includes(postId)) {
        updated = prev.filter((id) => id !== postId);
      } else {
        updated = [...prev, postId];
      }
      localStorage.setItem("bookmarkedPosts", JSON.stringify(updated));
      return updated;
    });
  };

  const getUserProfileImage = (userId: string) => {
    if (!userId) return "/profile/1.png";
    return "/profile/1.png";
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Toaster position="top-right" />
        {/* Skeleton for Create Post */}
        <div className="bg-white rounded-xl shadow-md p-6 animate-pulse space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-6 bg-gray-200 rounded"></div>
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        </div>

        {/* Skeleton for 3 Post Cards */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow-md p-6 animate-pulse space-y-4"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="flex space-x-4">
              <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
              <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
              <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Toaster position="top-right" />

      <h1 className="text-3xl font-bold mb-8 text-center">
        Post-Comments Service
      </h1>

      {/* Create Post */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-black">
          Create New Post
        </h2>
        <div className="flex items-center mb-4">
          <div className="relative w-10 h-10 mr-3">
            <Image
              src="/profile/1.png"
              alt="Your profile"
              className="rounded-full object-cover"
              width={40}
              height={40}
            />
          </div>
          <div>
            <div className="font-bold text-gray-900">You</div>
          </div>
        </div>
        <input
          type="text"
          placeholder="Title"
          className="w-full p-3 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
          value={newPost.title}
          onChange={(e) =>
            setNewPost({ ...newPost, title: e.target.value })
          }
        />
        <textarea
          placeholder="What's on your mind?"
          className="w-full p-3 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
          rows={3}
          value={newPost.content}
          onChange={(e) =>
            setNewPost({ ...newPost, content: e.target.value })
          }
        />
        <button
          onClick={handleCreatePost}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Post
        </button>
      </div>

      {/* Posts List */}
      <div className="space-y-6">
        {posts.map((post) => {
          const isBookmarked = bookmarkedIds.includes(post.id);
          const isProcessing = processingLikes.has(post.id);
          const isLiked = post.likes?.includes(`${sessionId}@itshivam.in`);
          const isCurrentUser = post.user_id === `${sessionId}@itshivam.in`;
          const username = post.user_id.split("@")[0] || "Anonymous";

          return (
            <div
              key={post.id}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                {/* User info header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="relative w-10 h-10 mr-3">
                      <Image
                        src={getUserProfileImage(post.user_id)}
                        alt={isCurrentUser ? "Your profile" : `${username}'s profile`}
                        className="rounded-full object-cover"
                        width={40}
                        height={40}
                      />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">
                        {isCurrentUser ? "You" : `User-${username}`}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(post.created_at * 1000), "MMM d, yyyy HH:mm")}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleBookmark(post.id)}
                    className="text-gray-400 hover:text-yellow-500"
                  >
                    {isBookmarked ? (
                      <FaBookmark className="text-yellow-500" />
                    ) : (
                      <FaRegBookmark />
                    )}
                  </button>
                </div>

                {/* Post content */}
                <h2 className="text-xl font-bold text-gray-800 mb-3">
                  {post.title}
                </h2>
                <p className="text-gray-600 mb-4">{post.content}</p>

                {/* Action buttons */}
                <div className="flex space-x-6 text-gray-500 pt-4 border-t border-gray-100">
                  {/* Like Button */}
                  <button
                    onClick={() => handleLike(post.id)}
                    disabled={isProcessing}
                    className={`flex items-center space-x-1 transition-colors ${
                      isLiked ? "text-red-500" : "hover:text-red-500"
                    } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {isLiked ? <FaHeart /> : <FaRegHeart />}
                    <span>{post.like_count}</span>
                  </button>

                  {/* Comment Count */}
                  <a
                    href={`/p/${post.id}`}
                    className="flex items-center space-x-1 hover:text-blue-500"
                  >
                    <FaComment />
                    <span>{post.comment_count}</span>
                  </a>

                  {/* Share Button */}
                  <button
                    onClick={() => handleShare(post.id)}
                    className="flex items-center space-x-1 hover:text-green-500"
                  >
                    <FaShare />
                    <span>Share</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HomePage;
