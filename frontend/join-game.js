// Join Game JavaScript
const joinForm = document.getElementById('joinForm');
const errorMsg = document.getElementById('errorMessage');

if (joinForm) {
    joinForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const code = document.getElementById('joinCode').value.trim().toUpperCase();
        const username = document.getElementById('username').value.trim();
        
        try {
            let session = null;
            let isSuperAdmin = false;
            let gameType = null;

            // Check if code length > 6 (super admin bypass code)
            if (code.length > 6) {
                // Query super_admins table
                const { data: superAdminData, error: superAdminError } = await supabase
                    .from('super_admins')
                    .select('*')
                    .eq('super_code', code)
                    .single();

                if (superAdminError || !superAdminData) {
                    showError('Invalid super admin code. Please check and try again.');
                    return;
                }

                // Super admin found
                session = superAdminData;
                isSuperAdmin = true;
            } else {
                // Standard game code (6 characters)
                // Check quiz_sessions first
                const { data: quizSession, error: quizError } = await supabase
                    .from('quiz_sessions')
                    .select('*')
                    .eq('game_code', code)
                    .single();

                if (quizSession && !quizError) {
                    session = quizSession;
                    gameType = 'quiz';
                    isSuperAdmin = false;
                } else {
                    // Check charades_games
                    const { data: charadesGame, error: charadesError } = await supabase
                        .from('charades_games')
                        .select('*')
                        .eq('game_code', code)
                        .single();

                    if (charadesGame && !charadesError) {
                        session = charadesGame;
                        gameType = 'charades';
                        isSuperAdmin = false;
                    } else {
                        showError('Invalid game code. Please check and try again.');
                        return;
                    }
                }
            }

            // Store session info
            sessionStorage.setItem('sessionId', session.id);
            sessionStorage.setItem('joinCode', code);
            sessionStorage.setItem('username', username);
            sessionStorage.setItem('isSuperAdmin', isSuperAdmin.toString());
            if (gameType) {
                sessionStorage.setItem('gameType', gameType);
            }
            
            // Redirect to avatar customizer
            window.location.href = 'avatar-select.html';
            
        } catch (err) {
            console.error('Join game error:', err);
            showError('Failed to join game. Please try again.');
        }
    });
}

function showError(message) {
    if (errorMsg) {
        errorMsg.textContent = message;
        errorMsg.style.display = 'block';
    }
}

// Auto-uppercase game code
const joinCodeInput = document.getElementById('joinCode');
if (joinCodeInput) {
    joinCodeInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
    });
}
