/**
 * Charades Game Logic
 * Handles real-time game state, WebSockets, device orientation detection,
 * motion-based input, animations, and all screen transitions
 */

// =====================================================
// GLOBAL STATE
// =====================================================

let gameState = {
    gameCode: null,
    playerId: null,
    playerName: null,
    isSuperAdmin: false,
    isCurrentPlayer: false,
    score: 0,
    isReady: false,
    gameStatus: 'waiting', // waiting, in_progress, finished
    currentState: 'WAITING', // WAITING, WHEEL_SPINNING, PLAYER_SELECTED, PREPARING, PLAYING, ROUND_COMPLETE, GAME_FINISHED
    players: {},
    currentWord: null,
    timerEndTime: null,
    isPlaying: false
};

let ws = null;
let wheel = null;
let deviceOrientationListener = null;
let accelerometerListener = null;
let lastActionTime = 0;
const ACTION_COOLDOWN = 800; // ms between accepted actions

let gameStateInterval = null;

let timerInterval = null;
let countdownInterval = null;

// =====================================================
// INITIALIZATION
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    const sessionId = sessionStorage.getItem('sessionId');
    const joinCode = sessionStorage.getItem('joinCode');
    const username = sessionStorage.getItem('username');
    gameState.isSuperAdmin = sessionStorage.getItem('isSuperAdmin') === 'true';

    if (!sessionId || !joinCode || !username) {
        window.location.href = 'join-game.html';
        return;
    }

    gameState.gameCode = joinCode;
    gameState.playerName = username;

    // Display info
    document.getElementById('playerNameDisplay').textContent = username;
    document.getElementById('gameCodeDisplay').textContent = joinCode;

    // Initialize WebSocket connection
    initializeWebSocket();

    // Fetch current game state
    fetchGameState();

    // Set up event listeners
    setupEventListeners();
        // Show Super Admin "Next" button if applicable
        try {
            const isSuper = sessionStorage.getItem('isSuperAdmin') === 'true';
            const nextBtn = document.getElementById('superNextBtnCharades');
            if (isSuper && nextBtn) {
                nextBtn.style.display = 'block';
                nextBtn.addEventListener('click', superAdminNextCharades);
            }
        } catch (e) { console.warn('Unable to init super next button (charades)', e); }

    });

    // Advance through charades screens for Super Admin testing
    function superAdminNextCharades() {
        const state = gameState.currentState;
        switch (state) {
            case 'WAITING':
                showWheelScreen();
                break;
            case 'WHEEL_SPINNING':
                showPreparationScreen();
                break;
            case 'PREPARING':
                showGameplayScreen();
                break;
            case 'PLAYING':
                stopGameTimer();
                showWaitingRoom();
                break;
            case 'GAME_FINISHED':
                try { showPodiumScreen(); } catch (e) { showWaitingRoom(); }
                break;
            default:
                showWaitingRoom();
                break;
        }
    }

/**
 * Initialize WebSocket connection to backend
 */
function initializeWebSocket() {
    // Auto-detect protocol and host from current URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    
    // For development: use localhost:4000
    // For production: use same host as frontend
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const host = isDev ? 'localhost:4000' : window.location.host;
    
    const wsUrl = `${protocol}//${host}`;
    
    console.log(`Connecting to WebSocket at ${wsUrl}`);
    
    try {
        ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
            console.log('WebSocket connected');
            // Send initial join message
            ws.send(JSON.stringify({
                type: 'JOIN_GAME',
                payload: {
                    game_code: gameState.gameCode,
                    player_id: gameState.playerId,
                    player_name: gameState.playerName
                }
            }));
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                handleWebSocketMessage(data);
            } catch (err) {
                console.error('Error parsing WebSocket message:', err);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        ws.onclose = () => {
            console.log('WebSocket closed - attempting reconnect in 3 seconds');
            setTimeout(initializeWebSocket, 3000);
        };
    } catch (err) {
        console.error('Error initializing WebSocket:', err);
    }
}

/**
 * Handle incoming WebSocket messages
 */
function handleWebSocketMessage(data) {
    const { type, payload } = data;

    switch (type) {
        case 'CONNECTION_ESTABLISHED':
            console.log('Connection established for player:', payload.playerId);
            gameState.playerId = payload.playerId;
            break;
        case 'wheelScreen':
            showScreen('preparationScreen');
            break;
        case 'preparationScreen':
            showScreen('gameplayScreen');
            break;

        case 'PLAYER_SELECTED':
            handlePlayerSelected(payload);
            break;

        case 'PLAYER_PREPARING':
            handlePreparationStarted(payload);
            break;

        case 'GAME_PLAYING':
            handleGamePlayStarted(payload);
            break;

        case 'TIMER_TICK':
            updateTimerDisplay(payload.time_remaining_ms);
            break;

        case 'PLAYER_ACTION_RECORDED':
            handleActionRecorded(payload);
            break;

        case 'ROUND_COMPLETE':
            handleRoundComplete(payload);
            break;

        case 'GAME_FINISHED':
            handleGameFinished(payload);
            break;

        case 'SCORE_UPDATE':
            handleScoreUpdate(payload);
            break;

        case 'PONG':
            // Keep-alive response
            break;

        default:
            showScreen('waitingRoom');
    }
}

/**
 * Set up DOM event listeners
 */
function setupEventListeners() {
    // Ready button listener
    const readyBtn = document.getElementById('readyButton');
    if (readyBtn) {
        readyBtn.addEventListener('click', togglePlayerReady);
    }

    // Device orientation for preparation detection only
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        // iOS 13+ requires permission
        window.addEventListener('orientationchange', handleOrientationChange);
    } else {
        // Non-iOS or older iOS
        window.addEventListener('deviceorientation', handleDeviceOrientation);
    }

    // Accelerometer/gyroscope for tilt detection during gameplay
    if (typeof DeviceMotionEvent !== 'undefined') {
        window.addEventListener('devicemotion', handleDeviceMotion);
    }

    // Request permissions if needed
    requestDevicePermissions();
}

/**
 * Request device orientation and motion permissions (iOS 13+)
 */
async function requestDevicePermissions() {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
            const permission = await DeviceOrientationEvent.requestPermission();
            if (permission === 'granted') {
                window.addEventListener('deviceorientation', handleDeviceOrientation);
            }
        } catch (err) {
            console.warn('Device orientation permission denied:', err);
        }
    }

    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        try {
            const permission = await DeviceMotionEvent.requestPermission();
            if (permission === 'granted') {
                window.addEventListener('devicemotion', handleDeviceMotion);
            }
        } catch (err) {
            console.warn('Device motion permission denied:', err);
        }
    }
}

/**
 * Toggle player ready status
 */
async function togglePlayerReady() {
    try {
        const response = await fetch(`/charades/player/${gameState.playerId}/ready`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                game_code: gameState.gameCode,
                is_ready: !gameState.isReady
            })
        });

        const data = await response.json();
        if (data.success) {
            gameState.isReady = !gameState.isReady;
            updateReadyButton();
            updatePlayersList();
            
            // Check if all players are ready
            checkAllPlayersReady();
        }
    } catch (err) {
        console.error('Error toggling ready status:', err);
    }
}

/**
 * Update ready button appearance
 */
function updateReadyButton() {
    const btn = document.getElementById('readyButton');
    if (btn) {
        if (gameState.isReady) {
            btn.textContent = '✓ Ready!';
            btn.classList.add('ready');
        } else {
            btn.textContent = 'Ready to Play';
            btn.classList.remove('ready');
        }
    }
}

/**
 * Check if all players are ready and show admin start button if so
 */
function checkAllPlayersReady() {
    const players = Object.values(gameState.players);
    const allReady = players.length > 0 && players.every(p => p.is_ready);
    
    const adminControls = document.getElementById('adminControls');
    const startBtn = document.getElementById('startGameBtn');
    
    if (allReady && gameState.isSuperAdmin) {
        adminControls.classList.add('visible');
        startBtn.disabled = false;
    } else {
        adminControls.classList.remove('visible');
    }
}

/**
 * Start the charades game (admin only)
 */
async function startCharadesGame() {
    try {
        const startBtn = document.getElementById('startGameBtn');
        startBtn.disabled = true;
        startBtn.textContent = 'Starting...';

        const response = await fetch(`/charades/game/${gameState.gameCode}/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                admin_id: gameState.playerId
            })
        });

        const data = await response.json();
        if (data.success) {
            // Initiate wheel spin after a short delay
            setTimeout(() => spinTheWheel(), 500);
        } else {
            startBtn.disabled = false;
            startBtn.textContent = 'Start Game';
        }
    } catch (err) {
        console.error('Error starting game:', err);
        const startBtn = document.getElementById('startGameBtn');
        startBtn.disabled = false;
        startBtn.textContent = 'Start Game';
    }
}

/**
 * Trigger wheel spin
 */
async function spinTheWheel() {
    try {
        const response = await fetch(`/charades/game/${gameState.gameCode}/spin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                admin_id: gameState.playerId
            })
        });

        const data = await response.json();
        if (data.success) {
            showWheelScreen();
        }
    } catch (err) {
        console.error('Error spinning wheel:', err);
    }
}

// =====================================================
// SCREEN TRANSITIONS
// =====================================================

function hideAllScreens() {
    document.getElementById('waitingRoom').style.display = 'none';
    document.getElementById('wheelScreen').style.display = 'none';
    document.getElementById('preparationScreen').style.display = 'none';
    document.getElementById('otherPlayerWaitingScreen').style.display = 'none';
    document.getElementById('gameplayScreen').style.display = 'none';
    document.getElementById('leaderboardScreen').style.display = 'none';
    document.getElementById('podiumScreen').style.display = 'none';
    document.getElementById('emotionScreen').style.display = 'none';
}

function showWaitingRoom() {
    hideAllScreens();
    gameState.currentState = 'WAITING';
    stopAllIntervals();
    document.getElementById('waitingRoom').style.display = 'flex';
    updatePlayersList();
    
    // Poll for game state updates every 2 seconds in waiting room
    gameStateInterval = setInterval(() => {
        fetchGameState();
    }, 2000);
    
    // Initialize admin controls if user is super admin
    const adminControls = document.getElementById('adminControls');
    if (gameState.isSuperAdmin && adminControls) {
        checkAllPlayersReady();
    } else if (adminControls) {
        adminControls.classList.remove('visible');
    }
}

async function showWheelScreen() {
    hideAllScreens();
    gameState.currentState = 'WHEEL_SPINNING';
    document.getElementById('wheelScreen').style.display = 'flex';
    
    // Fetch and display players on wheel
    await fetchGameState();
    const playerList = Object.values(gameState.players).filter(p => !p.has_played);
    initializeWheel(playerList);
}

function showPreparationScreen() {
    hideAllScreens();
    gameState.currentState = 'PREPARING';
    gameState.isCurrentPlayer = true;
    document.getElementById('preparationScreen').style.display = 'flex';
    
    // Boost brightness and start countdown
    boostBrightness();
    startPreparationCountdown();
    startOrientationDetection();
}

function showOtherPlayerWaitingScreen() {
    hideAllScreens();
    document.getElementById('otherPlayerWaitingScreen').style.display = 'flex';
    gameState.isCurrentPlayer = false;
}

function showGameplayScreen() {
    hideAllScreens();
    gameState.currentState = 'PLAYING';
    gameState.isCurrentPlayer = true;
    gameState.isPlaying = true;
    document.getElementById('gameplayScreen').style.display = 'flex';
    document.getElementById('scoreTicker').style.display = 'block';
    
    // Start the 60-second timer
    startGameTimer();
}

async function showLeaderboardScreen() {
    hideAllScreens();
    gameState.currentState = 'GAME_FINISHED';
    
    // Check if 3+ players have played
    const playersWhoPlayed = Object.values(gameState.players).filter(p => p.has_played).length;
    
    if (playersWhoPlayed < 3) {
        // Return to waiting room if less than 3 players have played
        showWaitingRoom();
        return;
    }
    
    document.getElementById('leaderboardScreen').style.display = 'flex';
    stopGameTimer();
    
    // Fetch final results
    await fetchFinalResults();
}

// =====================================================
// GAME FLOW HANDLERS
// =====================================================

function handleGameStateUpdate(payload) {
    console.log('Game state update:', payload);

    // Update game status
    gameState.gameStatus = payload.game.status;

    // Update players list
    gameState.players = {};
    payload.players.forEach(player => {
        gameState.players[player.id] = player;
    });

    // Update UI based on status
    if (payload.game.status === 'waiting') {
        updatePlayersList();
        checkAllPlayersReady();
        showWaitingRoom();
    }
}

function startWheelAnimation(players) {
    console.log('Wheel spinning with players:', players);
    showWheelScreen();
}

function handlePlayerSelected(payload) {
    console.log('Player selected:', payload);
    
    // Highlight selected player and show transition
    const selectedPlayerId = payload.selected_player_id;
    
    if (gameState.playerId === selectedPlayerId) {
        // This is us - prepare for our turn
        setTimeout(() => showPreparationScreen(), 1000);
    } else {
        // Another player was selected
        setTimeout(() => showOtherPlayerWaitingScreen(), 1000);
    }
}

function handlePreparationStarted(payload) {
    console.log('Preparation started:', payload);
    
    if (payload.is_you) {
        showPreparationScreen();
    } else {
        showOtherPlayerWaitingScreen();
    }
}

function handleGamePlayStarted(payload) {
    console.log('Game playing started:', payload);
    
    if (payload.is_you) {
        gameState.currentWord = null; // Hidden from player
        showGameplayScreen();
    } else {
        // Show word to other players
        gameState.currentWord = payload.word;
        document.getElementById('wordDisplay').textContent = payload.word;
        document.getElementById('wordLabel').textContent = 'WORD TO ACT:';
        hideAllScreens();
        document.getElementById('gameplayScreen').style.display = 'flex';
        startGameTimer();
    }
}

function handleActionRecorded(payload) {
    console.log('Action recorded:', payload);
    
    // Update score if it's our action
    if (payload.player_id === gameState.playerId) {
        gameState.score = payload.new_score;
        document.getElementById('scoreValue').textContent = gameState.score;
    }
    
    // Update player score in state
    if (gameState.players[payload.player_id]) {
        gameState.players[payload.player_id].score = payload.new_score;
    }
}

function handleRoundComplete(payload) {
    console.log('Round complete:', payload);
    stopGameTimer();
    
    // Wait a moment then return to waiting room
    setTimeout(() => showWaitingRoom(), 2000);
}

async function handleGameFinished(payload) {
    console.log('Game finished:', payload);
    stopGameTimer();
    
    // Check if 3+ players have played
    const playersWhoPlayed = Object.values(gameState.players).filter(p => p.has_played).length;
    
    // If less than 3 players have played, go back to waiting room instead of leaderboard
    if (playersWhoPlayed < 3) {
        setTimeout(() => showWaitingRoom(), 2000);
        return;
    }
    
    // Show leaderboard first
    await showLeaderboardScreen();
    
    // After delay, show podium
    setTimeout(() => showPodiumScreen(payload.podium), 3000);
    
    // After another delay, show emotion screen
    setTimeout(() => showEmotionScreen(), 7000);
}

function handleScoreUpdate(payload) {
    if (payload.player_id === gameState.playerId) {
        gameState.score = payload.score;
        document.getElementById('scoreValue').textContent = payload.score;
    }
}

// =====================================================
// WHEEL ANIMATION
// =====================================================

function initializeWheel(players) {
    const canvas = document.getElementById('wheelCanvas');
    const ctx = canvas.getContext('2d');

    const colors = [
        '#ff69b4', '#ff1493', '#ffb6d9', '#ffc0cb',
        '#7b2cff', '#c77dff', '#e0aaff', '#d5c4ff'
    ];

    const segmentCount = players.length;
    const segmentAngle = (2 * Math.PI) / segmentCount;

    // Draw wheel
    function drawWheel(rotation = 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(rotation);

        for (let i = 0; i < segmentCount; i++) {
            // Draw segment
            ctx.beginPath();
            ctx.arc(0, 0, 140, i * segmentAngle, (i + 1) * segmentAngle);
            ctx.lineTo(0, 0);
            ctx.fillStyle = colors[i % colors.length];
            ctx.fill();

            // Draw border
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw text
            ctx.save();
            ctx.rotate(i * segmentAngle + segmentAngle / 2);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px Arial';
            ctx.fillText(players[i].name, 120, 6);
            ctx.restore();
        }

        // Draw center circle
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, 2 * Math.PI);
        ctx.fillStyle = '#120018';
        ctx.fill();
        ctx.strokeStyle = '#ff69b4';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.restore();
    }

    // Animate wheel spin
    let rotation = 0;
    const spinDuration = 4000; // 4 seconds
    const spinStartTime = Date.now();

    function animateSpin() {
        const elapsed = Date.now() - spinStartTime;
        const progress = Math.min(elapsed / spinDuration, 1);

        // Spin with easing (ease-out)
        rotation = (progress * progress * 20 * Math.PI) * (1 - progress * 0.3);

        drawWheel(rotation);

        if (progress < 1) {
            requestAnimationFrame(animateSpin);
        } else {
            // Spin complete - highlight selected player
            setTimeout(() => {
                showWaitingRoom();
            }, 1500);
        }
    }

    drawWheel(0);
    animateSpin();
}

// =====================================================
// PREPARATION MODE (Orientation Detection)
// =====================================================

function startOrientationDetection() {
    let beta = 0;
    
    const handleDeviceOrientation = (event) => {
        beta = event.beta; // Tilt front-to-back (-180 to 180)
        
        // Update gauge display
        const gaugeElement = document.getElementById('gaugeIndicator');
        const normalizedBeta = (beta + 180) / 360 * 100; // Convert to 0-100%
        gaugeElement.style.width = normalizedBeta + '%';
        
        // Check if in neutral forehead range (-15° to +15°)
        const isInRange = Math.abs(beta) <= 15;
        
        const tiltStatus = document.getElementById('tiltStatus');
        if (isInRange) {
            tiltStatus.textContent = '✓ Perfect! Hold this position...';
            tiltStatus.style.color = '#4caf50';
            
            // Auto-confirm after 2 seconds of holding
            setTimeout(() => {
                if (Math.abs(beta) <= 15) {
                    confirmPreparationReady();
                }
            }, 2000);
        } else {
            tiltStatus.textContent = beta > 15 ? '↑ Tilt down to forehead' : '↓ Tilt up to forehead';
            tiltStatus.style.color = 'rgba(255, 255, 255, 0.8)';
        }
    };

    // Try to use DeviceOrientationEvent with permission
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
            .then(permissionState => {
                if (permissionState === 'granted') {
                    window.addEventListener('deviceorientation', handleDeviceOrientation);
                }
            })
            .catch(console.error);
    } else {
        // Non-iOS or older iOS
        window.addEventListener('deviceorientation', handleDeviceOrientation);
    }
}

function confirmPreparationReady() {
    document.getElementById('prepStatus').classList.add('success');
    
    // Send confirmation to backend
    submitPreparationReady();
}

async function submitPreparationReady() {
    try {
        const response = await fetch(`/charades/player/${gameState.playerId}/preparation-ready`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ game_code: gameState.gameCode })
        });

        const data = await response.json();
        if (data.success) {
            console.log('Preparation confirmed');
            // Transition to gameplay handled by WebSocket message
        }
    } catch (err) {
        console.error('Error submitting preparation:', err);
    }
}

function startPreparationCountdown() {
    let count = 5;
    const display = document.getElementById('countdownDisplay');
    
    countdownInterval = setInterval(() => {
        display.textContent = count;
        count--;
        
        if (count < 0) {
            clearInterval(countdownInterval);
        }
    }, 1000);
}

function boostBrightness() {
    // Visual brightness boost
    const boost = document.createElement('div');
    boost.className = 'brightness-boost';
    document.body.appendChild(boost);
    
    setTimeout(() => boost.remove(), 500);
    
    // If available, try to boost screen brightness via API
    if (typeof screen !== 'undefined' && typeof screen.lockOrientationUniversal !== 'undefined') {
        try {
            screen.lockOrientationUniversal = 'portrait';
        } catch (err) {
            // Not all devices support this
        }
    }
}

// =====================================================
// GAMEPLAY (Tilt Input Detection)
// =====================================================

let startBeta = null;

function handleDeviceOrientation(event) {
    if (gameState.currentState === 'PREPARING') {
        // Handled by orientation detection
        return;
    }

    screen.style.display = 'flex';
    gameState.currentScreen = screenName;

    // 🔑 ALWAYS restore admin UI after transitions
    updateSuperAdminButton();
}

/****************************
 * INITIALIZATION
 ****************************/
function initGame() {
    if (superNextBtn && gameState.isSuperAdmin) {
        superNextBtn.addEventListener('click', superAdminNextCharades);
    }

    updateSuperAdminButton();
    showScreen('waitingRoom');
}

document.addEventListener('DOMContentLoaded', initGame);

/****************************
 * WAIT ROOM – PLAYER LIST
 ****************************/
async function loadPlayersList() {
    try {
        const response = await fetch(`/charades/player/${gameState.playerId}/action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: action,
                game_code: gameState.gameCode
            })
        });

        const data = await response.json();
        if (data.success) {
            // Visual feedback
            const actionElement = action === 'correct' ? 
                document.getElementById('correctAction') : 
                document.getElementById('wrongAction');
            
            actionElement.classList.add('active');
            setTimeout(() => actionElement.classList.remove('active'), 200);
        }
    } catch (err) {
        console.error('Error submitting action:', err);
    }
}

// =====================================================
// TIMER MANAGEMENT
// =====================================================

function startGameTimer() {
    gameState.timerEndTime = Date.now() + 60000; // 60 seconds
    
    timerInterval = setInterval(() => {
        const remaining = Math.max(0, gameState.timerEndTime - Date.now());
        const seconds = Math.ceil(remaining / 1000);
        
        document.getElementById('timerText').textContent = seconds;
        
        // Update timer circle CSS variable
        const percent = (seconds / 60) * 100;
        document.querySelector('.timer-circle').style.setProperty('--timer-percent', `${percent}%`);
        
        if (seconds === 0) {
            stopGameTimer();
            endRound();
        }
    }, 100);
}

function stopGameTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    gameState.isPlaying = false;
}

function stopAllIntervals() {
    stopGameTimer();
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    if (gameStateInterval) {
        clearInterval(gameStateInterval);
        gameStateInterval = null;
    }
}

function updateTimerDisplay(timeRemaining) {
    const seconds = Math.ceil(timeRemaining / 1000);
    document.getElementById('timerText').textContent = seconds;
}

// =====================================================
// PODIUM SCREEN (Character Avatars)
// =====================================================

async function showPodiumScreen(podiumData) {
    hideAllScreens();
    document.getElementById('podiumScreen').style.display = 'flex';
    
    // Get top 3 players from podiumData or gameState
    const rankedPlayers = podiumData || 
        Object.values(gameState.players)
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);
    
    // Ensure we have 3 positions even if fewer players
    const positions = [
        rankedPlayers[0] || { name: 'Player 1', score: 0, avatar_id: '1' },
        rankedPlayers[1] || { name: 'Player 2', score: 0, avatar_id: '2' },
        rankedPlayers[2] || { name: 'Player 3', score: 0, avatar_id: '3' }
    ];
    
    const podiumStage = document.getElementById('podiumStage');
    podiumStage.innerHTML = `
        <div class="podium-position rank-2">
            <div class="podium-rank-box">
                <div class="podium-medal">🥈</div>
                <div class="podium-avatar-large">${createCharacterDisplay(positions[1].avatar_id)}</div>
                <div class="podium-name">${positions[1].name}</div>
                <div class="podium-score">${positions[1].score} pts</div>
            </div>
        </div>
        <div class="podium-position rank-1">
            <div class="podium-rank-box">
                <div class="podium-medal">🏆</div>
                <div class="podium-avatar-large">${createCharacterDisplay(positions[0].avatar_id)}</div>
                <div class="podium-name">${positions[0].name}</div>
                <div class="podium-score">${positions[0].score} pts</div>
            </div>
        </div>
        <div class="podium-position rank-3">
            <div class="podium-rank-box">
                <div class="podium-medal">🥉</div>
                <div class="podium-avatar-large">${createCharacterDisplay(positions[2].avatar_id)}</div>
                <div class="podium-name">${positions[2].name}</div>
                <div class="podium-score">${positions[2].score} pts</div>
            </div>
        </div>
    `;
}

function createCharacterDisplay(avatarId) {
    // Return emoji avatar for now (can be upgraded to SVG character later)
    const emojiMap = {
        '1': '😊', '2': '😍', '3': '😎', '4': '🤩', '5': '😘',
        '6': '🥰', '7': '😌', '8': '🤔', '9': '😄', '10': '🤣',
        '11': '😻', '12': '🐶', '13': '🐱', '14': '🦁', '15': '🐯',
        '16': '🦄', '17': '🌟', '18': '💫', '19': '✨', '20': '🎀'
    };
    return emojiMap[avatarId] || '😊';
}

// =====================================================
// EMOTION SCREEN
// =====================================================

function showEmotionScreen() {
    hideAllScreens();
    document.getElementById('emotionScreen').style.display = 'flex';
    
    // Get player's current score
    const playerScore = gameState.score || 0;
    const maxScore = 500; // Assume max possible score is around 500
    const percentage = (playerScore / maxScore) * 100;
    
    // Determine emotion and message based on score
    let emotion = '😊';
    let message = 'Nice try!';
    let caption = '';
    
    if (percentage >= 80) {
        emotion = '🏆';
        message = 'You were AMAZING!';
        caption = 'Top tier performance!';
    } else if (percentage >= 60) {
        emotion = '🎉';
        message = 'Great job!';
        caption = 'You did awesome!';
    } else if (percentage >= 40) {
        emotion = '😊';
        message = 'Good effort!';
        caption = 'You got some great guesses in!';
    } else {
        emotion = '💪';
        message = 'Keep practicing!';
        caption = 'You\'ll get better next time!';
    }
    
    document.getElementById('emotionFace').textContent = emotion;
    document.getElementById('emotionMessage').textContent = message;
    document.getElementById('emotionCaption').textContent = caption;
    
    // Return to waiting room after 4 seconds
    setTimeout(() => showWaitingRoom(), 4000);
}

// =====================================================
// FINAL SCREENS
// =====================================================

async function fetchFinalResults() {
    try {
        const response = await fetch(`/charades/game/${gameState.gameCode}/final-results`);
        const data = await response.json();

        if (!data.success) {
            console.error('Failed to fetch results:', data.error);
            return;
        }

        // Render leaderboard
        const leaderboardList = document.getElementById('leaderboardList');
        const sortedPlayers = Object.values(gameState.players)
            .sort((a, b) => b.score - a.score);
        
        leaderboardList.innerHTML = sortedPlayers.map((player, index) => `
            <div class="leaderboard-item">
                <div class="leaderboard-rank">${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}</div>
                <div class="leaderboard-avatar">${createCharacterDisplay(player.avatar_id)}</div>
                <div class="leaderboard-info">
                    <div class="leaderboard-name">${player.name}</div>
                </div>
                <div class="leaderboard-score">${player.score}</div>
            </div>
        `).join('');

    } catch (err) {
        console.error('fetchFinalResults failed:', err);
    }
}

// =====================================================
// UI HELPERS
// =====================================================

function updatePlayersList() {
    const playersList = document.getElementById('playersReadyList');
    const players = Object.values(gameState.players);
    const readyCount = players.filter(p => p.is_ready).length;

    document.getElementById('playerReadyCount').textContent = readyCount;

    playersList.innerHTML = players.map(player => `
        <div class="player-avatar-item${player.id === gameState.playerId ? ' active' : ''}">
            <div class="mini-avatar">${getAvatarEmoji(player.avatar_id)}</div>
            <div class="player-name-small">${player.name}</div>
            <div class="player-status">${player.is_ready ? '✓ Ready' : 'Waiting'}</div>
            ${player.is_ready ? '<div class="pulse-indicator"></div>' : ''}
        </div>
    `).join('');
}

function getAvatarEmoji(avatarId) {
    // Map avatar IDs to emojis
    const emojiMap = {
        '1': '😊', '2': '😍', '3': '😎', '4': '🤩', '5': '😘',
        '6': '🥰', '7': '😌', '8': '🤔', '9': '😄', '10': '🤣',
        '11': '😻', '12': '🐶', '13': '🐱', '14': '🦁', '15': '🐯',
        '16': '🦄', '17': '🌟', '18': '💫', '19': '✨', '20': '🎀'
    };

    return emojiMap[avatarId] || '😊';
}

async function endRound() {
    try {
        const response = await fetch(`/charades/game/${gameState.gameCode}/round-end`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admin_id: gameState.playerId })
        });

        const data = await response.json();
        if (data.all_played) {
            // Game is finished - check if 3+ players have played
            const playersWhoPlayed = Object.values(gameState.players).filter(p => p.has_played).length;
            
            if (playersWhoPlayed >= 3) {
                // Show leaderboard
                showLeaderboardScreen();
            } else {
                // Less than 3 players, return to waiting room
                showWaitingRoom();
            }
        } else {
            // Return to waiting room
            showWaitingRoom();
        }
    } catch (err) {
        console.error('Error ending round:', err);
    }
}
