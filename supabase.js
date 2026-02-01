// supabase.js
// PRODUCTION Supabase Client Initialization

const SUPABASE_URL = 'https://uceacvdgglhjmljqfkou.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjZWFjdmRnZ2xoam1sanFma291Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1ODExMzgsImV4cCI6MjA4NTE1NzEzOH0.jQ3kgK2jy9_NyivP5scW3wQH9u-Hfl-NBjEw0SIcWIM';

// Create Supabase client
if (window.supabase && typeof window.supabase.createClient === 'function') {
  var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: { 'Accept': 'application/json' }
    }
  });
  window.supabase = supabase;
  window.supabaseClient = supabase;
} else {
  console.warn('Supabase SDK not found. Make sure to include the CDN script before supabase.js');
}

// ---------- Utility helpers (only if not already defined) ----------

if (typeof window.generateRandomCode === 'undefined') {
  window.generateRandomCode = function(length = 6) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };
}

if (typeof window.formatDate === 'undefined') {
  window.formatDate = function(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
}

if (typeof window.formatTime === 'undefined') {
  window.formatTime = function(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
}

// ---------- Auth helper for PLAYERS ONLY (not admins) ----------
if (typeof window.checkPlayerSession === 'undefined') {
  window.checkPlayerSession = function(redirectUrl = 'join-game.html') {
    const sessionId = sessionStorage.getItem('sessionId');
    const username = sessionStorage.getItem('username');
    const userId = sessionStorage.getItem('userId');

    if (!sessionId || !username) {
      window.location.href = redirectUrl;
      return null;
    }

    return { sessionId, username, userId };
  };
}

// ---------- Notifications ----------
if (typeof window.showNotification === 'undefined') {
  window.showNotification = function(message, type = 'success') {
    // Remove any existing notification
    const existing = document.getElementById('supabase-notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.id = 'supabase-notification';
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Add styles if not already present
    if (!document.getElementById('supabase-notification-style')) {
      const nstyle = document.createElement('style');
      nstyle.id = 'supabase-notification-style';
      nstyle.textContent = `
        .notification { 
          position: fixed; 
          top: 20px; 
          right: 20px; 
          padding: 15px 25px; 
          border-radius: 10px; 
          z-index: 10000; 
          box-shadow: 0 5px 15px rgba(0,0,0,0.2);
          animation: slideIn 0.3s ease;
        } 
        .notification-success { background: #4caf50; color: #fff; }
        .notification-error { background: #f44336; color: #fff; }
        .notification-super { background: linear-gradient(135deg, gold, #ffd700); color: #000; font-weight: 700; }
        
        @keyframes slideIn {
          from { transform: translateX(400px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(400px); opacity: 0; }
        }
      `;
      document.head.appendChild(nstyle);
    }

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        if (notification && notification.parentNode) notification.remove();
      }, 300);
    }, 3000);
  };
}

// Export globally
window.supabaseClient = supabase;