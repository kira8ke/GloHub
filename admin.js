// Admin Dashboard Logic with Super Admin Support & Game Control

let currentClientId = null;
let currentTheme = {};
let currentGameSession = null;

// Quiz / Charades state
let currentEditingCategory = null;
let currentQuizSession = null;
let currentCharadesGame = null;
let quizQuestions = [];
let charadesCategories = [];
let selectedQuizColor = 'baby-pink';
let selectedCategoryColor = 'baby-pink';

// Utility to prefer sessionStorage, then localStorage
function getStoredItem(key) {
    try {
        return sessionStorage.getItem(key) || localStorage.getItem(key) || null;
    } catch (e) {
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
    console.log('Checking authentication...');

    const isSuperAdminFlag = getStoredItem('isSuperAdmin');
    console.log('Is Super Admin?', isSuperAdminFlag);

    if (isSuperAdminFlag === 'true') {
        const superAdminCode = getStoredItem('superAdminCode');
        const superAdminId = getStoredItem('superAdminId');

        console.log('Super Admin Code:', superAdminCode);
        console.log('Super Admin ID:', superAdminId);

        if (!superAdminCode || !superAdminId) {
            console.error('Super admin credentials missing, redirecting to login');
            window.location.href = 'admin-login.html';
            return null;
        }

        console.log('Super Admin authenticated');

        return {
            adminCode: superAdminCode,
            clientId: null, // no specific client id for super admin; look up when needed
            isSuperAdmin: true,
            superAdminId: superAdminId
        };
    }

    const adminCode = getStoredItem('adminCode');
    const clientId = getStoredItem('clientId');

    console.log('Admin Code:', adminCode);
    console.log('Client ID:', clientId);

    if (!adminCode || !clientId) {
        console.error('Admin credentials missing, redirecting to login');
        window.location.href = 'admin-login.html';
        return null;
    }

    console.log('Regular admin authenticated');

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
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
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
    console.log('Dashboard initializing...');

    const auth = checkAuth();
    if (!auth) {
        console.error('Authentication failed, stopping initialization');
        return;
    }

    console.log('Authentication successful:', auth);

    currentClientId = auth.clientId;
    console.log('Current Client ID:', currentClientId);

    if (isSuperAdmin()) {
        console.log('Super Admin detected');
        showSuperAdminBadge();
    }

    console.log('Dashboard ready');
});

function showSuperAdminBadge() {
    const badge = document.createElement('div');
    badge.className = 'super-admin-badge';
    badge.innerHTML = 'SUPER ADMIN MODE';
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
    `;
    document.body.appendChild(badge);
}

// ==========================================
// TAB DATA LOADING
// ==========================================
async function loadTabData(tabName) {
    switch (tabName) {
        case 'quiz-sessions':
            await loadQuizSessions();
            break;
        case 'charades-sessions':
            await loadCharadesGames();
            break;
        case 'overview':
            // static, nothing to load
            break;
        // legacy tabs kept in case other pages still reference them
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
// QUIZ GAME FUNCTIONS
// ==========================================
async function loadQuizSessions() {
    try {
        let query = supabase
            .from('quiz_sessions')
            .select('*')
            .order('created_at', { ascending: false });

        if (!isSuperAdmin()) {
            query = query.eq('client_id', currentClientId);
        }

        const { data: sessions, error } = await query;
        if (error) throw error;

        const container = document.getElementById('quizSessionsList');
        if (!container) return;

        if (!sessions || sessions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📝</div>
                    <h3>No quiz sessions yet</h3>
                    <p>Create your first quiz session to get started!</p>
                </div>`;
            return;
        }

        container.innerHTML = sessions.map(session => {
            const qCount = session.questions ? session.questions.length : 0;
            const hasCode = session.game_code;
            return `
                <div class="session-card-item">
                    <h3>${session.session_name || 'Untitled Quiz'}</h3>
                    <div class="session-meta">
                        <span>${qCount} questions</span>
                        <span>${session.theme_color || 'baby-pink'}</span>
                        <span>${formatDate(session.created_at)}</span>
                        ${hasCode ? `<span>Code: <strong>${session.game_code}</strong></span>` : ''}
                    </div>
                    <div class="session-actions">
                        ${!hasCode ? `<button class="btn-primary" onclick="generateQuizCode('${session.id}')">Generate Code</button>` : ''}
                        ${hasCode  ? `<button class="btn-primary" onclick="copyCode('${session.game_code}')">Copy Code</button>` : ''}
                        <button class="btn-secondary" onclick="editQuizSession('${session.id}')">Edit</button>
                        <button class="btn-secondary" onclick="viewQuizResults('${session.id}')">Results</button>
                        <button class="btn-secondary" onclick="deleteQuizSession('${session.id}')">Delete</button>
                    </div>
                </div>`;
        }).join('');

    } catch (error) {
        console.error('Error loading quiz sessions:', error);
        showNotification('Failed to load quiz sessions', 'error');
    }
}

function createNewQuizSession() {
    currentQuizSession = null;
    quizQuestions = [];
    selectedQuizColor = 'baby-pink';

    const nameEl = document.getElementById('quizSessionName');
    if (nameEl) nameEl.value = '';

    const titleEl = document.getElementById('quizEditorTitle');
    if (titleEl) titleEl.textContent = 'Create Quiz Session';

    document.querySelectorAll('#quiz-editor .color-option').forEach(opt => opt.classList.remove('selected'));
    const pinkOption = document.querySelector('#quiz-editor [data-color="baby-pink"]');
    if (pinkOption) pinkOption.classList.add('selected');

    updateQuizQuestionsList();
    window.switchTab('quiz-editor');
}

function selectQuizColor(color) {
    selectedQuizColor = color;
    document.querySelectorAll('#quiz-editor .color-option').forEach(opt => opt.classList.remove('selected'));
    const sel = document.querySelector(`#quiz-editor [data-color="${color}"]`);
    if (sel) sel.classList.add('selected');
}

function showAddQuizQuestion() {
    const form = document.getElementById('addQuizQuestionForm');
    if (form) form.classList.remove('hidden');
}

function cancelAddQuizQuestion() {
    const form = document.getElementById('addQuizQuestionForm');
    if (form) form.classList.add('hidden');
    ['quizQuestionText','quizOption1','quizOption2','quizOption3','quizOption4'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const ans = document.getElementById('quizCorrectAnswer');
    if (ans) ans.value = '1';
}

function saveQuizQuestion() {
    const questionText = document.getElementById('quizQuestionText')?.value.trim() || '';
    const option1      = document.getElementById('quizOption1')?.value.trim() || '';
    const option2      = document.getElementById('quizOption2')?.value.trim() || '';
    const option3      = document.getElementById('quizOption3')?.value.trim() || '';
    const option4      = document.getElementById('quizOption4')?.value.trim() || '';
    const correctAnswer = parseInt(document.getElementById('quizCorrectAnswer')?.value || '1');

    if (!questionText || !option1 || !option2 || !option3 || !option4) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    quizQuestions.push({
        id: Date.now().toString(),
        question_text: questionText,
        option_1: option1,
        option_2: option2,
        option_3: option3,
        option_4: option4,
        correct_answer: correctAnswer
    });

    showNotification('Question added!', 'success');
    cancelAddQuizQuestion();
    updateQuizQuestionsList();
}

function updateQuizQuestionsList() {
    const container = document.getElementById('quizQuestionsList');
    if (!container) return;

    if (quizQuestions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">📝</div>
                <h3>No questions yet</h3>
                <p>Add your first question to get started</p>
            </div>`;
        return;
    }

    container.innerHTML = quizQuestions.map((q, i) => {
        const options = [q.option_1, q.option_2, q.option_3, q.option_4];
        return `
            <div class="question-item">
                <div class="question-content">
                    <strong>Q${i + 1}:</strong> ${q.question_text}
                    <div class="question-options">Correct: ${options[q.correct_answer - 1]}</div>
                </div>
                <button class="btn-secondary" onclick="deleteQuizQuestion('${q.id}')">Delete</button>
            </div>`;
    }).join('');
}

function deleteQuizQuestion(questionId) {
    if (!confirm('Delete this question?')) return;
    quizQuestions = quizQuestions.filter(q => q.id !== questionId);
    updateQuizQuestionsList();
    showNotification('Question deleted', 'success');
}

async function saveQuizSession() {
    const sessionName = document.getElementById('quizSessionName')?.value.trim() || '';

    if (!sessionName) { showNotification('Please enter a session name', 'error'); return; }
    if (quizQuestions.length === 0) { showNotification('Please add at least one question', 'error'); return; }

    try {
        let sessionClientId = currentClientId;

        if (isSuperAdmin()) {
            const { data: superClient, error: clientError } = await supabase.from('clients').select('id').eq('email', 'superadmin@glohub.com').maybeSingle();
            if (clientError) {
                console.error('Failed to look up super client:', clientError);
                showNotification('Failed to find super client record. Cannot save session in Super Admin mode.', 'error');
                return; // abort save to avoid inserting invalid UUID
            }
            if (!superClient) {
                console.warn('No super client record found for superadmin@glohub.com');
                showNotification('No super client record found. Cannot save session.', 'error');
                return; // abort save
            }
            sessionClientId = superClient.id;
        }

        const sessionData = {
            client_id: sessionClientId,
            session_name: sessionName,
            questions: quizQuestions,
            theme_color: selectedQuizColor
        };

        if (currentQuizSession) {
            const { error } = await supabase.from('quiz_sessions').update(sessionData).eq('id', currentQuizSession.id);
            if (error) throw error;
            showNotification('Session updated!', 'success');
        } else {
            const { data: newSession, error } = await supabase.from('quiz_sessions').insert([sessionData]).select().single();
            if (error) throw error;
            currentQuizSession = newSession;
            showNotification('Session created!', 'success');
        }

        await generateQuizCode(currentQuizSession.id);

    } catch (error) {
        console.error('Error saving quiz session:', error);
        showNotification('Failed to save session', 'error');
    }
}

async function generateQuizCode(sessionId) {
    try {
        let gameCode;
        let codeExists = true;

        while (codeExists) {
            gameCode = generateRandomCode(6);
            const { data } = await supabase.from('quiz_sessions').select('game_code').eq('game_code', gameCode);
            codeExists = data && data.length > 0;
        }

        const { error } = await supabase.from('quiz_sessions').update({ game_code: gameCode, game_type: 'quiz' }).eq('id', sessionId);
        if (error) throw error;

        const codeDisplay = document.getElementById('displayGameCode');
        if (codeDisplay) codeDisplay.textContent = gameCode;

        window.currentGameCode = gameCode;

        const modal = document.getElementById('gameCodeModal');
        if (modal) modal.classList.add('active');

        await loadQuizSessions();

    } catch (error) {
        console.error('Error generating quiz code:', error);
        showNotification('Failed to generate code', 'error');
    }
}

async function editQuizSession(sessionId) {
    try {
        const { data: session, error } = await supabase.from('quiz_sessions').select('*').eq('id', sessionId).single();
        if (error) throw error;

        currentQuizSession = session;
        quizQuestions = session.questions || [];
        selectedQuizColor = session.theme_color || 'baby-pink';

        const nameEl = document.getElementById('quizSessionName');
        if (nameEl) nameEl.value = session.session_name;

        const titleEl = document.getElementById('quizEditorTitle');
        if (titleEl) titleEl.textContent = 'Edit Quiz Session';

        document.querySelectorAll('#quiz-editor .color-option').forEach(opt => opt.classList.remove('selected'));
        const sel = document.querySelector(`#quiz-editor [data-color="${selectedQuizColor}"]`);
        if (sel) sel.classList.add('selected');

        updateQuizQuestionsList();
        window.switchTab('quiz-editor');

    } catch (error) {
        console.error('Error loading quiz session:', error);
        showNotification('Failed to load session', 'error');
    }
}

async function deleteQuizSession(sessionId) {
    if (!confirm('Delete this quiz session? This cannot be undone.')) return;
    try {
        const role = sessionStorage.getItem('role') || (sessionStorage.getItem('isSuperAdmin') === 'true' ? 'super' : 'client');
        const code = sessionStorage.getItem('superAdminCode') || sessionStorage.getItem('adminCode');

        const base = window.BACKEND_URL || '';
        const resp = await fetch(base + '/admin/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemType: 'quiz_session', id: sessionId, role, code })
        });

        const result = await resp.json();
        if (result.success) {
            showNotification('Session deleted', 'success');
            await loadQuizSessions();
        } else {
            throw new Error(result.message || 'delete failed');
        }
    } catch (error) {
        console.error('Error deleting quiz session:', error);
        showNotification('Failed to delete session', 'error');
    }
}

function viewQuizResults(sessionId) {
    showNotification('Results view coming soon!', 'error');
}

// ==========================================
// CHARADES GAME FUNCTIONS
// ==========================================
async function loadCharadesGames() {
    try {
        let query = supabase.from('charades_games').select('*').order('created_at', { ascending: false });
        if (!isSuperAdmin()) query = query.eq('client_id', currentClientId);

        const { data: games, error } = await query;
        if (error) throw error;

        const container = document.getElementById('charadesGamesList');
        if (!container) return;

        if (!games || games.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">🎭</div>
                    <h3>No charades games yet</h3>
                    <p>Create your first charades game to get started!</p>
                </div>`;
            return;
        }

        container.innerHTML = games.map(game => {
            const catCount = game.categories ? game.categories.length : 0;
            const hasCode  = game.game_code;
            return `
                <div class="session-card-item">
                    <h3>${game.game_name || 'Untitled Charades'}</h3>
                    <div class="session-meta">
                        <span>${catCount} categories</span>
                        <span>${formatDate(game.created_at)}</span>
                        ${hasCode ? `<span>Code: <strong>${game.game_code}</strong></span>` : ''}
                    </div>
                    <div class="session-actions">
                        ${!hasCode ? `<button class="btn-primary" onclick="generateCharadesCode('${game.id}')">Generate Code</button>` : ''}
                        ${hasCode  ? `<button class="btn-primary" onclick="copyCode('${game.game_code}')">Copy Code</button>` : ''}
                        <button class="btn-secondary" onclick="editCharadesGame('${game.id}')">Edit</button>
                        <button class="btn-secondary" onclick="deleteCharadesGame('${game.id}')">Delete</button>
                    </div>
                </div>`;
        }).join('');

    } catch (error) {
        console.error('Error loading charades games:', error);
        showNotification('Failed to load games', 'error');
    }
}

function createNewCharadesGame() {
    currentCharadesGame = null;

    charadesCategories = [
        { id: '1', name: 'Movies',  emoji: '🎬', color: 'baby-pink',   flashcards: [] },
        { id: '2', name: 'Animals', emoji: '🦁', color: 'baby-blue',   flashcards: [] },
        { id: '3', name: 'Actions', emoji: '🏃', color: 'baby-purple', flashcards: [] },
        { id: '4', name: 'Objects', emoji: '🎁', color: 'baby-pink',   flashcards: [] },
        { id: '5', name: 'Food',    emoji: '🍕', color: 'baby-blue',   flashcards: [] }
    ];

    const nameEl = document.getElementById('charadesGameName');
    if (nameEl) nameEl.value = '';

    updateCategoriesGrid();
    window.switchTab('charades-editor');
}

function updateCategoriesGrid() {
    const container = document.getElementById('categoriesGrid');
    if (!container) return;

    const countEl = document.getElementById('categoryCount');
    if (countEl) countEl.textContent = charadesCategories.length;

    let html = charadesCategories.map(cat => {
        const fcCount = cat.flashcards ? cat.flashcards.length : 0;
        return `
            <div class="category-card color-${cat.color}" onclick="openCategoryEditor('${cat.id}')">
                <div class="category-emoji">${cat.emoji}</div>
                <div class="category-name">${cat.name}</div>
                <div class="category-count">${fcCount} flashcards</div>
                <div class="category-actions" onclick="event.stopPropagation()">
                    <button class="btn-secondary" onclick="openCategoryEditor('${cat.id}')">Edit</button>
                    ${charadesCategories.length > 5 ? `<button class="btn-secondary" onclick="deleteCategory('${cat.id}')">Delete</button>` : ''}
                </div>
            </div>`;
    }).join('');

    if (charadesCategories.length < 20) {
        html += `<div class="category-card add-category-btn" onclick="addNewCategory()">
                    <div class="icon">+</div>
                    <div>Add Category</div>
                 </div>`;
    }

    container.innerHTML = html;
}

function addNewCategory() {
    if (charadesCategories.length >= 20) { showNotification('Maximum 20 categories allowed', 'error'); return; }

    const cat = { id: Date.now().toString(), name: 'New Category', emoji: '🎯', color: 'baby-pink', flashcards: [] };
    charadesCategories.push(cat);
    updateCategoriesGrid();
    openCategoryEditor(cat.id);
}

function deleteCategory(categoryId) {
    if (!confirm('Delete this category?')) return;
    if (charadesCategories.length <= 5) { showNotification('Must have at least 5 categories', 'error'); return; }

    charadesCategories = charadesCategories.filter(c => c.id !== categoryId);
    updateCategoriesGrid();
    showNotification('Category deleted', 'success');
}

function openCategoryEditor(categoryId) {
    const category = charadesCategories.find(c => c.id === categoryId);
    if (!category) return;

    currentEditingCategory = category;

    const nameEl  = document.getElementById('categoryName');
    const emojiEl = document.getElementById('categoryEmoji');
    if (nameEl)  nameEl.value  = category.name;
    if (emojiEl) emojiEl.value = category.emoji;
    selectedCategoryColor = category.color;

    document.querySelectorAll('#categoryModal .color-option').forEach(opt => opt.classList.remove('selected'));
    const sel = document.querySelector(`#categoryModal [data-color="${category.color}"]`);
    if (sel) sel.classList.add('selected');

    updateFlashcardsList();

    const modal = document.getElementById('categoryModal');
    if (modal) modal.classList.add('active');
}

function closeCategoryModal() {
    const modal = document.getElementById('categoryModal');
    if (modal) modal.classList.remove('active');
    currentEditingCategory = null;
}

function selectCategoryColor(color) {
    selectedCategoryColor = color;
    document.querySelectorAll('#categoryModal .color-option').forEach(opt => opt.classList.remove('selected'));
    const sel = document.querySelector(`#categoryModal [data-color="${color}"]`);
    if (sel) sel.classList.add('selected');
}

function openEmojiPicker() {
    const emoji = prompt('Enter an emoji (use your device emoji keyboard):');
    if (emoji) {
        const el = document.getElementById('categoryEmoji');
        if (el) el.value = emoji;
    }
}

function showAddFlashcard() {
    const form = document.getElementById('addFlashcardForm');
    if (form) form.classList.remove('hidden');
    const input = document.getElementById('flashcardText');
    if (input) input.focus();
}

function cancelAddFlashcard() {
    const form  = document.getElementById('addFlashcardForm');
    const input = document.getElementById('flashcardText');
    if (form)  form.classList.add('hidden');
    if (input) input.value = '';
}

function saveFlashcard() {
    if (!currentEditingCategory) return;

    const text = document.getElementById('flashcardText')?.value.trim() || '';
    if (!text) { showNotification('Please enter a flashcard text', 'error'); return; }

    if (!currentEditingCategory.flashcards) currentEditingCategory.flashcards = [];
    if (currentEditingCategory.flashcards.length >= 20) { showNotification('Maximum 20 flashcards per category', 'error'); return; }

    currentEditingCategory.flashcards.push({ id: Date.now().toString(), text: text });

    cancelAddFlashcard();
    updateFlashcardsList();
    showNotification('Flashcard added!', 'success');
}

function updateFlashcardsList() {
    if (!currentEditingCategory) return;

    const container  = document.getElementById('flashcardsList');
    const flashcards = currentEditingCategory.flashcards || [];

    const countEl = document.getElementById('flashcardCount');
    if (countEl) countEl.textContent = flashcards.length;
    if (!container) return;

    if (flashcards.length === 0) {
        container.innerHTML = `<div class="empty-state" style="padding:30px;"><div class="icon">🎴</div><p>No flashcards yet</p></div>`;
        return;
    }

    container.innerHTML = flashcards.map(fc => `
        <div class="flashcard-item">
            <div class="flashcard-text">${fc.text}</div>
            <button class="btn-secondary" onclick="deleteFlashcard('${fc.id}')">Delete</button>
        </div>`).join('');
}

function deleteFlashcard(flashcardId) {
    if (!currentEditingCategory) return;
    currentEditingCategory.flashcards = currentEditingCategory.flashcards.filter(fc => fc.id !== flashcardId);
    updateFlashcardsList();
    showNotification('Flashcard deleted', 'success');
}

function saveCategoryChanges() {
    if (!currentEditingCategory) return;

    const name  = document.getElementById('categoryName')?.value.trim() || '';
    const emoji = document.getElementById('categoryEmoji')?.value.trim() || '';

    if (!name) { showNotification('Please enter a category name', 'error'); return; }

    currentEditingCategory.name  = name;
    currentEditingCategory.emoji = emoji || '🎯';
    currentEditingCategory.color = selectedCategoryColor;

    closeCategoryModal();
    updateCategoriesGrid();
    showNotification('Category updated!', 'success');
}

async function saveCharadesGame() {
    const gameName = document.getElementById('charadesGameName')?.value.trim() || '';

    if (!gameName)                        { showNotification('Please enter a game name', 'error'); return; }
    if (charadesCategories.length < 5)    { showNotification('Please have at least 5 categories', 'error'); return; }

    const emptyCats = charadesCategories.filter(c => !c.flashcards || c.flashcards.length === 0);
    if (emptyCats.length > 0)             { showNotification('All categories must have at least one flashcard', 'error'); return; }

    try {
        let gameClientId = currentClientId;
        if (isSuperAdmin()) {
            const { data: superClient, error: clientError } = await supabase.from('clients').select('id').eq('email', 'superadmin@glohub.com').maybeSingle();
            if (clientError) {
                console.error('Failed to look up super client for charades game:', clientError);
                showNotification('Failed to find super client record. Cannot save game in Super Admin mode.', 'error');
                return; // abort save
            }
            if (!superClient) {
                console.warn('No super client record found for superadmin@glohub.com (charades)');
                showNotification('No super client record found. Cannot save game.', 'error');
                return; // abort save
            }
            gameClientId = superClient.id;
        }

        const gameData = { client_id: gameClientId, game_name: gameName, categories: charadesCategories };

        if (currentCharadesGame) {
            const { error } = await supabase.from('charades_games').update(gameData).eq('id', currentCharadesGame.id);
            if (error) throw error;
            showNotification('Game updated!', 'success');
        } else {
            const { data: newGame, error } = await supabase.from('charades_games').insert([gameData]).select().single();
            if (error) throw error;
            currentCharadesGame = newGame;
            showNotification('Game created!', 'success');
        }

        await generateCharadesCode(currentCharadesGame.id);

    } catch (error) {
        console.error('Error saving charades game:', error);
        showNotification('Failed to save game', 'error');
    }
}

async function generateCharadesCode(gameId) {
    try {
        let gameCode;
        let codeExists = true;

        while (codeExists) {
            gameCode = generateRandomCode(6);
            const { data } = await supabase.from('charades_games').select('game_code').eq('game_code', gameCode);
            codeExists = data && data.length > 0;
        }

        const { error } = await supabase.from('charades_games').update({ game_code: gameCode, game_type: 'charades' }).eq('id', gameId);
        if (error) throw error;

        const codeDisplay = document.getElementById('displayGameCode');
        if (codeDisplay) codeDisplay.textContent = gameCode;

        window.currentGameCode = gameCode;

        const modal = document.getElementById('gameCodeModal');
        if (modal) modal.classList.add('active');

        await loadCharadesGames();

    } catch (error) {
        console.error('Error generating charades code:', error);
        showNotification('Failed to generate code', 'error');
    }
}

async function editCharadesGame(gameId) {
    try {
        const { data: game, error } = await supabase.from('charades_games').select('*').eq('id', gameId).single();
        if (error) throw error;

        currentCharadesGame  = game;
        charadesCategories   = game.categories || [];

        const nameEl = document.getElementById('charadesGameName');
        if (nameEl) nameEl.value = game.game_name;

        updateCategoriesGrid();
        window.switchTab('charades-editor');

    } catch (error) {
        console.error('Error loading charades game:', error);
        showNotification('Failed to load game', 'error');
    }
}

async function deleteCharadesGame(gameId) {
    if (!confirm('Delete this charades game? This cannot be undone.')) return;
    try {
        const role = sessionStorage.getItem('role') || (sessionStorage.getItem('isSuperAdmin') === 'true' ? 'super' : 'client');
        const code = sessionStorage.getItem('superAdminCode') || sessionStorage.getItem('adminCode');

        const base = window.BACKEND_URL || '';
        const resp = await fetch(base + '/admin/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemType: 'charades_game', id: gameId, role, code })
        });

        const result = await resp.json();
        if (result.success) {
            showNotification('Game deleted', 'success');
            await loadCharadesGames();
        } else {
            throw new Error(result.message || 'delete failed');
        }
    } catch (error) {
        console.error('Error deleting charades game:', error);
        showNotification('Failed to delete game', 'error');
    }
}

// ==========================================
// GAME CODE FUNCTIONS
// ==========================================
function copyCode(code) {
    navigator.clipboard.writeText(code).then(() => {
        showNotification('Code copied to clipboard!', 'success');
    }).catch(() => {
        showNotification('Code copied!', 'success');
    });
}

function copyGameCode() {
    const code = document.getElementById('displayGameCode')?.textContent || '';
    if (code) copyCode(code);
}

function shareGameCode() {
    const code = window.currentGameCode;
    if (!code) return;

    if (navigator.share) {
        navigator.share({
            title: 'Join My Game',
            text: `Join my game with code: ${code}`,
            url: `${window.location.origin}/join-game.html?code=${code}`
        }).catch(() => {});
    } else {
        copyCode(code);
        showNotification('Code copied! Share it with your friends.', 'success');
    }
}

function joinOwnGame() {
    const code = window.currentGameCode;
    if (!code) return;
    window.location.href = `join-game.html?code=${code}`;
}

function closeGameCodeModal() {
    const modal = document.getElementById('gameCodeModal');
    if (modal) modal.classList.remove('active');
}

// ==========================================
// LEGACY FUNCTIONS (kept for compatibility)
// ==========================================
async function loadActiveSessionsForControl() {
    try {
        let query = supabase.from('game_sessions').select('*').eq('is_active', true).order('created_at', { ascending: false });
        if (!isSuperAdmin()) query = query.eq('client_id', currentClientId);
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

function loadThemeSettings() {
    // stub - only needed if theme tab exists
}

async function loadQuestions() {
    // stub - only needed if questions tab exists
}

async function loadSessions() {
    // stub - only needed if legacy sessions tab exists
}

async function loadPlayers() {
    // stub - only needed if players tab exists
}

function logout() {
    try { sessionStorage.clear(); } catch(e) {}
    try {
        ['adminCode','clientId','isSuperAdmin','superAdminId','superAdminCode','superAdminName'].forEach(k => localStorage.removeItem(k));
    } catch (e) {}
    if (playerCheckInterval) clearInterval(playerCheckInterval);
    if (gameDurationInterval) clearInterval(gameDurationInterval);
    window.location.href = 'index.html';
}

// ==========================================
// EXPOSE EVERYTHING ON WINDOW
// ==========================================
window.loadTabData              = loadTabData;
window.logout                   = logout;

// Quiz
window.createNewQuizSession     = createNewQuizSession;
window.selectQuizColor          = selectQuizColor;
window.showAddQuizQuestion      = showAddQuizQuestion;
window.cancelAddQuizQuestion    = cancelAddQuizQuestion;
window.saveQuizQuestion         = saveQuizQuestion;
window.deleteQuizQuestion       = deleteQuizQuestion;
window.saveQuizSession          = saveQuizSession;
window.generateQuizCode         = generateQuizCode;
window.editQuizSession          = editQuizSession;
window.deleteQuizSession        = deleteQuizSession;
window.viewQuizResults          = viewQuizResults;

// Charades
window.createNewCharadesGame    = createNewCharadesGame;
window.addNewCategory           = addNewCategory;
window.deleteCategory           = deleteCategory;
window.openCategoryEditor       = openCategoryEditor;
window.closeCategoryModal       = closeCategoryModal;
window.selectCategoryColor      = selectCategoryColor;
window.openEmojiPicker          = openEmojiPicker;
window.showAddFlashcard         = showAddFlashcard;
window.cancelAddFlashcard       = cancelAddFlashcard;
window.saveFlashcard            = saveFlashcard;
window.deleteFlashcard          = deleteFlashcard;
window.saveCategoryChanges      = saveCategoryChanges;
window.saveCharadesGame         = saveCharadesGame;
window.generateCharadesCode     = generateCharadesCode;
window.editCharadesGame         = editCharadesGame;
window.deleteCharadesGame       = deleteCharadesGame;

// Game code
window.copyCode                 = copyCode;
window.copyGameCode             = copyGameCode;
window.shareGameCode            = shareGameCode;
window.joinOwnGame              = joinOwnGame;
window.closeGameCodeModal       = closeGameCodeModal;

// Legacy
window.loadActiveSessionsForControl = loadActiveSessionsForControl;

console.log('admin.js loaded — all functions registered');