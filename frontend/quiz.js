<<<<<<< HEAD
// Quiz Game Logic
=======
// Quiz Game Logic - Complete Flow Implementation
>>>>>>> nigel/main

let currentSession = null;
let questions = [];
let currentQuestionIndex = 0;
let playerScore = 0;
let timeLeft = 10;
let timer = null;
let hasAnswered = false;
<<<<<<< HEAD

document.addEventListener('DOMContentLoaded', async () => {
    const session = checkPlayerSession();
    if (!session) return;
    
    // Display player info
    document.getElementById('playerName').textContent = `${session.username}`;
    document.getElementById('gameCode').textContent = `Code: ${session.sessionId}`;
=======
let playerReady = false;
let allPlayers = [];
let gameStarted = false;

// Feedback messages
const correctMessages = [
    "Absolutely correct! You're crushing it! 💖",
    "Yesss! That's right! ✨",
    "Perfect answer! You're so smart! 🌟",
    "Correct! Love the confidence! 💪",
    "Right on! Main character energy! 👑"
];

const incorrectMessages = [
    "Not quite, but you'll get the next one! 💪",
    "Almost there! Keep going! 🚀",
    "Oops! Better luck next! 🎯",
    "No worries, you've got this! 💖",
    "Try again on the next one! 🌟"
];

const motivationalPhrases = [
    "You're amazing!",
    "Keep going, bestie!",
    "Slay queen!",
    "You've got this!",
    "Stay focused!",
    "Main character energy!",
    "Absolutely crushing it!",
    "So proud of you!"
];

document.addEventListener('DOMContentLoaded', async () => {
    const session = checkPlayerSession();
    if (!session) {
        window.location.href = 'join-game.html';
        return;
    }
    
    // Display player info
    document.getElementById('playerName').textContent = `Player: ${session.username}`;
    document.getElementById('gameCode').textContent = `Code: ${session.joinCode}`;
>>>>>>> nigel/main
    
    // Load session data
    await loadSessionData(session.sessionId);
    
    // Show lobby initially
    showLobby();
<<<<<<< HEAD
=======
    
    // Simulate loading player list (in real app, this would come from Supabase realtime)
    await loadPlayersList();
    
    // Simulate admin starting game after 10 seconds (for demo)
    // In real app, this would be triggered by admin action via Supabase
    setTimeout(() => {
        if (!gameStarted) {
            // startGameCountdown(); // Uncomment when admin trigger is ready
        }
    }, 10000);
>>>>>>> nigel/main
});

async function loadSessionData(sessionId) {
    try {
        const { data: sessionData } = await supabase
            .from('sessions')
            .select('*, clients(*)')
            .eq('id', sessionId)
            .single();
        
        if (!sessionData) {
            showNotification('Session not found', 'error');
            return;
        }
        
        currentSession = sessionData;
        
        // Load questions for this client
        const { data: questionsData } = await supabase
            .from('questions')
            .select('*')
            .eq('client_id', sessionData.client_id);
        
        questions = questionsData || [];
        
        // Shuffle questions
        questions = questions.sort(() => Math.random() - 0.5);
        
    } catch (error) {
        console.error('Error loading session:', error);
<<<<<<< HEAD
    }
}

function showLobby() {
    document.getElementById('lobby').style.display = 'block';
    document.getElementById('quizGame').style.display = 'none';
    document.getElementById('leaderboard').style.display = 'none';
    document.getElementById('finalResults').style.display = 'none';
    
    // In a real app, you'd wait for admin to start game
    // For now, auto-start after 3 seconds
    setTimeout(() => {
        if (questions.length > 0) {
            startQuiz();
        } else {
            document.getElementById('lobby').innerHTML = `
                <h2>No questions available</h2>
                <p>The admin hasn't added any questions yet.</p>
            `;
        }
    }, 3000);
=======
        questions = generateDemoQuestions(); // Fallback to demo questions
    }
}

// Generate demo questions if no questions in database
function generateDemoQuestions() {
    return [
        {
            id: 1,
            question_text: "What is 2 + 2?",
            options: ["3", "4", "5", "6"],
            correct_answer: 1
        },
        {
            id: 2,
            question_text: "What is the capital of France?",
            options: ["London", "Berlin", "Paris", "Madrid"],
            correct_answer: 2
        },
        {
            id: 3,
            question_text: "What year did the Titanic sink?",
            options: ["1912", "1920", "1905", "1915"],
            correct_answer: 0
        }
    ];
}

async function loadPlayersList() {
    // Simulate loading players (would be from Supabase in real app)
    const username = sessionStorage.getItem('username');
    allPlayers = [
        { name: username, avatar: '👑', ready: false, isCurrentPlayer: true, score: 0 },
        { name: 'Alex', avatar: '💕', ready: false, isCurrentPlayer: false, score: 0 },
        { name: 'Jordan', avatar: '💖', ready: false, isCurrentPlayer: false, score: 0 },
        { name: 'Casey', avatar: '✨', ready: false, isCurrentPlayer: false, score: 0 }
    ];
    
    renderLobbyPlayers();
}

function renderLobbyPlayers() {
    const container = document.getElementById('lobbyPlayers');
    if (!container) return;
    
    container.innerHTML = allPlayers.map((player, index) => `
        <div class="player-card ${player.ready ? 'ready' : ''}" data-index="${index}">
            <div class="player-avatar-mini">${player.avatar}</div>
            <div class="player-name">${player.name}</div>
            <div class="ready-badge">✓</div>
        </div>
    `).join('');
}

function toggleReady() {
    playerReady = !playerReady;
    const btn = document.getElementById('readyBtn');
    
    if (playerReady) {
        btn.classList.add('is-ready');
        btn.textContent = "Ready! ✓";
        // Mark current player as ready in the UI
        allPlayers[0].ready = true;
    } else {
        btn.classList.remove('is-ready');
        btn.textContent = "I'm Ready!";
        allPlayers[0].ready = false;
    }
    
    renderLobbyPlayers();
}

function showLobby() {
    document.getElementById('lobby').style.display = 'flex';
    document.getElementById('quizGame').style.display = 'none';
    document.getElementById('finalResults').style.display = 'none';
    gameStarted = false;
}

// Countdown overlay animation
function startGameCountdown() {
    if (gameStarted) return;
    gameStarted = true;
    
    document.getElementById('lobby').style.display = 'none';
    document.getElementById('countdownOverlay').style.display = 'flex';
    
    let count = 3;
    const display = document.getElementById('countdownDisplay');
    
    const interval = setInterval(() => {
        display.textContent = count;
        display.style.animation = 'none';
        setTimeout(() => {
            display.style.animation = 'countdownPulse 1s ease';
        }, 10);
        
        count--;
        
        if (count < 0) {
            clearInterval(interval);
            document.getElementById('countdownOverlay').style.display = 'none';
            startQuiz();
        }
    }, 1000);
>>>>>>> nigel/main
}

function startQuiz() {
    currentQuestionIndex = 0;
    playerScore = 0;
    
    document.getElementById('lobby').style.display = 'none';
<<<<<<< HEAD
    document.getElementById('quizGame').style.display = 'block';
=======
    document.getElementById('quizGame').style.display = 'flex';
    document.getElementById('finalResults').style.display = 'none';
    
    if (questions.length === 0) {
        showFinalResults();
        return;
    }
>>>>>>> nigel/main
    
    loadQuestion();
}

function loadQuestion() {
    if (currentQuestionIndex >= questions.length) {
<<<<<<< HEAD
        showFinalResults();
=======
        showPodium();
>>>>>>> nigel/main
        return;
    }
    
    hasAnswered = false;
    timeLeft = 10;
    
    const question = questions[currentQuestionIndex];
    
    document.getElementById('questionNumber').textContent = 
        `Question ${currentQuestionIndex + 1} of ${questions.length}`;
    document.getElementById('questionText').textContent = question.question_text;
    
    // Clear previous answer feedback
    document.getElementById('answerFeedback').style.display = 'none';
    
    // Render answer options
    const answersGrid = document.getElementById('answersGrid');
    answersGrid.innerHTML = question.options.map((option, index) => `
        <button class="answer-btn" onclick="selectAnswer(${index})">
            ${option}
        </button>
    `).join('');
    
    // Start timer
    startTimer();
}

function startTimer() {
    clearInterval(timer);
    
    timer = setInterval(() => {
        timeLeft--;
        document.getElementById('questionTimer').textContent = `${timeLeft}s`;
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            if (!hasAnswered) {
                showCorrectAnswer();
                setTimeout(() => {
                    currentQuestionIndex++;
<<<<<<< HEAD
                    showLeaderboard();
=======
                    showFeedback(false, false);
>>>>>>> nigel/main
                }, 2000);
            }
        }
    }, 1000);
}

async function selectAnswer(selectedIndex) {
    if (hasAnswered) return;
    
    hasAnswered = true;
    clearInterval(timer);
    
    const question = questions[currentQuestionIndex];
    const isCorrect = selectedIndex === question.correct_answer;
    
    if (isCorrect) {
        playerScore += 100;
<<<<<<< HEAD

         // ADD CELEBRATION EFFECT
        if (window.gameAnimations) {
            window.gameAnimations.celebrateWithConfetti();
        }
    } else {
        // ADD SHAKE EFFECT FOR WRONG ANSWER
        const feedback = document.getElementById('answerFeedback');
        if (window.gameAnimations && feedback) {
            window.gameAnimations.shakeElement(feedback);
        }
=======
>>>>>>> nigel/main
    }
    
    // Visual feedback
    const buttons = document.querySelectorAll('.answer-btn');
    buttons.forEach((btn, index) => {
        btn.disabled = true;
        if (index === question.correct_answer) {
            btn.classList.add('correct');
        } else if (index === selectedIndex && !isCorrect) {
            btn.classList.add('incorrect');
        }
    });
    
<<<<<<< HEAD
    // Show feedback
=======
    // Show answer feedback
>>>>>>> nigel/main
    const feedback = document.getElementById('answerFeedback');
    feedback.style.display = 'block';
    feedback.textContent = isCorrect ? 
        'Correct! +100 points!' : 
        'Oops! Better luck next time!';
    feedback.style.background = isCorrect ? '#4caf50' : '#f44336';
<<<<<<< HEAD
    feedback.style.color = 'white';
    feedback.style.padding = '15px';
    feedback.style.borderRadius = '10px';
=======
>>>>>>> nigel/main
    
    // Save response
    try {
        await supabase
            .from('responses')
            .insert([
                {
                    session_id: currentSession.id,
<<<<<<< HEAD
                    user_id: sessionStorage.getItem('userId'),
=======
                    user_id: sessionStorage.getItem('userId') || 'anonymous',
>>>>>>> nigel/main
                    question_id: question.id,
                    answer: selectedIndex,
                    is_correct: isCorrect
                }
            ]);
    } catch (error) {
        console.error('Error saving response:', error);
    }
    
<<<<<<< HEAD
    // Move to next question after delay
    setTimeout(() => {
        currentQuestionIndex++;
        showLeaderboard();
=======
    // Move to next question with feedback
    setTimeout(() => {
        currentQuestionIndex++;
        showFeedback(isCorrect, true);
>>>>>>> nigel/main
    }, 2000);
}

function showCorrectAnswer() {
    const question = questions[currentQuestionIndex];
    const buttons = document.querySelectorAll('.answer-btn');
    
    buttons.forEach((btn, index) => {
        btn.disabled = true;
        if (index === question.correct_answer) {
            btn.classList.add('correct');
        }
    });
    
    const feedback = document.getElementById('answerFeedback');
    feedback.style.display = 'block';
<<<<<<< HEAD
    feedback.textContent = 'Time\'s up!';
    feedback.style.background = '#ff9800';
    feedback.style.color = 'white';
    feedback.style.padding = '15px';
    feedback.style.borderRadius = '10px';
}

async function showLeaderboard() {
    document.getElementById('quizGame').style.display = 'none';
    document.getElementById('leaderboard').style.display = 'block';
    
    // In a real multiplayer game, you'd load all players' scores
    // For now, just show current player
    const leaderboardList = document.getElementById('leaderboardList');
    leaderboardList.innerHTML = `
                <div class="leaderboard-item">
            <div>
                <strong>${sessionStorage.getItem('username')}</strong>
            </div>
            <div style="font-size: 20px; font-weight: bold; color: #ff69b4;">
                ${playerScore} points
            </div>
        </div>
    `;
}

function nextQuestion() {
    document.getElementById('leaderboard').style.display = 'none';
    document.getElementById('quizGame').style.display = 'block';
    loadQuestion();
}

function showFinalResults() {
    document.getElementById('quizGame').style.display = 'none';
    document.getElementById('leaderboard').style.display = 'none';
    document.getElementById('finalResults').style.display = 'block';
    
    const finalLeaderboard = document.getElementById('finalLeaderboard');
    finalLeaderboard.innerHTML = `
            <div class="leaderboard-item" style="background: linear-gradient(135deg, #ffd700, #fff4cc); padding: 30px;">
            <div>
                <strong style="font-size: 24px;">${sessionStorage.getItem('username')}</strong>
                <div style="font-size: 14px; margin-top: 10px;">You're amazing!</div>
            </div>
            <div style="font-size: 32px; font-weight: bold; color: #ff69b4;">
                ${playerScore} points
            </div>
        </div>
    `;
}

function backToLobby() {
    currentQuestionIndex = 0;
    playerScore = 0;
    showLobby();
=======
    feedback.textContent = "Time's up!";
    feedback.style.background = '#ff9800';
}

// Show feedback screen with avatar expression
function showFeedback(isCorrect, answered) {
    document.getElementById('quizGame').style.display = 'none';
    document.getElementById('feedbackScreen').style.display = 'flex';
    
    const expression = document.getElementById('feedbackExpression');
    const message = document.getElementById('feedbackMessage');
    
    if (isCorrect) {
        expression.textContent = '😊';
        message.textContent = correctMessages[Math.floor(Math.random() * correctMessages.length)];
    } else if (!answered) {
        expression.textContent = '😅';
        message.textContent = 'Time ran out! Next one!';
    } else {
        expression.textContent = '😢';
        message.textContent = incorrectMessages[Math.floor(Math.random() * incorrectMessages.length)];
    }
    
    // Auto-advance after 3 seconds
    setTimeout(() => {
        document.getElementById('feedbackScreen').style.display = 'none';
        
        if (currentQuestionIndex >= questions.length) {
            showPodium();
        } else {
            document.getElementById('quizGame').style.display = 'flex';
            loadQuestion();
        }
    }, 3000);
}

// Show top 3 podium before full results
function showPodium() {
    document.getElementById('quizGame').style.display = 'none';
    document.getElementById('finalResults').style.display = 'none';
    document.getElementById('podiumScreen').style.display = 'flex';
    
    // Sort players by score
    const rankedPlayers = [
        { name: sessionStorage.getItem('username'), score: playerScore, avatar: '👑' },
        { name: 'Alex', score: Math.floor(Math.random() * playerScore), avatar: '💕' },
        { name: 'Jordan', score: Math.floor(Math.random() * playerScore), avatar: '💖' }
    ].sort((a, b) => b.score - a.score);
    
    const podium = document.getElementById('podiumContainer');
    
    podium.innerHTML = `
        <div class="podium-position">
            <div class="podium-avatar">${rankedPlayers[1]?.avatar || '💕'}</div>
            <div class="podium-name">${rankedPlayers[1]?.name || 'Player 2'}</div>
            <div class="podium-rank rank-2">2nd</div>
        </div>
        <div class="podium-position">
            <div class="podium-avatar">${rankedPlayers[0].avatar}</div>
            <div class="podium-name">${rankedPlayers[0].name}</div>
            <div class="podium-rank rank-1">🏆 1st</div>
        </div>
        <div class="podium-position">
            <div class="podium-avatar">${rankedPlayers[2]?.avatar || '💖'}</div>
            <div class="podium-name">${rankedPlayers[2]?.name || 'Player 3'}</div>
            <div class="podium-rank rank-3">3rd</div>
        </div>
    `;
    
    // Show podium for 5 seconds then show full results
    setTimeout(() => {
        document.getElementById('podiumScreen').style.display = 'none';
        showFinalResults();
    }, 5000);
}

// Show full leaderboard
function showFinalResults() {
    document.getElementById('quizGame').style.display = 'none';
    document.getElementById('podiumScreen').style.display = 'none';
    document.getElementById('finalResults').style.display = 'flex';
    
    const finalLeaderboard = document.getElementById('finalLeaderboard');
    
    // Create leaderboard with all players
    const leaderboard = [
        { name: sessionStorage.getItem('username'), score: playerScore, avatar: '👑' },
        { name: 'Alex', score: Math.floor(Math.random() * 400), avatar: '💕' },
        { name: 'Jordan', score: Math.floor(Math.random() * 400), avatar: '💖' },
        { name: 'Casey', score: Math.floor(Math.random() * 400), avatar: '✨' }
    ].sort((a, b) => b.score - a.score);
    
    finalLeaderboard.innerHTML = leaderboard.map((player, index) => `
        <div class="leaderboard-item" style="${index === 0 ? 'background: linear-gradient(135deg, #ffd700, #fff4cc); border-left-color: #ffd700;' : ''}">
            <div style="display: flex; align-items: center; gap: 15px;">
                <span style="font-size: 20px;">${player.avatar}</span>
                <div>
                    <strong>${player.name}</strong>
                    <div style="font-size: 12px; color: rgba(255,255,255,0.7);">${index === 0 ? '🏆 Winner!' : ''}</div>
                </div>
            </div>
            <div class="leaderboard-score">${player.score}</div>
        </div>
    `).join('');
}

// Leave game and go back to join page
function leaveGame() {
    // Clear session storage
    sessionStorage.removeItem('sessionId');
    sessionStorage.removeItem('joinCode');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('avatarConfig');
    
    // Redirect to join game
    window.location.href = 'join-game.html';
>>>>>>> nigel/main
}