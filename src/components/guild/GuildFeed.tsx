"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createGuildPost,
  toggleLike,
  addComment,
  toggleFollow,
  deleteOwnPost,
} from "@/server/actions/guild";
import { avatarGlyph } from "@/lib/enums";

interface FeedPost {
  id: string;
  content: string;
  createdAt: string;
  isMine: boolean;
  author: {
    id: string;
    displayName: string;
    avatar: string;
    level: number;
    isPrivate: boolean;
    isFollowing: boolean;
  };
  composition: { title: string; description: string; scoreLink: string } | null;
  likeCount: number;
  likedByMe: boolean;
  comments: { id: string; content: string; author: string; createdAt: string }[];
}

export function GuildFeed({
  posts,
  myPublicCompositions,
}: {
  posts: FeedPost[];
  myPublicCompositions: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [compositionId, setCompositionId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  async function post(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await createGuildPost({
      content,
      compositionId: compositionId || undefined,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Posting failed");
      return;
    }
    setContent("");
    setCompositionId("");
    router.refresh();
  }

  async function like(postId: string) {
    await toggleLike(postId);
    router.refresh();
  }

  async function comment(postId: string) {
    const draft = commentDrafts[postId]?.trim();
    if (!draft) return;
    await addComment({ postId, content: draft });
    setCommentDrafts((d) => ({ ...d, [postId]: "" }));
    router.refresh();
  }

  async function follow(userId: string) {
    await toggleFollow(userId);
    router.refresh();
  }

  async function remove(postId: string) {
    await deleteOwnPost(postId);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Post composer */}
      <form onSubmit={post} className="card space-y-3 p-4">
        <textarea
          className="input min-h-20"
          maxLength={2000}
          required
          placeholder="Announce a victory, share a discovery, post a piece…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="input max-w-xs flex-1"
            value={compositionId}
            onChange={(e) => setCompositionId(e.target.value)}
          >
            <option value="">No attached composition</option>
            {myPublicCompositions.map((c) => (
              <option key={c.id} value={c.id}>
                🎼 {c.title}
              </option>
            ))}
          </select>
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? "Posting…" : "Post to the Guild"}
          </button>
        </div>
        {myPublicCompositions.length === 0 && (
          <p className="text-xs text-parchment-500">
            Only public compositions can be attached — mark one public in the Library.
          </p>
        )}
        {error && <p className="text-sm text-crimson-400">{error}</p>}
      </form>

      {/* Feed */}
      {posts.length === 0 && (
        <p className="text-center text-parchment-500">
          The Guild hall is silent. Be the first voice.
        </p>
      )}
      {posts.map((post) => (
        <article key={post.id} className="card p-5">
          <header className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-abyss-600 bg-abyss-800 text-lg">
              {avatarGlyph(post.author.avatar)}
            </span>
            <div className="min-w-0 flex-1">
              {post.author.isPrivate && !post.isMine ? (
                <p className="text-sm font-semibold text-parchment-300">
                  {post.author.displayName}
                </p>
              ) : (
                <Link
                  href={`/guild/composer/${post.author.id}`}
                  className="text-sm font-semibold text-parchment-100 hover:text-gold-300"
                >
                  {post.author.displayName}
                </Link>
              )}
              <p className="text-xs text-parchment-500">
                Level {post.author.level} Composer ·{" "}
                {new Date(post.createdAt).toLocaleDateString()}
              </p>
            </div>
            {!post.isMine && !post.author.isPrivate && (
              <button
                onClick={() => follow(post.author.id)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  post.author.isFollowing
                    ? "border-gold-600 text-gold-300"
                    : "border-abyss-600 text-parchment-400 hover:border-gold-700/50"
                }`}
              >
                {post.author.isFollowing ? "Following" : "Follow"}
              </button>
            )}
            {post.isMine && (
              <button
                onClick={() => remove(post.id)}
                className="text-xs text-parchment-500 hover:text-crimson-400"
                title="Delete post"
              >
                ✕
              </button>
            )}
          </header>
          <p className="mt-3 whitespace-pre-wrap text-parchment-200">{post.content}</p>
          {post.composition && (
            <div className="mt-3 rounded border border-gold-700/40 bg-abyss-900/60 p-3">
              <p className="font-display text-sm text-gold-300">
                🎼 {post.composition.title}
              </p>
              {post.composition.description && (
                <p className="mt-1 text-xs text-parchment-400">
                  {post.composition.description}
                </p>
              )}
              {post.composition.scoreLink && (
                <a
                  href={post.composition.scoreLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-xs text-arcane-300"
                >
                  View score ↗
                </a>
              )}
            </div>
          )}
          <footer className="mt-3 border-t border-abyss-700/60 pt-3">
            <button
              onClick={() => like(post.id)}
              className={`text-sm transition-colors ${
                post.likedByMe ? "text-crimson-400" : "text-parchment-500 hover:text-crimson-400"
              }`}
            >
              {post.likedByMe ? "♥" : "♡"} {post.likeCount}
            </button>
            <div className="mt-3 space-y-2">
              {post.comments.map((c) => (
                <p key={c.id} className="text-sm text-parchment-300">
                  <span className="font-semibold text-parchment-100">{c.author}:</span>{" "}
                  {c.content}
                </p>
              ))}
              <div className="flex gap-2">
                <input
                  className="input flex-1 py-1.5 text-sm"
                  maxLength={1000}
                  placeholder="Add a comment…"
                  value={commentDrafts[post.id] ?? ""}
                  onChange={(e) =>
                    setCommentDrafts((d) => ({ ...d, [post.id]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      comment(post.id);
                    }
                  }}
                />
                <button onClick={() => comment(post.id)} className="btn-secondary text-xs">
                  Reply
                </button>
              </div>
            </div>
          </footer>
        </article>
      ))}
    </div>
  );
}
