# Módulo de Clientes

Este módulo implementa la gestión completa de clientes para el CRM PROSUMINISTROS.

## Estructura de Archivos

```
customers/
├── page.tsx                              # Página principal (Server Component)
├── README.md                             # Documentación
├── _components/
│   ├── customers-page-client.tsx        # Componente principal (Client Component)
│   ├── customer-table.tsx               # Tabla TanStack Table
│   ├── customer-table-columns.tsx       # Definición de columnas
│   ├── customer-form-dialog.tsx         # Modal crear/editar cliente
│   ├── customer-contacts-dialog.tsx     # Modal gestión de contactos
│   ├── contact-form-dialog.tsx          # Modal crear/editar contacto
│   └── customer-filters.tsx             # Filtros de búsqueda
└── _lib/
    ├── types.ts                         # TypeScript interfaces
    ├── schemas.ts                       # Zod schemas y validaciones
    └── customer-queries.ts              # TanStack Query hooks
```

## Características Implementadas

### 1. Gestión de Clientes (TAREA 1.1.4)
- ✅ Crear nuevo cliente
- ✅ Editar cliente existente
- ✅ Validación de NIT colombiano con dígito de verificación
- ✅ Campos obligatorios según matriz de permisos
- ✅ Campos condicionales según rol (forma de pago)

### 2. Tabla de Clientes (TAREA 1.1.5)
- ✅ TanStack Table v8 con columnas configurables
- ✅ Paginación server-side
- ✅ Búsqueda por razón social, NIT y ciudad
- ✅ Filtros con debounce (500ms)
- ✅ Loading states con spinner
- ✅ Empty states con ilustración
- ✅ Animaciones Framer Motion

### 3. Gestión de Contactos
- ✅ Múltiples contactos por cliente
- ✅ Marcar contacto principal
- ✅ CRUD completo (crear, editar, eliminar)
- ✅ Confirmación antes de eliminar
- ✅ Validación de campos obligatorios

## Validaciones Frontend

### Cliente
- **NIT**: Validación de dígito verificador colombiano
- **Razón Social**: Obligatorio, máx 255 caracteres
- **Dirección**: Obligatorio, máx 500 caracteres
- **Ciudad**: Obligatorio, máx 100 caracteres
- **Departamento**: Obligatorio, selector con 33 departamentos
- **Teléfono**: Obligatorio, formato internacional
- **Email**: Formato válido (opcional)
- **Forma de Pago**: Condicional según rol

### Contacto
- **Nombre Completo**: Obligatorio, máx 255 caracteres
- **Teléfono**: Obligatorio, formato internacional
- **Email**: Obligatorio, formato válido
- **Cargo**: Opcional, máx 100 caracteres
- **Contacto Principal**: Boolean, solo uno por cliente

## APIs Utilizadas

### Clientes
- `GET /api/customers` - Lista paginada con filtros
- `POST /api/customers` - Crear cliente
- `PUT /api/customers` - Actualizar cliente

### Contactos
- `GET /api/customers/[id]/contacts` - Lista contactos
- `POST /api/customers/[id]/contacts` - Crear contacto
- `PUT /api/customers/[id]/contacts` - Actualizar contacto
- `DELETE /api/customers/[id]/contacts?contactId={id}` - Eliminar contacto

## Stack Tecnológico

- **Next.js 15.5.9** - App Router, Server Components
- **React 19** - Client Components
- **TypeScript** - Type safety
- **TanStack Query 5.90.2** - Data fetching y cache
- **TanStack Table 8.21.3** - Tablas avanzadas
- **React Hook Form 7.65.0** - Formularios
- **Zod 3.25.32** - Validación de schemas
- **Framer Motion 12.34.0** - Animaciones
- **Shadcn/UI** - Componentes UI
- **Sonner 2.0.7** - Toast notifications

## UX/UI Features

### Diseño
- Dark mode por defecto
- Colores: Primary #00C8CF (Cyan), Accent #161052 (Navy)
- Responsive: Mobile, Tablet, Desktop
- Accesibilidad: ARIA labels, keyboard navigation

### Animaciones
- fadeIn al cargar página
- slideIn para filas de tabla (stagger)
- zoom para modals
- slide para transiciones

### Estados
- Loading: Spinner animado
- Empty: Ilustración + mensaje descriptivo
- Error: Border rojo + mensaje de error
- Success: Toast verde

## Permisos por Campo

Según CONSOLIDADO-DOCUMENTOS-GENERALES.md, sección 2:

| Campo | Obligatorio | Gerencia General | Gerencia Comercial | Comerciales | Financiera |
|-------|-------------|------------------|-------------------|-------------|-----------|
| NIT | SÍ | Crear/Modificar | Crear/Modificar | Crear/Modificar | NO |
| Razón social | SÍ | Crear/Modificar | Crear/Modificar | Crear/Modificar | NO |
| Dirección | SÍ | Crear/Modificar | Crear/Modificar | Crear/Modificar | NO |
| Ciudad | SÍ | Crear/Modificar | Crear/Modificar | Crear/Modificar | NO |
| Departamento | SÍ | Crear/Modificar | Crear/Modificar | Crear/Modificar | NO |
| Teléfono | SÍ | Crear/Modificar | Crear/Modificar | Crear/Modificar | NO |
| Forma de pago | NO | Crear/Modificar | NO | NO | Crear/Modificar |
| Comercial asignado | SÍ | Modificar | Modificar | NO | NO |

**Nota**: La implementación de permisos por rol está pendiente (ver TODOs en código).

## TODOs Pendientes

1. **Permisos RBAC**: Implementar `PermissionGate` para campos condicionales
2. **Comercial Asignado**: Agregar selector de usuarios con rol comercial
3. **Count de Contactos**: Agregar query para obtener el count de contactos por cliente
4. **Testing**: Unit tests y E2E tests
5. **i18n**: Internacionalización (actualmente en español)

## Cómo Usar

### Desarrollo Local
```bash
cd apps/web
pnpm dev
```

Navegar a: `http://localhost:3000/home/customers`

### Crear Cliente
1. Click en "Nuevo Cliente"
2. Completar formulario obligatorio
3. Submit → Toast de éxito
4. Tabla se actualiza automáticamente

### Gestionar Contactos
1. Click en icono "Users" en acciones
2. Se abre modal con lista de contactos
3. Agregar/Editar/Eliminar contactos
4. Marcar contacto principal

## Troubleshooting

### Error: "NIT no válido"
- Verificar que el NIT incluya el dígito de verificación
- Formato: `123456789-0`

### Error: "Cliente no encontrado"
- Verificar que el cliente pertenezca a la organización del usuario
- Revisar permisos de lectura

### Tabla no carga
- Verificar que la API `/api/customers` esté respondiendo
- Revisar Network tab en DevTools
- Verificar token de autenticación

## Changelog

### v1.0.0 (2026-02-13)
- ✅ Implementación inicial del módulo
- ✅ TAREA 1.1.4: Estructura y componentes
- ✅ TAREA 1.1.5: Tabla con paginación y filtros
- ✅ Gestión de contactos completa
- ✅ Validaciones y UX optimizada
