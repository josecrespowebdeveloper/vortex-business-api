import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../middleware/auth.js';

const router = Router();

const createBusinessSchema = z.object({
  name: z.string().min(2),
  business_type: z.string().min(2), // 'tienda' | 'restaurante' | 'taller' | 'clinica' | ...
  currency: z.string().length(3).default('USD'),
  timezone: z.string().default('UTC'),
});

// Lista los negocios donde el usuario autenticado es miembro (RLS lo filtra solo)
router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await req.supabase
    .from('businesses')
    .select('*, business_users!inner(role)')
    .eq('business_users.user_id', req.user.id);

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Crea un negocio nuevo y da de alta al creador como 'owner'
router.post('/', requireAuth, async (req, res) => {
  const parsed = createBusinessSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ error: parsed.error.flatten() });
  }

  const { data: business, error } = await req.supabase
    .from('businesses')
    .insert({ ...parsed.data, owner_id: req.user.id })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  const { error: memberError } = await req.supabase.from('business_users').insert({
    business_id: business.id,
    user_id: req.user.id,
    role: 'owner',
  });

  if (memberError) return res.status(400).json({ error: memberError.message });
  res.status(201).json(business);
});

// Actualiza datos del negocio (solo owner/admin, validado por requireRole)
router.patch('/:businessId', requireAuth, requireRole('owner', 'admin'), async (req, res) => {
  const { data, error } = await req.supabase
    .from('businesses')
    .update(req.body)
    .eq('id', req.businessId)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

export default router;
