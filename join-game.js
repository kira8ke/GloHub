// Join Game JavaScript
const joinForm = document.getElementById('joinForm');
const errorMsg = document.getElementById('errorMessage');

if (joinForm) {
    joinForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const code = document.getElementById('joinCode').value.trim().toUpperCase();
        const username = document.getElementById('username').value.trim();
        
        try {
            // Check if session exists
            const { data: session, error } = await supabase
                .from('sessions')
                .select('*')
                .eq('join_code', code)
                .single();

            if (error || !session) {
                showError('Invalid game code. Please check and try again.');
                return;
            }

            // Store session info
            sessionStorage.setItem('sessionId', session.id);
            sessionStorage.setItem('joinCode', code);
            sessionStorage.setItem('username', username);
            
            // Redirect to avatar customizer
            window.location.href = 'avatar-customizer.html';
            
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
