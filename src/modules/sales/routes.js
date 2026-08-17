import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../middleware/auth.js';

const router = Router();

const saleItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().positive(),
  unit_price: z.number().nonnegative(),
  tax_rate: z.number().nonnegative().default(0),
});

const createSaleSchema = z.object({
  business_id: z.string().uuid(),
  client_id: z.string().uuid().nullable().optional(),
  items: z.array(saleItemSchema).min(1),
});

// Crea una venta completa (items + descuento de inventario) de forma atómica,
// delegando la transacción a la función Postgres create_sale().
router.post('/', requireAuth, requireRole('owner', 'admin', 'manager', 'salesperson'), async (req, res) => {
  const parsed = createSaleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ error: parsed.error.flatten() });
  }

  const { business_id, client_id, items } = parsed.data;

  const { data: saleId, error } = await req.supabase.rpc('create_sale', {
    p_business_id: business_id,
    p_client_id: client_id ?? null,
    p_items: items,
  });

  if (error) return res.status(400).json({ error: error.message });

  const { data: sale, error: fetchError } = await req.supabase
    .from('sales')
    .select('*, sale_items(*)')
    .eq('id', saleId)
    .single();

  if (fetchError) return res.status(400).json({ error: fetchError.message });
  res.status(201).json(sale);
});

router.get('/:businessId', requireAuth, requireRole('owner', 'admin', 'manager', 'salesperson', 'accountant'), async (req, res) => {
  const { data, error } = await req.supabase
    .from('sales')
    .select('*, sale_items(*), clients(full_name)')
    .eq('business_id', req.businessId)
    .order('created_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

export default router;
