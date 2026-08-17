import { supabaseAdmin } from '../../lib/supabase.js';

// Job de sistema (correr con cron, ej. cada hora) que revisa productos bajo
// su stock mínimo EN TODOS los negocios. Usa supabaseAdmin porque necesita
// leer entre tenants, algo que un usuario normal nunca podría hacer bajo RLS.
export async function checkLowStock() {
  const { data: lowStockProducts, error } = await supabaseAdmin
    .from('products')
    .select('id, business_id, name, stock_quantity, min_stock')
    .eq('is_active', true)
    .filter('stock_quantity', 'lte', 'min_stock');

  if (error) {
    console.error('[lowStockJob] error:', error.message);
    return;
  }

  for (const product of lowStockProducts) {
    // Aquí conectarías con tu proveedor de notificaciones
    // (email, WhatsApp Business API, push) por negocio.
    console.log(`[ALERTA] ${product.name} bajo stock en negocio ${product.business_id}`);
  }
}
