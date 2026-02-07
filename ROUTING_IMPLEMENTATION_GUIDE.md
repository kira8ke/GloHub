# GloHub User Routing Implementation Guide

## Overview

This document outlines the complete implementation of proper user routing based on admin vs player roles and game types.

## Files Created/Modified

### 1. **avatar-intro.js** (NEW)

- **Purpose**: Main routing logic based on user role
- **Logic**:
  - Reads `isSuperAdmin` from sessionStorage
  - **Super Admin**: Redirects to `game-selection.html`
  - **Regular Player**: Determines game type from Supabase (quiz or charades)
    - Queries `quiz_sessions` table for game code
    - Queries `charades_games` table for game code
    - Redirects to appropriate wait room
- **Error Handling**: Falls back to join-game.html if game type cannot be determined

### 2. **avatar-intro.html** (MODIFIED)

- Removed embedded inline script
- Now imports `avatar-intro.js` as a module
- Maintains all animations and styling

### 3. **game-selection.html** (NEW)

- **Purpose**: Allow super admins to choose which game to inspect
- **Features**:
  - Two game options: Quiz Game (🧠) and Charades Game (🎭)
  - Click on a game to be redirected to that game page
  - Maintains sessionStorage data for avatar and username
  - Styled to match the GloHub design
- **Flow**: Avatar Intro → Game Selection → Quiz Game OR Charades Game

### 4. **quiz-wait-room.html** (NEW)

- **Purpose**: Wait room for quiz game players
- **Features**:
  - Displays game code
  - Shows list of joined players
  - Auto-refreshes player list every 2 seconds
  - **Admin Controls** (visible only to super admins):
    - "Start Game Now" button to begin the game
  - Animated waiting indicator
  - Responsive design

### 5. **charades-wait-room.html** (NEW)

- **Purpose**: Wait room for charades game players
- **Features**: Same as quiz-wait-room but themed for charades
  - Displays game code
  - Shows list of joined players
  - Auto-refreshes player list every 2 seconds
  - **Admin Controls** (visible only to super admins):
    - "Start Game Now" button to begin the game
  - Animated waiting indicator

### 6. **join-game.js** (MODIFIED)

- **Updated Logic**:
  - Code length > 6 characters: Check `super_admins` table
  - Code length = 6 characters:
    1. Check `quiz_sessions` table for `game_code` match
    2. If not found, check `charades_games` table for `game_code` match
    3. If found, set `gameType` in sessionStorage
  - Stores both `isSuperAdmin` and `gameType` in sessionStorage
  - Better error handling for invalid codes

## User Flows

### SUPER ADMIN FLOW (Code > 6 characters):

```
join-game.html
  ↓ [enter code]
  ↓
avatar-select.html
  ↓ [select avatar]
  ↓
avatar-intro.html
  ↓ [animations + checks isSuperAdmin]
  ↓
game-selection.html
  ↓ [choose game to inspect]
  ↓
quiz-game.html OR spin-game.html (charades)
```

### REGULAR PLAYER FLOW (Code = 6 characters):

```
join-game.html
  ↓ [enter code]
  ↓ [system identifies: quiz or charades]
  ↓
avatar-select.html
  ↓ [select avatar]
  ↓
avatar-intro.html
  ↓ [animations + checks game type]
  ↓
quiz-wait-room.html OR charades-wait-room.html
  ↓ [admin clicks "Start Game"]
  ↓
quiz-game.html OR spin-game.html
```

### ADMIN JOIN FROM ADMIN DASHBOARD:

```
admin-dashboard.html
  ↓ [admin joins a game with code]
  ↓
[goes through regular player flow but is identified as super admin]
  ↓
Wait room (sees Start button)
  ↓ [admin clicks Start]
  ↓
Game page
```

## Session Storage Keys

After `join-game.js`:

- `sessionId` - The session ID from the game table
- `joinCode` - The 6-character join code
- `username` - Player's username
- `isSuperAdmin` - String 'true' or 'false'
- `gameType` - 'quiz' or 'charades' (only for regular players)

After `avatar-select.html`:

- `selectedAvatarId` - The selected avatar ID

## Database Requirements

### Required Tables:

1. **super_admins**
   - `id` (UUID, PK)
   - `super_code` (VARCHAR, UNIQUE) - Must be > 6 characters

2. **quiz_sessions**
   - `id` (UUID, PK)
   - `game_code` (VARCHAR(6), UNIQUE)
   - `game_type` (VARCHAR, default 'quiz')
   - `status` (VARCHAR, default 'waiting')

3. **charades_games**
   - `id` (UUID, PK)
   - `game_code` (VARCHAR(6), UNIQUE)
   - `status` (VARCHAR, default 'waiting')

4. **players**
   - `id` (UUID, PK)
   - `session_id` (UUID, INDEXED)
   - `username` (VARCHAR)
   - `avatar_id` (VARCHAR)
   - `joined_at` (TIMESTAMP)

See `SQL_SCHEMA_ROUTING.sql` for complete schema with all fields and indexes.

## Key Implementation Notes

### Code Distinction:

- **Super Admin Codes**: > 6 characters (e.g., 8-10 alphanumeric)
- **Quiz Game Codes**: Exactly 6 characters, checked in `quiz_sessions.game_code`
- **Charades Game Codes**: Exactly 6 characters, checked in `charades_games.game_code`
- System prioritizes super admin check before game type check

### Player Registration:

When players join through the wait room, they should be added to the `players` table with:

- `session_id`: The game session ID
- `username`: From sessionStorage
- `avatar_id`: From sessionStorage
- `joined_at`: Current timestamp

### Wait Room Polling:

Both wait rooms poll the `players` table every 2 seconds to display updated player lists.

## Testing Checklist

- [ ] Super admin can enter code > 6 chars and access game selection
- [ ] Super admin can pick quiz game from game selection
- [ ] Super admin can pick charades game from game selection
- [ ] Regular player can enter 6-char quiz code and go to quiz wait room
- [ ] Regular player can enter 6-char charades code and go to charades wait room
- [ ] Players list updates automatically in wait room
- [ ] Super admin sees "Start Game" button in wait room
- [ ] Regular players do NOT see "Start Game" button
- [ ] Clicking "Start Game" redirects to correct game page
- [ ] Invalid codes show appropriate error messages
- [ ] Session data persists across page navigation

## Troubleshooting

**Issue**: Players not appearing in wait room

- Check: Is the `players` table being populated when users join?
- Check: Is `session_id` matching correctly?
- Check: Are there any Supabase RLS policies blocking reads?

**Issue**: Game type not being determined

- Check: Is `game_code` field properly set in quiz_sessions and charades_games?
- Check: Are codes exactly 6 characters?
- Check: Are there any duplicate codes across tables?

**Issue**: Routing to wrong page

- Check: Session storage values (open browser DevTools → Application → Session Storage)
- Check: Supabase query response in browser console
- Check: Error messages in browser console

## Future Enhancements

1. Add real-time player updates using Supabase subscriptions
2. Add player count countdown timer before auto-start
3. Add game-specific settings in wait room (difficulty, categories, etc.)
4. Add spectator mode for super admins
5. Add chat in wait room
