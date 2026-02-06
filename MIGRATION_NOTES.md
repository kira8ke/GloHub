Refactor Summary - Move sensitive logic to backend

What changed:

- Created `backend/` with Express server and endpoints for admin verification and sensitive admin operations.
- Moved super-admin/password verification to backend (`/auth/verify-super`).
- Moved admin code verification to backend (`/auth/verify-admin`).
- Added admin operations endpoints (`/admin/reset-client`, `/admin/revoke-access`, `/admin/delete`) that use the Supabase service role key.
- Kept frontend limited to UI logic, form handling, and fetch calls to backend endpoints. Replaced direct DB deletions and admin verification in frontend with secure API calls.
- Added `backend/supabase/service-client.js` - uses `SUPABASE_SERVICE_ROLE_KEY` from env.

How to run:

1. cd backend && npm install
2. Copy `.env.example` to `.env` and provide secrets
3. npm start

Frontend notes:

- Fetch calls use `window.BACKEND_URL || ''` as base. Set `window.BACKEND_URL` if backend is on a different host/port.
- `frontend/supabase.js` should only contain the public anon key.

Files updated:

- frontend: `admin-login.html`, `superadmin.js`, `admin.js`, `supabase.js`
- backend: new files under `backend/`

If you want, I can continue moving more DB write operations to backend endpoints. Decide how strict you want server authorization to be (simple code check vs token-based sessions).
