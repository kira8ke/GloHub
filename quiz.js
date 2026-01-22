// Quiz Game Logic

let currentSession = null;
let questions = [];
let currentQuestionIndex = 0;
let playerScore = 0;
let timeLeft = 10;
let timer = null;
let hasAnswered = false;

document.addEventListener('DOMContentLoaded', async () => {
    const session = checkPlayerSession();
    if (!session) return;
    
    // Display player info
    document.getElementById('playerName').textContent = `${session.username}`;
    document.getElementById('gameCode').textContent = `Code: ${session.sessionId}`;
    
    // Load session data
    await loadSessionData(session.sessionId);
    
    // Show lobby initially
    showLobby();
});

async function loadSessionData(sessionId) {
    try {
        const { data: sessionData } = await supabase
            .from('sessions')
            .select('*, clients(*)')
            .eq('id', sessionId)
            .single();
        
        if (!sessionData) {
            showNotification('Session not found', 'error');
            return;
        }
        
        currentSession = sessionData;
        
        // Load questions for this client
        const { data: questionsData } = await supabase
            .from('questions')
            .select('*')
            .eq('client_id', sessionData.client_id);
        
        questions = questionsData || [];
        
        // Shuffle questions
        questions = questions.sort(() => Math.random() - 0.5);
        
    } catch (error) {
        console.error('Error loading session:', error);
    }
}

function showLobby() {
    document.getElementById('lobby').style.display = 'block';
    document.getElementById('quizGame').style.display = 'none';
    document.getElementById('leaderboard').style.display = 'none';
    document.getElementById('finalResults').style.display = 'none';
    
    // In a real app, you'd wait for admin to start game
    // For now, auto-start after 3 seconds
    setTimeout(() => {
        if (questions.length > 0) {
            startQuiz();
        } else {
            document.getElementById('lobby').innerHTML = `
                <h2>No questions available</h2>
                <p>The admin hasn't added any questions yet.</p>
            `;
        }
    }, 3000);
}

function startQuiz() {
    currentQuestionIndex = 0;
    playerScore = 0;
    
    document.getElementById('lobby').style.display = 'none';
    document.getElementById('quizGame').style.display = 'block';
    
    loadQuestion();
}

function loadQuestion() {
    if (currentQuestionIndex >= questions.length) {
        showFinalResults();
        return;
    }
    
    hasAnswered = false;
    timeLeft = 10;
    
    const question = questions[currentQuestionIndex];
    
    document.getElementById('questionNumber').textContent = 
        `Question ${currentQuestionIndex + 1} of ${questions.length}`;
    document.getElementById('questionText').textContent = question.question_text;
    
    // Clear previous answer feedback
    document.getElementById('answerFeedback').style.display = 'none';
    
    // Render answer options
    const answersGrid = document.getElementById('answersGrid');
    answersGrid.innerHTML = question.options.map((option, index) => `
        <button class="answer-btn" onclick="selectAnswer(${index})">
            ${option}
        </button>
    `).join('');
    
    // Start timer
    startTimer();
}

function startTimer() {
    clearInterval(timer);
    
    timer = setInterval(() => {
        timeLeft--;
        document.getElementById('questionTimer').textContent = `${timeLeft}s`;
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            if (!hasAnswered) {
                showCorrectAnswer();
                setTimeout(() => {
                    currentQuestionIndex++;
                    showLeaderboard();
                }, 2000);
            }
        }
    }, 1000);
}

async function selectAnswer(selectedIndex) {
    if (hasAnswered) return;
    
    hasAnswered = true;
    clearInterval(timer);
    
    const question = questions[currentQuestionIndex];
    const isCorrect = selectedIndex === question.correct_answer;
    
    if (isCorrect) {
        playerScore += 100;

         // ADD CELEBRATION EFFECT
        if (window.gameAnimations) {
            window.gameAnimations.celebrateWithConfetti();
        }
    } else {
        // ADD SHAKE EFFECT FOR WRONG ANSWER
        const feedback = document.getElementById('answerFeedback');
        if (window.gameAnimations && feedback) {
            window.gameAnimations.shakeElement(feedback);
        }
    }
    
    // Visual feedback
    const buttons = document.querySelectorAll('.answer-btn');
    buttons.forEach((btn, index) => {
        btn.disabled = true;
        if (index === question.correct_answer) {
            btn.classList.add('correct');
        } else if (index === selectedIndex && !isCorrect) {
            btn.classList.add('incorrect');
        }
    });
    
    // Show feedback
    const feedback = document.getElementById('answerFeedback');
    feedback.style.display = 'block';
    feedback.textContent = isCorrect ? 
        'Correct! +100 points!' : 
        'Oops! Better luck next time!';
    feedback.style.background = isCorrect ? '#4caf50' : '#f44336';
    feedback.style.color = 'white';
    feedback.style.padding = '15px';
    feedback.style.borderRadius = '10px';
    
    // Save response
    try {
        await supabase
            .from('responses')
            .insert([
                {
                    session_id: currentSession.id,
                    user_id: sessionStorage.getItem('userId'),
                    question_id: question.id,
                    answer: selectedIndex,
                    is_correct: isCorrect
                }
            ]);
    } catch (error) {
        console.error('Error saving response:', error);
    }
    
    // Move to next question after delay
    setTimeout(() => {
        currentQuestionIndex++;
        showLeaderboard();
    }, 2000);
}

function showCorrectAnswer() {
    const question = questions[currentQuestionIndex];
    const buttons = document.querySelectorAll('.answer-btn');
    
    buttons.forEach((btn, index) => {
        btn.disabled = true;
        if (index === question.correct_answer) {
            btn.classList.add('correct');
        }
    });
    
    const feedback = document.getElementById('answerFeedback');
    feedback.style.display = 'block';
    feedback.textContent = 'Time\'s up!';
    feedback.style.background = '#ff9800';
    feedback.style.color = 'white';
    feedback.style.padding = '15px';
    feedback.style.borderRadius = '10px';
}

async function showLeaderboard() {
    document.getElementById('quizGame').style.display = 'none';
    document.getElementById('leaderboard').style.display = 'block';
    
    // In a real multiplayer game, you'd load all players' scores
    // For now, just show current player
    const leaderboardList = document.getElementById('leaderboardList');
    leaderboardList.innerHTML = `
                <div class="leaderboard-item">
            <div>
                <strong>${sessionStorage.getItem('username')}</strong>
            </div>
            <div style="font-size: 20px; font-weight: bold; color: #ff69b4;">
                ${playerScore} points
            </div>
        </div>
    `;
}

function nextQuestion() {
    document.getElementById('leaderboard').style.display = 'none';
    document.getElementById('quizGame').style.display = 'block';
    loadQuestion();
}

function showFinalResults() {
    document.getElementById('quizGame').style.display = 'none';
    document.getElementById('leaderboard').style.display = 'none';
    document.getElementById('finalResults').style.display = 'block';
    
    const finalLeaderboard = document.getElementById('finalLeaderboard');
    finalLeaderboard.innerHTML = `
            <div class="leaderboard-item" style="background: linear-gradient(135deg, #ffd700, #fff4cc); padding: 30px;">
            <div>
                <strong style="font-size: 24px;">${sessionStorage.getItem('username')}</strong>
                <div style="font-size: 14px; margin-top: 10px;">You're amazing!</div>
            </div>
            <div style="font-size: 32px; font-weight: bold; color: #ff69b4;">
                ${playerScore} points
            </div>
        </div>
    `;
}

function backToLobby() {
    currentQuestionIndex = 0;
    playerScore = 0;
    showLobby();
}