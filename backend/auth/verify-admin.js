const serviceClient = require('../supabase/service-client');

module.exports = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'code required' });

    // Try to create the service client; if it's not configured return a graceful response
    let supabase;
    try {
      supabase = serviceClient.getClient();
    } catch (e) {
      console.error('Supabase service client not configured', e);
      return res.json({ success: false, message: 'service_unavailable' });
    }

    // ✅ NEW: First check the admins table (unified table for all admin types)
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('admin_code', code)
      .maybeSingle();

    if (admin) {
      // ✅ Determine effective role based on can_bypass
      const effectiveRole = admin.can_bypass === true ? 'admin' : admin.role;

      // If bypass mode OR if it's a superadmin, return super role
      if (admin.role === 'superadmin' && !admin.can_bypass) {
        return res.json({
          success: true,
          role: 'super',
          id: admin.id,
          name: admin.name || 'Super Admin',
          code: admin.admin_code,
          isBypassMode: false
        });
      }

      // Regular admin or bypass mode
      return res.json({
        success: true,
        role: 'client',
        id: admin.id,
        email: admin.email,
        code: admin.admin_code,
        client_id: admin.client_id,
        effectiveRole: effectiveRole,
        isBypassMode: admin.can_bypass === true
      });
    }

    // ✅ FALLBACK: Check legacy super_admins table (if it still exists)
    const { data: superAdmin } = await supabase
      .from('super_admins')
      .select('id, name, super_code, is_active')
      .eq('super_code', code)
      .eq('is_active', true)
      .maybeSingle();

    if (superAdmin) {
      return res.json({
        success: true,
        role: 'super',
        id: superAdmin.id,
        name: superAdmin.name,
        code: superAdmin.super_code,
        isBypassMode: false
      });
    }

    // ✅ FALLBACK: Check legacy clients table (if it still exists)
    const { data: client } = await supabase
      .from('clients')
      .select('id, admin_email, admin_code, email')
      .eq('admin_code', code)
      .maybeSingle();

    if (client) {
      const email = client.admin_email || client.email || null;
      return res.json({
        success: true,
        role: 'client',
        id: client.id,
        email: email,
        code: client.admin_code,
        effectiveRole: 'admin',
        isBypassMode: false
      });
    }

    return res.json({ success: false, message: 'Invalid admin code' });
  } catch (err) {
    console.error('verify-admin error', err);
    res.status(500).json({ success: false, message: 'server error' });
  }
};