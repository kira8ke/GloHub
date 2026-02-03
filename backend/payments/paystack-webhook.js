// Minimal placeholder webhook for Paystack (validate via Paystack signature or secret)
module.exports = async (req, res) => {
  try {
    // In a real deployment, validate the Paystack signature header and/or secret
    // For now, accept and log
    console.log('Received paystack webhook', req.body);
    // TODO: verify signature using process.env.PAYSTACK_SECRET
    res.json({ ok: true });
  } catch (err) {
    console.error('paystack webhook error', err);
    res.status(500).json({ ok: false });
  }
};
