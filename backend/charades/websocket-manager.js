/**
 * Charades WebSocket Manager
 * Handles real-time state synchronization using WebSockets
 * Every state change is broadcast to all connected players
 */

const serviceClient = require('../supabase/service-client');

// Track connected clients per game
const connectedClients = new Map(); // gameCode -> Set of { ws, playerId, sessionId }

/**
 * Initialize WebSocket connection for a player
 * @param {WebSocket} ws - WebSocket connection
 * @param {string} gameCode - Game code
 * @param {string} playerId - Player ID
 * @param {string} sessionId - Session ID for this player
 */
function initializeConnection(ws, gameCode, playerId, sessionId) {
  if (!connectedClients.has(gameCode)) {
    connectedClients.set(gameCode, new Set());
  }

  const client = { ws, playerId, sessionId };
  connectedClients.get(gameCode).add(client);

  console.log(`[${gameCode}] Player ${playerId} connected. Total: ${connectedClients.get(gameCode).size}`);

  // Send connection confirmation
  ws.send(JSON.stringify({
    type: 'CONNECTION_ESTABLISHED',
    playerId: playerId,
    gameCode: gameCode
  }));

  // Set up message handler
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handlePlayerMessage(ws, gameCode, playerId, data);
    } catch (err) {
      console.error('Error parsing WebSocket message:', err);
      ws.send(JSON.stringify({ type: 'ERROR', message: 'Invalid message format' }));
    }
  });

  // Handle disconnect
  ws.on('close', () => {
    const clients = connectedClients.get(gameCode);
    if (clients) {
      clients.forEach(c => {
        if (c.playerId === playerId) {
          clients.delete(c);
        }
      });
      console.log(`[${gameCode}] Player ${playerId} disconnected. Total: ${clients.size}`);
    }
  });

  ws.on('error', (err) => {
    console.error(`WebSocket error for player ${playerId}:`, err);
  });
}

/**
 * Handle incoming WebSocket messages from players
 */
async function handlePlayerMessage(ws, gameCode, playerId, data) {
  const { type, payload } = data;

  switch (type) {
    case 'GET_GAME_STATE':
      await sendGameState(ws, gameCode, playerId);
      break;

    case 'PING':
      ws.send(JSON.stringify({ type: 'PONG' }));
      break;

    case 'PLAYER_ACTION':
      // Player submitted tilt input - handled via HTTP endpoint, socket just notifies
      await notifyAction(gameCode, playerId, payload);
      break;

    default:
      console.warn(`Unknown message type: ${type}`);
  }
}

/**
 * Send current game state to a player
 */
async function sendGameState(ws, gameCode, playerId) {
  try {
    const client = serviceClient.getClient();

    // Get game
    const { data: game } = await client
      .from('charades_games')
      .select('*')
      .eq('game_code', gameCode)
      .single();

    if (!game) {
      ws.send(JSON.stringify({ type: 'ERROR', message: 'Game not found' }));
      return;
    }

    // Get all players
    const { data: players } = await client
      .from('charades_players')
      .select('*')
      .eq('game_id', game.id)
      .order('created_at', { ascending: true });

    // Get current round
    let currentRound = null;
    const { data: rounds } = await client
      .from('charades_rounds')
      .select('*')
      .eq('game_id', game.id)
      .order('round_number', { ascending: false })
      .limit(1);

    if (rounds && rounds.length > 0) {
      currentRound = rounds[0];
    }

    ws.send(JSON.stringify({
      type: 'GAME_STATE_UPDATE',
      payload: {
        game: {
          id: game.id,
          code: gameCode,
          status: game.status,
          admin_id: game.admin_id,
          started_at: game.started_at,
          finished_at: game.finished_at
        },
        players: players.map(p => ({
          id: p.id,
          name: p.player_name,
          avatar_id: p.avatar_id,
          score: p.score,
          has_played: p.has_played,
          is_ready: p.is_ready || false,
          status: p.status
        })),
        current_round: currentRound,
        you_are_current_player: currentRound ? currentRound.selected_player_id === playerId : false
      }
    }));
  } catch (err) {
    console.error('Error sending game state:', err);
    ws.send(JSON.stringify({ type: 'ERROR', message: 'Failed to get game state' }));
  }
}

/**
 * Broadcast player action to all players in game (scores updated)
 */
async function notifyAction(gameCode, playerId, actionData) {
  const clients = connectedClients.get(gameCode);
  if (!clients) return;

  // Broadcast to all players
  const message = JSON.stringify({
    type: 'PLAYER_ACTION_RECORDED',
    payload: {
      player_id: playerId,
      action: actionData.action,
      score_change: actionData.score_change,
      new_score: actionData.new_score
    }
  });

  clients.forEach(client => {
    if (client.ws.readyState === 1) { // OPEN
      client.ws.send(message);
    }
  });
}

/**
 * Broadcast wheel spin animation start to all players
 */
function broadcastWheelSpinStart(gameCode, players) {
  const clients = connectedClients.get(gameCode);
  if (!clients) return;

  const message = JSON.stringify({
    type: 'WHEEL_SPINNING',
    payload: {
      players: players.map(p => ({
        id: p.id,
        name: p.player_name,
        avatar_id: p.avatar_id
      }))
    }
  });

  clients.forEach(client => {
    if (client.ws.readyState === 1) {
      client.ws.send(message);
    }
  });
}

/**
 * Broadcast player selection result
 */
function broadcastPlayerSelected(gameCode, selectedPlayerId, selectedPlayerName, selectedPlayerAvatar) {
  const clients = connectedClients.get(gameCode);
  if (!clients) return;

  const message = JSON.stringify({
    type: 'PLAYER_SELECTED',
    payload: {
      selected_player_id: selectedPlayerId,
      selected_player_name: selectedPlayerName,
      selected_player_avatar: selectedPlayerAvatar
    }
  });

  clients.forEach(client => {
    if (client.ws.readyState === 1) {
      client.ws.send(message);
    }
  });
}

/**
 * Broadcast preparation mode started
 */
function broadcastPreparationStarted(gameCode, playerId) {
  const clients = connectedClients.get(gameCode);
  if (!clients) return;

  clients.forEach(client => {
    const isCurrentPlayer = client.playerId === playerId;
    
    const message = JSON.stringify({
      type: 'PLAYER_PREPARING',
      payload: {
        player_id: playerId,
        is_you: isCurrentPlayer,
        // Only the current player gets the preparation screen, others see "preparing" message
        preparation_required: isCurrentPlayer
      }
    });

    if (client.ws.readyState === 1) {
      client.ws.send(message);
    }
  });
}

/**
 * Broadcast game play started (word revealed to other players)
 */
function broadcastGamePlayStarted(gameCode, playerId, word) {
  const clients = connectedClients.get(gameCode);
  if (!clients) return;

  clients.forEach(client => {
    const isCurrentPlayer = client.playerId === playerId;

    const message = JSON.stringify({
      type: 'GAME_PLAYING',
      payload: {
        current_player_id: playerId,
        is_you: isCurrentPlayer,
        word: isCurrentPlayer ? null : word, // Show word to others, not to player
        timer_duration: 60
      }
    });

    if (client.ws.readyState === 1) {
      client.ws.send(message);
    }
  });
}

/**
 * Broadcast timer tick (for live countdown on all screens)
 */
function broadcastTimerTick(gameCode, timeRemaining) {
  const clients = connectedClients.get(gameCode);
  if (!clients) return;

  const message = JSON.stringify({
    type: 'TIMER_TICK',
    payload: {
      time_remaining_ms: timeRemaining
    }
  });

  clients.forEach(client => {
    if (client.ws.readyState === 1) {
      client.ws.send(message);
    }
  });
}

/**
 * Broadcast round complete
 */
function broadcastRoundComplete(gameCode, playerScore, scoreBoard) {
  const clients = connectedClients.get(gameCode);
  if (!clients) return;

  const message = JSON.stringify({
    type: 'ROUND_COMPLETE',
    payload: {
      round_complete: true,
      scores: scoreBoard
    }
  });

  clients.forEach(client => {
    if (client.ws.readyState === 1) {
      client.ws.send(message);
    }
  });
}

/**
 * Broadcast game finished
 */
function broadcastGameFinished(gameCode, leaderboard, podium) {
  const clients = connectedClients.get(gameCode);
  if (!clients) return;

  const message = JSON.stringify({
    type: 'GAME_FINISHED',
    payload: {
      game_finished: true,
      leaderboard: leaderboard,
      podium: podium
    }
  });

  clients.forEach(client => {
    if (client.ws.readyState === 1) {
      client.ws.send(message);
    }
  });
}

/**
 * Broadcast score update (for live scoreboard)
 */
function broadcastScoreUpdate(gameCode, playerId, newScore) {
  const clients = connectedClients.get(gameCode);
  if (!clients) return;

  const message = JSON.stringify({
    type: 'SCORE_UPDATE',
    payload: {
      player_id: playerId,
      score: newScore
    }
  });

  clients.forEach(client => {
    if (client.ws.readyState === 1) {
      client.ws.send(message);
    }
  });
}

/**
 * Get count of connected players in a game
 */
function getConnectedPlayerCount(gameCode) {
  const clients = connectedClients.get(gameCode);
  return clients ? clients.size : 0;
}

module.exports = {
  initializeConnection,
  broadcastWheelSpinStart,
  broadcastPlayerSelected,
  broadcastPreparationStarted,
  broadcastGamePlayStarted,
  broadcastTimerTick,
  broadcastRoundComplete,
  broadcastGameFinished,
  broadcastScoreUpdate,
  getConnectedPlayerCount
};
