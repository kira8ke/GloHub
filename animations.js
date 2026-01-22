// Game-Style Scroll Animations
// Initialize animations when DOM is loaded

document.addEventListener('DOMContentLoaded', () => {
    initScrollAnimations();
    initHoverEffects();
    initClickEffects();
});

// Intersection Observer for scroll animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                
                // Add specific animation class based on data attribute
                const animationType = entry.target.dataset.animation;
                if (animationType) {
                    entry.target.classList.add(animationType);
                }
                
                // Optional: Unobserve after animation
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all elements with animate-on-scroll class
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });
}

// Add game-style hover effects
function initHoverEffects() {
    // Add hover class to interactive elements
    const interactiveElements = document.querySelectorAll(
        '.feature-card, .step, .stat-card, .session-card, .question-item, .btn-primary, .btn-secondary'
    );
    
    interactiveElements.forEach(el => {
        el.classList.add('game-hover');
        
        // Add sound effect on hover (optional)
        el.addEventListener('mouseenter', () => {
            // playHoverSound(); // Implement if you want sounds
        });
    });
}

// Add click effects
function initClickEffects() {
    const clickableElements = document.querySelectorAll(
        'button, .btn-primary, .btn-secondary, .btn-large, .answer-btn'
    );
    
    clickableElements.forEach(el => {
        el.classList.add('click-effect');
    });
}

// Utility: Add animation to element programmatically
function animateElement(element, animationType, delay = 0) {
    setTimeout(() => {
        element.classList.add('animate-on-scroll', animationType, 'animated');
    }, delay);
}

// Utility: Trigger shake animation (for errors or attention)
function shakeElement(element) {
    element.style.animation = 'shake 0.5s ease';
    setTimeout(() => {
        element.style.animation = '';
    }, 500);
}

// Utility: Trigger wiggle animation (for playful interactions)
function wiggleElement(element) {
    element.style.animation = 'wiggle 0.5s ease';
    setTimeout(() => {
        element.style.animation = '';
    }, 500);
}

// Optional: Add particle effects on click
function createParticleEffect(x, y) {
    const colors = ['#ff69b4', '#ffb6d9', '#ff1493', '#ffc0cb'];
    const particleCount = 8;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: fixed;
            width: 10px;
            height: 10px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            left: ${x}px;
            top: ${y}px;
        `;
        
        document.body.appendChild(particle);
        
        const angle = (Math.PI * 2 * i) / particleCount;
        const velocity = 100;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;
        
        let opacity = 1;
        let posX = x;
        let posY = y;
        
        const animate = () => {
            opacity -= 0.02;
            posX += vx * 0.016;
            posY += vy * 0.016;
            
            particle.style.opacity = opacity;
            particle.style.transform = `translate(${posX - x}px, ${posY - y}px)`;
            
            if (opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                particle.remove();
            }
        };
        
        animate();
    }
}

// Optional: Add confetti effect for celebrations
function celebrateWithConfetti() {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        // Create simple confetti particles
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            const colors = ['#ff69b4', '#ffb6d9', '#ff1493', '#ffc0cb', '#ffd700'];
            
            particle.style.cssText = `
                position: fixed;
                width: ${randomInRange(5, 15)}px;
                height: ${randomInRange(5, 15)}px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                left: ${randomInRange(0, window.innerWidth)}px;
                top: -20px;
                opacity: 1;
                pointer-events: none;
                z-index: 9999;
                border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
            `;
            
            document.body.appendChild(particle);
            
            const fallDuration = randomInRange(2000, 4000);
            const endY = window.innerHeight + 20;
            const rotation = randomInRange(0, 360);
            
            particle.animate([
                { transform: `translateY(0) rotate(0deg)`, opacity: 1 },
                { transform: `translateY(${endY}px) rotate(${rotation}deg)`, opacity: 0 }
            ], {
                duration: fallDuration,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }).onfinish = () => particle.remove();
        }
    }, 250);
}

// Export utilities for use in other scripts
window.gameAnimations = {
    animateElement,
    shakeElement,
    wiggleElement,
    createParticleEffect,
    celebrateWithConfetti
};