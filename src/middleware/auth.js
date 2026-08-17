import { createUserScopedClient, supabaseAdmin } from '../lib/supabase.js';

// Extrae el JWT del header Authorization, verifica al usuario contra Supabase Auth,
// y adjunta req.supabase (cliente scoped al usuario -> respeta RLS) y req.user.
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing bearer token' });
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = data.user;
  req.token = token;
  req.supabase = createUserScopedClient(token); // todas las queries respetan RLS
  next();
}

// Middleware opcional: exige un rol mínimo dentro de :businessId.
// Se apoya en la función SQL get_my_role() vía RPC para no duplicar la lógica de roles.
export function requireRole(...allowedRoles) {
  return async (req, res, next) => {
    const businessId = req.params.businessId || req.body.business_id;
    if (!businessId) {
      return res.status(400).json({ error: 'business_id is required' });
    }

    const { data: role, error } = await req.supabase.rpc('get_my_role', {
      target_business_id: businessId,
    });

    if (error || !role || !allowedRoles.includes(role)) {
      return res.status(403).json({ error: 'Insufficient permissions for this business' });
    }

    req.businessId = businessId;
    req.role = role;
    next();
  };
}
