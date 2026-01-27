// Avatar Customizer JavaScript
let selectedVibe = null;

// 12 Vibe Options
const vibes = [
    { id: 1, emoji: '👸🏻', name: 'Cute Pink Princess', desc: 'Sweet & girly', color: '#ff69b4' },
    { id: 2, emoji: '👑', name: 'Queen Energy', desc: 'Confident & bold', color: '#ffd700' },
    { id: 3, emoji: '✨', name: 'Sparkle Star', desc: 'Glam & shiny', color: '#da70d6' },
    { id: 4, emoji: '🌸', name: 'Soft Blossom', desc: 'Gentle & dreamy', color: '#ffb3ba' },
    { id: 5, emoji: '🔥', name: 'Hot Girl', desc: 'Fierce & fabulous', color: '#ff1493' },
    { id: 6, emoji: '💜', name: 'Purple Dreamer', desc: 'Mystical & creative', color: '#9370db' },
    { id: 7, emoji: '🍑', name: 'Peachy Keen', desc: 'Warm & friendly', color: '#ffdab9' },
    { id: 8, emoji: '🌈', name: 'Rainbow Vibes', desc: 'Colorful & fun', color: '#ff6b9d' },
    { id: 9, emoji: '💙', name: 'Cool Blue', desc: 'Calm & chill', color: '#87ceeb' },
    { id: 10, emoji: '🖤', name: 'Dark Babe', desc: 'Edgy & mysterious', color: '#4a4a4a' },
    { id: 11, emoji: '🌟', name: 'Golden Goddess', desc: 'Luxe & elegant', color: '#ffd700' },
    { id: 12, emoji: '💚', name: 'Mint Fresh', desc: 'Clean & crisp', color: '#98fb98' }
];

// Render vibe cards
function renderVibes() {
    const grid = document.getElementById('vibeGrid');
    if (!grid) return;
    
    vibes.forEach(vibe => {
        const card = document.createElement('div');
        card.className = 'vibe-card';
        card.innerHTML = `
            <div class="vibe-avatar">${vibe.emoji}</div>
            <div class="vibe-name">${vibe.name}</div>
            <div class="vibe-description">${vibe.desc}</div>
        `;
        card.onclick = () => selectVibe(vibe, card);
        grid.appendChild(card);
    });
}

// Select vibe
function selectVibe(vibe, cardElement) {
    selectedVibe = vibe;

    // Update card selection
    document.querySelectorAll('.vibe-card').forEach(c => c.classList.remove('selected'));
    cardElement.classList.add('selected');

    // Update preview
    const preview = document.getElementById('selectionPreview');
    if (preview) {
        const avatarEl = document.getElementById('previewAvatar');
        const textEl = document.getElementById('previewText');
        if (avatarEl) avatarEl.textContent = vibe.emoji;
        if (textEl) textEl.textContent = vibe.name;
        preview.classList.add('active');
    }

    // Enable submit if name is filled
    checkSubmitReady();
}

// Check if ready to submit
function checkSubmitReady() {
    const nameInput = document.getElementById('characterName');
    const btn = document.getElementById('submitBtn');
    if (nameInput && btn) {
        const name = nameInput.value.trim();
        btn.disabled = !(selectedVibe && name.length > 0);
    }
}

// Character name input
document.addEventListener('DOMContentLoaded', () => {
    const nameInput = document.getElementById('characterName');
    if (nameInput) {
        nameInput.addEventListener('input', checkSubmitReady);
    }
});

// Save and proceed
async function saveAndProceed() {
    const session = checkPlayerSession();
    if (!session) return;

    const characterName = document.getElementById('characterName').value.trim();
    
    if (!selectedVibe || !characterName) {
        alert('Please select a vibe and enter your character name!');
        return;
    }

    try {
        // Save avatar config
        const avatarConfig = {
            vibeId: selectedVibe.id,
            vibeName: selectedVibe.name,
            vibeEmoji: selectedVibe.emoji,
            vibeColor: selectedVibe.color,
            characterName: characterName
        };

        // Store in sessionStorage
        sessionStorage.setItem('avatarConfig', JSON.stringify(avatarConfig));
        sessionStorage.setItem('characterName', characterName);

        // Save to database
        const { data: user, error } = await supabase
            .from('users')
            .insert([{
                username: characterName,
                avatar_config: avatarConfig,
                role: 'player',
                session_id: session.sessionId
            }])
            .select()
            .single();

        if (error) throw error;

        sessionStorage.setItem('userId', user.id);

        // Show success and redirect
        showLoadingScreen();
        setTimeout(() => {
            window.location.href = 'quiz-game.html';
        }, 2000);

    } catch (error) {
        console.error('Error saving avatar:', error);
        alert('Failed to save avatar. Please try again.');
    }
}

function showLoadingScreen() {
    const phrases = [
        "Clock it, bestie! 💅",
        "Yurr girl is ready! ✨",
        "Let's slay this! 👑",
        "Boss babe unlocked! 💪"
    ];
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
    const characterName = document.getElementById('characterName').value;

    document.body.innerHTML = `
        <div style="
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #ff69b4, #ffb6d9, #fff5f8);
            text-align: center;
            padding: 20px;
        ">
            <div>
                <div style="font-size: 120px; margin-bottom: 20px; animation: bounce 1s infinite;">
                    ${selectedVibe.emoji}
                </div>
                <h2 style="color: white; font-size: clamp(24px, 5vw, 36px); text-shadow: 0 2px 10px rgba(0,0,0,0.2);">
                    ${randomPhrase}
                </h2>
                <p style="color: white; font-size: 20px; margin-top: 10px;">
                    Welcome, ${characterName}!
                </p>
            </div>
        </div>
    `;
}

// Check session
function checkPlayerSession() {
    const sessionId = sessionStorage.getItem('sessionId');
    const username = sessionStorage.getItem('username');
    
    if (!sessionId || !username) {
        window.location.href = 'join-game.html';
        return null;
    }
    
    return { sessionId, username };
}

// Initialize
window.addEventListener('load', () => {
    checkPlayerSession();
    renderVibes();
    checkSubmitReady();
});
