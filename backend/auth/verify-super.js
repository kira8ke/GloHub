const serviceClient = require('../supabase/service-client');

module.exports = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ success: false, message: 'password required' });

    const supabase = serviceClient.getClient();

    const { data: superAdmin } = await supabase
      .from('super_admins')
      .select('id, name, super_code, is_active')
      .eq('password', password)
      .eq('is_active', true)
      .maybeSingle();

    if (superAdmin) {
      return res.json({ success: true, id: superAdmin.id, name: superAdmin.name, code: superAdmin.super_code });
    }

    return res.json({ success: false });
  } catch (err) {
    console.error('verify-super error', err);
    res.status(500).json({ success: false, message: 'server error' });
  }
};
