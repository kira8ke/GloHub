// Admin Dashboard Logic with Super Admin Support & Game Control

let currentClientId = null;
let currentTheme = {};
let currentGameSession = null;

// Utility to prefer sessionStorage, then localStorage
function getStoredItem(key) {
    try {
        return sessionStorage.getItem(key) || localStorage.getItem(key) || null;
    } catch (e) {
        // If storage access is blocked, return null
        console.warn('Storage access failed for', key, e);
        return null;
    }
}
let playerCheckInterval = null;
let gameDurationInterval = null;
let gameStartTime = null;

// ==========================================
// SUPER ADMIN FUNCTIONS
// ==========================================
function isSuperAdmin() {
    return getStoredItem('isSuperAdmin') === 'true';
}

function getSuperAdminInfo() {
    return {
        isSuperAdmin: isSuperAdmin(),
        superAdminCode: getStoredItem('superAdminCode'),
        superAdminId: getStoredItem('superAdminId'),
        superAdminName: getStoredItem('superAdminName') || 'Super Admin'
    };
}

// ==========================================
// AUTHENTICATION CHECK
// ==========================================
function checkAuth() {
    console.log('🔍 Checking authentication...');
    
    // Check if super admin
    const isSuperAdminFlag = getStoredItem('isSuperAdmin');
    console.log('Is Super Admin?', isSuperAdminFlag);
    
    if (isSuperAdminFlag === 'true') {
        const superAdminCode = getStoredItem('superAdminCode');
        const superAdminId = getStoredItem('superAdminId');
        
        console.log('Super Admin Code:', superAdminCode);
        console.log('Super Admin ID:', superAdminId);
        
        if (!superAdminCode || !superAdminId) {
            console.error('❌ Super admin credentials missing, redirecting to login');
            window.location.href = 'admin-login.html';
            return null;
        }
        
        console.log('✅ Super Admin authenticated');
        
        return {
            adminCode: superAdminCode,
            clientId: 'super-admin-global',
            isSuperAdmin: true,
            superAdminId: superAdminId
        };
    }
    
    // Check for regular admin code in sessionStorage or localStorage
    const adminCode = getStoredItem('adminCode');
    const clientId = getStoredItem('clientId');
    
    console.log('Admin Code:', adminCode);
    console.log('Client ID:', clientId);
    
    if (!adminCode || !clientId) {
        console.error('❌ Admin credentials missing, redirecting to login');
        window.location.href = 'admin-login.html';
        return null;
    }
    
    console.log('✅ Regular admin authenticated');
    
    return {
        adminCode: adminCode,
        clientId: clientId,
        isSuperAdmin: false
    };
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
function generateRandomCode(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    const bgColor = type === 'success' ? '#4caf50' : type === 'super' ? 'linear-gradient(135deg, gold, #ffd700)' : '#f44336';
    const textColor = type === 'super' ? '#000' : 'white';
    
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 15px 25px;
        background: ${bgColor};
        color: ${textColor};
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        font-weight: ${type === 'super' ? '700' : '500'};
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ==========================================
// MAIN INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Dashboard initializing...');
    
    const auth = checkAuth();
    if (!auth) {
        console.error('❌ Authentication failed, stopping initialization');
        return;
    }
    
    console.log('✅ Authentication successful:', auth);
    
    currentClientId = auth.clientId;
    console.log('📝 Current Client ID:', currentClientId);
    
    if (isSuperAdmin()) {
        console.log('👑 Super Admin detected');
        showSuperAdminBadge();
    }
    
    console.log('🔧 Setting up navigation...');
    setupNavigation();
    
    console.log('📊 Loading dashboard data...');
    await loadDashboardData();
    
    console.log('🎴 Initializing session cards...');
    initializeSessionCards();
    
    console.log('🎨 Setting up forms...');
    setupThemeForm();
    setupQuestionForm();
    setupAdminJoinGame();
    
    console.log('🎮 Loading game control data...');
    await loadActiveSessionsForControl();
    
    console.log('✅ Dashboard initialization complete!');
});

function showSuperAdminBadge() {
    const badge = document.createElement('div');
    badge.className = 'super-admin-badge';
    badge.innerHTML = '👑 SUPER ADMIN MODE';
    badge.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, gold, #ffd700);
        color: #000;
        padding: 12px 24px;
        border-radius: 25px;
        font-weight: 700;
        font-size: 14px;
        box-shadow: 0 5px 20px rgba(255, 215, 0, 0.5);
        z-index: 9999;
        animation: superAdminPulse 2s ease-in-out infinite;
    `;
    document.body.appendChild(badge);
}

// ==========================================
// NAVIGATION
// ==========================================
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    if (!navItems || navItems.length === 0) return;

    navItems.forEach(item => {
        if (item.dataset.listenerAttached === 'true') return;
        item.addEventListener('click', () => {
            const tab = item.dataset.tab;
            switchTab(tab);
        });
        item.dataset.listenerAttached = 'true';
    });
}

function switchTab(tabName) {
    if (!tabName) return;

    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.tab === tabName) {
            item.classList.add('active');
        }
    });
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    const target = document.getElementById(tabName);
    if (!target) {
        console.warn('switchTab: no element with id', tabName);
        return;
    }

    target.classList.add('active');
    loadTabData(tabName);
}

async function loadDashboardData() {
    try {
        if (!isSuperAdmin()) {
            const { data: client } = await supabase
                .from('clients')
                .select('*')
                .eq('id', currentClientId)
                .single();
            
            if (client && client.theme_config) {
                currentTheme = client.theme_config;
            }
        }
        
        await loadStats();
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

async function loadStats() {
    try {
        const setText = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };

        if (isSuperAdmin()) {
            const { count: sessionsCount } = await supabase
                .from('game_sessions')
                .select('*', { count: 'exact', head: true });

            setText('totalSessions', sessionsCount || 0);

            const { count: playersCount } = await supabase
                .from('players')
                .select('*', { count: 'exact', head: true });

            setText('totalPlayers', playersCount || 0);

            const { count: questionsCount } = await supabase
                .from('quiz_questions')
                .select('*', { count: 'exact', head: true });

            setText('totalQuestions', questionsCount || 0);

            const { count: activeCount } = await supabase
                .from('game_sessions')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);

            setText('activeSessions', activeCount || 0);

            return;
        }

        const { count: sessionsCount } = await supabase
            .from('game_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('client_id', currentClientId);

        setText('totalSessions', sessionsCount || 0);

        const { data: sessions } = await supabase
            .from('game_sessions')
            .select('id')
            .eq('client_id', currentClientId);

        if (sessions && sessions.length > 0) {
            const sessionIds = sessions.map(s => s.id);
            const { count: playersCount } = await supabase
                .from('players')
                .select('*', { count: 'exact', head: true })
                .in('session_id', sessionIds);

            setText('totalPlayers', playersCount || 0);
        } else {
            setText('totalPlayers', 0);
        }

        const { count: questionsCount } = await supabase
            .from('quiz_questions')
            .select('*', { count: 'exact', head: true })
            .eq('client_id', currentClientId);

        setText('totalQuestions', questionsCount || 0);

        const { count: activeCount } = await supabase
            .from('game_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('client_id', currentClientId)
            .eq('is_active', true);

        setText('activeSessions', activeCount || 0);

    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Minimal helpers to avoid ReferenceErrors from the dashboard's buttons
function createNewQuizSession() {
    // Open quiz editor and reset fields if present
    switchTab('quiz-editor');
    const title = document.getElementById('quizEditorTitle');
    if (title) title.textContent = 'Create Quiz Session';
    const name = document.getElementById('quizSessionName');
    if (name) name.value = '';
    const addForm = document.getElementById('addQuizQuestionForm');
    if (addForm) addForm.classList.add('hidden');
    const questionsList = document.getElementById('quizQuestionsList');
    if (questionsList) questionsList.innerHTML = `<div class="empty-state"><div class="icon">📝</div><h3>No questions yet</h3><p>Add your first question to get started</p></div>`;
}

function createNewCharadesGame() {
    // Open charades editor and reset fields if present
    switchTab('charades-editor');
    const name = document.getElementById('charadesGameName');
    if (name) name.value = '';
    const categoriesGrid = document.getElementById('categoriesGrid');
    if (categoriesGrid) categoriesGrid.innerHTML = '';
    const categoryCount = document.getElementById('categoryCount');
    if (categoryCount) categoryCount.textContent = '0';
}

async function loadTabData(tabName) {
    switch(tabName) {
        case 'theme':
            loadThemeSettings();
            break;
        case 'questions':
            await loadQuestions();
            break;
        case 'sessions':
            await loadSessions();
            break;
        case 'players':
            await loadPlayers();
            break;
        case 'game-control':
            await loadActiveSessionsForControl();
            break;
    }
}

// ==========================================
// GAME CONTROL FUNCTIONS
// ==========================================
async function loadActiveSessionsForControl() {
    try {
        let query = supabase
            .from('game_sessions')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });
        
        if (!isSuperAdmin()) {
            query = query.eq('client_id', currentClientId);
        }
        
        const { data: sessions } = await query;
        
        const select = document.getElementById('activeSessionSelect');
        if (!select) return;
        
        select.innerHTML = '<option value="">-- Select a session --</option>';
        
        if (sessions && sessions.length > 0) {
            sessions.forEach(session => {
                const option = document.createElement('option');
                option.value = session.id;
                option.textContent = `${session.session_code} - ${formatDate(session.created_at)}`;
                select.appendChild(option);
            });
        }
        
    } catch (error) {
        console.error('Error loading active sessions:', error);
    }
}

async function loadGameSession() {
    const sessionId = document.getElementById('activeSessionSelect').value;
    
    if (!sessionId) {
        document.getElementById('gameStatusPanel').style.display = 'none';
        document.getElementById('sessionInfoPanel').style.display = 'none';
        return;
    }
    
    try {
        const { data: session } = await supabase
            .from('game_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();
        
        if (!session) {
            showNotification('Session not found', 'error');
            return;
        }
        
        currentGameSession = session;
        
        // Show panels
        document.getElementById('gameStatusPanel').style.display = 'block';
        document.getElementById('sessionInfoPanel').style.display = 'block';
        
        // Update UI
        document.getElementById('sessionCodeDisplay').textContent = session.session_code;
        document.getElementById('shareCode').textContent = session.session_code;
        document.getElementById('displayJoinCode').textContent = session.session_code;
        
        // Update share link
        const shareLink = `${window.location.origin}/join-game.html?code=${session.session_code}`;
        document.getElementById('shareLink').value = shareLink;
        
        // Update game status
        updateGameStatus(session);
        
        // Load players
        await refreshPlayers();
        
        // Start auto-refresh
        startPlayerMonitoring();
        
    } catch (error) {
        console.error('Error loading game session:', error);
        showNotification('Failed to load session', 'error');
    }
}

function updateGameStatus(session) {
    const badge = document.getElementById('gameStatusBadge');
    const startBtn = document.getElementById('startGameBtn');
    const pauseBtn = document.getElementById('pauseGameBtn');
    const progressPanel = document.getElementById('gameProgressPanel');
    
    if (session.started_at && !session.ended_at) {
        // Game is running
        badge.textContent = 'In Progress';
        badge.style.background = '#4caf50';
        startBtn.style.display = 'none';
        pauseBtn.style.display = 'inline-block';
        progressPanel.style.display = 'block';
        
        // Start duration counter
        startDurationCounter();
    } else if (session.ended_at) {
        // Game ended
        badge.textContent = 'Ended';
        badge.style.background = '#999';
        startBtn.style.display = 'none';
        pauseBtn.style.display = 'none';
        progressPanel.style.display = 'block';
    } else {
        // Waiting to start
        badge.textContent = 'Waiting';
        badge.style.background = '#ff9800';
        startBtn.style.display = 'inline-block';
        pauseBtn.style.display = 'none';
        progressPanel.style.display = 'none';
    }
}

async function refreshPlayers() {
    if (!currentGameSession) return;
    
    try {
        const { data: players } = await supabase
            .from('players')
            .select('*')
            .eq('session_id', currentGameSession.id)
            .order('joined_at', { ascending: true });
        
        const playersList = document.getElementById('livePlayersList');
        const playerCount = document.getElementById('playerCount');
        const startBtn = document.getElementById('startGameBtn');
        
        playerCount.textContent = players ? players.length : 0;
        
        if (!players || players.length === 0) {
            playersList.innerHTML = `<p class="no-players">No players yet. Share the code: <strong>${currentGameSession.session_code}</strong></p>`;
            startBtn.disabled = true;
            return;
        }
        
        // Enable start button if we have players
        if (!currentGameSession.started_at) {
            startBtn.disabled = false;
        }
        
        playersList.innerHTML = players.map(player => `
            <div class="player-chip">
                <span class="player-avatar" style="background-color: ${player.avatar_color || '#ff69b4'}">
                    ${player.avatar_emoji || '👤'}
                </span>
                <span class="player-name">${player.username}</span>
                <span class="player-score">${player.score || 0} pts</span>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error refreshing players:', error);
    }
}

function startPlayerMonitoring() {
    // Clear any existing interval
    if (playerCheckInterval) {
        clearInterval(playerCheckInterval);
    }
    
    // Refresh players every 3 seconds
    playerCheckInterval = setInterval(refreshPlayers, 3000);
}

function stopPlayerMonitoring() {
    if (playerCheckInterval) {
        clearInterval(playerCheckInterval);
        playerCheckInterval = null;
    }
}

async function startGame() {
    if (!currentGameSession) {
        showNotification('No session selected', 'error');
        return;
    }
    
    if (!confirm('Start the game now? All players will be notified.')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('game_sessions')
            .update({
                started_at: new Date().toISOString(),
                is_active: true
            })
            .eq('id', currentGameSession.id);
        
        if (error) throw error;
        
        showNotification('🎮 Game started!', 'success');
        
        // Reload session
        await loadGameSession();
        
        // In a real app, you'd redirect players to quiz-game.html here
        // For now, just show notification
        showNotification('Players can now start playing!', 'success');
        
    } catch (error) {
        console.error('Error starting game:', error);
        showNotification('Failed to start game', 'error');
    }
}

async function pauseGame() {
    // Implementation for pause functionality
    showNotification('Pause functionality coming soon', 'error');
}

async function endGame() {
    if (!currentGameSession) return;
    
    if (!confirm('End this game session? This cannot be undone.')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('game_sessions')
            .update({
                ended_at: new Date().toISOString(),
                is_active: false
            })
            .eq('id', currentGameSession.id);
        
        if (error) throw error;
        
        showNotification('🛑 Game ended', 'success');
        
        stopPlayerMonitoring();
        stopDurationCounter();
        
        // Reload session
        await loadGameSession();
        
    } catch (error) {
        console.error('Error ending game:', error);
        showNotification('Failed to end game', 'error');
    }
}

async function createQuickSession() {
    await createNewSession();
    await loadActiveSessionsForControl();
    showNotification('Session created! Select it from the dropdown', 'success');
}

function startDurationCounter() {
    if (!currentGameSession || !currentGameSession.started_at) return;
    
    gameStartTime = new Date(currentGameSession.started_at);
    
    if (gameDurationInterval) {
        clearInterval(gameDurationInterval);
    }
    
    gameDurationInterval = setInterval(() => {
        const now = new Date();
        const diff = Math.floor((now - gameStartTime) / 1000);
        document.getElementById('gameDuration').textContent = formatDuration(diff);
        document.getElementById('gameProgressStatus').textContent = 'Game in progress';
    }, 1000);
}

function stopDurationCounter() {
    if (gameDurationInterval) {
        clearInterval(gameDurationInterval);
        gameDurationInterval = null;
    }
}

function copyJoinCode() {
    const code = document.getElementById('displayJoinCode').textContent;
    navigator.clipboard.writeText(code);
    showNotification('Code copied to clipboard!', 'success');
}

function copyShareLink() {
    const link = document.getElementById('shareLink').value;
    navigator.clipboard.writeText(link);
    showNotification('Link copied to clipboard!', 'success');
}

// ==========================================
// THEME, QUESTIONS, SESSIONS, PLAYERS
// (Keep existing functions from previous code)
// ==========================================

function setupThemeForm() {
    const form = document.getElementById('themeForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (isSuperAdmin()) {
            showNotification('Super Admins cannot modify client themes', 'error');
            return;
        }
        
        const primaryColor = document.getElementById('primaryColor').value;
        const secondaryColor = document.getElementById('secondaryColor').value;
        const accentColor = document.getElementById('accentColor').value;
        
        try {
            await supabase
                .from('clients')
                .update({ 
                    theme_primary_color: primaryColor,
                    theme_secondary_color: secondaryColor,
                    theme_accent_color: accentColor
                })
                .eq('id', currentClientId);
            
            currentTheme = { primaryColor, secondaryColor, accentColor };
            showNotification('Theme updated successfully!', 'success');
            
        } catch (error) {
            console.error('Error updating theme:', error);
            showNotification('Failed to update theme', 'error');
        }
    });
}

function loadThemeSettings() {
    if (isSuperAdmin()) {
        document.getElementById('primaryColor').value = '#ff69b4';
        document.getElementById('secondaryColor').value = '#ffb6d9';
        document.getElementById('accentColor').value = '#ff1493';
        return;
    }
    
    supabase
        .from('clients')
        .select('theme_primary_color, theme_secondary_color, theme_accent_color')
        .eq('id', currentClientId)
        .single()
        .then(({ data }) => {
            if (data) {
                document.getElementById('primaryColor').value = data.theme_primary_color || '#ff69b4';
                document.getElementById('secondaryColor').value = data.theme_secondary_color || '#ffb6d9';
                document.getElementById('accentColor').value = data.theme_accent_color || '#ff1493';
            }
        });
}

function showAddQuestion() {
    document.getElementById('addQuestionForm').style.display = 'block';
}

function hideAddQuestion() {
    document.getElementById('addQuestionForm').style.display = 'none';
    document.getElementById('questionForm').reset();
}

function setupQuestionForm() {
    const form = document.getElementById('questionForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        let questionClientId = currentClientId;
        
        if (isSuperAdmin()) {
            const { data: superClient } = await supabase
                .from('clients')
                .select('id')
                .eq('email', 'superadmin@glohub.com')
                .single();
            
            if (superClient) {
                questionClientId = superClient.id;
            } else {
                showNotification('Cannot add questions as super admin without a client', 'error');
                return;
            }
        }
        
        const question = {
            client_id: questionClientId,
            question_text: document.getElementById('questionText').value,
            option_1: document.getElementById('option1').value,
            option_2: document.getElementById('option2').value,
            option_3: document.getElementById('option3').value,
            option_4: document.getElementById('option4').value,
            correct_answer: parseInt(document.getElementById('correctAnswer').value)
        };
        
        try {
            await supabase
                .from('quiz_questions')
                .insert([question]);
            
            showNotification('Question added successfully!', 'success');
            hideAddQuestion();
            await loadQuestions();
            await loadStats();
            
        } catch (error) {
            console.error('Error adding question:', error);
            showNotification('Failed to add question', 'error');
        }
    });
}

async function loadQuestions() {
    try {
        let query = supabase
            .from('quiz_questions')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (!isSuperAdmin()) {
            query = query.eq('client_id', currentClientId);
        }
        
        const { data: questions } = await query;
        
        const list = document.getElementById('questionsList');
        if (!questions || questions.length === 0) {
            list.innerHTML = '<p style="text-align: center; color: #666;">No questions yet. Add your first question!</p>';
            return;
        }
        
        list.innerHTML = questions.map((q, index) => {
            const options = [q.option_1, q.option_2, q.option_3, q.option_4];
            return `
                <div class="question-item">
                    <div>
                        <strong>Q${index + 1}:</strong> ${q.question_text}
                        ${isSuperAdmin() ? `<br><small style="color: #999; font-size: 12px;">Client ID: ${q.client_id}</small>` : ''}
                        <div style="font-size: 14px; color: #666; margin-top: 5px;">
                            Correct: ${options[q.correct_answer - 1]}
                        </div>
                    </div>
                    <button class="btn-secondary" onclick="deleteQuestion('${q.id}')">Delete</button>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading questions:', error);
    }
}

async function deleteQuestion(questionId) {
    if (!confirm('Are you sure you want to delete this question?')) return;
    
    try {
        await supabase
            .from('quiz_questions')
            .delete()
            .eq('id', questionId);
        
        showNotification('Question deleted', 'success');
        await loadQuestions();
        await loadStats();
        
    } catch (error) {
        console.error('Error deleting question:', error);
        showNotification('Failed to delete question', 'error');
    }
}

async function createNewSession() {
    try {
        let joinCode;
        let codeExists = true;
        
        while (codeExists) {
            joinCode = generateRandomCode(6);
            const { data } = await supabase
                .from('game_sessions')
                .select('session_code')
                .eq('session_code', joinCode);
            codeExists = data && data.length > 0;
        }
        
        let sessionClientId = currentClientId;
        
        if (isSuperAdmin()) {
            const { data: superClient } = await supabase
                .from('clients')
                .select('id')
                .eq('email', 'superadmin@glohub.com')
                .single();
            
            if (!superClient) {
                const { data: newClient } = await supabase
                    .from('clients')
                    .insert([{
                        email: 'superadmin@glohub.com',
                        admin_code: 'SUPER-ADMIN-CLIENT',
                        is_active: true
                    }])
                    .select()
                    .single();
                
                sessionClientId = newClient.id;
            } else {
                sessionClientId = superClient.id;
            }
        }
        
        const { data: session, error } = await supabase
            .from('game_sessions')
            .insert([
                {
                    client_id: sessionClientId,
                    session_code: joinCode,
                    is_active: true
                }
            ])
            .select()
            .single();
        
        if (error) throw error;
        
        showNotification(`Session created! Join code: ${joinCode}`, isSuperAdmin() ? 'super' : 'success');
        await loadSessions();
        await loadStats();
        
    } catch (error) {
        console.error('Error creating session:', error);
        showNotification('Failed to create session', 'error');
    }
}

function initializeSessionCards() {
    const container = document.getElementById('sessionsCardsContainer');
    const prevBtn = document.getElementById('prevCard');
    const nextBtn = document.getElementById('nextCard');
    
    if (!container || !prevBtn || !nextBtn) return;
    if (container.dataset.initialized === 'true') return;
    
    prevBtn.addEventListener('click', () => {
        const scrollAmount = container.offsetWidth * 0.8;
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });
    
    nextBtn.addEventListener('click', () => {
        const scrollAmount = container.offsetWidth * 0.8;
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });
    
    function updateNavButtons() {
        const isAtStart = container.scrollLeft <= 10;
        const isAtEnd = container.scrollLeft >= container.scrollWidth - container.offsetWidth - 10;
        
        prevBtn.disabled = isAtStart;
        nextBtn.disabled = isAtEnd;
    }
    
    container.addEventListener('scroll', updateNavButtons);
    updateNavButtons();
    
    let touchStartX = 0;
    let touchEndX = 0;
    
    container.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    container.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });
    
    function handleSwipe() {
        if (touchStartX - touchEndX > 50) {
            nextBtn.click();
        }
        if (touchEndX - touchStartX > 50) {
            prevBtn.click();
        }
    }

    container.dataset.initialized = 'true';
}

async function loadSessions() {
    try {
        let query = supabase
            .from('game_sessions')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (!isSuperAdmin()) {
            query = query.eq('client_id', currentClientId);
        }
        
        const { data: sessions } = await query;
        
        const cardsContainer = document.getElementById('sessionsCardsContainer');
        if (cardsContainer) {
            if (!sessions || sessions.length === 0) {
                cardsContainer.innerHTML = `
                    <div class="session-card" style="flex: 0 0 100%; min-height: 400px; display: flex; align-items: center; justify-content: center;">
                        <p style="text-align: center; color: #666;">No events yet. Create your first one!</p>
                    </div>
                `;
            } else {
                const recentSessions = sessions.slice(0, 6);
                cardsContainer.innerHTML = recentSessions.map((s, index) => `
                    <div class="session-card" style="position: relative;">
                        ${isSuperAdmin() ? '<span class="session-card-badge" style="background: gold; color: #000; top: 15px; left: 15px;">👑 Super View</span>' : ''}
                        <span class="session-card-badge" style="${isSuperAdmin() ? 'top: 50px;' : ''}">${s.is_active ? 'Active' : 'Ended'}</span>
                        <img src="https://images.unsplash.com/photo-${1517457373958 + index * 1000}-3f3c69d1d4a4?w=400&h=600&fit=crop" 
                             alt="Event ${index + 1}" 
                             class="session-card-image"
                             onerror="this.src='https://via.placeholder.com/400x600/ffb6d9/ffffff?text=Event+${index + 1}'">
                        <div class="session-card-content">
                            <div class="session-card-title">Event ${s.session_code}</div>
                            <div class="session-card-meta">
                                <span>${formatDate(s.created_at)}</span>
                                <span>${formatTime(s.created_at)}</span>
                                ${isSuperAdmin() ? `<br><small style="font-size: 10px; opacity: 0.7;">Client: ${s.client_id.substring(0, 8)}...</small>` : ''}
                            </div>
                        </div>
                    </div>
                `).join('');
            }
            
            setTimeout(initializeSessionCards, 100);
        }
        
        const list = document.getElementById('sessionsList');
        if (list) {
            if (!sessions || sessions.length === 0) {
                list.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No sessions yet.</p>';
                return;
            }
            
            list.innerHTML = '<h3 style="margin: 40px 0 20px; color: var(--primary);">All Sessions</h3>' +
                sessions.map(s => `
                <div class="session-item">
                    <div>
                        <strong>Join Code: ${s.session_code}</strong>
                        ${isSuperAdmin() ? `<br><small style="color: #999;">Client: ${s.client_id}</small>` : ''}
                        <div style="font-size: 14px; color: #666;">
                            Created: ${formatDate(s.created_at)} at ${formatTime(s.created_at)}
                        </div>
                    </div>
                    <button class="btn-secondary" onclick="deleteSession('${s.id}')">Delete</button>
                </div>
            `).join('');
        }
        
    } catch (error) {
        console.error('Error loading sessions:', error);
    }
}

async function deleteSession(sessionId) {
    if (!confirm('Are you sure you want to delete this session?')) return;
    
    try {
        await supabase
            .from('game_sessions')
            .delete()
            .eq('id', sessionId);
        
        showNotification('Session deleted', 'success');
        await loadSessions();
        await loadStats();
        
    } catch (error) {
        console.error('Error deleting session:', error);
        showNotification('Failed to delete session', 'error');
    }
}

async function loadPlayers() {
    try {
        let query;
        
        if (isSuperAdmin()) {
            query = supabase
                .from('players')
                .select('*')
                .order('joined_at', { ascending: false });
        } else {
            const { data: sessions } = await supabase
                .from('game_sessions')
                .select('id')
                .eq('client_id', currentClientId);
            
            if (!sessions || sessions.length === 0) {
                document.getElementById('playersList').innerHTML = 
                    '<p style="text-align: center; color: #666;">No players yet. Create a session first!</p>';
                return;
            }
            
            const sessionIds = sessions.map(s => s.id);
            query = supabase
                .from('players')
                .select('*')
                .in('session_id', sessionIds)
                .order('joined_at', { ascending: false });
        }
        
        const { data: players } = await query;
        
        const list = document.getElementById('playersList');
        if (!players || players.length === 0) {
            list.innerHTML = '<p style="text-align: center; color: #666;">No players yet!</p>';
            return;
        }
        
        list.innerHTML = players.map(p => `
            <div class="player-item">
                <div>
                    <strong>${p.username}</strong>
                    ${isSuperAdmin() ? `<br><small style="color: #999;">Session: ${p.session_id.substring(0, 8)}...</small>` : ''}
                    <div style="font-size: 14px; color: #666;">
                        Joined: ${formatDate(p.joined_at)}
                    </div>
                </div>
                <button class="btn-secondary" onclick="deletePlayer('${p.id}')">Remove</button>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading players:', error);
    }
}

async function deletePlayer(playerId) {
    if (!confirm('Are you sure you want to remove this player?')) return;
    
    try {
        await supabase
            .from('players')
            .delete()
            .eq('id', playerId);
        
        showNotification('Player removed', 'success');
        await loadPlayers();
        await loadStats();
        
    } catch (error) {
        console.error('Error removing player:', error);
        showNotification('Failed to remove player', 'error');
    }
}

function logout() {
    // Clear both session and persistent admin keys
    try { sessionStorage.clear(); } catch(e) { console.warn('sessionStorage clear failed', e); }
    try {
        const keys = ['adminCode','clientId','isSuperAdmin','superAdminId','superAdminCode','superAdminName'];
        keys.forEach(k => localStorage.removeItem(k));
    } catch (e) { console.warn('localStorage cleanup failed', e); }

    if (playerCheckInterval) clearInterval(playerCheckInterval);
    if (gameDurationInterval) clearInterval(gameDurationInterval);
    window.location.href = 'index.html';
}

// ==========================================
// MAKE ALL FUNCTIONS GLOBALLY AVAILABLE
// ==========================================
window.switchTab = switchTab;
window.showAddQuestion = showAddQuestion;
window.hideAddQuestion = hideAddQuestion;
window.deleteQuestion = deleteQuestion;
window.createNewSession = createNewSession;
window.deleteSession = deleteSession;
window.deletePlayer = deletePlayer;
window.logout = logout;
window.loadGameSession = loadGameSession;
window.refreshPlayers = refreshPlayers;
window.startGame = startGame;
window.pauseGame = pauseGame;
window.endGame = endGame;
window.createQuickSession = createQuickSession;
window.copyJoinCode = copyJoinCode;
window.copyShareLink = copyShareLink;
// Expose creation helpers referenced by inline HTML
window.createNewQuizSession = createNewQuizSession;
window.createNewCharadesGame = createNewCharadesGame;

function setupAdminJoinGame() {
    const form = document.getElementById('adminJoinForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const code = document.getElementById('adminJoinCode').value.trim().toUpperCase();
        const username = document.getElementById('adminUsername').value.trim();
        const errorDiv = document.getElementById('adminJoinError');
        
        try {
            const { data: session, error } = await supabase
                .from('game_sessions')
                .select('*')
                .eq('session_code', code)
                .single();

            if (error || !session) {
                errorDiv.textContent = 'Invalid game code. Please check and try again.';
                errorDiv.style.display = 'block';
                return;
            }

            sessionStorage.setItem('sessionId', session.id);
            sessionStorage.setItem('joinCode', code);
            sessionStorage.setItem('username', username);
            sessionStorage.setItem('isAdminPlayer', 'true');
            
            window.location.href = 'avatar-customizer.html';
            
        } catch (err) {
            console.error('Admin join error:', err);
            errorDiv.textContent = 'Failed to join game. Please try again.';
            errorDiv.style.display = 'block';
        }
    });
    
    const codeInput = document.getElementById('adminJoinCode');
    if (codeInput) {
        codeInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
            document.getElementById('adminJoinError').style.display = 'none';
        });
    }
}