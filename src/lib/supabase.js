import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Cliente "anon": se usa por request, autenticado con el JWT del usuario,
// así RLS filtra automáticamente por business_id/rol. Úsalo para el 95% de
// las operaciones (lectura y escritura normal).
export function createUserScopedClient(accessToken) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Cliente "service_role": ignora RLS. Solo para tareas de sistema
// (cron de alertas de stock, webhooks de WhatsApp, reportes agregados
// entre negocios, jobs administrativos). NUNCA exponerlo al cliente.
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
