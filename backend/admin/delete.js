const serviceClient = require('../supabase/service-client');

module.exports = async (req, res) => {
  try {
    const { itemType, id, role, code } = req.body;
    if (!itemType || !id || !role || !code) return res.status(400).json({ success: false, message: 'missing parameters' });

    const supabase = serviceClient.getClient();

    // Resolve permissions
    let allowed = false;

    if (role === 'super') {
      const { data: superAdmin } = await supabase
        .from('super_admins')
        .select('id')
        .eq('super_code', code)
        .eq('is_active', true)
        .maybeSingle();
      allowed = !!superAdmin;
    } else if (role === 'client') {
      // ensure admin code belongs to client who owns the item
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('admin_code', code)
        .maybeSingle();
      if (!client) return res.status(403).json({ success: false, message: 'unauthorized' });

      // for supported item types, fetch and compare client_id
      if (itemType === 'quiz_session' || itemType === 'charades_game') {
        const table = itemType === 'quiz_session' ? 'quiz_sessions' : 'charades_games';
        const { data: item } = await supabase.from(table).select('client_id').eq('id', id).maybeSingle();
        if (!item) return res.status(404).json({ success: false, message: 'not found' });
        allowed = item.client_id === client.id;
      }
    }

    if (!allowed) return res.status(403).json({ success: false, message: 'unauthorized' });

    // Perform deletion
    switch (itemType) {
      case 'quiz_session':
        await supabase.from('quiz_sessions').delete().eq('id', id);
        return res.json({ success: true });
      case 'charades_game':
        await supabase.from('charades_games').delete().eq('id', id);
        return res.json({ success: true });
      default:
        return res.status(400).json({ success: false, message: 'unsupported type' });
    }

  } catch (err) {
    console.error('admin delete error', err);
    res.status(500).json({ success: false, message: 'server error' });
  }
};
