// ==================== DOM Elements ==================== //
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');
const contactForm = document.getElementById('contactForm');
const typingText = document.querySelector('.typing-text');

// ==================== Typing Animation ==================== //
const titles = [
    'BCA Student',
    'AI & Machine Learning Enthusiast',
    'Robotics Explorer',
    'Future Tech Innovator',
    'Problem Solver',
    'Software Developer'
];

let titleIndex = 0;
let charIndex = 0;
let isDeleting = false;

function typeTitle() {
    const currentTitle = titles[titleIndex];
    
    if (isDeleting) {
        typingText.textContent = currentTitle.substring(0, charIndex - 1);
        charIndex--;
        
        if (charIndex === 0) {
            isDeleting = false;
            titleIndex = (titleIndex + 1) % titles.length;
            setTimeout(typeTitle, 500);
            return;
        }
    } else {
        typingText.textContent = currentTitle.substring(0, charIndex + 1);
        charIndex++;
        
        if (charIndex === currentTitle.length) {
            isDeleting = true;
            setTimeout(typeTitle, 2000);
            return;
        }
    }
    
    setTimeout(typeTitle, isDeleting ? 50 : 100);
}

// Start typing animation when page loads
window.addEventListener('load', () => {
    typeTitle();
});

// ==================== Mobile Menu Toggle ==================== //
hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when link is clicked
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// ==================== Smooth Scrolling ==================== //
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerOffset = 80;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// ==================== Scroll Animations ==================== //
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('show');
        }
    });
}, observerOptions);

// Observe skill bars for animation
document.querySelectorAll('.skill-item').forEach(item => {
    observer.observe(item);
});

// ==================== Animate Skill Bars on Scroll ==================== //
const skillBarsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const skillFills = entry.target.querySelectorAll('.skill-fill');
            skillFills.forEach(fill => {
                fill.style.animation = 'none';
                setTimeout(() => {
                    fill.style.animation = '';
                }, 10);
            });
            skillBarsObserver.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.skill-item').forEach(item => {
    skillBarsObserver.observe(item);
});

// ==================== Active Navigation Link ==================== //
const sections = document.querySelectorAll('section[id]');

const navLinkObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${id}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}, { threshold: 0.5 });

sections.forEach(section => {
    navLinkObserver.observe(section);
});

// ==================== Contact Form Handling ==================== //
contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get form values
    const name = contactForm.querySelector('input[type="text"]').value;
    const email = contactForm.querySelector('input[type="email"]').value;
    const message = contactForm.querySelector('textarea').value;
    
    // Validate form
    if (name && email && message) {
        // Show success message
        const submitButton = contactForm.querySelector('.contact-submit');
        const originalText = submitButton.innerHTML;
        
        submitButton.innerHTML = '<span>Message Transmitted</span>';
        submitButton.style.borderColor = 'var(--accent-green)';
        submitButton.style.color = 'var(--accent-green)';
        
        // Reset form
        contactForm.reset();
        
        // Reset button after 3 seconds
        setTimeout(() => {
            submitButton.innerHTML = originalText;
            submitButton.style.borderColor = '';
            submitButton.style.color = '';
        }, 3000);
    }
});

// ==================== Parallax Grid Background ==================== //
window.addEventListener('mousemove', (e) => {
    const grid = document.querySelector('.grid-background');
    const x = (e.clientX / window.innerWidth) * 50;
    const y = (e.clientY / window.innerHeight) * 50;
    
    grid.style.backgroundPosition = `${x}px ${y}px`;
});

// ==================== Add Glow Effect on Scroll ==================== //
const targetSection = document.querySelector('.hero');
let lastScrollY = 0;

window.addEventListener('scroll', () => {
    lastScrollY = window.scrollY;
    
    // Update navbar style
    const navbar = document.querySelector('.navbar');
    if (lastScrollY > 50) {
        navbar.style.borderBottomColor = 'rgba(0, 245, 255, 0.1)';
    } else {
        navbar.style.borderBottomColor = 'var(--accent-cyan)';
    }
    
    // Parallax effect for hero
    if (lastScrollY < targetSection.offsetHeight) {
        const elements = targetSection.querySelectorAll('.hero-content, .hero-profile');
        elements.forEach((el, index) => {
            el.style.transform = `translateY(${lastScrollY * 0.5}px)`;
        });
    }
});

// ==================== Button Ripple Effect ==================== //
function createRipple(event) {
    const button = event.currentTarget;
    const ripple = document.createElement('span');
    
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple');
    
    button.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);
}

// ==================== Project Card Interactions ==================== //
document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-5px)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
    });
});

// ==================== Certificate Card Interactions ==================== //
document.querySelectorAll('.cert-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.05)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
    });
});

// ==================== Responsive Menu Close on Resize ==================== //
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    }
});

// ==================== Add Custom Cursor Effect ==================== //
class Cursor {
    constructor() {
        this.cursor = document.createElement('div');
        this.cursor.id = 'cursor';
        this.cursor.style.cssText = `
            position: fixed;
            width: 20px;
            height: 20px;
            border: 2px solid #00f5ff;
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            display: none;
            box-shadow: 0 0 10px rgba(0, 245, 255, 0.5);
            mix-blend-mode: screen;
        `;
        document.body.appendChild(this.cursor);
        
        this.x = 0;
        this.y = 0;
        
        document.addEventListener('mousemove', (e) => this.move(e));
        document.addEventListener('mouseenter', () => this.show());
        document.addEventListener('mouseleave', () => this.hide());
    }
    
    move(e) {
        this.x = e.clientX;
        this.y = e.clientY;
        this.cursor.style.left = (this.x - 10) + 'px';
        this.cursor.style.top = (this.y - 10) + 'px';
    }
    
    show() {
        this.cursor.style.display = 'block';
    }
    
    hide() {
        this.cursor.style.display = 'none';
    }
}

// Initialize custom cursor only on desktop
if (window.innerWidth > 768) {
    new Cursor();
}

// ==================== Intersection Observer for Sections ==================== //
const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, {
    threshold: 0.1
});

document.querySelectorAll('section').forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(20px)';
    section.style.transition = 'all 0.6s ease';
    sectionObserver.observe(section);
});

// ==================== Performance Optimization ==================== //
let throttleTimer;

function throttle(callback, limit) {
    if (!throttleTimer) {
        callback();
        throttleTimer = setTimeout(() => {
            throttleTimer = null;
        }, limit);
    }
}

window.addEventListener('scroll', () => {
    throttle(() => {
        // Update scroll-based animations
    }, 16);
});

// ==================== Page Load Animation ==================== //
window.addEventListener('load', () => {
    document.body.style.opacity = '1';
    document.body.style.transition = 'opacity 0.5s ease';
});

// Set initial state
document.body.style.opacity = '0';

// ==================== Console Welcome Message ==================== //
console.log(
    '%c● SYSTEM INITIALIZED ●\n%cWelcome to Abhishek Pratap Singh\'s AI Portfolio Interface\n%c© 2026 | Powered by Advanced Tech Stack',
    'color: #00f5ff; font-size: 14px; font-weight: bold;',
    'color: #00ff9c; font-size: 12px;',
    'color: #7c3aed; font-size: 10px;'
);

// ==================== Performance Monitoring ==================== //
if (window.performance) {
    window.addEventListener('load', () => {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        console.log('%c⚡ System initialized in: ' + pageLoadTime + 'ms', 'color: #00ff9c; font-weight: bold;');
    });
}
