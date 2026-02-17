require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const verifyAdmin = require('./auth/verify-admin');
const paystackWebhook = require('./payments/paystack-webhook');
const serviceClient = require('./supabase/service-client');
const charadesRouter = require('./charades/game-manager');

const app = express();
const PORT = process.env.PORT || 4000;

// =====================================================
// CORS Configuration for Production
// =====================================================
const corsOptions = {
  origin: function(origin, callback) {
    const allowedOrigins = [
      'https://glohub.space',
      'http://localhost:3000',
      'http://localhost:8000',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:8000'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

// Register charades game router
app.use('/charades', charadesRouter);

// Health - check basic server and Supabase availability
app.get('/health', async (req, res) => {
  const result = { status: 'ok', db: 'unknown' };
  try {
    // Try to initialize service client and do a lightweight query
    try {
      const client = serviceClient.getClient();
      const { data, error } = await client.from('super_admins').select('id').limit(1);
      if (error) {
        console.warn('Health check: supabase query error', error.message || error);
        result.db = 'unavailable';
      } else {
        result.db = 'ok';
      }
    } catch (err) {
      // service client not configured or other error
      console.warn('Health check: supabase client init failed');
      result.db = 'unavailable';
    }
  } catch (err) {
    console.error('Health endpoint error', err);
  }

  res.json(result);
});

// Auth verification endpoints (safe wrappers)
app.post('/auth/verify-admin', verifyAdmin);
app.post('/auth/verify-super', require('./auth/verify-super'));

// payments: webhook (POST)
app.post('/payments/paystack-webhook', paystackWebhook);

// expose a test endpoint demonstrating service client use (protected by env key in header)
app.get('/supabase/test', async (req, res) => {
  try {
    const key = req.headers['x-service-key'];
    if (!key || key !== process.env.BACKEND_SERVICE_KEY) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const client = serviceClient.getClient();
    const { data } = await client.from('clients').select('*').limit(1);
    res.json({ ok: true, sample: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
});

// Admin operations
app.post('/admin/reset-client', require('./admin/reset-client'));
app.post('/admin/revoke-access', require('./admin/revoke-access'));
app.post('/admin/delete', require('./admin/delete'));

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
  console.log('Production frontend: https://glohub.space');
  console.log('This server should be running at: https://glohub.onrender.com');

  // Try to initialize Supabase service client and report status (do not log keys)
  try {
    const client = serviceClient.getClient();
    client.from('super_admins').select('id').limit(1).then(({ error }) => {
      if (error) {
        console.warn('Supabase service client initialized but query failed:', error.message || error);
      } else {
        console.log('Supabase service client initialized and responsive');
      }
    }).catch(err => {
      console.warn('Supabase query check failed:', err && err.message ? err.message : err);
    });
  } catch (err) {
    console.warn('Supabase service client not configured (check SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL in .env)');
  }
});
