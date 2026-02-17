# Production Deployment Checklist

## ✅ All Code Changes Complete

Your project has been fully updated for production deployment to:

- **Frontend:** https://glohub.space
- **Backend:** https://glohub.onrender.com

---

## 🚀 Quick Deployment Steps

### Step 1: Deploy Backend to Render.com

```bash
# 1. Push code to GitHub (if using Render's GitHub integration)
git add .
git commit -m "Production deployment: CORS config update"
git push

# 2. On Render.com, redeploy the service
# - Go to https://dashboard.render.com
# - Select your backend service
# - Click "Manual Deploy" or "Redeploy"
```

**Environment Variables to Verify:**

```
SUPABASE_URL=https://[your-project].supabase.co
SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
SUPER_ADMIN_CODE=[secure-code]
PAYSTACK_SECRET_KEY=[if-using-payments]
```

### Step 2: Deploy Frontend to Hosting (e.g., Vercel, Netlify)

```bash
# 1. Push code to GitHub
git add .
git commit -m "Production deployment: BACKEND_URL and socket.io updates"
git push

# 2. Deploy on your hosting platform
# - If using Vercel/Netlify, it auto-deploys on push
# - Or manually trigger deployment
```

### Step 3: Verify Deployment

**Test Backend Health:**

```bash
curl https://glohub.onrender.com/health
# Expected response: {"status":"ok","db":"ok"} or similar
```

**Test Frontend:**

1. Open https://glohub.space in browser
2. Open DevTools Console (F12)
3. Look for: `[Config] Production mode. Using backend: https://glohub.onrender.com`
4. Go to Admin Login and test with admin code
5. Start a game and verify WebSocket connects to wss://glohub.onrender.com

**Network Test (DevTools Network Tab):**

- All API calls to `https://glohub.onrender.com` ✅
- WebSocket to `wss://glohub.onrender.com` ✅
- No 404 errors ✅
- No localhost requests ✅

---

## 📋 What Changed

### Backend

- ✅ CORS now allows `https://glohub.space`
- ✅ Removed hardcoded localhost references
- ✅ Added credentials support for authentication

### Frontend

- ✅ New `config.js` file with API configuration
- ✅ All fetch() calls updated to use `${window.BACKEND_URL}`
- ✅ WebSocket uses `wss://` for secure connection
- ✅ HTML files load config.js before other scripts
- ✅ Automatic development/production detection

### Files Modified

```
backend/
  └─ server.js                    (CORS config)

frontend/
  ├─ config.js                    (NEW - API config)
  ├─ admin-login.html             (Updated script tags)
  ├─ admin-dashboard.html         (Updated script tags)
  ├─ charades-game.html           (Updated script tags)
  ├─ charades-wait-room.html      (Updated script tags)
  └─ charades.js                  (Updated fetch/WebSocket calls)
```

---

## 🔍 Testing Before Going Live

### Admin Login Test

```
1. Go to https://glohub.space/admin-login.html
2. Enter admin code
3. Should redirect to admin dashboard
4. Check DevTools Console: No CORS errors
5. Check Network tab: Requests to glohub.onrender.com
```

### Game WebSocket Test

```
1. Create a game and start it
2. Check DevTools > Network > WS
3. Should see connection to wss://glohub.onrender.com
4. Messages should flow in real-time
5. No "WebSocket is closed" errors
```

### API Fetch Test

```
1. Start a game
2. Check DevTools > Network > XHR
3. All requests to https://glohub.onrender.com
4. No 404 or CORS errors
5. Responses are 200 OK
```

---

## 🆘 If Something Goes Wrong

### CORS Error

```javascript
// Check server.js allows origin:
'https://glohub.space',
```

### WebSocket Won't Connect

```javascript
// Check it's using WSS:
wss://glohub.onrender.com  // ✅ Correct
ws://glohub.onrender.com   // ❌ Wrong
```

### API Returns 404

```javascript
// Verify full URL is constructed:
${window.BACKEND_URL}/charades/player/123/ready
// Should be: https://glohub.onrender.com/charades/player/123/ready
```

### Admin Login Fails

1. Check environment variables on Render.com
2. Verify SUPABASE_SERVICE_ROLE_KEY is set
3. Check backend logs for SQL errors

---

## 📚 Documentation

For detailed information, see:

- `PRODUCTION_MIGRATION_GUIDE.md` - Complete deployment guide with code examples
- `PRODUCTION_DEPLOYMENT_COMPLETE.md` - Full change summary

---

## ✨ You're All Set!

Your backend and frontend are now **production-ready**. All localhost references have been removed, CORS is configured, and the system automatically detects whether it's running in development or production.

**No manual URL changes needed in your code!**

---

## 🎯 Key Improvements

| Aspect       | Before                  | After                           |
| ------------ | ----------------------- | ------------------------------- |
| Frontend URL | `http://localhost:3000` | `https://glohub.space`          |
| Backend URL  | `http://localhost:4000` | `https://glohub.onrender.com`   |
| API Calls    | `/api/...`              | `${window.BACKEND_URL}/api/...` |
| WebSocket    | `ws://localhost:4000`   | `wss://glohub.onrender.com`     |
| CORS         | Open                    | `https://glohub.space`          |
| Security     | HTTP                    | HTTPS + WSS                     |
| Development  | Hardcoded               | Auto-detect                     |

---

**Ready to deploy!** 🚀

Questions? Check the detailed guides or review the code changes.
