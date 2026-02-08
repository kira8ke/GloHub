# Quiz Game Flow Implementation Guide

## Overview

Complete quiz game flow implementation with all screens, animations, and player interactions.

## Game Flow Architecture

### 1. **Join Game Page** (`join-game.html`)

- **User Input**: Game code + Display name
- **Validation**: Checks against `quiz_sessions` table
- **Data Persistence**: Stores in sessionStorage:
  - `sessionId`: Game session ID
  - `joinCode`: Join code (6 chars)
  - `username`: Player display name
  - `gameType`: 'quiz' or 'charades'
- **Navigation**: Redirects to avatar selection

### 2. **Avatar Selection Page** (`avatar-select.html`)

- **User Action**: Select from 20 avatar styles
- **Avatar Config**: Customizable vibe colors
- **Data Saved**:
  - `avatarConfig`: Object with dollId, vibeColor, brightness, emoji
  - `userId`: Generated from Supabase users table
- **Navigation**: Redirects to `quiz-game.html`

### 3. **Quiz Game Page** (`quiz-game.html`) - Main Game Container

#### **Screen States**:

1. **Lobby** (`#lobby`) - Initial waiting state
2. **Quiz Game** (`#quizGame`) - Question display
3. **Leaderboard** (`#leaderboard`) - Between questions
4. **Feedback Screen** (`#feedbackScreen`) - Result feedback
5. **Podium** (`#podiumScreen`) - Top 3 ranking
6. **Final Results** (`#finalResults`) - Complete leaderboard

---

## Component Details

### Lobby Component

```html
<div id="lobby" class="lobby">
  <h2>Waiting for the quiz to start...</h2>
  <div id="lobbyPlayers" class="lobby-players"></div>
  <button id="readyBtn" class="ready-button" onclick="toggleReady()">
    I'm Ready!
  </button>
</div>
```

**Features**:

- Displays all connected players with avatars
- Players appear as circular buttons with emoji icons
- Current player appears first
- Ready button allows player to indicate readiness
- Admin controls game start (webhook/realtime trigger)

**Related Functions**:

- `loadPlayersList()` - Load demo players
- `renderLobbyPlayers()` - Render player list
- `toggleReady()` - Toggle ready state
- `setupGameStartListener()` - Listen for admin trigger

---

### Quiz Game Component

```html
<div id="quizGame" class="quiz-game">
  <div class="question-container">
    <div class="question-header">
      <span id="questionNumber">Question 1</span>
      <span id="questionTimer">10s</span>
    </div>
    <h2 id="questionText"></h2>
    <div id="answersGrid"></div>
    <div id="answerFeedback" style="display: none;"></div>
  </div>
</div>
```

**Features**:

- Question number and timer display
- Answer grid with dynamic buttons
- Real-time feedback for correct/incorrect answers
- Timer countdown (10 seconds per question)
- Auto-advance protection (answers locked after selection)

**Related Functions**:

- `loadQuestion()` - Load and display question
- `startTimer()` - Start countdown timer
- `selectAnswer(selectedIndex)` - Handle answer selection

---

### Between-Questions Leaderboard Component

```html
<div
  id="leaderboard"
  class="between-questions-leaderboard"
  style="display: none;"
>
  <h2>Current Standings</h2>
  <div id="betweenQuestionsLeaderboard" class="leaderboard-list"></div>
  <button class="next-question-button" onclick="nextQuestion()">
    Next Question
  </button>
</div>
```

**Features**:

- Real-time score updates
- Player ranking display
- Highlights current player
- Next Question button to proceed

**Related Functions**:

- `showBetweenQuestionsLeaderboard()` - Display rankings
- `nextQuestion()` - Proceed to next question

---

### Feedback Screen Component

```html
<div id="feedbackScreen">
  <div class="feedback-content">
    <div class="feedback-avatar">
      <span id="feedbackAvatarEmoji">😊</span>
      <div class="expression" id="feedbackExpression">✨</div>
    </div>
    <div id="feedbackMessage">Great job!</div>
  </div>
</div>
```

**Features**:

- Avatar display with emoji expression
- Motivational/encouraging messages
- 3-second auto-advance timer
- Animation: fadeIn effect

**Expressions**:

- Happy (😊) - Correct answers
- Sad (😢) - Incorrect answers
- Surprised (😅) - Time's up

**Related Functions**:

- `showFeedback(isCorrect, answered)` - Show feedback screen

---

### Podium Component

```html
<div id="podiumScreen">
  <div class="podium-container" id="podiumContainer"></div>
</div>
```

**Features**:

- Top 3 players display
- Gold/Silver/Bronze styling
- Centered (1st) and offset (2nd/3rd) positioning
- 5-second viewing time before final results

**Layout**:

```
     🥇
  🥈    🥉
```

**Related Functions**:

- `showPodium()` - Display top 3 ranking

---

### Final Results Component

```html
<div id="finalResults">
  <h2>Game Over!</h2>
  <h3>Final Standings</h3>
  <div id="finalLeaderboard" class="leaderboard-list"></div>
  <button class="leave-button" onclick="leaveGame()">Leave Game</button>
</div>
```

**Features**:

- Full leaderboard display
- Score display for all players
- Winner highlighting
- Leave Game button to return to join page

**Related Functions**:

- `showFinalResults()` - Display final rankings
- `leaveGame()` - Clear session and redirect

---

## Data Flow Diagram

```
Join Game
    ↓
[Validate Code] → sessionStorage: sessionId, joinCode, username, gameType
    ↓
Avatar Selection
    ↓
[Select Avatar] → sessionStorage: avatarConfig (with emoji), userId
    ↓
Quiz Game Load
    ↓
[Check Session] → Load questions from DB
    ↓
Lobby Display
    ↓
[Admin Starts] → gameStarted event trigger
    ↓
Countdown (3→2→1)
    ↓
Question Loop:
  ├─ Load Question
  ├─ Start Timer (10s)
  ├─ Player Selects Answer
  ├─ Show Feedback (3s)
  ├─ Show Leaderboard (before next)
  └─ Next Question Button
    ↓
Final Question Reached
    ↓
Podium Display (5s)
    ↓
Final Results + Leave Game
```

---

## JavaScript Functions Reference

### Core Game Functions

- `document.addEventListener('DOMContentLoaded', ...)` - Initialize game on page load
- `checkPlayerSession()` - Validate player has session
- `loadSessionData(sessionId)` - Load questions from database
- `loadPlayersList()` - Initialize player list
- `setupGameStartListener()` - Listen for admin game start

### Lobby Functions

- `showLobby()` - Display lobby screen
- `loadPlayersList()` - Load player data
- `renderLobbyPlayers()` - Render player grid
- `toggleReady()` - Toggle player ready status

### Quiz Functions

- `startGameCountdown()` - Show 3-2-1 countdown
- `startQuiz()` - Initialize quiz
- `loadQuestion()` - Display question
- `startTimer()` - Start question timer
- `selectAnswer(selectedIndex)` - Handle answer selection
- `showCorrectAnswer()` - Show correct answer on timeout

### Feedback Functions

- `showFeedback(isCorrect, answered)` - Display feedback screen
- `showBetweenQuestionsLeaderboard()` - Display scores between questions
- `nextQuestion()` - Proceed to next question

### Results Functions

- `showPodium()` - Display top 3
- `showFinalResults()` - Display complete leaderboard
- `leaveGame()` - Clear session and redirect

---

## Global State Variables

```javascript
let currentSession = null; // Session data
let questions = []; // All quiz questions
let currentQuestionIndex = 0; // Current question index
let playerScore = 0; // Current player's score
let timeLeft = 10; // Question timer
let timer = null; // Timer interval
let hasAnswered = false; // Answer submitted flag
let playerReady = false; // Player ready status
let allPlayers = []; // All connected players
let gameStarted = false; // Game started flag
```

---

## Session Storage Structure

### After Join Game

```javascript
{
  sessionId: "abc123",
  joinCode: "GAME01",
  username: "Player",
  gameType: "quiz"
}
```

### After Avatar Selection

```javascript
{
  sessionId: "abc123",
  joinCode: "GAME01",
  username: "Player",
  gameType: "quiz",
  avatarConfig: {
    dollId: 5,
    vibeColor: "#ff69b4",
    brightness: "100%",
    emoji: "💕"
  },
  userId: "user123"
}
```

---

## CSS Classes Reference

### Display Classes

- `.lobby` - Lobby container
- `.quiz-game` - Quiz container
- `.between-questions-leaderboard` - Leaderboard display
- `.leaderboard-list` - Leaderboard items container
- `.podium-container` - Podium display

### Player/Rank Classes

- `.player-card` - Individual player in lobby
- `.player-card.ready` - Ready state styling
- `.leaderboard-item` - Ranking item
- `.podium-position` - Podium rank position
- `.podium-rank` - Rank badge (1st/2nd/3rd)

### Button Classes

- `.ready-button` - Ready button
- `.ready-button.is-ready` - Ready state
- `.next-question-button` - Next question button
- `.leave-button` - Leave game button
- `.answer-btn` - Answer option button
- `.answer-btn.correct` - Correct answer style
- `.answer-btn.incorrect` - Incorrect answer style

---

## Styling Notes

### Theme Colors (Maintained from Original)

- Primary: `#ff69b4` (Hot Pink)
- Accent: `#7b2cff` (Purple)
- Success: `#4caf50` (Green)
- Error: `#f44336` (Red)
- Background: `linear-gradient(135deg, #120018, #2b0036, #3a004d)`

### Animations

- `fadeIn` - 0.3s fade in effect
- `countdownPulse` - 1s pulse animation
- `floatingGlow` - 3s floating animation
- `slideDown` - 0.6s slide down animation

---

## Demo Questions

If no questions load from database, fallback to:

```javascript
[
  {
    question_text: "What is 2 + 2?",
    options: ["3", "4", "5", "6"],
    correct_answer: 1,
  },
  {
    question_text: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correct_answer: 2,
  },
  {
    question_text: "What year did the Titanic sink?",
    options: ["1912", "1920", "1905", "1915"],
    correct_answer: 0,
  },
];
```

---

## Testing Checklist

- [ ] Player can join with valid code and display name
- [ ] Avatar selection saves and displays in lobby
- [ ] Lobby shows all connected players
- [ ] Ready button toggles ready state
- [ ] Admin trigger starts game countdown
- [ ] Countdown displays 3→2→1 animation
- [ ] First question loads correctly
- [ ] Timer countdown works (10s)
- [ ] Answer selection works
- [ ] Feedback screen displays correct/incorrect
- [ ] Between-questions leaderboard displays
- [ ] Score updates correctly
- [ ] Next question button works
- [ ] Final question shows podium (top 3)
- [ ] Podium displays for 5 seconds
- [ ] Final results shows all players
- [ ] Leave button clears session and redirects

---

## Accessibility Features

- Semantic HTML structure
- Color contrast for visibility
- Button focus states
- Clear player identification via emoji
- Large touch targets for mobile
- Text feedback for all actions

---

## Mobile Optimization

- Responsive grid layouts
- Flex-based centering
- Touch-friendly button sizes (minimum 48px)
- Scrollable leaderboards
- Responsive font sizes
- Viewport optimization

---

## Future Enhancements

1. Real-time player updates via Supabase subscriptions
2. Sound effects for feedback
3. Player streak tracking
4. Difficulty levels
5. Team gameplay mode
6. Replay functionality
7. Achievement badges
8. Custom question sets per admin
9. Timed global questions
10. Live admin dashboard integration
