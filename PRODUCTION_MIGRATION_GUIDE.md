# GloHub Production Migration Guide

## Overview

This document outlines the production deployment configuration for GloHub, moving from local development (`http://localhost`) to production URLs.

**Frontend Domain:** https://glohub.space  
**Backend Domain:** https://glohub.onrender.com

---

## 1. Backend Server Configuration (Updated)

### server.js - CORS Configuration

```javascript
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const verifyAdmin = require("./auth/verify-admin");
const paystackWebhook = require("./payments/paystack-webhook");
const serviceClient = require("./supabase/service-client");
const charadesRouter = require("./charades/game-manager");

const app = express();
const PORT = process.env.PORT || 4000;

// =====================================================
// CORS Configuration for Production
// =====================================================
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "https://glohub.space", // Production frontend
      "http://localhost:3000", // Local development
      "http://localhost:8000", // Local development (alternate port)
      "http://127.0.0.1:3000", // Localhost variant
      "http://127.0.0.1:8000", // Localhost variant
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

// Register routes
app.use("/charades", charadesRouter);

// Health check endpoint
app.get("/health", async (req, res) => {
  const result = { status: "ok", db: "unknown" };
  try {
    const client = serviceClient.getClient();
    const { data, error } = await client
      .from("super_admins")
      .select("id")
      .limit(1);
    result.db = error ? "unavailable" : "ok";
  } catch (err) {
    result.db = "unavailable";
  }
  res.json(result);
});

// Auth endpoints
app.post("/auth/verify-admin", verifyAdmin);
app.post("/auth/verify-super", require("./auth/verify-super"));

// Webhook
app.post("/payments/paystack-webhook", paystackWebhook);

// Admin operations
app.post("/admin/reset-client", require("./admin/reset-client"));
app.post("/admin/revoke-access", require("./admin/revoke-access"));
app.post("/admin/delete", require("./admin/delete"));

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
  console.log("Production frontend: https://glohub.space");
  console.log("This server should be running at: https://glohub.onrender.com");

  // Database connection check
  try {
    const client = serviceClient.getClient();
    client
      .from("super_admins")
      .select("id")
      .limit(1)
      .then(({ error }) => {
        if (error) {
          console.warn(
            "Supabase service client initialized but query failed:",
            error.message,
          );
        } else {
          console.log("Supabase service client initialized and responsive");
        }
      });
  } catch (err) {
    console.warn("Supabase service client not configured");
  }
});
```

### Key Changes:

- ✅ Replaced `app.use(cors())` with explicit CORS configuration
- ✅ Added `https://glohub.space` to allowed origins
- ✅ Enabled `credentials: true` for cookie/auth support
- ✅ Kept localhost addresses for development compatibility
- ✅ Removed hardcoded localhost console logs

---

## 2. Frontend Configuration

### config.js - API Configuration (NEW FILE)

Create `/frontend/config.js`:

```javascript
/**
 * GloHub Frontend Configuration
 * Production Environment Setup
 */

window.BACKEND_URL = "https://glohub.onrender.com";

// Auto-detect development environment
const isDevelopment =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname.includes("localhost");

// Override for development
if (isDevelopment) {
  window.BACKEND_URL = "http://localhost:4000";
  console.log(
    "[Config] Development mode detected. Using backend:",
    window.BACKEND_URL,
  );
} else {
  console.log("[Config] Production mode. Using backend:", window.BACKEND_URL);
}

// =====================================================
// API HELPER FUNCTIONS
// =====================================================

/**
 * Make an API call to the backend
 * @param {string} endpoint - The API endpoint (e.g., '/charades/create')
 * @param {object} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise<Response>}
 */
window.apiCall = async function (endpoint, options = {}) {
  const url = `${window.BACKEND_URL}${endpoint}`;

  const defaultOptions = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include",
  };

  const finalOptions = { ...defaultOptions, ...options };

  try {
    const response = await fetch(url, finalOptions);
    if (!response.ok) {
      console.error(
        `API call failed: ${endpoint}`,
        response.status,
        response.statusText,
      );
    }
    return response;
  } catch (error) {
    console.error(`API call error: ${endpoint}`, error);
    throw error;
  }
};

/**
 * Create a WebSocket connection to the backend
 * @param {object} options - WebSocket options
 * @returns {WebSocket}
 */
window.createWebSocket = function (options = {}) {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const backendUrl = window.BACKEND_URL;

  // Convert https:// to wss:// and http:// to ws://
  let wsUrl = backendUrl
    .replace("https://", "wss://")
    .replace("http://", "ws://");

  console.log("[WebSocket] Connecting to:", wsUrl);

  const ws = new WebSocket(wsUrl);

  if (options.onopen) ws.onopen = options.onopen;
  if (options.onmessage) ws.onmessage = options.onmessage;
  if (options.onerror) ws.onerror = options.onerror;
  if (options.onclose) ws.onclose = options.onclose;

  return ws;
};

console.log("[GloHub Config] Loaded successfully");
```

### Add to HTML Files

Add this script to the `<head>` or before other scripts in:

- `admin-login.html`
- `admin-dashboard.html`
- `charades-game.html`
- `charades-wait-room.html`
- Any other pages making API calls

```html
<script src="config.js"></script>
```

---

## 3. Frontend API Call Examples

### Example 1: Standard Fetch (Charades Player Ready)

**Before (Development):**

```javascript
const response = await fetch(`/charades/player/${gameState.playerId}/ready`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    game_code: gameState.gameCode,
    is_ready: !gameState.isReady,
  }),
});
```

**After (Production):**

```javascript
const response = await fetch(
  `${window.BACKEND_URL}/charades/player/${gameState.playerId}/ready`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      game_code: gameState.gameCode,
      is_ready: !gameState.isReady,
    }),
  },
);
```

### Example 2: Admin API Call

**Before:**

```javascript
const base = window.BACKEND_URL || "";
const resp = await fetch(base + "/admin/delete", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ itemType: "quiz_session", id: sessionId, role, code }),
});
```

**After:**

```javascript
// Using the new API helper (optional but recommended)
const resp = await window.apiCall("/admin/delete", {
  method: "POST",
  body: JSON.stringify({ itemType: "quiz_session", id: sessionId, role, code }),
});
```

---

## 4. WebSocket Connection Examples

### Before (Development - Auto-detect localhost)

```javascript
function initializeWebSocket() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const isDev =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
  const host = isDev ? "localhost:4000" : window.location.host;
  const wsUrl = `${protocol}//${host}`;

  ws = new WebSocket(wsUrl);
  ws.onopen = () => {
    /* ... */
  };
}
```

### After (Production-Ready)

```javascript
function initializeWebSocket() {
  // Use BACKEND_URL from config.js
  const backendUrl = window.BACKEND_URL || "https://glohub.onrender.com";

  // Convert https:// to wss:// and http:// to ws://
  let wsUrl = backendUrl
    .replace("https://", "wss://")
    .replace("http://", "ws://");

  console.log(`Connecting to WebSocket at ${wsUrl}`);

  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log("WebSocket connected");
    ws.send(
      JSON.stringify({
        type: "JOIN_GAME",
        payload: {
          game_code: gameState.gameCode,
          player_id: gameState.playerId,
          player_name: gameState.playerName,
        },
      }),
    );
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    } catch (err) {
      console.error("Error parsing WebSocket message:", err);
    }
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  ws.onclose = () => {
    console.log("WebSocket closed - attempting reconnect in 3 seconds");
    setTimeout(initializeWebSocket, 3000);
  };
}
```

---

## 5. Environment Variables

### Backend (.env)

```bash
# =============================
# PRODUCTION ENVIRONMENT SETUP
# =============================

# Server Configuration
PORT=4000
NODE_ENV=production

# Supabase Configuration
SUPABASE_URL=https://[your-supabase-project].supabase.co
SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]

# Admin Code
SUPER_ADMIN_CODE=[[generate-secure-code]]

# Backend Service Key (for protected endpoints)
BACKEND_SERVICE_KEY=[[generate-secure-key]]

# Paystack Configuration (for payments)
PAYSTACK_SECRET_KEY=[your-paystack-secret]
PAYSTACK_PUBLIC_KEY=[your-paystack-public]
```

### Frontend (index.html or preloader.html)

Add this to the `<head>` section:

```html
<!-- API Configuration -->
<script>
  // Can be overridden before config.js loads
  // window.BACKEND_URL = 'https://custom-backend.com';
</script>
<script src="config.js"></script>
```

---

## 6. Deployment Checklist

### Frontend (https://glohub.space)

- [ ] Verify `config.js` is deployed and loads correctly
- [ ] Check browser console for `[Config] Production mode` message
- [ ] Test admin login works with `https://glohub.onrender.com` backend
- [ ] Test charades game API calls work
- [ ] Test WebSocket connections (wss protocol)
- [ ] Verify no localhost references in network requests (DevTools Network tab)

### Backend (https://glohub.onrender.com)

- [ ] Verify CORS allows `https://glohub.space`
- [ ] Test `/health` endpoint returns 200
- [ ] Test `/auth/verify-admin` from frontend
- [ ] Verify Supabase service client is configured
- [ ] Check logs for connection issues
- [ ] Ensure SSL/TLS certificate is valid

### Environment

- [ ] All sensitive keys are set as environment variables
- [ ] No hardcoded credentials in code
- [ ] API keys are never logged
- [ ] HTTPS is enforced on both frontend and backend

---

## 7. Troubleshooting

### Issue: CORS Error when calling backend

**Solution:**

1. Verify origin is in `corsOptions.allowedOrigins` in server.js
2. Check that backend is running at correct URL
3. Verify SSL certificate is valid for https://glohub.onrender.com

### Issue: WebSocket connection fails

**Solution:**

1. Verify `wss://` protocol (not `ws://`)
2. Check backend has WebSocket server configured
3. Verify port is open on render.com
4. Check browser console for actual connection URL

### Issue: API calls return 405 Method Not Allowed

**Solution:**

1. Verify CORS is properly configured
2. Check that request is reaching the correct backend
3. Ensure request method (GET/POST) matches endpoint

### Issue: config.js not loading

**Solution:**

1. Verify `config.js` file exists in `/frontend` directory
2. Check HTML file has `<script src="config.js"></script>` before other scripts
3. Check browser console for 404 errors

---

## 8. Security Checklist

- [ ] All HTTP requests upgraded to HTTPS
- [ ] CORS only allows `https://glohub.space`
- [ ] No development/debug code in production
- [ ] Environment variables for all secrets
- [ ] WebSocket uses WSS (secure WebSocket)
- [ ] CSRF tokens if applicable
- [ ] Rate limiting configured on backend
- [ ] Input validation on all endpoints
- [ ] No sensitive data in logs

---

## 9. Files Modified/Created

### Created:

- `frontend/config.js` - Centralized API configuration

### Modified Backend:

- `backend/server.js` - Updated CORS configuration

### Modified Frontend (HTML):

- `frontend/admin-login.html` - Added config.js, simplified backend discovery
- `frontend/admin-dashboard.html` - Added config.js to script tags
- `frontend/charades-game.html` - Added config.js to script tags
- `frontend/charades-wait-room.html` - Added config.js to script tags

### Modified Frontend (JavaScript):

- `frontend/charades.js` - Updated all fetch calls to use `${window.BACKEND_URL}`, updated WebSocket initialization
- `frontend/admin.js` - Already using `window.BACKEND_URL` (no changes needed)

---

## 10. Quick Reference

| Component    | Before                  | After                                |
| ------------ | ----------------------- | ------------------------------------ |
| Frontend URL | `http://localhost:3000` | `https://glohub.space`               |
| Backend URL  | `http://localhost:4000` | `https://glohub.onrender.com`        |
| WebSocket    | `ws://localhost:4000`   | `wss://glohub.onrender.com`          |
| API Calls    | `/charades/...`         | `${window.BACKEND_URL}/charades/...` |
| CORS Allow   | N/A                     | `https://glohub.space`               |
| Environment  | Development             | Production                           |

---

**Last Updated:** February 17, 2026  
**Version:** 1.0 - Production Ready
