-- ============================================
-- CHARADES GAME SCHEMA MIGRATION
-- Extends SQL_SCHEMA_ROUTING.sql with charades-specific tables
-- ============================================
-- Database: Supabase
-- Purpose: Schema for real-time multiplayer Charades game
-- ============================================
-- ============================================
-- 1. CHARADES PLAYERS TABLE
-- ============================================
-- Tracks individual player state within a charades game
CREATE TABLE IF NOT EXISTS charades_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES charades_games(id) ON DELETE CASCADE,
    player_name VARCHAR(100) NOT NULL,
    avatar_id VARCHAR(50),
    score INT DEFAULT 0,
    has_played BOOLEAN DEFAULT false,
    is_ready BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'waiting',
    -- waiting, active, preparing, playing, finished
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(game_id, player_name) -- Prevent duplicate player names per game
);
CREATE INDEX IF NOT EXISTS idx_charades_players_game_id ON charades_players(game_id);
CREATE INDEX IF NOT EXISTS idx_charades_players_has_played ON charades_players(has_played);
CREATE INDEX IF NOT EXISTS idx_charades_players_status ON charades_players(status);
-- ============================================
-- 2. CHARADES ROUNDS TABLE
-- ============================================
-- Tracks individual rounds within a charades game
-- Each round: one player acts, others guess
CREATE TABLE IF NOT EXISTS charades_rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES charades_games(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    selected_player_id UUID NOT NULL REFERENCES charades_players(id) ON DELETE CASCADE,
    word VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    -- Category for this round (e.g., Movies, Animals, Sports, etc.)
    status VARCHAR(50) DEFAULT 'in_progress',
    -- in_progress, complete
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_charades_rounds_game_id ON charades_rounds(game_id);
CREATE INDEX IF NOT EXISTS idx_charades_rounds_selected_player_id ON charades_rounds(selected_player_id);
CREATE INDEX IF NOT EXISTS idx_charades_rounds_round_number ON charades_rounds(round_number);
-- ============================================
-- 3. CHARADES SCORES TABLE
-- ============================================
-- Track detailed score history for analytics (optional)
CREATE TABLE IF NOT EXISTS charades_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES charades_games(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES charades_players(id) ON DELETE CASCADE,
    round_id UUID REFERENCES charades_rounds(id) ON DELETE
    SET NULL,
        points_earned INT NOT NULL,
        action VARCHAR(50),
        -- 'correct', 'wrong', 'pass'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_charades_scores_game_id ON charades_scores(game_id);
CREATE INDEX IF NOT EXISTS idx_charades_scores_player_id ON charades_scores(player_id);
CREATE INDEX IF NOT EXISTS idx_charades_scores_round_id ON charades_scores(round_id);
-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- Enable RLS on charades tables for security
ALTER TABLE charades_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE charades_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE charades_scores ENABLE ROW LEVEL SECURITY;
-- Allow authenticated users to read charades_players
CREATE POLICY "Users can read charades players in their game" ON charades_players FOR
SELECT USING (true);
-- Adjust based on your auth model
-- Allow authenticated users to read charades_rounds
CREATE POLICY "Users can read charades rounds in their game" ON charades_rounds FOR
SELECT USING (true);
-- Allow authenticated users to read charades_scores
CREATE POLICY "Users can read charades scores in their game" ON charades_scores FOR
SELECT USING (true);
-- ============================================
-- NOTES FOR IMPLEMENTATION
-- ============================================
--
-- GAME FLOW:
-- 1. Admin creates game → charades_games (status='waiting')
-- 2. Players join → charades_players created (has_played=false)
-- 3. Admin starts game → charades_games (status='in_progress')
-- 4. Backend selects player → charades_rounds created
-- 5. Selected player plays → charades_players (status='playing'), timer runs
-- 6. Round ends → charades_rounds (status='complete'), charades_players (has_played=true)
-- 7. Repeat until all players have played (has_played=true for all)
-- 8. Game ends → charades_games (status='finished')
--
-- BACKEND VALIDATION:
-- - Only backend calculates scores, never trust frontend
-- - Backend validates: has_played, player eligibility, timing, state transitions
-- - Word is only shown to non-acting players during PLAYING state
-- - Tilt inputs only accepted when state=PLAYING and cooldown respected
--
-- REAL-TIME SYNC:
-- - All state changes broadcast via WebSocket
-- - Frontend shows real-time timer, score updates, state transitions
-- - Backend owns state machine, frontend is fully untrusted
--
-- ============================================