# Vortex Business API

Backend Node.js (Express) sobre Supabase (PostgreSQL + Auth) para gestión
multi-negocio: ventas, inventario, CRM, contabilidad.

## Orden de setup

1. Crea un proyecto en supabase.com
2. En el SQL Editor de Supabase, ejecuta en este orden:
   - `vortex_business_api_schema.sql` — tablas base
   - `02_supabase_adjustments.sql` — profiles ligado a auth.users + RLS
   - `03_create_sale_function.sql` — función atómica para crear ventas
3. Copia `.env.example` a `.env` y llena con las keys de tu proyecto
   (Project Settings → API en el dashboard de Supabase)
4. `npm install`
5. `npm run dev`

## Cómo funciona la autenticación

El frontend (o Postman/curl para pruebas) se autentica directo contra
Supabase Auth (`supabase.auth.signInWithPassword`, etc.) y obtiene un JWT.
Ese JWT se manda en cada request a esta API como
`Authorization: Bearer <token>`. El middleware `requireAuth` lo valida y
crea un cliente Supabase "scoped" a ese usuario — así todas las queries
respetan Row Level Security automáticamente, sin lógica de permisos
duplicada en Node.

## Patrón para nuevos módulos

Cada carpeta en `src/modules/` sigue el mismo patrón que `businesses/` y
`sales/`: rutas Express delgadas que llaman a `req.supabase` (respeta RLS)
para CRUD simple, y a funciones RPC de Postgres cuando la operación necesita
ser atómica (ej. crear venta + descontar stock).

Módulos pendientes de implementar con el mismo patrón: `products`,
`clients`, `inventory`, `accounting`, `reports`, `suppliers`.
