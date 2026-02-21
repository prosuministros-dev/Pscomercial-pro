'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@kit/ui/button';
import { Textarea } from '@kit/ui/textarea';
import { Send, Trash2, Loader2, MessageSquare, AtSign } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';

interface Comment {
  id: string;
  content: string;
  mentions: string[];
  created_at: string;
  author?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
}

interface CommentThreadProps {
  entityType: 'lead' | 'quote' | 'order';
  entityId: string;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `hace ${diffMins} min`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `hace ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `hace ${diffDays}d`;
}

export function CommentThread({ entityType, entityId }: CommentThreadProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teamMembers, setTeamMembers] = useState<
    Array<{ id: string; full_name: string }>
  >([]);
  const [showMentions, setShowMentions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch team members for @mention autocomplete
  useEffect(() => {
    fetch('/api/team')
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((d) => setTeamMembers(d.data || []))
      .catch(() => {});
  }, []);

  const fetchComments = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/comments?entity_type=${entityType}&entity_id=${entityId}`
      );
      if (response.ok) {
        const data = await response.json();
        setComments(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setIsSubmitting(true);

    try {
      // Extract @mentions from text
      const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
      const mentions: string[] = [];
      let match;
      while ((match = mentionRegex.exec(newComment)) !== null) {
        mentions.push(match[2]!);
      }

      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_type: entityType,
          entity_id: entityId,
          content: newComment,
          mentions,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al crear el comentario');
      }

      const data = await response.json();
      setComments((prev) => [...prev, data.data]);
      setNewComment('');
      toast.success('Comentario agregado');
    } catch (error) {
      console.error('Error creating comment:', error);
      toast.error('Error al agregar el comentario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments?id=${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        toast.success('Comentario eliminado');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Error al eliminar el comentario');
    }
  };

  const insertMention = (member: { id: string; full_name: string }) => {
    const mention = `@[${member.full_name}](${member.id}) `;
    setNewComment((prev) => prev + mention);
    setShowMentions(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === '@') {
      setShowMentions(true);
    }
  };

  const renderContent = (content: string) => {
    return content.replace(
      /@\[([^\]]+)\]\([^)]+\)/g,
      '<span class="text-primary font-medium">@$1</span>'
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-sm font-medium">
          Observaciones ({comments.length})
        </h4>
      </div>

      {/* Comment List */}
      <div className="space-y-3 max-h-[300px] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            No hay observaciones aún
          </div>
        ) : (
          comments.map((comment, index) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group rounded-lg border border-border p-3 space-y-1"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-medium text-primary">
                      {(comment.author?.full_name || 'U')[0]?.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium">
                    {comment.author?.full_name || 'Usuario'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {timeAgo(comment.created_at)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(comment.id)}
                >
                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                </Button>
              </div>
              <p
                className="text-sm text-foreground"
                dangerouslySetInnerHTML={{
                  __html: renderContent(comment.content),
                }}
              />
            </motion.div>
          ))
        )}
      </div>

      {/* New Comment Input */}
      <div className="space-y-2 relative">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe una observación... (Ctrl+Enter para enviar, @ para mencionar)"
              rows={2}
              disabled={isSubmitting}
              className="resize-none pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-7 w-7"
              onClick={() => setShowMentions(!showMentions)}
            >
              <AtSign className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !newComment.trim()}
            size="icon"
            className="h-auto"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Mentions Dropdown */}
        {showMentions && teamMembers.length > 0 && (
          <div className="absolute bottom-full left-0 w-64 mb-1 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto">
            {teamMembers.map((member) => (
              <button
                key={member.id}
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent/50 transition-colors"
                onClick={() => insertMention(member)}
              >
                @{member.full_name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
