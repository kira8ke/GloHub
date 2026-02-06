// Spin-to-Win Game Logic

const wheelOptions = [
    { text: 'Truth', color: '#ff69b4', value: 'truth' },
    { text: 'Dare', color: '#ff1493', value: 'dare' },
    { text: 'Dare Light', color: '#ffb6d9', value: 'dare-light' },
    { text: 'Affirmation', color: '#ffc0cb', value: 'affirmation' },
    { text: 'Truth', color: '#ff69b4', value: 'truth' },
    { text: 'Dare', color: '#ff1493', value: 'dare' },
    { text: 'Dare Light', color: '#ffb6d9', value: 'dare-light' },
    { text: 'Affirmation', color: '#ffc0cb', value: 'affirmation' }
];

const prompts = {
    'truth': [
        "What's your biggest secret?",
        "Who was your first crush?",
        "What's the most embarrassing thing you've done?",
        "If you could date anyone, who would it be?",
        "What's a lie you told that you regret?"
    ],
    'dare': [
        "Do your best dance move right now!",
        "Call someone and sing them a song!",
        "Post an embarrassing photo!",
        "Do 20 pushups!",
        "Text your crush!"
    ],
    'dare-light': [
        "Give everyone a compliment!",
        "Share your favorite memory!",
        "Do a silly pose for a photo!",
        "Tell a funny joke!",
        "Show us your best smile!"
    ],
    'affirmation': [
        "You are absolutely amazing!",
        "Your energy lights up every room!",
        "You deserve all the good things coming your way!",
        "You are beautiful inside and out!",
        "Your kindness makes the world better!"
    ]
};

let canvas, ctx;
let isSpinning = false;
let currentRotation = 0;
let spinHistory = [];

document.addEventListener('DOMContentLoaded', () => {
    const session = checkPlayerSession();
    if (!session) return;
    
    document.getElementById('playerName').textContent = `${session.username}`;
    document.getElementById('gameCode').textContent = `Code: ${session.sessionId}`;
    
    initWheel();
    setupSpinButton();
    loadSpinHistory();
});

function initWheel() {
    canvas = document.getElementById('wheelCanvas');
    ctx = canvas.getContext('2d');
    
    // Make canvas responsive for mobile
    const container = canvas.parentElement;
    const maxSize = Math.min(window.innerWidth - 40, 400);
    
    canvas.width = maxSize;
    canvas.height = maxSize;
    
    // Adjust canvas for device pixel ratio on mobile
    if (window.devicePixelRatio > 1) {
        canvas.width = maxSize * window.devicePixelRatio;
        canvas.height = maxSize * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    
    drawWheel();
    
    // Redraw on window resize
    window.addEventListener('resize', () => {
        const newSize = Math.min(window.innerWidth - 40, 400);
        canvas.width = newSize;
        canvas.height = newSize;
        if (window.devicePixelRatio > 1) {
            canvas.width = newSize * window.devicePixelRatio;
            canvas.height = newSize * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        }
        drawWheel(currentRotation);
    });
}

function drawWheel(rotation = 0) {
    const centerX = canvas.width / (2 * window.devicePixelRatio || 1);
    const centerY = canvas.height / (2 * window.devicePixelRatio || 1);
    const canvasSize = canvas.width / (window.devicePixelRatio || 1);
    const radius = canvasSize * 0.35; // Use responsive radius
    const sliceAngle = (2 * Math.PI) / wheelOptions.length;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    wheelOptions.forEach((option, index) => {
        const startAngle = index * sliceAngle + rotation;
        const endAngle = startAngle + sliceAngle;
        
        // Draw slice
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = option.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Draw text
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + sliceAngle / 2);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(option.text, radius * 0.65, 0);
        ctx.restore();
    });
    
    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#ff69b4';
    ctx.lineWidth = 4;
    ctx.stroke();
}

function setupSpinButton() {
    const spinBtn = document.getElementById('spinButton');
    spinBtn.addEventListener('click', spin);
}

function spin() {
    if (isSpinning) return;
    
    isSpinning = true;
    document.getElementById('spinButton').disabled = true;
    document.getElementById('spinResult').style.display = 'none';
    
    // Random spin parameters
    const minSpins = 5;
    const maxSpins = 8;
    const spins = minSpins + Math.random() * (maxSpins - minSpins);
    const duration = 4000;
    const startTime = Date.now();
    const startRotation = currentRotation;
    const totalRotation = spins * 2 * Math.PI;
    
    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth deceleration
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        currentRotation = startRotation + totalRotation * easeOut;
        drawWheel(currentRotation);
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            finishSpin();
        }
    }
    
    animate();
}

function finishSpin() {
    isSpinning = false;
    
    // Calculate which option was selected
    const normalizedRotation = currentRotation % (2 * Math.PI);
    const sliceAngle = (2 * Math.PI) / wheelOptions.length;
    const selectedIndex = Math.floor((2 * Math.PI - normalizedRotation + Math.PI / 2) / sliceAngle) % wheelOptions.length;
    const selectedOption = wheelOptions[selectedIndex];
    
    // Get random prompt for this category
    const categoryPrompts = prompts[selectedOption.value];
    const randomPrompt = categoryPrompts[Math.floor(Math.random() * categoryPrompts.length)];
    
    // Show result
    showResult(selectedOption, randomPrompt);
    
    // Save to history
    saveToHistory(selectedOption, randomPrompt);
}

function showResult(option, prompt) {
    const resultDiv = document.getElementById('spinResult');
    const resultText = document.getElementById('resultText');
    
    resultText.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 20px;">${option.text}</div>
        <div style="font-size: 24px; color: ${option.color}; font-weight: bold; margin-bottom: 20px;">
            ${prompt}
        </div>
    `;
    
    resultDiv.style.display = 'block';
    
    // Re-enable spin button
    setTimeout(() => {
        document.getElementById('spinButton').disabled = false;
    }, 1000);
}

function saveToHistory(option, prompt) {
    const username = sessionStorage.getItem('username');
    const historyItem = {
        username,
        option: option.text,
        prompt,
        timestamp: new Date().toLocaleTimeString()
    };
    
    spinHistory.unshift(historyItem);
    if (spinHistory.length > 10) {
        spinHistory = spinHistory.slice(0, 10);
    }
    
    updateHistoryDisplay();
}

function updateHistoryDisplay() {
    const historyList = document.getElementById('historyList');
    
    if (spinHistory.length === 0) {
        historyList.innerHTML = '<p style="text-align: center; color: #666;">No spins yet!</p>';
        return;
    }
    
    historyList.innerHTML = spinHistory.map(item => `
        <div class="history-item">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <strong>${item.username}</strong>
                <span style="color: #666; font-size: 12px;">${item.timestamp}</span>
            </div>
            <div style="color: #ff69b4;">${item.option}</div>
            <div style="font-size: 14px; color: #666;">${item.prompt}</div>
        </div>
    `).join('');
}

function loadSpinHistory() {
    // In a real app, load from database
    updateHistoryDisplay();
}

function resetSpin() {
    document.getElementById('spinResult').style.display = 'none';
    document.getElementById('spinButton').disabled = false;
}