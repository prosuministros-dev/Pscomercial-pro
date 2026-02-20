# FASE 4: Arquitectura RLS Supabase (Eficiente, Sin Duplicidad)

**Proyecto:** Pscomercial-pro (PROSUMINISTROS)
**Fecha:** 2026-02-11
**Perspectivas:** Arquitecto | DB-Integration | Business Analyst | Fullstack Dev | UX/UI Designer
**Principio:** Mínima duplicación entre RLS, API y Frontend

---

## 1. ESTRATEGIA RLS: TENANT ISOLATION + DATA SCOPE

### 1.1 Principio Fundamental

**RLS se encarga SOLO de:**
1. **Aislamiento multi-tenant** → Cada usuario solo ve datos de su organización
2. **Ownership básico** → Asesores solo ven sus propios registros (leads, quotes, orders asignados)

**RLS NO se encarga de:**
- Validar permisos de acción (create, update, delete, approve) → Eso lo hace la API
- Lógica de negocio compleja → Eso lo hacen funciones RPC
- Validar flujos de estado → Eso lo hacen CHECK constraints + triggers

### 1.2 Por qué esta separación

| Responsabilidad | RLS | API Route | Frontend |
|----------------|-----|-----------|----------|
| Multi-tenant isolation | **SI** | No | No |
| Data scope (own/team/all) | **SI** | Refuerza | Refleja |
| Permission check (CRUD) | No | **SI** | Refleja |
| Business rules | No | **SI** | Valida previo |
| UI show/hide | No | No | **SI** |

**Beneficio:** Sin duplicación de lógica. Cada capa tiene una responsabilidad clara.

---

## 2. FUNCIONES HELPER PARA RLS

### 2.1 Función: Obtener organization_id del usuario actual

```sql
-- Función que obtiene el org_id del usuario autenticado
-- Se usa en TODAS las policies RLS
CREATE OR REPLACE FUNCTION auth.get_user_org_id()
RETURNS uuid AS $$
  SELECT organization_id
  FROM profiles
  WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Cachear el resultado por transacción para evitar queries repetitivos
-- PostgreSQL ya cachea funciones STABLE dentro de una misma transacción
```

### 2.2 Función: Verificar si usuario es admin/gerente (ve todo)

```sql
CREATE OR REPLACE FUNCTION auth.is_org_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND r.slug IN ('super_admin', 'gerente_general', 'director_comercial', 'gerente_operativo')
      AND r.is_active = true
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

### 2.3 Función: Verificar si usuario es gerente comercial (ve su equipo)

```sql
CREATE OR REPLACE FUNCTION auth.is_commercial_manager()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND r.slug IN ('super_admin', 'gerente_general', 'director_comercial', 'gerente_comercial')
      AND r.is_active = true
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

### 2.4 Función: Verificar si tiene un permiso específico

```sql
-- Solo para RLS policies que necesiten verificar permiso granular
CREATE OR REPLACE FUNCTION auth.has_perm(p_slug text)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON rp.role_id = ur.role_id
    JOIN permissions p ON p.id = rp.permission_id
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND p.slug = p_slug
      AND r.is_active = true
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

---

## 3. POLICIES RLS POR TABLA

### 3.1 Patrón Base: Tenant Isolation

Este patrón aplica a TODAS las tablas con `organization_id`:

```sql
-- Patrón genérico (se repite para cada tabla)
ALTER TABLE {tabla} ENABLE ROW LEVEL SECURITY;

-- SELECT: Solo datos de mi organización
CREATE POLICY "{tabla}_select_org"
  ON {tabla} FOR SELECT
  TO authenticated
  USING (organization_id = auth.get_user_org_id());

-- INSERT: Solo en mi organización
CREATE POLICY "{tabla}_insert_org"
  ON {tabla} FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = auth.get_user_org_id());

-- UPDATE: Solo datos de mi organización
CREATE POLICY "{tabla}_update_org"
  ON {tabla} FOR UPDATE
  TO authenticated
  USING (organization_id = auth.get_user_org_id())
  WITH CHECK (organization_id = auth.get_user_org_id());

-- DELETE: Solo datos de mi organización
CREATE POLICY "{tabla}_delete_org"
  ON {tabla} FOR DELETE
  TO authenticated
  USING (organization_id = auth.get_user_org_id());
```

### 3.2 Tablas con Tenant Isolation PURO (Solo org_id)

Las siguientes tablas SOLO necesitan aislamiento por org_id. Cualquier usuario de la org puede ver todos los registros:

```sql
-- Tablas con acceso abierto dentro de la organización:
-- (El API/Frontend se encarga de mostrar solo lo que el rol puede ver)

-- organizations (especial: solo la propia)
-- profiles
-- roles
-- role_permissions (via role)
-- user_roles (via user)
-- customers
-- customer_contacts
-- products
-- product_categories
-- margin_rules
-- trm_rates
-- suppliers
-- rejection_reasons
-- consecutive_counters
-- system_settings
-- whatsapp_accounts
-- whatsapp_templates
-- dashboard_widgets
-- saved_reports
```

**Script para tablas con tenant isolation puro:**

```sql
-- Macro para aplicar el patrón a múltiples tablas
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'customers', 'customer_contacts', 'products', 'product_categories',
    'margin_rules', 'trm_rates', 'suppliers', 'rejection_reasons',
    'consecutive_counters', 'system_settings', 'whatsapp_accounts',
    'whatsapp_templates', 'dashboard_widgets', 'saved_reports'
  ]) LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);

    EXECUTE format(
      'CREATE POLICY %I ON %I FOR SELECT TO authenticated USING (organization_id = auth.get_user_org_id())',
      tbl || '_select_org', tbl
    );

    EXECUTE format(
      'CREATE POLICY %I ON %I FOR INSERT TO authenticated WITH CHECK (organization_id = auth.get_user_org_id())',
      tbl || '_insert_org', tbl
    );

    EXECUTE format(
      'CREATE POLICY %I ON %I FOR UPDATE TO authenticated USING (organization_id = auth.get_user_org_id()) WITH CHECK (organization_id = auth.get_user_org_id())',
      tbl || '_update_org', tbl
    );

    EXECUTE format(
      'CREATE POLICY %I ON %I FOR DELETE TO authenticated USING (organization_id = auth.get_user_org_id())',
      tbl || '_delete_org', tbl
    );
  END LOOP;
END;
$$;
```

### 3.3 Tablas con Data Scope (Tenant + Owner/Team)

Estas tablas necesitan filtro adicional para asesores comerciales:

#### LEADS

```sql
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- SELECT: Admin/gerente ve todos, asesor solo los asignados
CREATE POLICY "leads_select"
  ON leads FOR SELECT
  TO authenticated
  USING (
    organization_id = auth.get_user_org_id()
    AND (
      auth.is_commercial_manager()  -- Admin/gerentes ven todos
      OR assigned_to = auth.uid()   -- Asesor ve solo los asignados
      OR created_by = auth.uid()    -- O los que creó
    )
  );

-- INSERT: Solo si está en la organización (permisos se validan en API)
CREATE POLICY "leads_insert"
  ON leads FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = auth.get_user_org_id());

-- UPDATE: Admin/gerente puede todos, asesor solo los asignados
CREATE POLICY "leads_update"
  ON leads FOR UPDATE
  TO authenticated
  USING (
    organization_id = auth.get_user_org_id()
    AND (
      auth.is_commercial_manager()
      OR assigned_to = auth.uid()
    )
  );

-- DELETE: Solo admin (validado también en API)
CREATE POLICY "leads_delete"
  ON leads FOR DELETE
  TO authenticated
  USING (
    organization_id = auth.get_user_org_id()
    AND auth.is_org_admin()
  );
```

#### QUOTES

```sql
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- SELECT: Admin/gerente ve todos, asesor solo los propios, finanzas ve todos (para crédito)
CREATE POLICY "quotes_select"
  ON quotes FOR SELECT
  TO authenticated
  USING (
    organization_id = auth.get_user_org_id()
    AND (
      auth.is_commercial_manager()
      OR advisor_id = auth.uid()
      OR auth.has_perm('quotes:read') -- Finanzas puede ver todos
    )
  );

-- INSERT
CREATE POLICY "quotes_insert"
  ON quotes FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = auth.get_user_org_id());

-- UPDATE: Admin/gerente puede todos, asesor solo los propios
CREATE POLICY "quotes_update"
  ON quotes FOR UPDATE
  TO authenticated
  USING (
    organization_id = auth.get_user_org_id()
    AND (
      auth.is_commercial_manager()
      OR advisor_id = auth.uid()
    )
  );

-- DELETE: Solo admin
CREATE POLICY "quotes_delete"
  ON quotes FOR DELETE
  TO authenticated
  USING (
    organization_id = auth.get_user_org_id()
    AND auth.is_org_admin()
  );
```

#### ORDERS

```sql
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- SELECT: Casi todos los roles necesitan ver pedidos (con diferentes alcances)
CREATE POLICY "orders_select"
  ON orders FOR SELECT
  TO authenticated
  USING (
    organization_id = auth.get_user_org_id()
    -- Todos los roles autenticados de la org pueden ver pedidos
    -- El filtro granular se hace en la API/Frontend
  );

-- INSERT
CREATE POLICY "orders_insert"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = auth.get_user_org_id());

-- UPDATE
CREATE POLICY "orders_update"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    organization_id = auth.get_user_org_id()
    AND (
      auth.is_org_admin()
      OR auth.is_commercial_manager()
      OR advisor_id = auth.uid()
    )
  );

-- DELETE: Solo admin
CREATE POLICY "orders_delete"
  ON orders FOR DELETE
  TO authenticated
  USING (
    organization_id = auth.get_user_org_id()
    AND auth.is_org_admin()
  );
```

#### PURCHASE ORDERS

```sql
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

-- SELECT: Admin, operativo, compras, finanzas ven todos
CREATE POLICY "purchase_orders_select"
  ON purchase_orders FOR SELECT
  TO authenticated
  USING (organization_id = auth.get_user_org_id());

-- INSERT: Solo compras/operativo (validado en API)
CREATE POLICY "purchase_orders_insert"
  ON purchase_orders FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = auth.get_user_org_id());

-- UPDATE
CREATE POLICY "purchase_orders_update"
  ON purchase_orders FOR UPDATE
  TO authenticated
  USING (organization_id = auth.get_user_org_id());

-- DELETE: Solo admin
CREATE POLICY "purchase_orders_delete"
  ON purchase_orders FOR DELETE
  TO authenticated
  USING (
    organization_id = auth.get_user_org_id()
    AND auth.is_org_admin()
  );
```

### 3.4 Tablas Child (Sin organization_id propio)

Tablas que heredan el acceso de su tabla padre:

```sql
-- QUOTE_ITEMS: Acceso vía quote_id
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quote_items_select"
  ON quote_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotes q
      WHERE q.id = quote_items.quote_id
        AND q.organization_id = auth.get_user_org_id()
    )
  );

CREATE POLICY "quote_items_insert"
  ON quote_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotes q
      WHERE q.id = quote_items.quote_id
        AND q.organization_id = auth.get_user_org_id()
    )
  );

CREATE POLICY "quote_items_update"
  ON quote_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotes q
      WHERE q.id = quote_items.quote_id
        AND q.organization_id = auth.get_user_org_id()
    )
  );

CREATE POLICY "quote_items_delete"
  ON quote_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotes q
      WHERE q.id = quote_items.quote_id
        AND q.organization_id = auth.get_user_org_id()
    )
  );

-- Mismo patrón para:
-- order_items (via order_id → orders)
-- order_status_history (via order_id → orders)
-- order_documents (tiene organization_id propio)
-- order_pending_tasks (tiene organization_id propio)
-- purchase_order_items (via purchase_order_id → purchase_orders)
-- shipment_items (via shipment_id → shipments)
-- invoice_items (via invoice_id → invoices)
-- quote_approvals (tiene organization_id propio)
-- quote_follow_ups (tiene organization_id propio)
```

### 3.5 Tablas Especiales

#### NOTIFICATIONS (Solo el destinatario)

```sql
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- SELECT: Solo mis notificaciones
CREATE POLICY "notifications_select"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- INSERT: Sistema puede crear para cualquier usuario de la org
CREATE POLICY "notifications_insert"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = auth.get_user_org_id());

-- UPDATE: Solo puedo marcar como leídas mis propias notificaciones
CREATE POLICY "notifications_update"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- DELETE: No se eliminan notificaciones
-- (No crear policy de DELETE)
```

#### COMMENTS (Polimórfica)

```sql
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- SELECT: De mi organización
CREATE POLICY "comments_select"
  ON comments FOR SELECT
  TO authenticated
  USING (organization_id = auth.get_user_org_id());

-- INSERT: En mi organización
CREATE POLICY "comments_insert"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = auth.get_user_org_id()
    AND author_id = auth.uid()  -- Solo puede comentar como sí mismo
  );

-- UPDATE: Solo el autor puede editar su comentario
CREATE POLICY "comments_update"
  ON comments FOR UPDATE
  TO authenticated
  USING (
    organization_id = auth.get_user_org_id()
    AND author_id = auth.uid()
  );

-- DELETE: Solo el autor o admin
CREATE POLICY "comments_delete"
  ON comments FOR DELETE
  TO authenticated
  USING (
    organization_id = auth.get_user_org_id()
    AND (author_id = auth.uid() OR auth.is_org_admin())
  );
```

#### AUDIT_LOGS (Solo lectura por admin)

```sql
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- SELECT: Solo admin puede ver la bitácora
CREATE POLICY "audit_logs_select"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    organization_id = auth.get_user_org_id()
    AND auth.has_perm('admin:view_audit')
  );

-- INSERT: Solo via trigger (service_role), no directamente por usuarios
-- No crear policy de INSERT para 'authenticated'
CREATE POLICY "audit_logs_insert_service"
  ON audit_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- No UPDATE ni DELETE en audit_logs
```

#### PROFILES

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: Todos en la org pueden ver perfiles
CREATE POLICY "profiles_select"
  ON profiles FOR SELECT
  TO authenticated
  USING (organization_id = auth.get_user_org_id());

-- UPDATE: Solo el propio usuario o admin
CREATE POLICY "profiles_update"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid()
    OR (organization_id = auth.get_user_org_id() AND auth.has_perm('admin:manage_users'))
  );

-- INSERT: Manejado por trigger after_user_created
CREATE POLICY "profiles_insert"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());
```

#### WHATSAPP MESSAGES

```sql
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- SELECT: De mi organización
CREATE POLICY "whatsapp_messages_select"
  ON whatsapp_messages FOR SELECT
  TO authenticated
  USING (organization_id = auth.get_user_org_id());

-- INSERT: Solo via webhook o agente autorizado
CREATE POLICY "whatsapp_messages_insert"
  ON whatsapp_messages FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = auth.get_user_org_id());

-- No UPDATE ni DELETE en mensajes de WhatsApp
```

---

## 4. OPTIMIZACIÓN DE PERFORMANCE RLS

### 4.1 Índices Críticos para RLS

```sql
-- CRÍTICO: Índice en profiles para auth.get_user_org_id()
CREATE INDEX idx_profiles_id ON profiles(id);
-- (Ya es PK, pero confirmar que está)

-- CRÍTICO: Índice en user_roles para las funciones de verificación
CREATE INDEX idx_user_roles_user_role ON user_roles(user_id, role_id);

-- CRÍTICO: Índice en roles para slug lookup
CREATE INDEX idx_roles_slug_active ON roles(slug, is_active) WHERE is_active = true;

-- Indices compuestos para las policies más frecuentes
CREATE INDEX idx_leads_org_assigned ON leads(organization_id, assigned_to);
CREATE INDEX idx_quotes_org_advisor ON quotes(organization_id, advisor_id);
CREATE INDEX idx_orders_org_advisor ON orders(organization_id, advisor_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_comments_entity ON comments(entity_type, entity_id, organization_id);
```

### 4.2 Evitar Subconsultas Costosas

```sql
-- ❌ EVITAR: Subconsulta en cada fila
CREATE POLICY "bad_policy"
  ON orders FOR SELECT
  USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

-- ✅ PREFERIR: Función STABLE que se cachea por transacción
CREATE POLICY "good_policy"
  ON orders FOR SELECT
  USING (
    organization_id = auth.get_user_org_id()  -- STABLE = cached per transaction
  );
```

### 4.3 Monitoreo de Performance RLS

```sql
-- Query para verificar que las policies no están degradando performance
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM orders
WHERE organization_id = 'some-uuid'
LIMIT 50;

-- Debería mostrar:
-- Index Scan using idx_orders_org on orders
-- Filter: (organization_id = auth.get_user_org_id())
-- NO debería mostrar: Seq Scan
```

---

## 5. RESUMEN DE POLICIES POR TABLA

| Tabla | RLS | SELECT Policy | INSERT Check | UPDATE Check | DELETE Check |
|-------|-----|---------------|-------------|-------------|-------------|
| organizations | SI | `id = org_id` from profile | Service only | `id = get_user_org_id()` | Never |
| profiles | SI | `org_id match` | `id = uid()` | `own OR admin` | Never |
| roles | SI | `org_id match` | `org_id match` | `org_id match` | `org_id + admin` |
| permissions | NO | Global (no org_id) | Service only | Service only | Service only |
| role_permissions | SI | Via role org_id | `org_id match` | N/A | `org_id match` |
| user_roles | SI | Via user org_id | `org_id match` | N/A | `org_id match` |
| customers | SI | `org_id match` | `org_id match` | `org_id match` | `org_id + admin` |
| customer_contacts | SI | `org_id match` | `org_id match` | `org_id match` | `org_id match` |
| **leads** | SI | `org_id + (admin OR assigned)` | `org_id match` | `org_id + (admin OR assigned)` | `org_id + admin` |
| lead_assignments_log | SI | `org_id match` | `org_id match` | Never | Never |
| products | SI | `org_id match` | `org_id match` | `org_id match` | `org_id + admin` |
| product_categories | SI | `org_id match` | `org_id match` | `org_id match` | `org_id + admin` |
| margin_rules | SI | `org_id match` | `org_id match` | `org_id match` | `org_id match` |
| trm_rates | SI | `org_id match` | `org_id match` | Never | Never |
| **quotes** | SI | `org_id + (manager OR advisor OR has_perm)` | `org_id match` | `org_id + (manager OR advisor)` | `org_id + admin` |
| quote_items | SI | Via quote org_id | Via quote org_id | Via quote org_id | Via quote org_id |
| quote_approvals | SI | `org_id match` | `org_id match` | `org_id match` | Never |
| quote_follow_ups | SI | `org_id match` | `org_id match` | `org_id match` | `org_id match` |
| **orders** | SI | `org_id match` (all roles see) | `org_id match` | `org_id + (admin OR manager OR advisor)` | `org_id + admin` |
| order_items | SI | Via order org_id | Via order org_id | Via order org_id | Never |
| order_status_history | SI | Via order org_id | `org_id match` | Never | Never |
| order_documents | SI | `org_id match` | `org_id match` | Never | `org_id match` |
| order_pending_tasks | SI | `org_id match` | `org_id match` | `org_id match` | `org_id match` |
| suppliers | SI | `org_id match` | `org_id match` | `org_id match` | `org_id + admin` |
| purchase_orders | SI | `org_id match` | `org_id match` | `org_id match` | `org_id + admin` |
| purchase_order_items | SI | Via PO org_id | Via PO org_id | Via PO org_id | Via PO org_id |
| shipments | SI | `org_id match` | `org_id match` | `org_id match` | Never |
| shipment_items | SI | Via shipment org_id | Via shipment org_id | Never | Never |
| invoices | SI | `org_id match` | `org_id match` | `org_id match` | `org_id + admin` |
| invoice_items | SI | Via invoice org_id | Via invoice org_id | Never | Never |
| license_records | SI | `org_id match` | `org_id match` | `org_id match` | Never |
| whatsapp_accounts | SI | `org_id match` | `org_id match` | `org_id match` | Never |
| whatsapp_templates | SI | `org_id match` | `org_id match` | `org_id match` | `org_id match` |
| whatsapp_conversations | SI | `org_id match` | `org_id match` | `org_id match` | Never |
| whatsapp_messages | SI | `org_id match` | `org_id match` | Never | Never |
| **notifications** | SI | `user_id = uid()` | `org_id match` | `user_id = uid()` | Never |
| comments | SI | `org_id match` | `org_id + author=uid` | `org_id + author=uid` | `author OR admin` |
| email_logs | SI | `org_id match` | `org_id match` | `org_id match` | Never |
| **audit_logs** | SI | `org_id + admin:view_audit` | Service only | Never | Never |
| product_route_events | SI | `org_id match` | `org_id match` | Never | Never |
| dashboard_widgets | SI | `org_id + user=uid` | `org_id match` | `user_id = uid()` | `user_id = uid()` |
| saved_reports | SI | `org_id + (own OR shared)` | `org_id match` | `user_id = uid()` | `user_id = uid()` |

---

## 6. PRINCIPIOS ANTI-DUPLICIDAD

### 6.1 Dónde vive cada lógica

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                     │
│  - useHasPermission('leads:create') → show/hide "Nuevo Lead" button │
│  - useCanAccessModule('leads') → show/hide menu item                │
│  - NO valida lógica de negocio                                      │
│  - NO hace queries directos a la DB para permisos                   │
├─────────────────────────────────────────────────────────────────────┤
│                         API ROUTE                                    │
│  - checkPermission('leads:create') → 403 si no tiene permiso       │
│  - Valida: campos requeridos, formato, reglas de negocio            │
│  - Llama a funciones RPC cuando necesario                           │
│  - NO duplica validación de org_id (RLS lo hace)                    │
├─────────────────────────────────────────────────────────────────────┤
│                         RLS                                          │
│  - organization_id = auth.get_user_org_id() → SIEMPRE              │
│  - Data scope (own/team/all) → SOLO en leads, quotes, orders       │
│  - NO valida permisos de acción                                     │
│  - NO implementa lógica de negocio                                  │
├─────────────────────────────────────────────────────────────────────┤
│                         TRIGGERS/CONSTRAINTS                         │
│  - CHECK constraints → valores válidos                              │
│  - Triggers → audit_log, updated_at, consecutivos                  │
│  - NO duplica lo que hace RLS                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 Checklist Anti-Duplicidad

- [ ] RLS solo filtra por `organization_id` (y `assigned_to/advisor_id` cuando necesario)
- [ ] API Routes validan permisos con `checkPermission()`
- [ ] Frontend usa `useHasPermission()` para UI condicional
- [ ] Lógica de negocio vive en funciones RPC o en el API Route
- [ ] CHECK constraints validan valores en la base de datos
- [ ] Triggers manejan side-effects (audit, timestamps, consecutivos)
- [ ] NINGUNA validación se repite en más de una capa

---

## 7. RESUMEN EJECUTIVO

| Métrica | Valor |
|---|---|
| **Tablas con RLS** | 43 de 45 (permissions es global, organizations es especial) |
| **Funciones helper** | 4 (get_user_org_id, is_org_admin, is_commercial_manager, has_perm) |
| **Tablas con data scope** | 3 (leads, quotes, orders) |
| **Tablas child (via parent)** | 8 (quote_items, order_items, po_items, etc.) |
| **Tablas solo-lectura** | 4 (audit_logs, lead_assignments_log, status_history, route_events) |
| **Índices para RLS** | 8 índices críticos |

### Decisiones Clave:
1. **RLS = tenant isolation + data scope mínimo** → simple y performante
2. **Permisos de acción = API** → no en RLS (evita complejidad)
3. **Funciones STABLE** → cacheo automático por transacción en PostgreSQL
4. **Child tables via parent** → no duplicar organization_id en tablas hijas
5. **Audit_logs = service_role only** → los usuarios no escriben directamente
