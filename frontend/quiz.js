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
let currentPlayerAvatarConfig = null;

// Create Bratz Doll SVG with variations
function createBratzDollSVG(dollId, avatarCfg, isMain) {
    const size = isMain ? 280 : 100;
    const color = avatarCfg.vibeColor || '#ff69b4';
    const brightness = `brightness(${avatarCfg.brightness || 100}%)`;
    
    const skinTones = ['#ffd6cc', '#f4c2a5', '#d9a574', '#c68553', '#8d5524', '#5c3a21'];
    const hairColors = ['#2c1810', '#8b4513', '#d4a574', '#ff6b9d', '#6a4c93', '#000000'];
    
    const dollIndex = (dollId - 1) % 20;
    const skin = skinTones[dollIndex % skinTones.length];
    const hair = hairColors[dollIndex % hairColors.length];
    const hairStyle = dollIndex % 5;
    const outfitStyle = dollIndex % 4;
    
    let svg = `<svg class="bratz-doll" width="${size}" height="${size}" viewBox="0 0 200 280" style="filter: ${brightness}">`;
    
    // Shadow
    svg += `<ellipse cx="100" cy="260" rx="45" ry="12" fill="#00000010"/>`;
    
    // Outfit variations
    if (outfitStyle === 0) {
        svg += `<path d="M70 140 Q50 180 55 250 L85 250 L85 210 L90 250 L110 250 L110 210 L115 250 L145 250 Q150 180 130 140 Z" fill="${color}"/>`;
        svg += `<circle cx="85" cy="175" r="3" fill="#fff" opacity="0.5"/>`;
        svg += `<circle cx="115" cy="175" r="3" fill="#fff" opacity="0.5"/>`;
    } else if (outfitStyle === 1) {
        svg += `<rect x="75" y="140" width="50" height="45" rx="8" fill="${color}"/>`;
        svg += `<path d="M75 185 L75 250 L95 250 L95 185 Z" fill="#4a5568"/>`;
        svg += `<path d="M105 185 L105 250 L125 250 L125 185 Z" fill="#4a5568"/>`;
    } else if (outfitStyle === 2) {
        svg += `<rect x="70" y="140" width="60" height="50" rx="10" fill="${color}"/>`;
        svg += `<path d="M70 190 L70 250 L130 250 L130 190 Z" fill="${color}" opacity="0.8"/>`;
        svg += `<line x1="100" y1="190" x2="100" y2="250" stroke="#fff" stroke-width="2"/>`;
    } else {
        svg += `<path d="M75 140 Q60 160 55 185 Q50 220 55 250 L85 250 Q82 220 85 185 L90 250 L110 250 L115 185 Q118 220 115 250 L145 250 Q150 220 145 185 Q140 160 125 140 Z" fill="${color}"/>`;
        svg += `<path d="M75 140 Q100 150 125 140" stroke="#fff" stroke-width="2" fill="none" opacity="0.5"/>`;
    }
    
    // Arms
    svg += `<path d="M70 140 Q60 150 55 170" stroke="${skin}" stroke-width="8" fill="none" stroke-linecap="round"/>`;
    svg += `<path d="M130 140 Q140 150 145 170" stroke="${skin}" stroke-width="8" fill="none" stroke-linecap="round"/>`;
    
    // Neck
    svg += `<rect x="90" y="110" width="20" height="30" fill="${skin}"/>`;
    
    // Face
    svg += `<circle cx="100" cy="80" r="38" fill="${skin}"/>`;
    
    // Hair variations
    if (hairStyle === 0) {
        svg += `<path d="M62 50 Q55 35 65 22 Q100 8 135 22 Q145 35 138 50 Z" fill="${hair}"/>`;
        svg += `<path d="M62 50 Q45 75 48 105 Q50 120 60 125 Q100 135 140 125 Q150 120 152 105 Q155 75 138 50 Z" fill="${hair}"/>`;
        svg += `<path d="M60 80 Q55 95 60 110" stroke="${hair}" stroke-width="2" fill="none" opacity="0.5"/>`;
        svg += `<path d="M140 80 Q145 95 140 110" stroke="${hair}" stroke-width="2" fill="none" opacity="0.5"/>`;
    } else if (hairStyle === 1) {
        svg += `<path d="M62 58 Q55 45 70 32 Q100 25 130 32 Q145 45 138 58 Q140 88 100 98 Q60 88 62 58 Z" fill="${hair}"/>`;
        svg += `<path d="M70 70 Q75 80 70 90" stroke="${hair}" stroke-width="1.5" fill="none" opacity="0.3"/>`;
        svg += `<path d="M130 70 Q125 80 130 90" stroke="${hair}" stroke-width="1.5" fill="none" opacity="0.3"/>`;
    } else if (hairStyle === 2) {
        svg += `<ellipse cx="145" cy="55" rx="28" ry="55" fill="${hair}"/>`;
        svg += `<circle cx="145" cy="35" r="18" fill="${hair}"/>`;
        svg += `<path d="M65 52 Q100 38 135 52 L135 75 Q100 88 65 75 Z" fill="${hair}"/>`;
        svg += `<circle cx="135" cy="52" r="8" fill="${color}" opacity="0.8"/>`;
    } else if (hairStyle === 3) {
        svg += `<circle cx="68" cy="58" r="22" fill="${hair}"/>`;
        svg += `<circle cx="78" cy="42" r="20" fill="${hair}"/>`;
        svg += `<circle cx="100" cy="35" r="24" fill="${hair}"/>`;
        svg += `<circle cx="122" cy="42" r="20" fill="${hair}"/>`;
        svg += `<circle cx="132" cy="58" r="22" fill="${hair}"/>`;
        svg += `<circle cx="85" cy="55" r="18" fill="${hair}"/>`;
        svg += `<circle cx="115" cy="55" r="18" fill="${hair}"/>`;
    } else {
        svg += `<circle cx="100" cy="35" r="28" fill="${hair}"/>`;
        svg += `<ellipse cx="100" cy="35" rx="32" ry="25" fill="${hair}" opacity="0.7"/>`;
        svg += `<path d="M65 52 Q100 42 135 52" fill="${hair}"/>`;
        svg += `<circle cx="100" cy="35" r="6" fill="${color}" opacity="0.6"/>`;
    }
    
    // Face features - Eyes
    svg += `<ellipse cx="82" cy="78" rx="6" ry="8" fill="#fff"/>`;
    svg += `<ellipse cx="118" cy="78" rx="6" ry="8" fill="#fff"/>`;
    svg += `<circle cx="82" cy="80" r="5" fill="#000"/>`;
    svg += `<circle cx="118" cy="80" r="5" fill="#000"/>`;
    svg += `<circle cx="80" cy="77" r="2" fill="#fff"/>`;
    svg += `<circle cx="116" cy="77" r="2" fill="#fff"/>`;
    
    // Eyebrows
    svg += `<path d="M70 65 Q80 62 90 65" stroke="#000" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
    svg += `<path d="M110 65 Q120 62 130 65" stroke="#000" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
    
    // Eyelashes
    svg += `<path d="M76 75 Q74 72 76 70" stroke="#000" stroke-width="1" fill="none"/>`;
    svg += `<path d="M88 75 Q90 72 88 70" stroke="#000" stroke-width="1" fill="none"/>`;
    svg += `<path d="M112 75 Q110 72 112 70" stroke="#000" stroke-width="1" fill="none"/>`;
    svg += `<path d="M124 75 Q126 72 124 70" stroke="#000" stroke-width="1" fill="none"/>`;
    
    // Blush
    svg += `<ellipse cx="70" cy="88" rx="8" ry="5" fill="#ff69b4" opacity="0.3"/>`;
    svg += `<ellipse cx="130" cy="88" rx="8" ry="5" fill="#ff69b4" opacity="0.3"/>`;
    
    // Nose
    svg += `<path d="M98 85 Q100 90 102 85" stroke="#000" stroke-width="1" fill="none" opacity="0.3"/>`;
    
    // Lips
    svg += `<path d="M85 98 Q100 105 115 98" stroke="#ff69b4" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    svg += `<path d="M85 98 Q100 102 115 98" fill="#ff1493" opacity="0.3"/>`;
    
    // Accessories based on doll ID
    if (dollIndex % 7 === 0) {
        svg += `<path d="M80 40 L85 30 L90 40 L95 28 L100 40 L105 28 L110 40 L115 30 L120 40 L100 45 Z" fill="#ffd700"/>`;
        svg += `<circle cx="100" cy="32" r="3" fill="#ff1493"/>`;
    } else if (dollIndex % 7 === 1) {
        svg += `<path d="M95 38 Q90 35 90 40 Q90 45 95 42 Z" fill="${color}"/>`;
        svg += `<path d="M105 38 Q110 35 110 40 Q110 45 105 42 Z" fill="${color}"/>`;
        svg += `<circle cx="100" cy="40" r="3" fill="${color}"/>`;
    } else if (dollIndex % 7 === 2) {
        svg += `<ellipse cx="100" cy="50" rx="42" ry="8" fill="${color}" opacity="0.8"/>`;
        svg += `<circle cx="100" cy="50" r="4" fill="#fff" opacity="0.8"/>`;
    } else if (dollIndex % 7 === 3) {
        svg += `<circle cx="82" cy="78" r="10" stroke="#000" stroke-width="2" fill="none" opacity="0.6"/>`;
        svg += `<circle cx="118" cy="78" r="10" stroke="#000" stroke-width="2" fill="none" opacity="0.6"/>`;
        svg += `<line x1="92" y1="78" x2="108" y2="78" stroke="#000" stroke-width="2" opacity="0.6"/>`;
    } else if (dollIndex % 7 === 4) {
        svg += `<circle cx="62" cy="95" r="4" fill="#ffd700"/>`;
        svg += `<circle cx="138" cy="95" r="4" fill="#ffd700"/>`;
    } else if (dollIndex % 7 === 5) {
        svg += `<path d="M85 110 Q100 115 115 110" stroke="#ffd700" stroke-width="2" fill="none"/>`;
        svg += `<circle cx="100" cy="115" r="3" fill="#ff1493"/>`;
    }
    
    svg += `</svg>`;
    
    return svg;
}

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
    const sessionId = sessionStorage.getItem('sessionId');
    const username = sessionStorage.getItem('username');
    const selectedAvatarImage = sessionStorage.getItem('selectedAvatarImage');
    const selectedAvatarId = sessionStorage.getItem('selectedAvatarId');

    // Try to load players from database
    try {
        const { data: players, error } = await supabase
            .from('players')
            .select('*')
            .eq('session_id', sessionId)
            .order('joined_at', { ascending: true });

        if (!error && players && players.length > 0) {
            // Map database players to allPlayers format with avatar images
            allPlayers = players.map((player, index) => ({
                name: player.username,
                avatarImage: player.avatar_image,
                avatarId: player.avatar_id,
                ready: player.status === 'ready' || false,
                isCurrentPlayer: player.username === username,
                score: player.score || 0,
                id: player.id
            }));
        }
    } catch (err) {
        console.log('Could not load players from database:', err);
    }

    // Fallback: if no players loaded from database, use local data
    if (!allPlayers || allPlayers.length === 0) {
        const currentPlayerAvatarCfg = {
            dollId: 1,
            vibeColor: '#ff69b4',
            brightness: 100,
            emoji: '👑'
        };
        
        allPlayers = [
            { 
                name: username || 'Player', 
                avatarImage: selectedAvatarImage,
                avatarId: selectedAvatarId,
                avatarConfig: currentPlayerAvatarCfg, 
                ready: false, 
                isCurrentPlayer: true, 
                score: 0 
            },
            { 
                name: 'Alex', 
                avatarImage: null,
                avatarConfig: { dollId: 2, vibeColor: '#da70d6', brightness: 100, emoji: '💕' }, 
                ready: false, 
                isCurrentPlayer: false, 
                score: 0 
            },
            { 
                name: 'Jordan', 
                avatarImage: null,
                avatarConfig: { dollId: 3, vibeColor: '#ffd700', brightness: 100, emoji: '💖' }, 
                ready: false, 
                isCurrentPlayer: false, 
                score: 0 
            },
            { 
                name: 'Casey', 
                avatarImage: null,
                avatarConfig: { dollId: 4, vibeColor: '#87ceeb', brightness: 100, emoji: '✨' }, 
                ready: false, 
                isCurrentPlayer: false, 
                score: 0 
            }
        ];
    }
    
    renderLobbyPlayers();
}

function renderLobbyPlayers() {
    const container = document.getElementById('lobbyPlayers');
    if (!container) return;
    
    container.innerHTML = allPlayers.map((player, index) => {
        // Use avatar image if available, otherwise fall back to SVG
        let avatarHtml = '';
        if (player.avatarImage) {
            avatarHtml = `<img src="${player.avatarImage}" alt="${player.name}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
        } else if (player.avatarConfig) {
            const avatarSVG = createBratzDollSVG(player.avatarConfig.dollId, player.avatarConfig, false);
            avatarHtml = avatarSVG;
        } else {
            avatarHtml = player.name?.charAt(0).toUpperCase() || '?';
        }
        
        return `
        <div class="player-card ${player.ready ? 'ready' : ''}" data-index="${index}">
            <div class="player-avatar-mini">${avatarHtml}</div>
            <div class="player-name">${player.name}</div>
            <div class="ready-badge">✓</div>
        </div>
    `;
    }).join('');
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
    
    // Show quiz header with progress bar
    const quizHeader = document.getElementById('quizHeader');
    if (quizHeader) {
        quizHeader.style.display = 'block';
    }
    
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
    
    // Explicitly update progress bar
    updateQuizProgress(currentQuestionIndex + 1, questions.length);
    
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
    const avatarContainer = document.getElementById('feedbackAvatarContainer');
    const avatarImage = document.getElementById('feedbackAvatarImage');
    const avatarExpression = document.getElementById('feedbackAvatarExpression');
    
    // Display user's avatar SVG
    if (currentPlayerAvatarConfig) {
        const avatarSVG = createBratzDollSVG(currentPlayerAvatarConfig.dollId, currentPlayerAvatarConfig, true);
        // Create a container for the SVG
        const svgContainer = document.createElement('div');
        svgContainer.innerHTML = avatarSVG;
        svgContainer.style.width = '150px';
        svgContainer.style.height = '150px';
        svgContainer.style.display = 'flex';
        svgContainer.style.alignItems = 'center';
        svgContainer.style.justifyContent = 'center';
        
        // Clear existing content and add SVG
        avatarContainer.innerHTML = '';
        avatarContainer.appendChild(svgContainer);
    }
    
    // Clear expression image (for PNG overlays if needed in future)
    avatarExpression.src = '';
    avatarExpression.style.display = 'none';
    
    if (isCorrect) {
        expression.textContent = '😊';
        message.textContent = correctMessages[Math.floor(Math.random() * correctMessages.length)];
        // TODO: Add happy avatar PNG if you have: avatarExpression.src = 'assets/avatar-happy.png'; avatarExpression.style.display = 'block';
    } else if (!answered) {
        expression.textContent = '😅';
        message.textContent = 'Time ran out! Next one!';
    } else {
        expression.textContent = '😢';
        message.textContent = incorrectMessages[Math.floor(Math.random() * incorrectMessages.length)];
        // TODO: Add sad avatar PNG if you have: avatarExpression.src = 'assets/avatar-sad.png'; avatarExpression.style.display = 'block';
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
    
    leaderboardContainer.innerHTML = sortedPlayers.map((player, index) => {
        const avatarSVG = createBratzDollSVG(player.avatarConfig.dollId, player.avatarConfig, false);
        return `
        <div class="leaderboard-item" style="${player.isCurrentPlayer ? 'background: linear-gradient(135deg, #ffd700, #fff4cc); border-left-color: #ffd700;' : ''}">
            <div style="display: flex; align-items: center; gap: 15px;">
                <div style="width: 50px; height: 50px; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #ff69b4, #7b2cff); flex-shrink: 0;">
                    ${avatarSVG}
                </div>
                <div>
                    <strong>${player.name}</strong>
                    <div style="font-size: 12px; color: rgba(255,255,255,0.7);">${player.isCurrentPlayer ? '(You)' : ''}</div>
                </div>
            </div>
            <div class="leaderboard-score">${player.score}</div>
        </div>
    `;
    }).join('');
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
    const pos1 = rankedPlayers[0] || { name: 'Player 1', score: 0, avatarImage: null };
    const pos2 = rankedPlayers[1] || { name: 'Player 2', score: 0, avatarImage: null };
    const pos3 = rankedPlayers[2] || { name: 'Player 3', score: 0, avatarImage: null };
    
    // Create avatar HTML for each position
    const createAvatarHtml = (player) => {
        if (player.avatarImage) {
            return `<img src="${player.avatarImage}" alt="${player.name}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
        } else if (player.avatarConfig) {
            return createBratzDollSVG(player.avatarConfig.dollId, player.avatarConfig, false);
        } else {
            return player.name?.charAt(0).toUpperCase() || '?';
        }
    };
    
    const pos1Avatar = createAvatarHtml(pos1);
    const pos2Avatar = createAvatarHtml(pos2);
    const pos3Avatar = createAvatarHtml(pos3);
    
    podium.innerHTML = `
        <div class="podium-position">
            <div class="podium-avatar">${pos2Avatar}</div>
            <div class="podium-name">${pos2.name}</div>
            <div class="podium-rank rank-2">2nd</div>
        </div>
        <div class="podium-position">
            <div class="podium-avatar">${pos1Avatar}</div>
            <div class="podium-name">${pos1.name}</div>
            <div class="podium-rank rank-1">🏆 1st</div>
        </div>
        <div class="podium-position">
            <div class="podium-avatar">${pos3Avatar}</div>
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
    
    finalLeaderboard.innerHTML = finalRanking.map((player, index) => {
        // Create avatar HTML
        let avatarHtml = '';
        if (player.avatarImage) {
            avatarHtml = `<img src="${player.avatarImage}" alt="${player.name}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
        } else if (player.avatarConfig) {
            avatarHtml = createBratzDollSVG(player.avatarConfig.dollId, player.avatarConfig, false);
        } else {
            avatarHtml = player.name?.charAt(0).toUpperCase() || '?';
        }
        
        return `
        <div class="leaderboard-item" style="${index === 0 ? 'background: linear-gradient(135deg, #ffd700, #fff4cc); border-left-color: #ffd700;' : ''}">
            <div style="display: flex; align-items: center; gap: 15px;">
                <div style="width: 50px; height: 50px; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #ff69b4, #7b2cff); flex-shrink: 0;">
                    ${avatarHtml}
                </div>
                <div>
                    <strong>${player.name}</strong>
                    <div style="font-size: 12px; color: rgba(255,255,255,0.7);">${index === 0 ? '🏆 Winner!' : ''}</div>
                </div>
            </div>
            <div class="leaderboard-score">${player.score}</div>
        </div>
    `;
    }).join('');
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