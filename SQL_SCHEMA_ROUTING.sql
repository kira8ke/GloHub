-- SQL Schema for GloHub Game Routing System
-- These tables are required for proper user routing and game management
-- ============================================
-- 1. SUPER ADMINS TABLE (for admin login flow)
-- ============================================
CREATE TABLE IF NOT EXISTS super_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    super_code VARCHAR(10) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- ============================================
-- 2. QUIZ SESSIONS TABLE (quiz-specific games)
-- ============================================
CREATE TABLE IF NOT EXISTS quiz_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_code VARCHAR(6) NOT NULL UNIQUE,
    game_type VARCHAR(20) DEFAULT 'quiz',
    game_name VARCHAR(255),
    client_id UUID,
    admin_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    finished_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'waiting',
    -- waiting, in_progress, finished
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Create index on game_code for fast lookups
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_game_code ON quiz_sessions(game_code);
-- ============================================
-- 3. CHARADES GAMES TABLE (charades-specific games)
-- ============================================
CREATE TABLE IF NOT EXISTS charades_games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_code VARCHAR(6) NOT NULL UNIQUE,
    game_name VARCHAR(255),
    admin_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    finished_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'waiting',
    -- waiting, in_progress, finished
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Create index on game_code for fast lookups
CREATE INDEX IF NOT EXISTS idx_charades_games_game_code ON charades_games(game_code);
-- ============================================
-- 4. PLAYERS TABLE (for wait room player list)
-- ============================================
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    username VARCHAR(100) NOT NULL,
    avatar_id VARCHAR(50),
    status VARCHAR(50) DEFAULT 'waiting',
    -- waiting, in_game, finished
    score INT DEFAULT 0,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Create index on session_id for fast lookups in wait rooms
CREATE INDEX IF NOT EXISTS idx_players_session_id ON players(session_id);
-- ============================================
-- 5. GAME SESSIONS TABLE (if using sessions table)
-- ============================================
-- This table may still be used for general session tracking
-- Make sure it either matches the quiz_sessions/charades_games structure
-- OR create a parent sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    join_code VARCHAR(6) NOT NULL UNIQUE,
    game_type VARCHAR(50),
    -- 'quiz' or 'charades'
    game_id UUID,
    -- References quiz_sessions.id or charades_games.id
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    finished_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'waiting',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Create index on join_code for fast lookups
CREATE INDEX IF NOT EXISTS idx_game_sessions_join_code ON game_sessions(join_code);
-- ============================================
-- NOTES ON ROUTING LOGIC:
-- ============================================
--
-- 1. SUPER ADMIN FLOW:
--    - User enters code > 6 characters from join-game.html
--    - System checks super_admins table
--    - Redirects to: avatar-select → avatar-intro → game-selection.html
--    - User picks quiz or charades game
--    - User sees the actual game page
--
-- 2. REGULAR PLAYER FLOW:
--    - User enters code = 6 characters from join-game.html
--    - System checks:
--      a) quiz_sessions table (code field)
--      b) charades_games table (code field)
--    - Redirects to: avatar-select → avatar-intro → quiz-wait-room.html OR charades-wait-room.html
--    - Wait room displays all joined players
--    - Admin can see "Start Game" button
--    - Admin clicks to start game
--    - Players are redirected to game pages:
--      - Quiz players → quiz-game.html
--      - Charades players → spin-game.html
--
-- 3. CODE GENERATION:
--    - Super admin codes: Generate >6 characters (e.g., 8-10 chars)
--    - Quiz game codes: Generate 6 uppercase alphanumeric codes
--    - Charades game codes: Generate 6 uppercase alphanumeric codes
--
-- ============================================
-- REQUIRED FIELDS IN EACH TABLE:
-- ============================================
--
-- super_admins:
--   - id (UUID, PK)
--   - super_code (VARCHAR, UNIQUE)
--   - created_at, updated_at (TIMESTAMP)
--
-- quiz_sessions:
--   - id (UUID, PK)
--   - game_code (VARCHAR(6), UNIQUE) ← MUST BE UNIQUE AND DIFFERENT FROM CHARADES
--   - game_type (VARCHAR, default 'quiz')
--   - game_name (VARCHAR)
--   - status (VARCHAR, default 'waiting')
--
-- charades_games:
--   - id (UUID, PK)
--   - game_code (VARCHAR(6), UNIQUE) ← MUST BE UNIQUE AND DIFFERENT FROM QUIZ
--   - game_name (VARCHAR)
--   - status (VARCHAR, default 'waiting')
--
-- players:
--   - id (UUID, PK)
--   - session_id (UUID, INDEXED) ← Links to quiz_sessions.id or charades_games.id
--   - username (VARCHAR)
--   - avatar_id (VARCHAR)
--   - joined_at (TIMESTAMP)
--
-- ============================================