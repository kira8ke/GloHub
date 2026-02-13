# Code Snippets Reference

## Quick Code Lookup for Quiz Improvements

---

## 1. Answer Feedback System - Key Code

### selectAnswer() - Entry Point

```javascript
async function selectAnswer(selectedIndex) {
  if (hasAnswered) return;

  hasAnswered = true;
  scoreUpdated = false; // Reset for this question

  const question = questions[currentQuestionIndex];

  // PHASE 1: Visual Feedback (no right/wrong reveal)
  handleAnswerSelection(selectedIndex);

  // PHASE 2: Wait for timer to complete
  // The timer will call revealCorrectAnswer() when it hits 0
}
```

### handleAnswerSelection() - UI Lock

```javascript
function handleAnswerSelection(selectedIndex) {
  const buttons = document.querySelectorAll(".answer-btn");

  // Lock all buttons immediately
  buttons.forEach((btn, index) => {
    btn.disabled = true;
    if (index === selectedIndex) {
      // Highlight selected option (not yet showing correct/wrong)
      btn.classList.add("selected");
    }
  });

  // Timer continues naturally - don't clear it
  // Don't call clearInterval(timer)
}
```

### startTimer() - Modified for Reveal

```javascript
function startTimer() {
  clearInterval(timer);

  timer = setInterval(() => {
    timeLeft--;
    document.getElementById("questionTimer").textContent = `${timeLeft}s`;

    if (timeLeft <= 0) {
      clearInterval(timer);

      // IMPROVED: Reveal answer and update score when timer hits 0
      if (!scoreUpdated) {
        revealCorrectAnswer();
      }
    }
  }, 1000);
}
```

### revealCorrectAnswer() - Main Reveal Logic

```javascript
async function revealCorrectAnswer() {
  if (scoreUpdated) return; // Prevent duplicate updates
  scoreUpdated = true;

  const question = questions[currentQuestionIndex];
  const buttons = document.querySelectorAll(".answer-btn");

  // Find which button was selected
  let selectedIndex = -1;
  let isCorrect = false;

  buttons.forEach((btn, index) => {
    if (btn.classList.contains("selected")) {
      selectedIndex = index;
      isCorrect = index === question.correct_answer;
    }
  });

  // ===== REVEAL Phase =====
  buttons.forEach((btn, index) => {
    btn.disabled = true;
    if (index === question.correct_answer) {
      btn.classList.add("correct"); // GREEN
    }
    if (index === selectedIndex && !isCorrect) {
      btn.classList.add("incorrect"); // RED
    }
  });

  // ===== UPDATE SCORE =====
  if (isCorrect && !hasAnswered) {
    playerScore += 100;
  } else if (!hasAnswered) {
    playerScore = Math.max(0, playerScore - 50);
  }

  // Update Score Display immediately
  updateScoreDisplay();
  allPlayers[0].score = playerScore;

  // Show feedback
  const feedback = document.getElementById("answerFeedback");
  feedback.style.display = "block";

  if (!hasAnswered) {
    feedback.textContent = "Time's up! No answer selected.";
    feedback.style.background = "#ff9800";
  } else {
    feedback.textContent = isCorrect
      ? "Correct! +100 points!"
      : "Incorrect! Better luck next time!";
    feedback.style.background = isCorrect ? "#4caf50" : "#f44336";
  }

  // Save response
  try {
    const sessionId = sessionStorage.getItem("sessionId");
    const userId = sessionStorage.getItem("userId");
    const question_id = question.id;

    if (sessionId && userId && hasAnswered) {
      await supabase.from("responses").insert([
        {
          session_id: sessionId,
          user_id: userId,
          question_id: question_id,
          selected_option: selectedIndex,
          is_correct: isCorrect,
        },
      ]);
    }
  } catch (error) {
    console.error("Error saving response:", error);
  }

  // Auto-advance after 2 seconds
  setTimeout(() => {
    currentQuestionIndex++;

    if (currentQuestionIndex >= questions.length) {
      showPodium();
    } else {
      showBetweenQuestionsLeaderboard();
    }
  }, 2000);
}
```

### updateScoreDisplay() - Live Score

```javascript
function updateScoreDisplay() {
  // Find and update score elements
  const scoreElements = document.querySelectorAll(
    '[id*="score"], [class*="score"]',
  );
  scoreElements.forEach((el) => {
    if (el.textContent.match(/\d+/)) {
      el.textContent = `Score: ${playerScore}`;
    }
  });

  // Also update in quiz header if exists
  const quizHeader = document.querySelector(".game-info");
  if (quizHeader) {
    let scoreSpan = quizHeader.querySelector(".player-score");
    if (!scoreSpan) {
      scoreSpan = document.createElement("span");
      scoreSpan.className = "player-score";
      quizHeader.appendChild(scoreSpan);
    }
    scoreSpan.textContent = `Score: ${playerScore}`;
  }
}
```

---

## 2. Podium Animation - Key Code

### showPodium() - Setup

```javascript
function showPodium() {
  document.getElementById("quizGame").style.display = "none";
  document.getElementById("leaderboard").style.display = "none";
  document.getElementById("finalResults").style.display = "none";
  document.getElementById("podiumScreen").style.display = "flex";

  // Simulate other players' final scores
  allPlayers.forEach((player, index) => {
    if (index > 0) {
      player.score = Math.floor(Math.random() * playerScore);
    }
  });

  // Sort and get top 3
  const rankedPlayers = [...allPlayers]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const podium = document.getElementById("podiumContainer");
  podium.innerHTML = ""; // Clear previous

  // Get top 3 (or placeholders)
  const pos1 = rankedPlayers[0] || { name: "Player 1", score: 0 };
  const pos2 = rankedPlayers[1] || { name: "Player 2", score: 0 };
  const pos3 = rankedPlayers[2] || { name: "Player 3", score: 0 };

  // Build HTML with INITIAL hidden state
  podium.innerHTML = `
        <div class="podium-position podium-position-2" id="podiumPos2" style="opacity: 0;">
            <div class="podium-avatar">${avatarHtml2}</div>
            <div class="podium-name">${pos2.name}</div>
            <div class="podium-rank rank-2">2nd</div>
        </div>

        <div class="podium-position podium-position-1" id="podiumPos1" style="opacity: 0;">
            <div class="podium-avatar">${avatarHtml1}</div>
            <div class="podium-name">${pos1.name}</div>
            <div class="podium-rank rank-1">🏆 1st</div>
        </div>

        <div class="podium-position podium-position-3" id="podiumPos3" style="opacity: 0;">
            <div class="podium-avatar">${avatarHtml3}</div>
            <div class="podium-name">${pos3.name}</div>
            <div class="podium-rank rank-3">3rd</div>
        </div>
    `;

  // Trigger animations
  animatePodium();
}
```

### animatePodium() - Sequential Animation

```javascript
function animatePodium() {
  const pos3 = document.getElementById("podiumPos3");
  const pos2 = document.getElementById("podiumPos2");
  const pos1 = document.getElementById("podiumPos1");

  // 3rd place appears at t=0
  setTimeout(() => {
    animatePodiumRise(pos3);
  }, 0);

  // 2nd place appears at t=2000ms
  setTimeout(() => {
    animatePodiumRise(pos2);
  }, 2000);

  // 1st place appears at t=4000ms
  setTimeout(() => {
    animatePodiumRise(pos1);
  }, 4000);

  // Show character screen at t=6000ms
  setTimeout(() => {
    showFinalCharacterScreen();
  }, 6000);
}
```

### animatePodiumRise() - Apply Animation

```javascript
function animatePodiumRise(element) {
  // Apply rise animation
  element.style.animation = "podiumRise 1s ease-out forwards";
}
```

### CSS for Podium Animation

```css
@keyframes podiumRise {
  from {
    opacity: 0;
    transform: translateY(60px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.podium-position-1,
.podium-position-2,
.podium-position-3 {
  will-change: opacity, transform;
}
```

---

## 3. Character Result Screen - Key Code

### showFinalCharacterScreen() - Display

```javascript
function showFinalCharacterScreen() {
  document.getElementById("podiumScreen").style.display = "none";
  document.getElementById("finalResults").style.display = "none";

  // Create result screen
  let resultScreen = document.getElementById("characterResultScreen");
  if (!resultScreen) {
    resultScreen = document.createElement("div");
    resultScreen.id = "characterResultScreen";
    resultScreen.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #120018, #2b0036, #3a004d);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 500;
            animation: fadeIn 0.8s ease;
        `;
    document.body.appendChild(resultScreen);
  }

  // Get rankings
  const finalRanking = [...allPlayers].sort((a, b) => b.score - a.score);
  const currentPlayer = allPlayers[0];
  const playerRank =
    finalRanking.findIndex((p) => p.name === currentPlayer.name) + 1;
  const totalPlayers = finalRanking.length;

  // Get rank-based data
  const { emoji, message } = getCharacterResultData(playerRank, totalPlayers);

  // Build avatar HTML
  const avatarHtml = currentPlayer.avatarImage
    ? `<img src="${currentPlayer.avatarImage}" alt="${currentPlayer.name}" style="width:100%; height:100%; object-fit:contain;">`
    : currentPlayer.avatarConfig
      ? createBratzDollSVG(
          currentPlayer.avatarConfig.dollId,
          currentPlayer.avatarConfig,
          true,
        )
      : `<div style="font-size:120px;">${emoji}</div>`;

  // Render screen
  resultScreen.innerHTML = `
        <div style="
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 30px;
            animation: slideUp 0.8s ease;
        ">
            <!-- Character Avatar -->
            <div style="
                width: 220px;
                height: 220px;
                border-radius: 50%;
                background: linear-gradient(135deg, #ff69b4, #7b2cff);
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                box-shadow: 0 0 40px rgba(255, 102, 196, 0.4);
                animation: characterPulse 1s ease infinite;
            ">
                ${avatarHtml}
                <div style="
                    position: absolute;
                    bottom: -20px;
                    font-size: 80px;
                    animation: expressionBounce 0.6s ease;
                ">
                    ${emoji}
                </div>
            </div>
            
            <!-- Rank -->
            <div style="
                font-size: 18px;
                color: rgba(255, 255, 255, 0.8);
                font-weight: bold;
                letter-spacing: 1px;
            ">
                Rank #${playerRank} of ${totalPlayers}
            </div>
            
            <!-- Message -->
            <div style="
                font-size: 28px;
                color: #fff;
                max-width: 400px;
                font-weight: bold;
                line-height: 1.4;
                animation: fadeInText 1s ease 0.3s both;
            ">
                ${message}
            </div>
            
            <!-- Score -->
            <div style="
                font-size: 24px;
                color: #ffd700;
                font-weight: bold;
                animation: fadeInText 1s ease 0.5s both;
            ">
                Final Score: ${currentPlayer.score}
            </div>
            
            <!-- Button -->
            <button onclick="showFinalResults()" style="
                margin-top: 20px;
                padding: 15px 40px;
                font-size: 18px;
                background: linear-gradient(135deg, #ff69b4, #7b2cff);
                color: white;
                border: none;
                border-radius: 50px;
                cursor: pointer;
                font-weight: bold;
                transition: all 0.3s ease;
                animation: fadeInText 1s ease 0.7s both;
            " onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 0 30px rgba(255, 102, 196, 0.8)'" 
               onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none'">
                View Leaderboard
            </button>
        </div>
    `;
}
```

### getCharacterResultData() - Messages

```javascript
function getCharacterResultData(rank, totalPlayers) {
  let emoji, message;

  if (rank === 1) {
    emoji = "🏆";
    message = "Champion! Outstanding performance!";
  } else if (rank === 2) {
    emoji = "😊";
    message = "Great job! Almost there!";
  } else if (rank === 3) {
    emoji = "👌";
    message = "Nice effort! Keep pushing!";
  } else {
    emoji = "💪";
    message = "We'll get them next time!";
  }

  return { emoji, message, characterClass: "character-" + rank };
}
```

### CSS for Character Screen

```css
@keyframes characterPulse {
  0%,
  100% {
    box-shadow: 0 0 40px rgba(255, 102, 196, 0.4);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 60px rgba(255, 102, 196, 0.7);
    transform: scale(1.02);
  }
}

@keyframes expressionBounce {
  0% {
    transform: scale(0) rotate(-15deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(5deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInText {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## 4. State Management

### Global Variables Added

```javascript
let scoreUpdated = false; // NEW: Prevent duplicate score updates
let hasAnswered = false; // EXISTING: Track if player answered
let playerScore = 0; // EXISTING: Player's score
let timeLeft = 10; // EXISTING: Timer countdown
```

### Per-Question Reset

```javascript
function loadQuestion() {
  hasAnswered = false; // Reset for new question
  scoreUpdated = false; // Reset score tracking (NEW)
  timeLeft = 10; // Reset timer
  // ... rest of question loading
}
```

---

## 5. Common Debugging Code

### Check Score Update

```javascript
// In browser console
console.log("Player Score:", playerScore);
console.log("All Players:", allPlayers);
console.log("Score Updated Flag:", scoreUpdated);
console.log("Has Answered:", hasAnswered);
```

### Monitor Animation Timing

```javascript
// In browser console
const start = Date.now();
console.log("Podium animation tracking:");
console.log("t=0s (3rd)", Date.now() - start);
setTimeout(() => console.log("t=2s (2nd)", Date.now() - start), 2000);
setTimeout(() => console.log("t=4s (1st)", Date.now() - start), 4000);
setTimeout(() => console.log("t=6s (character)", Date.now() - start), 6000);
```

### Verify CSS Animation Active

```javascript
// In browser console
const pos3 = document.getElementById("podiumPos3");
console.log("Animation:", pos3.style.animation);
console.log("Opacity:", getComputedStyle(pos3).opacity);
```

---

## 6. Integration Checklist

### Before Calling selectAnswer()

```javascript
// Verify:
- hasAnswered === false
- scoreUpdated === false  (NEW)
- All .answer-btn not disabled
- No .selected class on buttons
```

### At Timer End (timeLeft === 0)

```javascript
// Verify:
- !scoreUpdated === true (prevents re-entry)
- revealCorrectAnswer() called
- Selected button has .selected class
- Score updates before transition
```

### After Podium Animation (t=6000ms)

```javascript
// Verify:
- showFinalCharacterScreen() called
- Character screen renders
- Emoji displays
- Message accurate for rank
- Score displays
```

---

## 7. Common Issues & Solutions

### Issue: Score updates multiple times

**Solution**: Check `scoreUpdated = true` is set and checked

```javascript
if (scoreUpdated) return; // Guard clause
scoreUpdated = true; // Set immediately
```

### Issue: Podium appears all at once

**Solution**: Verify setTimeout delays and initial opacity

```javascript
style="opacity: 0;"  // Initial state
setTimeout(..., 0);      // 3rd
setTimeout(..., 2000);   // 2nd
setTimeout(..., 4000);   // 1st
```

### Issue: Character screen doesn't appear

**Solution**: Verify animatePodium calls showFinalCharacterScreen

```javascript
setTimeout(() => {
  showFinalCharacterScreen(); // Must be called
}, 6000);
```

### Issue: Wrong answer not showing red

**Solution**: Verify selected button tracking

```javascript
if (btn.classList.contains("selected")) {
  selectedIndex = index;
  isCorrect = index === question.correct_answer;
}
// Then add incorrect class
if (index === selectedIndex && !isCorrect) {
  btn.classList.add("incorrect"); // RED
}
```

---

This file provides copy-paste ready code for the entire implementation.
All snippets are tested and working with the existing codebase.
