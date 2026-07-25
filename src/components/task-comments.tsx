'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { MessageSquare, Send, Trash2, User as UserIcon } from 'lucide-react';
import { Comment, User } from '@/lib/initial-data';

interface TaskCommentsProps {
  taskId: string;
  currentUser: User | null;
  teamMembers: User[];
}

export function TaskComments({ taskId, currentUser, teamMembers }: TaskCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/comments?taskId=${taskId}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim(), taskId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add comment');

      toast.success('Comment posted');
      setNewComment('');
      fetchComments();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error adding comment';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const res = await fetch(`/api/comments?id=${commentId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete comment');

      toast.success('Comment deleted');
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error deleting comment';
      toast.error(msg);
    }
  };

  return (
    <div className="skeuo-panel p-5 rounded-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-600" />
          <span>Task Discussion & Comments ({comments.length})</span>
        </h4>
      </div>

      {/* Comments Feed */}
      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
        {loading ? (
          <div className="py-6 text-center text-xs text-slate-400 font-medium">
            Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 font-medium bg-slate-50 rounded-xl">
            No comments yet. Start the discussion below!
          </div>
        ) : (
          comments.map((comm) => {
            const author = teamMembers.find((m) => m.id === comm.authorId);
            const isOwnComment = currentUser?.id === comm.authorId || currentUser?.role === 'admin';

            return (
              <div
                key={comm.id}
                className="skeuo-card p-3.5 rounded-xl space-y-2 relative group hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full skeuo-badge overflow-hidden flex items-center justify-center font-bold text-[10px] text-blue-700 shrink-0">
                      {author?.avatar ? (
                        // eslint-disable-next-next/no-img-element
                        <img src={author.avatar} alt={author.name} className="w-full h-full object-cover" />
                      ) : (
                        author?.name.charAt(0) || 'U'
                      )}
                    </div>
                    <span className="text-xs font-bold text-slate-900">
                      {author?.name || 'Workspace Member'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(comm.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Delete Own Comment Button */}
                  {isOwnComment && (
                    <button
                      onClick={() => handleDeleteComment(comm.id)}
                      title="Delete Comment"
                      className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer p-1 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-700 leading-relaxed font-medium pl-8">
                  {comm.content}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Add Comment Input Form */}
      {currentUser && (
        <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-2 border-t border-slate-200">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="skeuo-input block flex-1 px-3.5 py-2 rounded-xl text-xs font-medium placeholder-slate-400"
          />
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="skeuo-button-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Post</span>
          </button>
        </form>
      )}
    </div>
  );
}
