// Avatar Customization Logic

const avatarConfig = {
    preset: 'cute-pink',
    hairstyle: 'long-wavy',
    skinTone: '#ffd6cc',
    outfit: 'dress',
    accessories: []
};

const presets = {
    'cute-pink': { gradient: 'linear-gradient(135deg, #ff69b4, #ffb6d9)', emoji: '' },
    'queen': { gradient: 'linear-gradient(135deg, #ffd700, #fff4cc)', emoji: '' },
    'girly-purple': { gradient: 'linear-gradient(135deg, #da70d6, #f0d6f0)', emoji: '' },
    'sweet-peach': { gradient: 'linear-gradient(135deg, #ffb3ba, #ffe5e7)', emoji: '' },
    'mint-fresh': { gradient: 'linear-gradient(135deg, #98fb98, #e0ffe0)', emoji: '' },
    'sky-blue': { gradient: 'linear-gradient(135deg, #87ceeb, #e0f6ff)', emoji: '' }
};

const cuteMessages = [
    "Yesss girl, looking cute!",
    "Okay gorgeous, let's win this!",
    "Absolutely stunning!",
    "You look amazing!",
    "Serving looks!",
    "Queen energy!",
    "So pretty!",
    "Love this vibe!"
];

document.addEventListener('DOMContentLoaded', () => {
    const session = checkPlayerSession();
    if (!session) return;
    
    setupOptionTabs();
    setupAvatarCustomizer();
    renderAvatar();
});

function setupOptionTabs() {
    const tabs = document.querySelectorAll('.option-tab');
    const contents = document.querySelectorAll('.option-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const optionName = tab.dataset.option;
            
            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            tab.classList.add('active');
            document.getElementById(`content-${optionName}`).classList.add('active');
        });
    });
}

function setupAvatarCustomizer() {
    // Preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            avatarConfig.preset = btn.dataset.preset;
            renderAvatar();
            showRandomMessage();
        });
    });
    
    // Hairstyle
    document.getElementById('hairstyle').addEventListener('change', (e) => {
        avatarConfig.hairstyle = e.target.value;
        renderAvatar();
        showRandomMessage();
    });
    
    // Skin tone
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            avatarConfig.skinTone = btn.dataset.color;
            renderAvatar();
            showRandomMessage();
        });
    });
    
    // Outfit
    document.getElementById('outfit').addEventListener('change', (e) => {
        avatarConfig.outfit = e.target.value;
        renderAvatar();
        showRandomMessage();
    });
    
    // Accessories
    document.querySelectorAll('.accessory').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                avatarConfig.accessories.push(e.target.value);
            } else {
                avatarConfig.accessories = avatarConfig.accessories.filter(a => a !== e.target.value);
            }
            renderAvatar();
            showRandomMessage();
        });
    });
}

function renderAvatar() {
    const preview = document.getElementById('avatarPreview');
    const preset = presets[avatarConfig.preset];
    
    // Build avatar representation
    let avatarEmojis = [];
    
    // Add accessories as labels
    if (avatarConfig.accessories.includes('crown')) avatarEmojis.push('Crown');

    // Add hairstyle label
    const hairstyleLabels = {
        'long-wavy': 'Long Wavy',
        'short-bob': 'Short Bob',
        'ponytail': 'Ponytail',
        'braids': 'Braids',
        'curly': 'Curly',
        'bun': 'Bun'
    };
    avatarEmojis.push(hairstyleLabels[avatarConfig.hairstyle]);

    // Add outfit label
    const outfitLabels = {
        'dress': 'Dress',
        'casual': 'Casual',
        'glam': 'Glam',
        'sporty': 'Sporty'
    };
    avatarEmojis.push(outfitLabels[avatarConfig.outfit]);

    // Add more accessories
    if (avatarConfig.accessories.includes('glasses')) avatarEmojis.push('Glasses');
    if (avatarConfig.accessories.includes('earrings')) avatarEmojis.push('Earrings');
    if (avatarConfig.accessories.includes('necklace')) avatarEmojis.push('Necklace');
    
    preview.style.background = preset.gradient;
    preview.innerHTML = `
        <div style="font-size: 20px; text-align: center;">
            ${avatarEmojis.filter(Boolean).join(' ')}
        </div>
    `;
}

function showRandomMessage() {
    const username = sessionStorage.getItem('username');
    const message = cuteMessages[Math.floor(Math.random() * cuteMessages.length)];
    const messageEl = document.getElementById('avatarMessage');
    
    messageEl.textContent = `${username}, ${message}`;
    messageEl.style.opacity = '0';
    
    setTimeout(() => {
        messageEl.style.transition = 'opacity 0.3s';
        messageEl.style.opacity = '1';
    }, 100);
}

async function saveAvatar() {
    const session = checkPlayerSession();
    if (!session) return;
    
    try {
        // Create user in database
        const { data: user, error } = await supabase
            .from('users')
            .insert([
                {
                    username: session.username,
                    avatar_config: avatarConfig,
                    role: 'player',
                    session_id: session.sessionId
                }
            ])
            .select()
            .single();
        
        if (error) throw error;
        
        // Store user ID
        sessionStorage.setItem('userId', user.id);
        
        // Show final cute message
        const messageEl = document.getElementById('avatarMessage');
        messageEl.innerHTML = `
            <div style="font-size: 28px; color: #ff69b4;">
                Yesss ${session.username}! You look absolutely gorgeous!<br>
                Let's go have some fun!
            </div>
        `;
        
        // Redirect to game lobby after a moment
        setTimeout(() => {
            window.location.href = 'quiz-game.html';
        }, 2000);
        
    } catch (error) {
        console.error('Error saving avatar:', error);
        showNotification('Failed to save avatar. Please try again.', 'error');
    }
}