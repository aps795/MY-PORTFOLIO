// Interactions: mobile menu, theme toggle, active nav, portfolio filters, back-to-top
// Kept lightweight and accessible

document.addEventListener('DOMContentLoaded', function () {
  // Year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Theme: persist preference
  const themeBtn = document.getElementById('theme-toggle');
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme === 'light') document.documentElement.setAttribute('data-theme', 'light');
  // update button label
  if (themeBtn) themeBtn.textContent = (document.documentElement.getAttribute('data-theme') === 'light') ? 'Light' : 'Dark';

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      document.documentElement.setAttribute('data-theme', isLight ? 'dark' : 'light');
      // store explicit 'light' or remove for dark default
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
      if (hamburger) { hamburger.classList.remove('is-active'); hamburger.setAttribute('aria-expanded', 'false'); }
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
        card.style.display = '';
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
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); }
      });
    });
  }

  // Smooth scroll for anchor links (excluding empty hashes)
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    const href = a.getAttribute('href');
    if (href === '#' || href === '#0') return;
    a.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.pageYOffset - 14; // slight offset for sticky header
        window.scrollTo({ top, behavior: 'smooth' });
        // update focus for accessibility
        setTimeout(() => { target.setAttribute('tabindex', '-1'); target.focus({preventScroll:true}); }, 600);
      }
    });
  });

  // Back to top
  const backToTop = document.getElementById('back-to-top');
  function toggleBack() {
    if (!backToTop) return;
    if (window.scrollY > 400) backToTop.classList.add('visible'); else backToTop.classList.remove('visible');
  }
  window.addEventListener('scroll', toggleBack, { passive: true });
  toggleBack();
  if (backToTop) backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

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

  // Initial filter state (ensure one active)
  const activeBtn = document.querySelector('.filter-btn.active');
  if (activeBtn) setFilter(activeBtn.dataset.filter);

  // Animate circular skill charts
  const charts = document.querySelectorAll('.skill-chart');
  charts.forEach(chart => {
    const percent = Number(chart.dataset.percent) || 0;
    const circle = chart.querySelector('.circle');
    if (!circle) return;
    const dash = Math.max(0, Math.min(100, percent));
    circle.style.transition = 'stroke-dasharray 900ms cubic-bezier(.2,.8,.2,1)';
    setTimeout(() => {
      circle.setAttribute('stroke-dasharray', `${dash},100`);
    }, 120);
  });

});
