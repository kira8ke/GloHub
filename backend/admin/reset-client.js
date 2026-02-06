const serviceClient = require('../supabase/service-client');

module.exports = async (req, res) => {
  try {
    const { clientId, role, code } = req.body;
    if (!clientId || !role || !code) return res.status(400).json({ success: false, message: 'missing parameters' });

    const supabase = serviceClient.getClient();

    // Verify permissions
    if (role === 'super') {
      const { data: superAdmin } = await supabase
        .from('super_admins')
        .select('id')
        .eq('super_code', code)
        .eq('is_active', true)
        .maybeSingle();

      if (!superAdmin) return res.status(403).json({ success: false, message: 'unauthorized' });
    } else if (role === 'client') {
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('admin_code', code)
        .eq('id', clientId)
        .maybeSingle();

      if (!client) return res.status(403).json({ success: false, message: 'unauthorized' });
    } else {
      return res.status(403).json({ success: false, message: 'unauthorized' });
    }

    // Delete sessions and questions for the client
    await supabase.from('sessions').delete().eq('client_id', clientId);
    await supabase.from('questions').delete().eq('client_id', clientId);

    res.json({ success: true });
  } catch (err) {
    console.error('reset-client error', err);
    res.status(500).json({ success: false });
  }
};
