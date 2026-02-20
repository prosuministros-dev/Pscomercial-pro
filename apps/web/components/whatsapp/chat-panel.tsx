'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Clock,
  Loader2,
  MessageCircle,
  Search,
  Send,
} from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Badge } from '@kit/ui/badge';
import { Skeleton } from '@kit/ui/skeleton';
import { ScrollArea } from '@kit/ui/scroll-area';
import { cn } from '@kit/ui/utils';
import { toast } from 'sonner';

import { useSupabase } from '@kit/supabase/hooks/use-supabase';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Conversation {
  id: string;
  customer_name: string;
  customer_phone: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  status: 'bot' | 'active' | 'human' | 'closed';
}

interface Message {
  id: string;
  conversation_id: string;
  direction: 'inbound' | 'outbound';
  body: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  created_at: string;
  sender_name?: string;
}

type MobileView = 'list' | 'chat';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `${diffMins} min`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

const STATUS_CONFIG: Record<
  Conversation['status'],
  { label: string; className: string }
> = {
  bot: {
    label: 'Bot',
    className:
      'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
  },
  active: {
    label: 'Activa',
    className:
      'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
  },
  human: {
    label: 'Humano',
    className:
      'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
  },
  closed: {
    label: 'Cerrada',
    className:
      'bg-gray-500/15 text-gray-700 dark:text-gray-400 border-gray-500/30',
  },
};

/* ------------------------------------------------------------------ */
/*  Delivery status icon                                               */
/* ------------------------------------------------------------------ */

function DeliveryStatus({ status }: { status: Message['status'] }) {
  switch (status) {
    case 'sent':
      return <Check className="h-3.5 w-3.5 text-muted-foreground" />;
    case 'delivered':
      return <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />;
    case 'read':
      return <CheckCheck className="h-3.5 w-3.5 text-blue-500" />;
    case 'failed':
      return <Clock className="h-3.5 w-3.5 text-destructive" />;
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Conversation list                                                  */
/* ------------------------------------------------------------------ */

function ConversationList({
  conversations,
  selectedId,
  onSelect,
  isLoading,
  searchQuery,
  onSearchChange,
}: {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (c: Conversation) => void;
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}) {
  return (
    <div className="flex h-full flex-col border-r border-border bg-card">
      {/* Search */}
      <div className="border-b border-border p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar conversación..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-3 rounded-lg p-3">
                <Skeleton className="h-10 w-10 flex-shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <MessageCircle className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">
              Sin conversaciones
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              {searchQuery
                ? 'No se encontraron resultados'
                : 'Las conversaciones aparecerán aquí'}
            </p>
          </div>
        ) : (
          <div className="space-y-0.5 p-1.5">
            {conversations.map((conv) => {
              const statusCfg = STATUS_CONFIG[conv.status] ?? STATUS_CONFIG.closed;
              const isSelected = selectedId === conv.id;

              return (
                <motion.button
                  key={conv.id}
                  onClick={() => onSelect(conv)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors',
                    isSelected
                      ? 'bg-primary/10 dark:bg-primary/15'
                      : 'hover:bg-muted/50',
                  )}
                >
                  {/* Avatar circle */}
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#25D366]/15 text-sm font-bold text-[#25D366]">
                    {conv.customer_name
                      .split(' ')
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-foreground">
                        {conv.customer_name}
                      </span>
                      <span className="flex-shrink-0 text-xs text-muted-foreground">
                        {timeAgo(conv.last_message_at)}
                      </span>
                    </div>

                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <p className="truncate text-xs text-muted-foreground">
                        {conv.last_message ?? 'Sin mensajes'}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={cn(
                            'px-1.5 py-0 text-[10px]',
                            statusCfg.className,
                          )}
                        >
                          {statusCfg.label}
                        </Badge>
                        {conv.unread_count > 0 && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#25D366] text-[10px] font-bold text-white">
                            {conv.unread_count > 99
                              ? '99+'
                              : conv.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Chat area                                                          */
/* ------------------------------------------------------------------ */

function ChatArea({
  conversation,
  messages,
  isLoading,
  onSend,
  isSending,
  onBack,
}: {
  conversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  onSend: (text: string) => void;
  isSending: boolean;
  onBack?: () => void;
}) {
  const [inputText, setInputText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Auto-scroll to bottom */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;
    onSend(text);
    setInputText('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* Empty state */
  if (!conversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-muted/5 p-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <MessageCircle className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            Selecciona una conversación
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Elige una conversación del panel izquierdo para ver los mensajes
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Chat header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#25D366]/15 text-xs font-bold text-[#25D366]">
          {conversation.customer_name
            .split(' ')
            .map((w) => w[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()}
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="truncate text-sm font-semibold text-foreground">
            {conversation.customer_name}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {conversation.customer_phone}
          </p>
        </div>
        <Badge
          variant="outline"
          className={cn(
            'text-xs',
            STATUS_CONFIG[conversation.status]?.className,
          )}
        >
          {STATUS_CONFIG[conversation.status]?.label}
        </Badge>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-3">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'flex',
                  i % 2 === 0 ? 'justify-start' : 'justify-end',
                )}
              >
                <Skeleton
                  className={cn(
                    'h-12 rounded-2xl',
                    i % 2 === 0 ? 'w-52' : 'w-44',
                  )}
                />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center py-16 text-center">
            <p className="text-sm text-muted-foreground">
              No hay mensajes en esta conversación
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {messages.map((msg) => {
                const isOutbound = msg.direction === 'outbound';

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      'flex',
                      isOutbound ? 'justify-end' : 'justify-start',
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[75%] rounded-2xl px-4 py-2 shadow-sm',
                        isOutbound
                          ? 'rounded-br-md bg-[#DCF8C6] text-gray-900 dark:bg-[#056162] dark:text-gray-100'
                          : 'rounded-bl-md bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100',
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words text-sm">
                        {msg.body}
                      </p>
                      <div
                        className={cn(
                          'mt-1 flex items-center gap-1',
                          isOutbound ? 'justify-end' : 'justify-start',
                        )}
                      >
                        <span className="text-[10px] text-muted-foreground dark:text-gray-400">
                          {formatTime(msg.created_at)}
                        </span>
                        {isOutbound && <DeliveryStatus status={msg.status} />}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* Message input */}
      <div className="border-t border-border bg-card p-3">
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            placeholder="Escribe un mensaje..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSending || conversation.status === 'closed'}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={
              isSending || !inputText.trim() || conversation.status === 'closed'
            }
            size="icon"
            className="bg-[#25D366] text-white hover:bg-[#1da851]"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        {conversation.status === 'closed' && (
          <p className="mt-1.5 text-center text-xs text-muted-foreground">
            Esta conversación está cerrada
          </p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main ChatPanel component                                           */
/* ------------------------------------------------------------------ */

export function ChatPanel() {
  const supabase = useSupabase();

  /* State */
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileView, setMobileView] = useState<MobileView>('list');

  /* ---- Fetch conversations ---- */
  const fetchConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    try {
      const res = await fetch('/api/whatsapp/conversations');
      if (!res.ok) throw new Error('Error al cargar conversaciones');
      const data = await res.json();
      setConversations(data.data ?? []);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      toast.error('Error al cargar conversaciones');
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  /* ---- Fetch messages for selected conversation ---- */
  const fetchMessages = useCallback(async (conversationId: string) => {
    setIsLoadingMessages(true);
    try {
      const res = await fetch(
        `/api/whatsapp/conversations/${conversationId}/messages`,
      );
      if (!res.ok) throw new Error('Error al cargar mensajes');
      const data = await res.json();
      setMessages(data.data ?? []);
    } catch (err) {
      console.error('Error fetching messages:', err);
      toast.error('Error al cargar mensajes');
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (selectedConv) {
      fetchMessages(selectedConv.id);
    } else {
      setMessages([]);
    }
  }, [selectedConv, fetchMessages]);

  /* ---- Supabase Realtime subscription for new messages ---- */
  useEffect(() => {
    if (!selectedConv) return;

    const channel = supabase
      .channel(`whatsapp_messages:${selectedConv.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whatsapp_messages',
          filter: `conversation_id=eq.${selectedConv.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'whatsapp_messages',
          filter: `conversation_id=eq.${selectedConv.id}`,
        },
        (payload) => {
          const updated = payload.new as Message;
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? updated : m)),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, selectedConv]);

  /* ---- Send a message ---- */
  const handleSend = useCallback(
    async (text: string) => {
      if (!selectedConv) return;
      setIsSending(true);

      // Optimistic update
      const optimisticMsg: Message = {
        id: `temp-${Date.now()}`,
        conversation_id: selectedConv.id,
        direction: 'outbound',
        body: text,
        status: 'sent',
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticMsg]);

      try {
        const res = await fetch('/api/whatsapp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversation_id: selectedConv.id,
            message: text,
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            (body as { error?: string }).error ?? 'Error al enviar mensaje',
          );
        }
      } catch (err) {
        // Remove the optimistic message on failure
        setMessages((prev) =>
          prev.filter((m) => m.id !== optimisticMsg.id),
        );
        const msg =
          err instanceof Error ? err.message : 'Error al enviar mensaje';
        toast.error('Error al enviar', { description: msg });
      } finally {
        setIsSending(false);
      }
    },
    [selectedConv],
  );

  /* ---- Filter conversations by search ---- */
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.customer_name.toLowerCase().includes(q) ||
        c.customer_phone.includes(q) ||
        c.last_message?.toLowerCase().includes(q),
    );
  }, [conversations, searchQuery]);

  /* ---- Select a conversation ---- */
  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConv(conv);
    setMobileView('chat');
  };

  /* ---- Mobile back ---- */
  const handleMobileBack = () => {
    setMobileView('list');
    setSelectedConv(null);
  };

  /* ---- Render ---- */

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex h-[calc(100vh-12rem)] overflow-hidden rounded-lg border border-border bg-card shadow-sm"
    >
      {/* Desktop: two-column layout */}
      {/* Mobile: show one at a time */}

      {/* Conversation list (left panel) */}
      <div
        className={cn(
          'h-full w-full flex-shrink-0 md:w-1/3 md:max-w-sm md:block',
          mobileView === 'list' ? 'block' : 'hidden',
        )}
      >
        <ConversationList
          conversations={filteredConversations}
          selectedId={selectedConv?.id ?? null}
          onSelect={handleSelectConversation}
          isLoading={isLoadingConversations}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Chat area (right panel) */}
      <div
        className={cn(
          'h-full flex-1 md:block',
          mobileView === 'chat' ? 'block' : 'hidden',
        )}
      >
        <ChatArea
          conversation={selectedConv}
          messages={messages}
          isLoading={isLoadingMessages}
          onSend={handleSend}
          isSending={isSending}
          onBack={handleMobileBack}
        />
      </div>
    </motion.div>
  );
}
