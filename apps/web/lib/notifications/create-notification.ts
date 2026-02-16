import { getSupabaseServerClient } from '@kit/supabase/server-client';

interface CreateNotificationInput {
  organizationId: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

/**
 * Create an in-app notification for a specific user.
 */
export async function createNotification(input: CreateNotificationInput): Promise<void> {
  const client = getSupabaseServerClient();

  const { error } = await client.from('notifications').insert({
    organization_id: input.organizationId,
    user_id: input.userId,
    type: input.type,
    title: input.title,
    message: input.message,
    entity_type: input.entityType || null,
    entity_id: input.entityId || null,
    action_url: input.actionUrl || null,
    priority: input.priority || 'normal',
  });

  if (error) {
    console.error('Error creating notification:', error);
  }
}

/**
 * Send notifications to all users with a specific role in an organization.
 * Uses the get_users_by_role RPC to find target users.
 */
export async function notifyAreaTeam(
  organizationId: string,
  roleSlug: string,
  notification: Omit<CreateNotificationInput, 'organizationId' | 'userId'>,
): Promise<void> {
  const client = getSupabaseServerClient();

  const { data: users, error } = await client.rpc('get_users_by_role', {
    p_organization_id: organizationId,
    p_role_slug: roleSlug,
  });

  if (error) {
    console.error(`Error getting users for role ${roleSlug}:`, error);
    return;
  }

  if (!users?.length) return;

  const notifications = users.map((user: { user_id: string }) => ({
    organization_id: organizationId,
    user_id: user.user_id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    entity_type: notification.entityType || null,
    entity_id: notification.entityId || null,
    action_url: notification.actionUrl || null,
    priority: notification.priority || 'normal',
  }));

  const { error: insertError } = await client.from('notifications').insert(notifications);

  if (insertError) {
    console.error('Error creating area team notifications:', insertError);
  }
}
