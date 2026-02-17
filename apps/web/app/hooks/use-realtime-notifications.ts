'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useSupabase } from '@kit/supabase/hooks/use-supabase';

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

interface UseRealtimeNotificationsOptions {
  userId: string;
  onNewNotification?: (notification: Notification) => void;
}

interface UseRealtimeNotificationsReturn {
  unreadCount: number;
  latestNotification: Notification | null;
  resetCount: () => void;
}

/**
 * Hook that subscribes to Supabase Realtime postgres_changes
 * on the `notifications` table for a given user.
 *
 * It tracks the number of unread notifications received in
 * real time (auto-increments on INSERT) and exposes the latest
 * notification payload so the caller can react to it (e.g. show
 * a toast).
 */
export function useRealtimeNotifications({
  userId,
  onNewNotification,
}: UseRealtimeNotificationsOptions): UseRealtimeNotificationsReturn {
  const supabase = useSupabase();

  const [unreadCount, setUnreadCount] = useState(0);
  const [latestNotification, setLatestNotification] =
    useState<Notification | null>(null);

  // Keep the callback ref stable so we don't re-subscribe on every render.
  const callbackRef = useRef(onNewNotification);
  callbackRef.current = onNewNotification;

  const resetCount = useCallback(() => {
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;

          setLatestNotification(newNotification);
          setUnreadCount((prev) => prev + 1);

          callbackRef.current?.(newNotification);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  return { unreadCount, latestNotification, resetCount };
}
