const serviceClient = require('../supabase/service-client');

module.exports = async (req, res) => {
  try {
    const { clientId, role, code } = req.body;
    if (!clientId || !role || !code) return res.status(400).json({ success: false, message: 'missing parameters' });

    const supabase = serviceClient.getClient();

    // Only super admins can revoke access
    const { data: superAdmin } = await supabase
      .from('super_admins')
      .select('id')
      .eq('super_code', code)
      .eq('is_active', true)
      .maybeSingle();

    if (!superAdmin) return res.status(403).json({ success: false, message: 'unauthorized' });

    // Delete related data
    await supabase.from('sessions').delete().eq('client_id', clientId);
    await supabase.from('questions').delete().eq('client_id', clientId);
    await supabase.from('clients').delete().eq('id', clientId);

    res.json({ success: true });
  } catch (err) {
    console.error('revoke-access error', err);
    res.status(500).json({ success: false });
  }
};
