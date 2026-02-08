// Quiz Game Logic - Complete Flow Implementation

let currentSession = null;
let questions = [];
let currentQuestionIndex = 0;
let playerScore = 0;
let timeLeft = 10;
let timer = null;
let hasAnswered = false;
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
    const sessionData = checkPlayerSession();
    if (!sessionData) {
        window.location.href = 'join-game.html';
        return;
    }
    
    // Get player info from session storage
    const username = sessionStorage.getItem('username');
    const joinCode = sessionStorage.getItem('joinCode');
    const userId = sessionStorage.getItem('userId');
    
    // Display player info
    if (username) document.getElementById('playerName').textContent = `Player: ${username}`;
    if (joinCode) document.getElementById('gameCode').textContent = `Code: ${joinCode}`;
    
    // Load session data
    const sessionId = sessionStorage.getItem('sessionId');
    if (sessionId) {
        await loadSessionData(sessionId);
    } else {
        // Fallback to demo questions if no session
        questions = generateDemoQuestions();
    }
    
    // Show lobby initially
    showLobby();
    
    // Simulate loading player list (in real app, this would come from Supabase realtime)
    await loadPlayersList();
    
    // Simulate admin starting game after 10 seconds (for demo)
    // In real app, this would be triggered by admin action via Supabase
    setTimeout(() => {
        if (!gameStarted) {
            // startGameCountdown(); // Uncomment when admin trigger is ready
        }
    }, 10000);

    // Show Super Admin "Next" button if applicable
    try {
        const isSuper = sessionStorage.getItem('isSuperAdmin') === 'true';
        const nextBtn = document.getElementById('superNextBtn');
        if (isSuper && nextBtn) {
            nextBtn.style.display = 'block';
            nextBtn.addEventListener('click', superAdminNext);
        }
    } catch (e) { console.warn('Unable to init super next button', e); }
});

// Advance through game screens for Super Admin testing
function superAdminNext() {
    // If lobby visible -> start countdown
    const lobby = document.getElementById('lobby');
    const countdown = document.getElementById('countdownOverlay');
    const quizGame = document.getElementById('quizGame');
    const feedback = document.getElementById('feedbackScreen');
    const podium = document.getElementById('podiumScreen');
    const final = document.getElementById('finalResults');

    if (lobby && getComputedStyle(lobby).display !== 'none') {
        startGameCountdown();
        return;
    }

    if (countdown && getComputedStyle(countdown).display !== 'none') {
        // Force finish countdown and start quiz
        countdown.style.display = 'none';
        startQuiz();
        return;
    }

    if (quizGame && getComputedStyle(quizGame).display !== 'none') {
        // Skip current question and go to next (no feedback)
        clearInterval(timer);
        currentQuestionIndex++;
        if (currentQuestionIndex >= questions.length) {
            showPodium();
        } else {
            loadQuestion();
        }
        return;
    }

    if (feedback && getComputedStyle(feedback).display !== 'none') {
        // Immediately perform post-feedback transition
        feedback.style.display = 'none';
        if (currentQuestionIndex >= questions.length) {
            showPodium();
        } else {
            document.getElementById('quizGame').style.display = 'flex';
            loadQuestion();
        }
        return;
    }

    if (podium && getComputedStyle(podium).display !== 'none') {
        podium.style.display = 'none';
        document.getElementById('finalResults').style.display = 'flex';
        return;
    }

    if (final && getComputedStyle(final).display !== 'none') {
        // Cycle back to lobby for further inspection
        showLobby();
        return;
    }
}

async function loadSessionData(sessionId) {
    try {
        // Get session details from storage if available
        const gameType = sessionStorage.getItem('gameType');
        
        if (gameType === 'quiz') {
            // Load questions for quiz session
            const { data: questionsData } = await supabase
                .from('questions')
                .select('*')
                .eq('quiz_session_id', sessionId)
                .order('id', { ascending: true });
            
            questions = questionsData || [];
        }
        
        // If no questions found, use demo questions
        if (questions.length === 0) {
            questions = generateDemoQuestions();
        }
        
        // Shuffle questions for randomness
        questions = questions.sort(() => Math.random() - 0.5);
        
        currentSession = { id: sessionId };
        
    } catch (error) {
        console.error('Error loading session:', error);
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
    const avatarConfig = sessionStorage.getItem('avatarConfig');
    
    // Parse avatar config if available
    let currentPlayerAvatar = '👑';
    try {
        if (avatarConfig) {
            const config = JSON.parse(avatarConfig);
            currentPlayerAvatar = config.emoji || '👑';
        }
    } catch (e) {
        console.log('Could not parse avatar config');
    }
    
    allPlayers = [
        { name: username || 'Player', avatar: currentPlayerAvatar, ready: false, isCurrentPlayer: true, score: 0 },
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

// Setup listener for admin starting the game
function setupGameStartListener() {
    // In a production app, this would listen to Supabase realtime
    // For now, we'll use a simple polling mechanism or allow admin to trigger
    // This can be triggered by admin dashboard or simulated with a button
    
    // Listen for custom event that admin dashboard might trigger
    window.addEventListener('gameStarted', () => {
        if (!gameStarted) {
            startGameCountdown();
        }
    });
    
    // For demo purposes, uncomment to auto-start after 15 seconds
    // setTimeout(() => {
    //     if (!gameStarted) {
    //         startGameCountdown();
    //     }
    // }, 15000);
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
}

function startQuiz() {
    currentQuestionIndex = 0;
    playerScore = 0;
    
    document.getElementById('lobby').style.display = 'none';
    document.getElementById('quizGame').style.display = 'flex';
    document.getElementById('finalResults').style.display = 'none';
    
    if (questions.length === 0) {
        showFinalResults();
        return;
    }
    
    loadQuestion();
}

function loadQuestion() {
    if (currentQuestionIndex >= questions.length) {
        showPodium();
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
                    showFeedback(false, false);
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
        // Update current player's score in allPlayers
        allPlayers[0].score = playerScore;
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
    
    // Show answer feedback
    const feedback = document.getElementById('answerFeedback');
    feedback.style.display = 'block';
    feedback.textContent = isCorrect ? 
        'Correct! +100 points!' : 
        'Oops! Better luck next time!';
    feedback.style.background = isCorrect ? '#4caf50' : '#f44336';
    
    // Save response
    try {
        const sessionId = sessionStorage.getItem('sessionId');
        const userId = sessionStorage.getItem('userId');
        const question_id = question.id;
        
        if (sessionId && userId) {
            await supabase
                .from('responses')
                .insert([
                    {
                        session_id: sessionId,
                        user_id: userId,
                        question_id: question_id,
                        selected_option: selectedIndex,
                        is_correct: isCorrect
                    }
                ]);
        }
    } catch (error) {
        console.error('Error saving response:', error);
    }
    
    // Move to next question with feedback
    setTimeout(() => {
        currentQuestionIndex++;
        showFeedback(isCorrect, true);
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
            // Show leaderboard between questions
            showBetweenQuestionsLeaderboard();
        }
    }, 3000);
}

// Show leaderboard after each question
function showBetweenQuestionsLeaderboard() {
    document.getElementById('quizGame').style.display = 'none';
    document.getElementById('leaderboard').style.display = 'flex';
    
    const leaderboardContainer = document.getElementById('betweenQuestionsLeaderboard');
    
    // Sort players by score
    const sortedPlayers = [...allPlayers].sort((a, b) => b.score - a.score);
    
    leaderboardContainer.innerHTML = sortedPlayers.map((player, index) => `
        <div class="leaderboard-item" style="${player.isCurrentPlayer ? 'background: linear-gradient(135deg, #ffd700, #fff4cc); border-left-color: #ffd700;' : ''}">
            <div style="display: flex; align-items: center; gap: 15px;">
                <span style="font-size: 20px;">${player.avatar}</span>
                <div>
                    <strong>${player.name}</strong>
                    <div style="font-size: 12px; color: rgba(255,255,255,0.7);">${player.isCurrentPlayer ? '(You)' : ''}</div>
                </div>
            </div>
            <div class="leaderboard-score">${player.score}</div>
        </div>
    `).join('');
}

// Move to next question
function nextQuestion() {
    document.getElementById('leaderboard').style.display = 'none';
    document.getElementById('quizGame').style.display = 'flex';
    loadQuestion();
}

// Show top 3 podium before full results
function showPodium() {
    document.getElementById('quizGame').style.display = 'none';
    document.getElementById('leaderboard').style.display = 'none';
    document.getElementById('finalResults').style.display = 'none';
    document.getElementById('podiumScreen').style.display = 'flex';
    
    // Simulate other players' final scores
    allPlayers.forEach((player, index) => {
        if (index > 0) {
            player.score = Math.floor(Math.random() * playerScore);
        }
    });
    
    // Sort players by score
    const rankedPlayers = [...allPlayers].sort((a, b) => b.score - a.score).slice(0, 3);
    
    const podium = document.getElementById('podiumContainer');
    
    // Ensure we have 3 positions even if fewer players
    const pos1 = rankedPlayers[0] || { name: 'Player 1', score: 0, avatar: '👑' };
    const pos2 = rankedPlayers[1] || { name: 'Player 2', score: 0, avatar: '💕' };
    const pos3 = rankedPlayers[2] || { name: 'Player 3', score: 0, avatar: '💖' };
    
    podium.innerHTML = `
        <div class="podium-position">
            <div class="podium-avatar">${pos2.avatar}</div>
            <div class="podium-name">${pos2.name}</div>
            <div class="podium-rank rank-2">2nd</div>
        </div>
        <div class="podium-position">
            <div class="podium-avatar">${pos1.avatar}</div>
            <div class="podium-name">${pos1.name}</div>
            <div class="podium-rank rank-1">🏆 1st</div>
        </div>
        <div class="podium-position">
            <div class="podium-avatar">${pos3.avatar}</div>
            <div class="podium-name">${pos3.name}</div>
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
    document.getElementById('leaderboard').style.display = 'none';
    document.getElementById('podiumScreen').style.display = 'none';
    document.getElementById('finalResults').style.display = 'flex';
    
    const finalLeaderboard = document.getElementById('finalLeaderboard');
    
    // Sort all players by score
    const finalRanking = [...allPlayers].sort((a, b) => b.score - a.score);
    
    finalLeaderboard.innerHTML = finalRanking.map((player, index) => `
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
}