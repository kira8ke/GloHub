// Admin Dashboard Logic

let currentClientId = null;
let currentTheme = {};

document.addEventListener('DOMContentLoaded', async () => {
    const auth = checkAuth();
    if (!auth) return;
    
    currentClientId = auth.clientId;
    
    // Setup navigation
    setupNavigation();
    
    // Load dashboard data
    await loadDashboardData();

    // Initialize session cards navigation
    initializeSessionCards();
    
    // Setup forms
    setupThemeForm();
    setupQuestionForm();
});



function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const tab = item.dataset.tab;
            switchTab(tab);
        });
    });
}

function switchTab(tabName) {
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
    document.getElementById(tabName).classList.add('active');
    
    // Load specific tab data
    loadTabData(tabName);
}

async function loadDashboardData() {
    try {
        // Load client info
        const { data: client } = await supabase
            .from('clients')
            .select('*')
            .eq('id', currentClientId)
            .single();
        
        if (client && client.theme_config) {
            currentTheme = client.theme_config;
        }
        
        // Load stats
        await loadStats();
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

async function loadStats() {
    try {
        // Total sessions
        const { count: sessionsCount } = await supabase
            .from('sessions')
            .select('*', { count: 'exact', head: true })
            .eq('client_id', currentClientId);
        
        document.getElementById('totalSessions').textContent = sessionsCount || 0;
        
        // Total players
        const { count: playersCount } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'player');
        
        document.getElementById('totalPlayers').textContent = playersCount || 0;
        
        // Total questions
        const { count: questionsCount } = await supabase
            .from('questions')
            .select('*', { count: 'exact', head: true })
            .eq('client_id', currentClientId);
        
        document.getElementById('totalQuestions').textContent = questionsCount || 0;
        
        // Active sessions (created in last 24 hours)
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { count: activeCount } = await supabase
            .from('sessions')
            .select('*', { count: 'exact', head: true })
            .eq('client_id', currentClientId)
            .gte('created_at', yesterday);
        
        document.getElementById('activeSessions').textContent = activeCount || 0;
        
    } catch (error) {
        console.error('Error loading stats:', error);
    }
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
    }
}

function setupThemeForm() {
    const form = document.getElementById('themeForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const theme = {
            primary: document.getElementById('primaryColor').value,
            secondary: document.getElementById('secondaryColor').value,
            accent: document.getElementById('accentColor').value
        };
        
        try {
            await supabase
                .from('clients')
                .update({ theme_config: theme })
                .eq('id', currentClientId);
            
            currentTheme = theme;
            showNotification('Theme updated successfully!', 'success');
            
        } catch (error) {
            console.error('Error updating theme:', error);
            showNotification('Failed to update theme', 'error');
        }
    });
}

function loadThemeSettings() {
    if (currentTheme.primary) {
        document.getElementById('primaryColor').value = currentTheme.primary;
        document.getElementById('secondaryColor').value = currentTheme.secondary;
        document.getElementById('accentColor').value = currentTheme.accent;
    }
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
        
        const question = {
            client_id: currentClientId,
            question_text: document.getElementById('questionText').value,
            options: [
                document.getElementById('option1').value,
                document.getElementById('option2').value,
                document.getElementById('option3').value,
                document.getElementById('option4').value
            ],
            correct_answer: parseInt(document.getElementById('correctAnswer').value) - 1
        };
        
        try {
            await supabase
                .from('questions')
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
        const { data: questions } = await supabase
            .from('questions')
            .select('*')
            .eq('client_id', currentClientId)
            .order('created_at', { ascending: false });
        
        const list = document.getElementById('questionsList');
        if (!questions || questions.length === 0) {
            list.innerHTML = '<p style="text-align: center; color: #666;">No questions yet. Add your first question!</p>';
            return;
        }
        
        list.innerHTML = questions.map((q, index) => `
            <div class="question-item">
                <div>
                    <strong>Q${index + 1}:</strong> ${q.question_text}
                    <div style="font-size: 14px; color: #666; margin-top: 5px;">
                        Correct: ${q.options[q.correct_answer]}
                    </div>
                </div>
                <button class="btn-secondary" onclick="deleteQuestion('${q.id}')">Delete</button>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading questions:', error);
    }
}

async function deleteQuestion(questionId) {
    if (!confirm('Are you sure you want to delete this question?')) return;
    
    try {
        await supabase
            .from('questions')
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
        // Generate unique join code
        let joinCode;
        let codeExists = true;
        
        while (codeExists) {
            joinCode = generateRandomCode(6);
            const { data } = await supabase
                .from('sessions')
                .select('join_code')
                .eq('join_code', joinCode);
            codeExists = data && data.length > 0;
        }
        
        // Create session
        const { data: session, error } = await supabase
            .from('sessions')
            .insert([
                {
                    client_id: currentClientId,
                    join_code: joinCode
                }
            ])
            .select()
            .single();
        
        if (error) throw error;
        
        showNotification(`Session created! Join code: ${joinCode}`, 'success');
        await loadSessions();
        await loadStats();
        
    } catch (error) {
        console.error('Error creating session:', error);
        showNotification('Failed to create session', 'error');
    }
}

async function loadSessions() {
    try {
        const { data: sessions } = await supabase
            .from('sessions')
            .select('*')
            .eq('client_id', currentClientId)
            .order('created_at', { ascending: false });
        
        const list = document.getElementById('sessionsList');
        if (!sessions || sessions.length === 0) {
            list.innerHTML = '<p style="text-align: center; color: #666;">No sessions yet. Create your first game!</p>';
            return;
        }
        
        list.innerHTML = sessions.map(s => `
            <div class="session-item">
                <div>
                    <strong>Join Code: ${s.join_code}</strong>
                    <div style="font-size: 14px; color: #666;">
                        Created: ${formatDate(s.created_at)} at ${formatTime(s.created_at)}
                    </div>
                </div>
                <button class="btn-secondary" onclick="deleteSession('${s.id}')">Delete</button>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading sessions:', error);
    }
}

// Initialize session cards with navigation
function initializeSessionCards() {
    const container = document.getElementById('sessionsCardsContainer');
    const prevBtn = document.getElementById('prevCard');
    const nextBtn = document.getElementById('nextCard');
    
    if (!container || !prevBtn || !nextBtn) return;
    
    // Navigation handlers
    prevBtn.addEventListener('click', () => {
        const scrollAmount = container.offsetWidth * 0.8;
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });
    
    nextBtn.addEventListener('click', () => {
        const scrollAmount = container.offsetWidth * 0.8;
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });
    
    // Update button states
    function updateNavButtons() {
        const isAtStart = container.scrollLeft <= 10;
        const isAtEnd = container.scrollLeft >= container.scrollWidth - container.offsetWidth - 10;
        
        prevBtn.disabled = isAtStart;
        nextBtn.disabled = isAtEnd;
    }
    
    container.addEventListener('scroll', updateNavButtons);
    updateNavButtons();
    
    // Touch swipe support
    let touchStartX = 0;
    let touchEndX = 0;
    
    container.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });
    
    container.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });
    
    function handleSwipe() {
        if (touchStartX - touchEndX > 50) {
            // Swipe left
            nextBtn.click();
        }
        if (touchEndX - touchStartX > 50) {
            // Swipe right
            prevBtn.click();
        }
    }
}

// Modified loadSessions function
async function loadSessions() {
    try {
        const { data: sessions } = await supabase
            .from('sessions')
            .select('*')
            .eq('client_id', currentClientId)
            .order('created_at', { ascending: false });
        
        // Populate cards container
        const cardsContainer = document.getElementById('sessionsCardsContainer');
        if (cardsContainer) {
            if (!sessions || sessions.length === 0) {
                cardsContainer.innerHTML = `
                    <div class="session-card" style="flex: 0 0 100%; min-height: 400px; display: flex; align-items: center; justify-content: center;">
                        <p style="text-align: center; color: #666;">No events yet. Create your first one!</p>
                    </div>
                `;
            } else {
                // Display up to 6 most recent sessions as cards
                const recentSessions = sessions.slice(0, 6);
                cardsContainer.innerHTML = recentSessions.map((s, index) => `
                    <div class="session-card" style="position: relative;">
                        <span class="session-card-badge">Active</span>
                        <img src="https://images.unsplash.com/photo-${1517457373958 + index * 1000}-3f3c69d1d4a4?w=400&h=600&fit=crop" 
                             alt="Event ${index + 1}" 
                             class="session-card-image"
                             onerror="this.src='https://via.placeholder.com/400x600/ffb6d9/ffffff?text=Event+${index + 1}'">
                        <div class="session-card-content">
                            <div class="session-card-title">Event ${s.join_code}</div>
                            <div class="session-card-meta">
                                <span>${formatDate(s.created_at)}</span>
                                <span>${formatTime(s.created_at)}</span>
                            </div>
                        </div>
                    </div>
                `).join('');
            }
            
            // Initialize navigation after cards are loaded
            setTimeout(initializeSessionCards, 100);
        }
        
        // Populate sessions list (existing functionality)
        const list = document.getElementById('sessionsList');
        if (!sessions || sessions.length === 0) {
            list.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No sessions yet.</p>';
            return;
        }
        
        list.innerHTML = '<h3 style="margin: 40px 0 20px; color: var(--primary);">All Sessions</h3>' +
            sessions.map(s => `
            <div class="session-item">
                <div>
                    <strong>Join Code: ${s.join_code}</strong>
                    <div style="font-size: 14px; color: #666;">
                        Created: ${formatDate(s.created_at)} at ${formatTime(s.created_at)}
                    </div>
                </div>
                <button class="btn-secondary" onclick="deleteSession('${s.id}')">Delete</button>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading sessions:', error);
    }
}

async function deleteSession(sessionId) {
    if (!confirm('Are you sure you want to delete this session?')) return;
    
    try {
        await supabase
            .from('sessions')
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
        // Get all sessions for this client
        const { data: sessions } = await supabase
            .from('sessions')
            .select('id')
            .eq('client_id', currentClientId);
        
        if (!sessions || sessions.length === 0) {
            document.getElementById('playersList').innerHTML = 
                '<p style="text-align: center; color: #666;">No players yet. Create a session first!</p>';
            return;
        }
        
        const sessionIds = sessions.map(s => s.id);
        
        // Get users who joined these sessions
        const { data: players } = await supabase
            .from('users')
            .select('*')
            .in('session_id', sessionIds)
            .eq('role', 'player')
            .order('created_at', { ascending: false });
        
        const list = document.getElementById('playersList');
        if (!players || players.length === 0) {
            list.innerHTML = '<p style="text-align: center; color: #666;">No players yet!</p>';
            return;
        }
        
        list.innerHTML = players.map(p => `
            <div class="player-item">
                <div>
                    <strong>${p.username}</strong>
                    <div style="font-size: 14px; color: #666;">
                        Joined: ${formatDate(p.created_at)}
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
            .from('users')
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
    sessionStorage.clear();
    window.location.href = 'index.html';
}