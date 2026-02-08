/**
 * Charades Game Manager
 * Manages game state, player turns, scoring, and WebSocket communication
 * Backend is the single source of truth - all state changes originate here
 */

const express = require('express');
const router = express.Router();
const serviceClient = require('../supabase/service-client');

// =====================================================
// STATE MANAGEMENT (Backend owns all truth)
// =====================================================

// In-memory state cache (sync with DB)
const gameState = new Map();

// Word list for charades
const CHARADES_WORDS = [
  'Dancing', 'Swimming', 'Cooking', 'Running', 'Sleeping',
  'Reading', 'Writing', 'Painting', 'Singing', 'Jumping',
  'Laughing', 'Crying', 'Thinking', 'Watching', 'Listening',
  'Playing Guitar', 'Riding Bike', 'Driving Car', 'Flying Plane', 'Sailing Boat',
  'Climbing Mountain', 'Diving Deep', 'Skiing', 'Skateboarding', 'Surfing',
  'Bowling', 'Tennis', 'Soccer', 'Basketball', 'Baseball',
  'Gymnastics', 'Yoga', 'Boxing', 'Wrestling', 'Weightlifting',
  'Fishing', 'Hunting', 'Camping', 'Hiking', 'Picnicking',
  'Shopping', 'Cooking Dinner', 'Having Breakfast', 'Making Coffee', 'Baking Cake',
  'Eating Pizza', 'Drinking Water', 'Making Sandwich', 'Peeling Orange', 'Cutting Meat'
];

// Categories for charades rounds
const CHARADES_CATEGORIES = [
  'Movies', 'TV Shows', 'Books', 'Animals', 'Sports',
  'Professions', 'Actions', 'Objects', 'Food', 'Places',
  'Historical Events', 'Emotions', 'Music Genres', 'Hobbies', 'Technology',
  'Weather', 'Vehicles', 'Superheroes', 'Fairy Tales', 'Countries'
];

// =====================================================
// API ENDPOINTS
// =====================================================

/**
 * POST /charades/create
 * Admin creates a new charades game
 * Returns: game_code, game_id
 */
router.post('/create', async (req, res) => {
  try {
    const { admin_id, game_name } = req.body;
    
    if (!admin_id) {
      return res.status(400).json({ error: 'admin_id required' });
    }

    const client = serviceClient.getClient();
    
    // Generate unique 6-character game code
    const gameCode = generateGameCode();
    
    // Create charades game record
    const { data: game, error } = await client
      .from('charades_games')
      .insert({
        game_code: gameCode,
        game_name: game_name || `Charades ${gameCode}`,
        admin_id: admin_id,
        status: 'waiting'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating game:', error);
      return res.status(500).json({ error: 'Failed to create game' });
    }

    // Initialize in-memory state
    gameState.set(gameCode, {
      id: game.id,
      code: gameCode,
      admin_id: admin_id,
      status: 'waiting', // waiting, in_progress, finished
      state: 'WAITING', // WAITING, WHEEL_SPINNING, PLAYER_SELECTED, PREPARING, PLAYING, ROUND_COMPLETE
      players: {},
      current_round: 0,
      current_player_id: null,
      current_word: null,
      timer_end_time: null,
      created_at: new Date()
    });

    res.json({
      success: true,
      game_id: game.id,
      game_code: gameCode,
      message: 'Game created successfully'
    });
  } catch (err) {
    console.error('Error in POST /charades/create:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /charades/join
 * Player joins an existing game
 * Validates: game exists, has not started, player not duplicate
 * Returns: session_id for this player in this game
 */
router.post('/join', async (req, res) => {
  try {
    const { game_code, player_name, avatar_id } = req.body;

    if (!game_code || !player_name || !avatar_id) {
      return res.status(400).json({ error: 'game_code, player_name, avatar_id required' });
    }

    const client = serviceClient.getClient();

    // Verify game exists and is in waiting state
    const { data: game, error: gameError } = await client
      .from('charades_games')
      .select('*')
      .eq('game_code', game_code.toUpperCase())
      .single();

    if (gameError || !game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.status !== 'waiting') {
      return res.status(400).json({ error: 'Game has already started' });
    }

    // Check for duplicate player (same name in this game)
    const { data: existing, error: checkError } = await client
      .from('charades_players')
      .select('*')
      .eq('game_id', game.id)
      .eq('player_name', player_name);

    if (!checkError && existing && existing.length > 0) {
      return res.status(400).json({ error: 'Player name already in use' });
    }

    // Create player record
    const { data: player, error: playerError } = await client
      .from('charades_players')
      .insert({
        game_id: game.id,
        player_name: player_name,
        avatar_id: avatar_id,
        score: 0,
        has_played: false,
        status: 'waiting'
      })
      .select()
      .single();

    if (playerError) {
      console.error('Error creating player:', playerError);
      return res.status(500).json({ error: 'Failed to join game' });
    }

    // Update in-memory state
    const state = gameState.get(game_code.toUpperCase());
    if (state) {
      state.players[player.id] = {
        id: player.id,
        name: player_name,
        avatar_id: avatar_id,
        score: 0,
        has_played: false,
        status: 'waiting'
      };
    }

    res.json({
      success: true,
      player_id: player.id,
      game_id: game.id,
      game_code: game_code.toUpperCase(),
      message: 'Player joined game successfully'
    });
  } catch (err) {
    console.error('Error in POST /charades/join:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /charades/game/:gameCode/state
 * Returns current game state (used on UI reconnect)
 */
router.get('/game/:gameCode/state', async (req, res) => {
  try {
    const gameCode = req.params.gameCode.toUpperCase();
    const client = serviceClient.getClient();

    // Get game
    const { data: game, error: gameError } = await client
      .from('charades_games')
      .select('*')
      .eq('game_code', gameCode)
      .single();

    if (gameError || !game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Get all players for this game
    const { data: players, error: playersError } = await client
      .from('charades_players')
      .select('*')
      .eq('game_id', game.id)
      .order('created_at', { ascending: true });

    if (playersError) {
      console.error('Error fetching players:', playersError);
      return res.status(500).json({ error: 'Failed to fetch game state' });
    }

    // Get current round data if game is in progress
    let currentRound = null;
    if (game.started_at) {
      const { data: rounds, error: roundError } = await client
        .from('charades_rounds')
        .select('*')
        .eq('game_id', game.id)
        .order('round_number', { ascending: false })
        .limit(1);

      if (!roundError && rounds && rounds.length > 0) {
        currentRound = rounds[0];
      }
    }

    res.json({
      success: true,
      game: {
        id: game.id,
        code: gameCode,
        status: game.status,
        admin_id: game.admin_id,
        created_at: game.created_at,
        started_at: game.started_at,
        finished_at: game.finished_at
      },
      players: players.map(p => ({
        id: p.id,
        name: p.player_name,
        avatar_id: p.avatar_id,
        score: p.score,
        has_played: p.has_played,
        status: p.status
      })),
      current_round: currentRound
    });
  } catch (err) {
    console.error('Error in GET /charades/game/:gameCode/state:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /charades/game/:gameCode/start
 * Admin starts the game - transitions from waiting to first wheel spin
 */
router.post('/game/:gameCode/start', async (req, res) => {
  try {
    const gameCode = req.params.gameCode.toUpperCase();
    const { admin_id } = req.body;

    if (!admin_id) {
      return res.status(400).json({ error: 'admin_id required' });
    }

    const client = serviceClient.getClient();

    // Get game
    const { data: game, error: gameError } = await client
      .from('charades_games')
      .select('*')
      .eq('game_code', gameCode)
      .single();

    if (gameError || !game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Verify admin
    if (game.admin_id !== admin_id) {
      return res.status(403).json({ error: 'Unauthorized - only admin can start game' });
    }

    // Update game status
    const { error: updateError } = await client
      .from('charades_games')
      .update({ status: 'in_progress', started_at: new Date().toISOString() })
      .eq('id', game.id);

    if (updateError) {
      console.error('Error updating game:', updateError);
      return res.status(500).json({ error: 'Failed to start game' });
    }

    // Update in-memory state
    const state = gameState.get(gameCode);
    if (state) {
      state.status = 'in_progress';
    }

    res.json({
      success: true,
      message: 'Game started - prepare for wheel spin'
    });
  } catch (err) {
    console.error('Error in POST /charades/game/:gameCode/start:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /charades/game/:gameCode/spin
 * Admin initiates wheel spin - backend selects eligible player
 * Only admin can trigger, backend randomly selects from eligible players
 */
router.post('/game/:gameCode/spin', async (req, res) => {
  try {
    const gameCode = req.params.gameCode.toUpperCase();
    const { admin_id } = req.body;

    const client = serviceClient.getClient();

    // Get game
    const { data: game, error: gameError } = await client
      .from('charades_games')
      .select('*')
      .eq('game_code', gameCode)
      .single();

    if (gameError || !game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Verify admin
    if (game.admin_id !== admin_id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get eligible players (active and have NOT played)
    const { data: eligiblePlayers, error: playersError } = await client
      .from('charades_players')
      .select('*')
      .eq('game_id', game.id)
      .eq('has_played', false)
      .eq('status', 'active');

    if (playersError || !eligiblePlayers || eligiblePlayers.length === 0) {
      return res.status(400).json({ error: 'No eligible players' });
    }

    // Backend randomly selects ONE eligible player
    const selectedPlayer = eligiblePlayers[Math.floor(Math.random() * eligiblePlayers.length)];

    // Select a word
    const selectedWord = CHARADES_WORDS[Math.floor(Math.random() * CHARADES_WORDS.length)];

    // Get all used categories for this game
    const { data: usedRounds, error: usedError } = await client
      .from('charades_rounds')
      .select('category')
      .eq('game_id', game.id)
      .not('category', 'is', null);

    const usedCategories = usedRounds ? usedRounds.map(r => r.category) : [];

    // Filter available categories (not yet used)
    const availableCategories = CHARADES_CATEGORIES.filter(
      cat => !usedCategories.includes(cat)
    );

    // Select a category (use available first, but allow repeats if all used)
    let selectedCategory;
    if (availableCategories.length > 0) {
      selectedCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)];
    } else {
      // All categories used, reset and pick from all
      selectedCategory = CHARADES_CATEGORIES[Math.floor(Math.random() * CHARADES_CATEGORIES.length)];
    }

    // Create round record
    const { data: round, error: roundError } = await client
      .from('charades_rounds')
      .insert({
        game_id: game.id,
        round_number: eligiblePlayers.length - (eligiblePlayers.length - 1),
        selected_player_id: selectedPlayer.id,
        word: selectedWord,
        category: selectedCategory,
        status: 'in_progress'
      })
      .select()
      .single();

    if (roundError) {
      console.error('Error creating round:', roundError);
      return res.status(500).json({ error: 'Failed to create round' });
    }

    // Update selected player status
    await client
      .from('charades_players')
      .update({ status: 'preparing' })
      .eq('id', selectedPlayer.id);

    // Update in-memory state
    const state = gameState.get(gameCode);
    if (state) {
      state.state = 'PLAYER_SELECTED';
      state.current_round = round.id;
      state.current_player_id = selectedPlayer.id;
      state.current_word = selectedWord;
    }

    res.json({
      success: true,
      round_id: round.id,
      selected_player_id: selectedPlayer.id,
      selected_player_name: selectedPlayer.player_name,
      selected_player_avatar: selectedPlayer.avatar_id,
      category: selectedCategory,
      // Word is NOT sent to frontend - only backend knows, shown to other players when playing
      message: 'Player and category selected - wheel animation complete'
    });
  } catch (err) {
    console.error('Error in POST /charades/game/:gameCode/spin:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /charades/player/:playerId/preparation-ready
 * Player confirms correct orientation (tilt detected)
 * Transitions from PREPARING to PLAYING, starts timer
 */
router.post('/player/:playerId/preparation-ready', async (req, res) => {
  try {
    const playerId = req.params.playerId;
    const { game_code } = req.body;

    const client = serviceClient.getClient();

    // Get player and game
    const { data: player, error: playerError } = await client
      .from('charades_players')
      .select('*')
      .eq('id', playerId)
      .single();

    if (playerError || !player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Get game
    const { data: game, error: gameError } = await client
      .from('charades_games')
      .select('*')
      .eq('id', player.game_id)
      .single();

    if (gameError || !game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Verify this player is the current selected player
    const state = gameState.get(game.game_code);
    if (!state || state.current_player_id !== playerId) {
      return res.status(400).json({ error: 'Not the current player' });
    }

    // Update player status
    await client
      .from('charades_players')
      .update({ status: 'playing' })
      .eq('id', playerId);

    // Update state to PLAYING and set 60-second timer
    state.state = 'PLAYING';
    state.timer_end_time = Date.now() + 60000; // 60 seconds from now

    res.json({
      success: true,
      message: 'Player ready - game starting',
      timer_duration: 60
    });
  } catch (err) {
    console.error('Error in POST /charades/player/:playerId/preparation-ready:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /charades/player/:playerId/action
 * Player submits tilt input (DOWN = correct +5, UP = wrong/pass -2)
 * Backend validates timing, enforces cooldown, updates score, broadcasts
 */
router.post('/player/:playerId/action', async (req, res) => {
  try {
    const playerId = req.params.playerId;
    const { action, game_code } = req.body; // action: 'correct' or 'wrong'

    if (!['correct', 'wrong'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const client = serviceClient.getClient();

    // Get player
    const { data: player, error: playerError } = await client
      .from('charades_players')
      .select('*')
      .eq('id', playerId)
      .single();

    if (playerError || !player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Get game state
    const state = gameState.get(game_code);
    if (!state) {
      return res.status(400).json({ error: 'Game not found' });
    }

    // Verify: player is current player, game state is PLAYING, timer not expired
    if (state.current_player_id !== playerId) {
      return res.status(400).json({ error: 'Not current player' });
    }

    if (state.state !== 'PLAYING') {
      return res.status(400).json({ error: 'Game not in playing state' });
    }

    if (Date.now() > state.timer_end_time) {
      return res.status(400).json({ error: 'Time expired' });
    }

    // Calculate score change
    const scoreChange = action === 'correct' ? 5 : -2;

    // Update player score
    const newScore = player.score + scoreChange;
    await client
      .from('charades_players')
      .update({ score: newScore })
      .eq('id', playerId);

    // Update in-memory player score
    state.players[playerId].score = newScore;

    res.json({
      success: true,
      action: action,
      score_change: scoreChange,
      new_score: newScore,
      message: 'Action recorded'
    });
  } catch (err) {
    console.error('Error in POST /charades/player/:playerId/action:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /charades/game/:gameCode/round-end
 * Admin or backend completes current round (timer expired)
 * Updates player status, broadcasts results
 */
router.post('/game/:gameCode/round-end', async (req, res) => {
  try {
    const gameCode = req.params.gameCode.toUpperCase();
    const { admin_id } = req.body;

    const client = serviceClient.getClient();

    // Get game
    const { data: game, error: gameError } = await client
      .from('charades_games')
      .select('*')
      .eq('game_code', gameCode)
      .single();

    if (gameError || !game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Verify admin
    if (game.admin_id !== admin_id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get current round
    const { data: rounds, error: roundError } = await client
      .from('charades_rounds')
      .select('*')
      .eq('game_id', game.id)
      .order('round_number', { ascending: false })
      .limit(1);

    if (roundError || !rounds || rounds.length === 0) {
      return res.status(400).json({ error: 'No active round' });
    }

    const currentRound = rounds[0];

    // Mark round as complete
    await client
      .from('charades_rounds')
      .update({ status: 'complete' })
      .eq('id', currentRound.id);

    // Mark player as HAS_PLAYED
    await client
      .from('charades_players')
      .update({ has_played: true, status: 'waiting' })
      .eq('id', currentRound.selected_player_id);

    // Update in-memory state
    const state = gameState.get(gameCode);
    if (state) {
      state.state = 'ROUND_COMPLETE';
      state.current_player_id = null;
      state.current_word = null;
      state.timer_end_time = null;
      state.players[currentRound.selected_player_id].has_played = true;
      state.players[currentRound.selected_player_id].status = 'waiting';
    }

    // Check if all players have played
    const { data: allPlayers } = await client
      .from('charades_players')
      .select('*')
      .eq('game_id', game.id);

    const allPlayed = allPlayers.every(p => p.has_played === true);

    res.json({
      success: true,
      round_complete: true,
      all_played: allPlayed,
      message: allPlayed ? 'Game finished!' : 'Round complete, waiting for next spin'
    });
  } catch (err) {
    console.error('Error in POST /charades/game/:gameCode/round-end:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /charades/game/:gameCode/final-results
 * Returns final leaderboard, top 3 for podium, and player emotions
 */
router.get('/game/:gameCode/final-results', async (req, res) => {
  try {
    const gameCode = req.params.gameCode.toUpperCase();
    const client = serviceClient.getClient();

    // Get game
    const { data: game, error: gameError } = await client
      .from('charades_games')
      .select('*')
      .eq('game_code', gameCode)
      .single();

    if (gameError || !game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Get all players sorted by score
    const { data: players, error: playersError } = await client
      .from('charades_players')
      .select('*')
      .eq('game_id', game.id)
      .order('score', { ascending: false });

    if (playersError) {
      return res.status(500).json({ error: 'Failed to get results' });
    }

    // Calculate ranks and emotions
    const leaderboard = players.map((p, index) => {
      const rank = index + 1;
      const totalPlayers = players.length;
      
      // Emotion: top 20% = happy, middle = neutral, bottom = sad
      let emotion = 'neutral';
      if (rank <= totalPlayers * 0.2) {
        emotion = 'happy';
      } else if (rank > totalPlayers * 0.8) {
        emotion = 'sad';
      }

      return {
        rank: rank,
        id: p.id,
        name: p.player_name,
        avatar_id: p.avatar_id,
        score: p.score,
        emotion: emotion
      };
    });

    res.json({
      success: true,
      leaderboard: leaderboard,
      podium: leaderboard.slice(0, 3), // Top 3
      total_players: players.length
    });
  } catch (err) {
    console.error('Error in GET /charades/game/:gameCode/final-results:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /charades/game/:gameCode/word/:playerId
 * Returns the word for the specified player (only if they are the current player)
 * Used by other players' screens to show the word during gameplay
 */
router.get('/game/:gameCode/word/:playerId', async (req, res) => {
  try {
    const { gameCode, playerId } = req.params;

    const state = gameState.get(gameCode.toUpperCase());
    if (!state) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Only return word if requested player is current player and game is PLAYING
    if (state.current_player_id === playerId && state.state === 'PLAYING' && state.current_word) {
      res.json({
        success: true,
        word: state.current_word
      });
    } else {
      res.status(403).json({ error: 'Word not available' });
    }
  } catch (err) {
    console.error('Error in GET /charades/game/:gameCode/word/:playerId:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function generateGameCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

module.exports = router;
