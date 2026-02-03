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

    // first check super_admins
    const { data: superAdmin } = await supabase
      .from('super_admins')
      .select('id, name, super_code, is_active')
      .eq('super_code', code)
      .eq('is_active', true)
      .maybeSingle();

    if (superAdmin) {
      return res.json({ success: true, role: 'super', id: superAdmin.id, name: superAdmin.name, code: superAdmin.super_code });
    }

    // then check clients admin code (be tolerant to column name differences)
    const { data: client } = await supabase
      .from('clients')
      .select('id, admin_email, admin_code, email')
      .eq('admin_code', code)
      .maybeSingle();

    if (client) {
      const email = client.admin_email || client.email || null;
      return res.json({ success: true, role: 'client', id: client.id, email: email, code: client.admin_code });
    }

    return res.json({ success: false });
  } catch (err) {
    console.error('verify-admin error', err);
    res.status(500).json({ success: false, message: 'server error' });
  }
};
