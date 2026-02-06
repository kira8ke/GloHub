// Client Purchase and Payment Logic

document.addEventListener('DOMContentLoaded', () => {
    const purchaseForm = document.getElementById('purchaseForm');
    
    if (purchaseForm) {
        purchaseForm.addEventListener('submit', handlePurchase);
    }
    
    // Initialize header scroll behavior
    initHeaderScroll();
    
    // Optimize for mobile
    optimizeForMobile();
});

// Mobile optimization
function optimizeForMobile() {
    // Prevent zoom on double-tap for buttons on iOS
    document.querySelectorAll('button, a.btn-primary, a.btn-secondary, a.btn-large').forEach(el => {
        el.addEventListener('touchend', (e) => {
            e.preventDefault();
            el.click();
        }, false);
    });
    
    // Improve text rendering on mobile
    if (window.innerWidth <= 768) {
        document.documentElement.style.fontSize = '16px';
    }
}

// Header scroll behavior
function initHeaderScroll() {
    let lastScrollTop = 0;
    const header = document.querySelector('.header');
    const scrollThreshold = 100; // Start hiding after 100px scroll
    
    if (!header) return; // Exit if header doesn't exist on page
    
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Add background when scrolled
        if (scrollTop > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        // Hide/show behavior
        if (scrollTop > scrollThreshold) {
            if (scrollTop > lastScrollTop) {
                // Scrolling down - hide header
                header.style.transform = 'translateY(-100%)';
            } else {
                // Scrolling up - show header
                header.style.transform = 'translateY(0)';
            }
        } else {
            // At top of page - always show header
            header.style.transform = 'translateY(0)';
        }
        
        lastScrollTop = scrollTop;
    });
}

// Mobile Menu Toggle
function toggleMobileMenu() {
    const nav = document.getElementById('mobileNav');
    const overlay = document.getElementById('menuOverlay');
    const menuToggle = document.querySelector('.menu-toggle');
    
    if (nav && overlay) {
        nav.classList.toggle('active');
        overlay.classList.toggle('active');
        
        // Change hamburger to X when open
        if (nav.classList.contains('active')) {
            menuToggle.innerHTML = '✕';
        } else {
            menuToggle.innerHTML = '☰';
        }
        
        // Prevent body scroll when menu is open
        document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : '';
    }
}

function closeMobileMenu() {
    const nav = document.getElementById('mobileNav');
    const overlay = document.getElementById('menuOverlay');
    const menuToggle = document.querySelector('.menu-toggle');
    
    if (nav && overlay) {
        nav.classList.remove('active');
        overlay.classList.remove('active');
        
        if (menuToggle) {
            menuToggle.innerHTML = '☰';
        }
        
        // Restore body scroll
        document.body.style.overflow = '';
    }
}

// Close menu on window resize if it's open
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        closeMobileMenu();
    }
});

async function handlePurchase(e) {
    e.preventDefault();
    
    const email = document.getElementById('purchaseEmail').value.trim();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    if (!email) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    // Disable button during processing
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';
    
    try {
        // Check if email already exists
        const { data: existingClient } = await supabase
            .from('clients')
            .select('admin_email')
            .eq('admin_email', email)
            .single();
        
        if (existingClient) {
            showNotification('This email already has an account. Check your inbox for your admin code!', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Buy Now - KES 649';
            return;
        }
        
        // Mock payment processing
        // In production, integrate with M-Pesa, Stripe, or other payment gateway
        const paymentSuccess = await mockPaymentProcess();
        
        if (!paymentSuccess) {
            showNotification('Payment failed. Please try again.', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Buy Now - KES 649';
            return;
        }
        
        // Generate unique admin code
        let adminCode;
        let codeExists = true;
        
        while (codeExists) {
            adminCode = generateRandomCode(8);
            const { data } = await supabase
                .from('clients')
                .select('admin_code')
                .eq('admin_code', adminCode);
            codeExists = data && data.length > 0;
        }
        
        // Create client record
        const { data: newClient, error: clientError } = await supabase
            .from('clients')
            .insert([
                {
                    admin_email: email,
                    admin_code: adminCode,
                    theme_config: {
                        primary: '#ff69b4',
                        secondary: '#ffb6d9',
                        accent: '#ff1493'
                    }
                }
            ])
            .select()
            .single();
        
        if (clientError) {
            throw clientError;
        }
        
        // Record payment
        await supabase
            .from('payments')
            .insert([
                {
                    client_id: newClient.id,
                    amount: 649,
                    status: 'completed'
                }
            ]);
        
        // Send email with admin code
        await sendEmail(
            email,
            'Welcome to GloHub - Your Admin Code',
            `
            Hi there,

            Welcome to GloHub! We're so excited to have you.

            Your Admin Code: ${adminCode}

            Use this code to login at: ${window.location.origin}/admin-login.html

            What's next?
            1. Login with your admin code
            2. Customize your theme colors
            3. Add quiz questions
            4. Create a game session and share the join code with your friends!

            Have fun hosting the cutest quiz parties!

            Love,
            The GalentineHub Team
            `
        );
        
        // Show success message
        showNotification('Payment successful! Check your email for your admin code!', 'success');
        
        // Show admin code on screen as well
        const purchaseCard = document.querySelector('.purchase-card');
        purchaseCard.innerHTML = `
            <h2>Payment Successful!</h2>
            <div style="background: #e8f5e9; padding: 30px; border-radius: 15px; margin: 30px 0;">
                <p style="margin-bottom: 10px; color: #666;">Your Admin Code:</p>
                <div style="font-size: 36px; font-weight: bold; color: #4caf50; margin: 20px 0;">
                    ${adminCode}
                </div>
                <p style="color: #666; font-size: 14px;">We've also sent this to ${email}</p>
            </div>
            <a href="admin-login.html" class="btn-large">Go to Admin Login →</a>
        `;
        
    } catch (error) {
        console.error('Purchase error:', error);
        showNotification('Something went wrong. Please try again.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Buy Now - KES 649';
    }
}

// Mock payment processing
// Replace with actual payment gateway integration
async function mockPaymentProcess() {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Simulate successful payment
            resolve(true);
        }, 2000);
    });
}

// M-Pesa Integration (Kenya)
// This is a placeholder - implement actual M-Pesa STK Push integration
async function initiateMpesaPayment(phoneNumber, amount) {
    // In production, call your backend API that interfaces with M-Pesa
    console.log('Initiating M-Pesa payment:', { phoneNumber, amount });
    
    // Your backend should:
    // 1. Call M-Pesa STK Push API
    // 2. Wait for callback
    // 3. Return payment status
    
    return { success: true, transactionId: 'MOCK_TXN_' + Date.now() };
}