// GloHub - Main JavaScript

// ==========================================
// PULSATING HEARTS (SVG)
// ==========================================
function createPulsatingHearts() {
    const container = document.getElementById('heartsContainer');
    if (!container) return;

    const heartSVG = `
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="heartGradient{ID}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#ff69b4;stop-opacity:1" />
                    <stop offset="50%" style="stop-color:#ff1493;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#ff69b4;stop-opacity:1" />
                </linearGradient>
            </defs>
            <path d="M16 28c-.5 0-1-.2-1.3-.6C13.4 25.9 2 13.8 2 8.5 2 5.4 4.4 3 7.5 3c1.7 0 3.2.7 4.3 2 .1.1.2.2.2.2.1.1.2.2.2.2.1.1.2.2.2.2.1.1.2.2.2.2.1.1.2.2.2.2.1.1.2.2.2.2.1.1.2.2.2.2.1.1.2.2.2.2.1.1.2.2.2.2.1.1.2.2.2.2.1.1.2.2.2.2.1.1.2.2.2.2 1.1-1.3 2.7-2 4.3-2 3.1 0 5.5 2.4 5.5 5.5 0 5.3-11.4 17.4-12.7 18.9-.3.4-.8.6-1.3.6z" 
                  fill="url(#heartGradient{ID})" 
                  opacity="0.7"/>
        </svg>
    `;

    // Create 15 hearts with varying positions and animations
    for (let i = 0; i < 15; i++) {
        const heart = document.createElement('div');
        heart.className = 'pulsating-heart';
        heart.innerHTML = heartSVG.replace(/{ID}/g, i);
        
        // Random positioning
        heart.style.left = Math.random() * 100 + '%';
        heart.style.top = Math.random() * 100 + '%';
        
        // Varying sizes
        const size = 30 + Math.random() * 50; // 30px to 80px
        heart.style.width = size + 'px';
        heart.style.height = size + 'px';
        
        // Random animation delays and durations
        const delay = Math.random() * 3;
        const duration = 2 + Math.random() * 2; // 2-4 seconds
        heart.style.animationDelay = delay + 's';
        heart.style.animationDuration = duration + 's';
        
        container.appendChild(heart);
    }
}

// ==========================================
// 3D CAROUSEL
// ==========================================
let currentSlide = 0;
const totalSlides = 4;

function updateCarousel() {
    const items = document.querySelectorAll('.carousel-3d-item');
    const indicators = document.querySelectorAll('.indicator');
    
    items.forEach((item, index) => {
        item.classList.remove('active', 'left', 'right');
        
        if (index === currentSlide) {
            item.classList.add('active');
        } else if (index === (currentSlide - 1 + totalSlides) % totalSlides) {
            item.classList.add('left');
        } else if (index === (currentSlide + 1) % totalSlides) {
            item.classList.add('right');
        }
    });
    
    indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === currentSlide);
    });
}

function rotateCarousel(direction) {
    currentSlide = (currentSlide + direction + totalSlides) % totalSlides;
    updateCarousel();
}

function goToSlide(index) {
    currentSlide = index;
    updateCarousel();
}

// Auto-rotate carousel
let carouselInterval;
function startCarouselAutoRotate() {
    carouselInterval = setInterval(() => {
        rotateCarousel(1);
    }, 5000); // Rotate every 5 seconds
}

function stopCarouselAutoRotate() {
    if (carouselInterval) {
        clearInterval(carouselInterval);
    }
}

// ==========================================
// SCROLL TO TOP BUTTON
// ==========================================
function initScrollToTop() {
    const scrollBtn = document.getElementById('scrollToTop');
    if (!scrollBtn) return;

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollBtn.classList.add('visible');
        } else {
            scrollBtn.classList.remove('visible');
        }
    });
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// ==========================================
// SCROLL ANIMATIONS
// ==========================================
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    });

    // Observe all flow steps
    document.querySelectorAll('.flow-step').forEach(step => {
        observer.observe(step);
    });

    // Observe game cards
    document.querySelectorAll('.game-card').forEach(card => {
        observer.observe(card);
    });

    // Observe review cards
    document.querySelectorAll('.review-card').forEach(card => {
        observer.observe(card);
    });
}

// ==========================================
// MOUSE FOLLOWER
// ==========================================
function initMouseFollower() {
    const mouseFollower = document.getElementById('mouseFollower');
    if (!mouseFollower) return;

    document.addEventListener('mousemove', (e) => {
        mouseFollower.style.left = e.clientX + 'px';
        mouseFollower.style.top = e.clientY + 'px';
    });

    // Hide on mobile
    if (window.innerWidth < 768) {
        mouseFollower.style.display = 'none';
    }
}

// ==========================================
// FLOATING KISSES BACKGROUND
// ==========================================
function createFloatingKisses() {
    const container = document.getElementById('floatingKisses');
    if (!container) return;
    
    const kisses = ['💋', '💕', '💖', '💗', '💝'];
    
    for (let i = 0; i < 15; i++) {
        const kiss = document.createElement('div');
        kiss.className = 'kiss';
        kiss.textContent = kisses[Math.floor(Math.random() * kisses.length)];
        kiss.style.left = Math.random() * 100 + '%';
        kiss.style.top = Math.random() * 100 + '%';
        kiss.style.animationDelay = Math.random() * 5 + 's';
        kiss.style.animationDuration = (10 + Math.random() * 10) + 's';
        container.appendChild(kiss);
    }
}

// ==========================================
// MOBILE MENU
// ==========================================
function toggleMobileMenu() {
    const nav = document.getElementById('mobileNav');
    const overlay = document.getElementById('menuOverlay');
    const menuToggle = document.querySelector('.menu-toggle');
    
    nav.classList.toggle('active');
    overlay.classList.toggle('active');
    
    // Animate menu icon
    if (nav.classList.contains('active')) {
        menuToggle.innerHTML = '✕';
    } else {
        menuToggle.innerHTML = '☰';
    }
}

function closeMobileMenu() {
    const nav = document.getElementById('mobileNav');
    const overlay = document.getElementById('menuOverlay');
    const menuToggle = document.querySelector('.menu-toggle');
    
    nav.classList.remove('active');
    overlay.classList.remove('active');
    menuToggle.innerHTML = '☰';
}

// ==========================================
// SMOOTH SCROLL
// ==========================================
function scrollToFeatures() {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
        featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// ==========================================
// HEADER SCROLL EFFECT
// ==========================================
function initHeaderScroll() {
    const header = document.querySelector('.header');
    if (!header) return;

    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
    });
}

// ==========================================
// FLAGSHIP SECTION ANIMATIONS
// ==========================================
function initFlagshipAnimations() {
    const flagshipSection = document.querySelector('.flagship-section');
    if (!flagshipSection) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Animate sparkles
                const sparkles = entry.target.querySelectorAll('.sparkle');
                sparkles.forEach((sparkle, index) => {
                    setTimeout(() => {
                        sparkle.style.animation = 'sparkleFloat 3s ease-in-out infinite';
                    }, index * 200);
                });
            }
        });
    }, { threshold: 0.3 });

    observer.observe(flagshipSection);
}

// ==========================================
// PARALLAX SCROLL EFFECTS
// ==========================================
function initParallaxEffects() {
    const floatingElements = document.querySelectorAll('.float-3d');
    
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        
        floatingElements.forEach((element, index) => {
            const speed = 0.5 + (index * 0.1);
            const yPos = -(scrolled * speed);
            element.style.transform = `translateY(${yPos}px)`;
        });
    });
}

// ==========================================
// INTERSECTION OBSERVER FOR ANIMATIONS
// ==========================================
function initIntersectionObserver() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
            }
        });
    }, {
        threshold: 0.1
    });
    
    animatedElements.forEach(element => {
        observer.observe(element);
    });
}

// ==========================================
// KEYBOARD NAVIGATION FOR CAROUSEL
// ==========================================
function initCarouselKeyboard() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            rotateCarousel(-1);
            stopCarouselAutoRotate();
            setTimeout(startCarouselAutoRotate, 10000); // Restart after 10s
        } else if (e.key === 'ArrowRight') {
            rotateCarousel(1);
            stopCarouselAutoRotate();
            setTimeout(startCarouselAutoRotate, 10000);
        }
    });
}

// ==========================================
// TOUCH SWIPE FOR CAROUSEL (MOBILE)
// ==========================================
function initCarouselTouch() {
    const carousel = document.getElementById('carousel3D');
    if (!carousel) return;

    let touchStartX = 0;
    let touchEndX = 0;
    
    carousel.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    carousel.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
    
    function handleSwipe() {
        if (touchEndX < touchStartX - 50) {
            // Swipe left
            rotateCarousel(1);
            stopCarouselAutoRotate();
            setTimeout(startCarouselAutoRotate, 10000);
        }
        if (touchEndX > touchStartX + 50) {
            // Swipe right
            rotateCarousel(-1);
            stopCarouselAutoRotate();
            setTimeout(startCarouselAutoRotate, 10000);
        }
    }
}

// ==========================================
// INITIALIZE ALL FEATURES
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Create visual elements
    createPulsatingHearts();
    createFloatingKisses();
    
    // Initialize interactive features
    initScrollToTop();
    initMouseFollower();
    initHeaderScroll();
    initScrollAnimations();
    initFlagshipAnimations();
    initParallaxEffects();
    initIntersectionObserver();
    
    // Initialize carousel
    updateCarousel();
    startCarouselAutoRotate();
    initCarouselKeyboard();
    initCarouselTouch();
    
    // Stop carousel auto-rotate on hover
    const carouselWrapper = document.querySelector('.carousel-3d-wrapper');
    if (carouselWrapper) {
        carouselWrapper.addEventListener('mouseenter', stopCarouselAutoRotate);
        carouselWrapper.addEventListener('mouseleave', startCarouselAutoRotate);
    }
    
    // Add smooth scroll behavior to all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
});

// ==========================================
// WINDOW RESIZE HANDLER
// ==========================================
window.addEventListener('resize', () => {
    // Hide mouse follower on mobile
    const mouseFollower = document.getElementById('mouseFollower');
    if (mouseFollower) {
        if (window.innerWidth < 768) {
            mouseFollower.style.display = 'none';
        } else {
            mouseFollower.style.display = 'block';
        }
    }
});

// ==========================================
// PERFORMANCE OPTIMIZATION
// ==========================================
// Debounce function for scroll events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Optimize scroll listeners
const optimizedScroll = debounce(() => {
    initParallaxEffects();
}, 10);

window.addEventListener('scroll', optimizedScroll, { passive: true });