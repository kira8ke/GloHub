// Admin Dashboard Logic

let currentClientId = null;
let currentTheme = {};

document.addEventListener('DOMContentLoaded', async () => {
    const auth = checkAuth();
    if (!auth) return;
    
    currentClientId = auth.clientId;
    
    // Setup navigation
    setupNavigation();
    
    // Setup mobile menu toggle
    setupMobileMenu();
    
    // Load dashboard data
    await loadDashboardData();
    
    // Setup forms
    setupThemeForm();
    setupQuestionForm();
});

function setupMobileMenu() {
    // Add hamburger menu for mobile
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    
    // Create menu toggle button if it doesn't exist
    const dashboardContent = document.querySelector('.dashboard-content');
    if (dashboardContent && !document.querySelector('.mobile-menu-toggle')) {
        const toggle = document.createElement('button');
        toggle.className = 'mobile-menu-toggle';
        toggle.innerHTML = '☰';
        toggle.setAttribute('aria-label', 'Toggle menu');
        toggle.style.cssText = 'display: none; position: fixed; top: 10px; left: 10px; z-index: 1001; background: none; border: none; font-size: 28px; cursor: pointer; color: var(--primary);';
        document.body.appendChild(toggle);
        
        toggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
        
        // Hide menu when clicking content
        document.addEventListener('click', (e) => {
            if (!sidebar.contains(e.target) && !toggle.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        });
        
        // Show/hide toggle based on screen size
        window.addEventListener('resize', () => {
            if (window.innerWidth <= 768) {
                toggle.style.display = 'block';
            } else {
                toggle.style.display = 'none';
                sidebar.classList.remove('active');
            }
        });
        
        // Initial check
        if (window.innerWidth <= 768) {
            toggle.style.display = 'block';
        }
    }
}

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