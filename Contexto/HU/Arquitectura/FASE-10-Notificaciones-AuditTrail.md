# FASE 10: Notificaciones y Audit Trail

**Proyecto:** Pscomercial-pro (PROSUMINISTROS)
**Fecha:** 2026-02-11

---

## 1. SISTEMA DE NOTIFICACIONES

### 1.1 Canales de Notificación

| Canal | Tecnología | Uso | Tiempo Real |
|-------|-----------|-----|-------------|
| **Campanita (in-app)** | Supabase Realtime + tabla `notifications` | Todas las notificaciones | SI |
| **Email** | SendGrid API | Leads asignados, cotizaciones, alertas críticas | NO (async) |
| **WhatsApp** | Meta Cloud API | Envío de proformas al cliente | NO (async) |

### 1.2 Eventos que Generan Notificaciones

| Evento | Destinatario | Canal | Prioridad |
|--------|-------------|-------|-----------|
| Lead asignado | Asesor asignado | Campanita + Email | high |
| Lead reasignado | Nuevo asesor | Campanita + Email | high |
| Cotización requiere aprobación margen | Gerente Comercial | Campanita | urgent |
| Margen aprobado/rechazado | Asesor | Campanita | high |
| Cotización próxima a vencer (3 días) | Asesor | Campanita | normal |
| Cotización vencida | Asesor | Campanita | high |
| Pedido creado | Asesor + Gerente Operativo | Campanita | normal |
| Cambio de estado de pedido | Asesor | Campanita | normal |
| OC confirmada por proveedor | Compras | Campanita | normal |
| Mercancía recibida en bodega | Logística + Asesor | Campanita | normal |
| Despacho en camino | Asesor | Campanita | normal |
| Entrega confirmada | Asesor + Facturación | Campanita | normal |
| @Mención en comentario | Usuario mencionado | Campanita | high |
| Tarea pendiente vencida (semáforo rojo) | Responsable | Campanita | urgent |
| Licencia por vencer (30 días) | Compras + Asesor | Campanita + Email | normal |

### 1.3 Implementación Realtime (Campanita)

```tsx
// components/notification-bell.tsx
'use client';
import { Bell } from 'lucide-react';
import { useNotifications, useUnreadCount } from '@kit/supabase/hooks/use-notifications';
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications';

export function NotificationBell({ userId }: { userId: string }) {
  useRealtimeNotifications(userId); // Suscripción Realtime

  const { data: unreadCount } = useUnreadCount();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <NotificationPanel />
      </PopoverContent>
    </Popover>
  );
}

function NotificationPanel() {
  const { data: notifications } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');

  const filtered = filter === 'unread'
    ? notifications?.filter(n => !n.is_read)
    : notifications;

  return (
    <div>
      <div className="p-3 border-b flex justify-between items-center">
        <h4 className="font-semibold">Notificaciones</h4>
        <div className="flex gap-1">
          <Button variant={filter === 'unread' ? 'default' : 'ghost'} size="sm"
            onClick={() => setFilter('unread')}>Pendientes</Button>
          <Button variant={filter === 'all' ? 'default' : 'ghost'} size="sm"
            onClick={() => setFilter('all')}>Todas</Button>
        </div>
      </div>
      <ScrollArea className="h-80">
        {filtered?.map(notification => (
          <NotificationItem key={notification.id} notification={notification} />
        ))}
      </ScrollArea>
    </div>
  );
}
```

### 1.4 Trigger: Crear Notificación por @Mención

```sql
CREATE OR REPLACE FUNCTION notify_mentions()
RETURNS trigger AS $$
DECLARE
  v_mention_id uuid;
  v_author_name text;
BEGIN
  IF NEW.mentions IS NOT NULL AND array_length(NEW.mentions, 1) > 0 THEN
    SELECT full_name INTO v_author_name FROM profiles WHERE id = NEW.author_id;

    FOREACH v_mention_id IN ARRAY NEW.mentions LOOP
      INSERT INTO notifications (
        organization_id, user_id, type, title, message,
        entity_type, entity_id, action_url, priority
      ) VALUES (
        NEW.organization_id,
        v_mention_id,
        'mention',
        v_author_name || ' te mencionó en un comentario',
        LEFT(NEW.content, 200),
        NEW.entity_type,
        NEW.entity_id,
        '/' || NEW.entity_type || 's/' || NEW.entity_id,
        'high'
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER notify_mentions_trigger
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION notify_mentions();
```

---

## 2. AUDIT TRAIL (BITÁCORA)

### 2.1 Trigger Genérico de Auditoría

```sql
CREATE OR REPLACE FUNCTION audit_trail_fn()
RETURNS trigger AS $$
DECLARE
  v_changes jsonb;
  v_action text;
  v_org_id uuid;
BEGIN
  -- Determinar acción
  v_action := TG_OP;  -- INSERT, UPDATE, DELETE

  -- Obtener organization_id
  IF TG_OP = 'DELETE' THEN
    v_org_id := OLD.organization_id;
  ELSE
    v_org_id := NEW.organization_id;
  END IF;

  -- Calcular cambios (solo para UPDATE)
  IF TG_OP = 'UPDATE' THEN
    SELECT jsonb_object_agg(key, jsonb_build_object('old', old_val, 'new', new_val))
    INTO v_changes
    FROM (
      SELECT key, old_row.value as old_val, new_row.value as new_val
      FROM jsonb_each(to_jsonb(OLD)) old_row
      FULL OUTER JOIN jsonb_each(to_jsonb(NEW)) new_row USING (key)
      WHERE old_row.value IS DISTINCT FROM new_row.value
        AND key NOT IN ('updated_at', 'created_at')  -- Ignorar timestamps
    ) diffs;
  END IF;

  -- Insertar log (usando service_role internamente)
  INSERT INTO audit_logs (
    organization_id, user_id, action, entity_type, entity_id, changes
  ) VALUES (
    v_org_id,
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    lower(v_action),
    TG_TABLE_NAME,
    CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
    v_changes
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2.2 Aplicar Trigger a Tablas de Negocio

```sql
-- Aplicar auditoría a todas las tablas de negocio
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'leads', 'customers', 'quotes', 'quote_items', 'orders', 'order_items',
    'purchase_orders', 'shipments', 'invoices', 'roles', 'user_roles',
    'role_permissions', 'whatsapp_accounts', 'system_settings', 'products',
    'suppliers', 'license_records'
  ]) LOOP
    EXECUTE format(
      'CREATE TRIGGER audit_%I AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION audit_trail_fn()',
      tbl, tbl
    );
  END LOOP;
END;
$$;
```

### 2.3 Consulta de Bitácora (Panel Admin)

```sql
-- Vista para el panel de bitácora administrativa
CREATE OR REPLACE FUNCTION get_audit_log(
  p_org_id uuid,
  p_entity_type text DEFAULT NULL,
  p_entity_id uuid DEFAULT NULL,
  p_user_id uuid DEFAULT NULL,
  p_action text DEFAULT NULL,
  p_from timestamptz DEFAULT now() - interval '30 days',
  p_to timestamptz DEFAULT now(),
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
) RETURNS TABLE(
  id uuid,
  action text,
  entity_type text,
  entity_id uuid,
  changes jsonb,
  user_name text,
  user_avatar text,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.id,
    al.action,
    al.entity_type,
    al.entity_id,
    al.changes,
    p.full_name as user_name,
    p.avatar_url as user_avatar,
    al.created_at
  FROM audit_logs al
  LEFT JOIN profiles p ON p.id = al.user_id
  WHERE al.organization_id = p_org_id
    AND al.created_at BETWEEN p_from AND p_to
    AND (p_entity_type IS NULL OR al.entity_type = p_entity_type)
    AND (p_entity_id IS NULL OR al.entity_id = p_entity_id)
    AND (p_user_id IS NULL OR al.user_id = p_user_id)
    AND (p_action IS NULL OR al.action = p_action)
  ORDER BY al.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

---

## 3. RESUMEN

| Métrica | Valor |
|---|---|
| **Canales de notificación** | 3 (in-app, email, WhatsApp) |
| **Eventos que notifican** | 15+ |
| **Realtime** | Supabase Realtime (postgres_changes) |
| **Filtros campanita** | Pendientes / Todas |
| **Auditoría** | Trigger automático en 17 tablas |
| **Retención audit** | Particionamiento mensual recomendado |
| **Panel bitácora** | Filtros por entidad, usuario, acción, fecha |
