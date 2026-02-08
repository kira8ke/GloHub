/**
 * Charades Wait Room Logic
 * Handles real-time player list updates via WebSocket
 */

let ws = null;

/**
 * Initialize WebSocket connection for wait room real-time updates
 */
export function initBackendConnection(gameCode) {
    // For now, we'll use polling instead of WebSockets for the wait room
    // since the player list updates are less critical
    
    loadPlayersList();
    
    // Poll every 2 seconds (same as before)
    setInterval(loadPlayersList, 2000);
}

/**
 * Load and display players list from Supabase
 */
async function loadPlayersList() {
    try {
        const sessionId = sessionStorage.getItem('sessionId');
        
        if (!sessionId) return;

        // For charades, we need to create a charades_players table
        // For now, use the players table if available
        const { data: players, error } = await supabase
            .from('players')
            .select('*')
            .eq('session_id', sessionId)
            .order('joined_at', { ascending: true });

        if (error) {
            console.error('Error loading players:', error);
            return;
        }

        const playersList = document.getElementById('playersList');
        const playerCount = document.getElementById('playerCount');

        if (!players || players.length === 0) {
            playersList.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⏳</div><p>Waiting for players to join...</p></div>';
            playerCount.textContent = '0';
            return;
        }

        playerCount.textContent = players.length;
        playersList.innerHTML = players.map((player) => `
            <div class="player-item">
                <div class="player-avatar">${getPlayerInitial(player.username)}</div>
                <div class="player-name">${player.username || 'Unknown Player'}</div>
                <div class="player-status">✓ Ready</div>
            </div>
        `).join('');
    } catch (err) {
        console.error('Error in loadPlayersList:', err);
    }
}

/**
 * Get first initial of player name for avatar
 */
function getPlayerInitial(username) {
    if (!username) return '?';
    return username.charAt(0).toUpperCase();
}

/**
 * Send WebSocket message (if WebSocket is connected)
 */
function sendWebSocketMessage(type, payload) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type, payload }));
    }
}
