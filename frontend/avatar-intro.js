// Avatar Intro Routing Logic
// Routes users based on their role (super admin vs player) and game type

import { getAvatar, interpolate } from './dialogue.js';

(async function() {
  try {
    // Read selection from sessionStorage
    const avatarId = sessionStorage.getItem('selectedAvatarId') || 'avatar1';
    const username = sessionStorage.getItem('username') || 'Player';
    const joinCode = sessionStorage.getItem('joinCode');
    const sessionId = sessionStorage.getItem('sessionId');
    const isSuperAdmin = sessionStorage.getItem('isSuperAdmin') === 'true';
    const loginSource = sessionStorage.getItem('loginSource'); // NEW: Track where they logged in from

    // Get avatar data
    const avatar = getAvatar(avatarId);
    if (!avatar) {
      console.warn('Avatar not found, defaulting...');
    }

    // Populate avatar display
    if (avatar) {
      document.getElementById('avatarImage').src = avatar.image;
      document.getElementById('avatarImage').alt = `${avatar.name} avatar`;

      // Set avatar name labels
      const nameLabels = document.querySelectorAll('[id^="avatarNameLabel"]');
      nameLabels.forEach(label => {
        label.textContent = avatar.name;
      });
    }

    // Dialogue messages
    const intro1 = `Nice to meet you ${username}`;
    const intro2 = isSuperAdmin 
      ? (loginSource === 'admin-login' ? `Welcome to the admin dashboard!` : `Let's choose a game to inspect!`)
      : `Let's join the game!`;

    // Populate bubbles
    document.getElementById('bubble1').textContent = intro1;
    document.getElementById('bubble2').textContent = intro2;

    // Determine routing destination - CHECK LOGIN SOURCE FIRST
    let redirectUrl = '';

    // MOST IMPORTANT: Check loginSource FIRST - this determines flow regardless of other flags
    if (loginSource === 'admin-login') {
      // Came from admin login page → ALWAYS go to Admin Dashboard
      redirectUrl = 'admin-dashboard.html';
    } else if (loginSource === 'join-game' && isSuperAdmin) {
      // Came from join-game with super admin code → Game Selection to choose which game
      redirectUrl = 'game-selection.html';
    } else if (loginSource === 'join-game') {
      // Regular player joining a game → Determine game type (quiz or charades)
      redirectUrl = await determineGameTypeAndRedirect(joinCode, sessionId);
    } else {
      // Fallback - unknown login source, default to join game page
      redirectUrl = 'join-game.html';
    }

    // After animations complete, redirect
    setTimeout(() => {
      document.body.style.transition = 'opacity 1000ms ease';
      document.body.style.opacity = '0';
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 300);
    }, 5000); // Allow animations to play

  } catch (err) {
    console.error('Avatar intro error:', err);
    // Fallback redirect
    window.location.href = 'join-game.html';
  }
})();

/**
 * Determine game type based on join code and redirect to appropriate wait room
 * @param {string} joinCode - The 6-character join code
 * @param {string} sessionId - The session ID
 * @returns {string} - URL to redirect to
 */
async function determineGameTypeAndRedirect(joinCode, sessionId) {
  try {
    if (!joinCode) {
      console.error('No join code found in session');
      return 'join-game.html';
    }

    // Check if this is a quiz game code
    const { data: quizSession, error: quizError } = await supabase
      .from('quiz_sessions')
      .select('id, game_type')
      .eq('game_code', joinCode)
      .single();

    if (quizSession && !quizError) {
      // This is a quiz game
      return 'quiz-wait-room.html';
    }

    // Check if this is a charades game code
    const { data: charadesGame, error: charadesError } = await supabase
      .from('charades_games')
      .select('id, game_code')
      .eq('game_code', joinCode)
      .single();

    if (charadesGame && !charadesError) {
      // This is a charades game
      return 'charades-wait-room.html';
    }

    // Game type could not be determined
    console.error('Could not determine game type for code:', joinCode);
    return 'join-game.html';

  } catch (err) {
    console.error('Error determining game type:', err);
    return 'join-game.html';
  }
}