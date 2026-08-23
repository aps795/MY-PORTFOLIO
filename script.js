// Interactions: mobile menu, theme toggle, active nav, portfolio filters, back-to-top, scroll animations
// Lightweight, performant, and accessible

document.addEventListener('DOMContentLoaded', function () {
  // Dynamic Year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Theme: persist preference in localStorage
  const themeBtn = document.getElementById('theme-toggle');
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme === 'light') document.documentElement.setAttribute('data-theme', 'light');
  if (themeBtn) themeBtn.textContent = (document.documentElement.getAttribute('data-theme') === 'light') ? 'Light' : 'Dark';

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      if (isLight) {
        localStorage.removeItem('theme');
        themeBtn.textContent = 'Dark';
        document.documentElement.removeAttribute('data-theme');
      } else {
        localStorage.setItem('theme', 'light');
        document.documentElement.setAttribute('data-theme', 'light');
        themeBtn.textContent = 'Light';
      }
      themeBtn.setAttribute('aria-pressed', String(!isLight));
    });
  }

  // Hamburger / mobile nav
  const hamburger = document.getElementById('hamburger');
  const body = document.body;
  if (hamburger) {
    hamburger.addEventListener('click', () => {
      const isOpen = body.classList.toggle('mobile-nav-open');
      hamburger.classList.toggle('is-active', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
    });
  }

  // Close mobile nav on link click
  document.querySelectorAll('.nav-list a').forEach(a => {
    a.addEventListener('click', () => {
      body.classList.remove('mobile-nav-open');
      if (hamburger) {
        hamburger.classList.remove('is-active');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // Portfolio filters (buttons)
  const filterBtns = Array.from(document.querySelectorAll('.filter-btn'));
  const projectCards = Array.from(document.querySelectorAll('.project-card'));

  function setFilter(filter) {
    filterBtns.forEach(b => {
      const isActive = b.dataset.filter === filter;
      b.classList.toggle('active', isActive);
      b.setAttribute('aria-pressed', String(isActive));
    });

    projectCards.forEach(card => {
      if (filter === 'all' || card.dataset.category === filter) {
        card.style.display = 'flex';
        card.style.opacity = '1';
        card.style.transform = 'none';
      } else {
        card.style.display = 'none';
      }
    });
  }

  if (filterBtns.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => setFilter(btn.dataset.filter));
      btn.setAttribute('tabindex', '0');
      btn.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          btn.click();
        }
      });
    });
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    const href = a.getAttribute('href');
    if (href === '#' || href === '#0') return;
    a.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.pageYOffset - 14;
        window.scrollTo({ top, behavior: 'smooth' });
        setTimeout(() => {
          target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
        }, 600);
      }
    });
  });

  // Back to top
  const backToTop = document.getElementById('back-to-top');
  function toggleBack() {
    if (!backToTop) return;
    if (window.scrollY > 400) backToTop.classList.add('visible');
    else backToTop.classList.remove('visible');
  }
  window.addEventListener('scroll', toggleBack, { passive: true });
  toggleBack();
  if (backToTop) {
    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  // Active nav highlighting using IntersectionObserver
  const navLinks = Array.from(document.querySelectorAll('.nav-list a'));
  const sections = navLinks.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    const obsOptions = { root: null, rootMargin: '0px 0px -45% 0px', threshold: 0 };
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const id = entry.target.id;
        const link = document.querySelector('.nav-list a[href="#' + id + '"]');
        if (!link) return;
        if (entry.isIntersecting) {
          navLinks.forEach(l => l.classList.remove('active'));
          link.classList.add('active');
        }
      });
    }, obsOptions);
    sections.forEach(s => observer.observe(s));
  }

  // Initial filter state
  const activeBtn = document.querySelector('.filter-btn.active');
  if (activeBtn) setFilter(activeBtn.dataset.filter);

  // Animate circular skill charts
  const charts = document.querySelectorAll('.skill-chart');
  charts.forEach(chart => {
    const percent = Number(chart.dataset.percent) || 0;
    const circle = chart.querySelector('.circle');
    if (!circle) return;
    const dash = Math.max(0, Math.min(100, percent));
    circle.style.transition = 'stroke-dasharray 1200ms cubic-bezier(.34,.1,.68,.55)';
    
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            circle.setAttribute('stroke-dasharray', `${dash},100`);
          }, 100);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    
    observer.observe(chart);
  });

  // Scroll animations for Timeline, Skill cards, and Certificate cards
  if ('IntersectionObserver' in window) {
    const animateElements = (selector, threshold = 0.2, stagger = 0.08) => {
      const items = document.querySelectorAll(selector);
      if (!items.length) return;
      const observer = new IntersectionObserver(entries => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            entry.target.style.animation = `fadeInUp 0.6s ease ${index * stagger}s forwards`;
            observer.unobserve(entry.target);
          }
        });
      }, { threshold });
      items.forEach(item => observer.observe(item));
    };

    animateElements('.timeline-item', 0.3, 0.1);
    animateElements('.skill-card', 0.2, 0.08);
    animateElements('.cert-card', 0.15, 0.06);
    animateElements('.service-card', 0.2, 0.08);
  }

  // Contact Form AJAX Handler (FormSubmit.co -> abhishekpratapsingh795@gmail.com)
  const contactForm = document.getElementById('contact-form');
  const formStatus = document.getElementById('form-status');
  const submitBtn = document.getElementById('form-submit-btn');
  const btnText = document.getElementById('btn-text');
  const btnSpinner = document.getElementById('btn-spinner');

  if (contactForm) {
    contactForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      
      const name = document.getElementById('form-name') ? document.getElementById('form-name').value.trim() : '';
      const email = document.getElementById('form-email') ? document.getElementById('form-email').value.trim() : '';
      const message = document.getElementById('form-message') ? document.getElementById('form-message').value.trim() : '';

      if (!name || !email || !message) {
        showStatus('Please fill in all fields before sending.', 'error');
        return;
      }

      // Set loading state
      if (submitBtn) submitBtn.disabled = true;
      if (btnText) btnText.style.display = 'none';
      if (btnSpinner) btnSpinner.style.display = 'inline';
      if (formStatus) formStatus.style.display = 'none';

      try {
        const formData = new FormData(contactForm);
        const response = await fetch('https://formsubmit.co/ajax/abhishekpratapsingh795@gmail.com', {
          method: 'POST',
          headers: {
            'Accept': 'application/json'
          },
          body: formData
        });

        if (response.ok) {
          showStatus(`✅ Thank you, ${name}! Your message has been sent successfully to Abhishek's email. You will receive a reply soon!`, 'success');
          contactForm.reset();
        } else {
          const data = await response.json().catch(() => null);
          const errorMsg = data && data.message ? data.message : 'Unable to send message right now. Please email directly at abhishekpratapsingh795@gmail.com';
          showStatus(`⚠️ ${errorMsg}`, 'error');
        }
      } catch (err) {
        // Fallback: submit form natively
        contactForm.submit();
      } finally {
        if (submitBtn) submitBtn.disabled = false;
        if (btnText) btnText.style.display = 'inline';
        if (btnSpinner) btnSpinner.style.display = 'none';
      }
    });

    function showStatus(text, type) {
      if (!formStatus) return;
      formStatus.className = `form-status ${type}`;
      formStatus.textContent = text;
      formStatus.style.display = 'block';
    }
  }

  // Add fadeInUp animation keyframe dynamically
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
  document.head.appendChild(style);
});
