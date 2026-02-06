# GloHub Backend (minimal)

This backend provides secure endpoints for admin verification and sensitive operations. Key files:

- `server.js` - Express server exposing endpoints
- `auth/verify-admin.js` - Verify admin codes (client or super via code)
- `auth/verify-super.js` - Verify super admin password
- `supabase/service-client.js` - Supabase service role client (uses `SUPABASE_SERVICE_ROLE_KEY` from .env)
- `admin/reset-client.js`, `admin/revoke-access.js`, `admin/delete.js` - Protected admin operations
- `payments/paystack-webhook.js` - Placeholder Paystack webhook (validate signatures in prod)

Setup:

1. Copy `.env.example` to `.env` and fill values (SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL, BACKEND_SERVICE_KEY, PAYSTACK_SECRET)
2. Run `npm install` in the `backend` folder
3. Start with `npm start` (defaults to port 4000). Set `PORT` in `.env` to change.

Frontend integration:

- By default frontend fetch calls use relative paths (e.g., `/auth/verify-admin`). If backend runs on a different origin, set `window.BACKEND_URL` in your frontend to the backend URL (e.g., `https://api.example.com`).

Security notes:

- Never expose the Supabase service role key in the frontend.
- Validate Paystack webhook signatures with `PAYSTACK_SECRET` before processing payments.
