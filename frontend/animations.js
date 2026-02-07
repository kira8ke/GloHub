// animations.js - Interactive animations for GloHub

// Scroll-triggered animations
function initScrollAnimations() {
    const elements = document.querySelectorAll('.animate-on-scroll');
    if (!elements.length) return;

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const animation = entry.target.dataset.animation;
                entry.target.classList.add('animated', animation);
            }
        });
    });

    elements.forEach(el => observer.observe(el));
}


// Header scroll effect
function initHeaderScroll() {
    const header = document.querySelector('.header');
    if (!header) return; //prevents errors

    let lastScroll = 0;

     window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        header.classList.toggle('scrolled', currentScroll > 50);

        if (currentScroll > lastScroll && currentScroll > 100) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        }

        lastScroll = currentScroll;
    });
}

// Parallax effect for hero section
function initParallax() {
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const parallaxElements = document.querySelectorAll('.hero-enhanced');
        
        parallaxElements.forEach(el => {
            const speed = 0.5;
            el.style.transform = `translateY(${scrolled * speed}px)`;
        });
    });
}

// Interactive hover effects
function initHoverEffects() {
    // Feature cards tilt effect
    const cards = document.querySelectorAll('.feature-card, .carousel-card, .step-enhanced');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
        });
    });
}

// Ripple effect on buttons
function initRippleEffect() {
    const buttons = document.querySelectorAll('button, .btn-primary, .btn-secondary, .btn-large');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple-effect');
            
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });
}

// Smooth scroll for navigation
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Mobile menu functions
function toggleMobileMenu() {
    const nav = document.getElementById('mobileNav');
    const overlay = document.getElementById('menuOverlay');
    const toggle = document.querySelector('.menu-toggle');
    
    nav.classList.toggle('active');
    overlay.classList.toggle('active');
    
    // Animate menu toggle
    if (nav.classList.contains('active')) {
        toggle.textContent = '✕';
    } else {
        toggle.textContent = '☰';
    }
}

function closeMobileMenu() {
    const nav = document.getElementById('mobileNav');
    const overlay = document.getElementById('menuOverlay');
    const toggle = document.querySelector('.menu-toggle');
    
    nav.classList.remove('active');
    overlay.classList.remove('active');
    toggle.textContent = '☰';
}

// Add CSS for ripple effect
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
    button, .btn-primary, .btn-secondary, .btn-large {
        position: relative;
        overflow: hidden;
    }

    .ripple-effect {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple-animation 0.6s ease-out;
        pointer-events: none;
    }

    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(rippleStyle);

// Initialize all animations when DOM is ready (single handler)
document.addEventListener('DOMContentLoaded', () => {
    initScrollAnimations();
    initHeaderScroll();
    initParallax();
    initHoverEffects();
    initRippleEffect();
    initSmoothScroll();
});

// Expose functions globally (safely)
window.toggleMobileMenu = function() {
    const nav = document.getElementById('mobileNav');
    const overlay = document.getElementById('menuOverlay');
    const toggle = document.querySelector('.menu-toggle');
    if (!nav || !overlay || !toggle) return;
    nav.classList.toggle('active');
    overlay.classList.toggle('active');
    if (nav.classList.contains('active')) {
        toggle.textContent = '✕';
    } else {
        toggle.textContent = '☰';
    }
};

window.closeMobileMenu = function() {
    const nav = document.getElementById('mobileNav');
    const overlay = document.getElementById('menuOverlay');
    const toggle = document.querySelector('.menu-toggle');
    if (nav) nav.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    if (toggle) toggle.textContent = '☰';
};

// Guarded smooth scroll (skip if no matching target)
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            const target = href ? document.querySelector(href) : null;
            if (!target) return;
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
}
