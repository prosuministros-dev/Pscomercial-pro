'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Bell, Check, Inbox, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';

import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { useUser } from '@kit/supabase/hooks/use-user';
import { Button } from '@kit/ui/button';
import { Skeleton } from '@kit/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@kit/ui/sheet';

import { useRealtimeNotifications } from '~/hooks/use-realtime-notifications';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: string | null;
  action_url: string | null;
  priority: string;
  is_read: boolean;
  created_at: string;
}

type FilterMode = 'all' | 'unread';

const PAGE_SIZE = 30;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `${diffMins} min`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}

// ---------------------------------------------------------------------------
// Motion variants
// ---------------------------------------------------------------------------

const itemVariants = {
  hidden: { opacity: 0, y: -8 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

// ---------------------------------------------------------------------------
// Notification skeleton loader
// ---------------------------------------------------------------------------

function NotificationSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border p-4 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NotificationBell() {
  const user = useUser();
  const userId = user.data?.sub ?? '';

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [pulseBadge, setPulseBadge] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // ---- Unread count derived from loaded notifications ----
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // ---- Realtime subscription ----
  const { resetCount } = useRealtimeNotifications({
    userId,
    onNewNotification: (newNotif) => {
      // Prepend to the local list so it appears immediately.
      setNotifications((prev) => {
        // Avoid duplicates if the notification was already fetched.
        if (prev.some((n) => n.id === newNotif.id)) return prev;
        return [newNotif, ...prev];
      });

      // Show a toast so the user knows something arrived.
      toast.info(newNotif.title, { description: newNotif.message });

      // Trigger a pulse animation on the badge.
      setPulseBadge(true);
      setTimeout(() => setPulseBadge(false), 2000);
    },
  });

  // ---- Fetch notifications (initial + pagination) ----
  const fetchNotifications = useCallback(
    async (offset = 0) => {
      if (offset === 0) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const response = await fetch(
          `/api/notifications?limit=${PAGE_SIZE}&offset=${offset}`,
        );

        if (response.ok) {
          const data = await response.json();
          const fetched: Notification[] = data.data || [];

          if (offset === 0) {
            setNotifications(fetched);
          } else {
            setNotifications((prev) => {
              const existingIds = new Set(prev.map((n) => n.id));
              const unique = fetched.filter((n) => !existingIds.has(n.id));
              return [...prev, ...unique];
            });
          }

          setHasMore(fetched.length >= PAGE_SIZE);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [],
  );

  // Load on first mount (no polling).
  useEffect(() => {
    if (userId) {
      fetchNotifications(0);
    }
  }, [userId, fetchNotifications]);

  // ---- Infinite scroll handler ----
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || isLoadingMore || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = container;

    if (scrollHeight - scrollTop - clientHeight < 100) {
      fetchNotifications(notifications.length);
    }
  }, [isLoadingMore, hasMore, notifications.length, fetchNotifications]);

  // ---- Mark all as read ----
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mark_all: true }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, is_read: true })),
        );
        resetCount();
        toast.success('Todas las notificaciones marcadas como leidas');
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // ---- Mark single as read ----
  const markAsRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // ---- Click handler ----
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
  };

  // ---- Filtered list ----
  const visibleNotifications =
    filter === 'unread'
      ? notifications.filter((n) => !n.is_read)
      : notifications;

  // ---- Render ----
  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);

        if (isOpen) {
          fetchNotifications(0);
        }
      }}
    >
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />

          {unreadCount > 0 && (
            <span
              className={`absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground ${
                pulseBadge ? 'animate-pulse' : ''
              }`}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}

          <span className="sr-only">Notificaciones</span>
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>Notificaciones</SheetTitle>
          <SheetDescription>
            {unreadCount > 0
              ? `Tienes ${unreadCount} notificacion${unreadCount > 1 ? 'es' : ''} sin leer`
              : 'No tienes notificaciones pendientes'}
          </SheetDescription>
        </SheetHeader>

        {/* ---- Filter toggle + mark all ---- */}
        <div className="mt-4 flex items-center gap-2">
          <div className="flex rounded-md border border-border">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors rounded-l-md ${
                filter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent/50'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors rounded-r-md ${
                filter === 'unread'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent/50'
              }`}
            >
              No leidas
            </button>
          </div>

          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="ml-auto"
            >
              <Check className="mr-1.5 h-3.5 w-3.5" />
              Marcar todas
            </Button>
          )}
        </div>

        {/* ---- Notification list with infinite scroll ---- */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="mt-4 flex-1 overflow-y-auto space-y-2 pr-1"
        >
          {isLoading && notifications.length === 0 ? (
            <NotificationSkeleton />
          ) : visibleNotifications.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Inbox className="mx-auto h-12 w-12 mb-3 opacity-50" />
              <p className="text-sm">
                {filter === 'unread'
                  ? 'No tienes notificaciones sin leer'
                  : 'No tienes notificaciones'}
              </p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {visibleNotifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.2, delay: index < 10 ? index * 0.03 : 0 }}
                  onClick={() => handleNotificationClick(notification)}
                  className={`cursor-pointer rounded-lg border p-4 transition-colors hover:bg-accent/50 ${
                    !notification.is_read
                      ? 'border-primary/20 bg-primary/5'
                      : 'border-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {notification.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {timeAgo(notification.created_at)}
                      </p>
                    </div>

                    {!notification.is_read && (
                      <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {/* ---- Loading more indicator ---- */}
          {isLoadingMore && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
