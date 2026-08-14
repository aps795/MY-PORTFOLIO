// Basic interactions: mobile menu + portfolio filtering + year filler
document.addEventListener('DOMContentLoaded', function () {
  // Year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Hamburger
  const hamburger = document.getElementById('hamburger');
  hamburger && hamburger.addEventListener('click', () => {
    document.body.classList.toggle('mobile-nav-open');
    hamburger.classList.toggle('is-active');
  });

  // Close mobile nav on link click
  document.querySelectorAll('.nav-list a').forEach(a => {
    a.addEventListener('click', () => {
      document.body.classList.remove('mobile-nav-open');
      hamburger && hamburger.classList.remove('is-active');
    });
  });

  // Portfolio filters
  const filterBtns = Array.from(document.querySelectorAll('.filter-btn'));
  const projectCards = Array.from(document.querySelectorAll('.project-card'));

  function setFilter(filter) {
    filterBtns.forEach(b => b.classList.toggle('active', b.dataset.filter === filter));
    projectCards.forEach(card => {
      if (filter === 'all' || card.dataset.category === filter) {
        card.style.display = '';
        // small delay for nicer reveal (optional)
        card.style.opacity = '1';
        card.style.transform = 'none';
      } else {
        card.style.display = 'none';
      }
    });
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      setFilter(btn.dataset.filter);
    });
  });

  // Accessibility: keyboard filter support
  filterBtns.forEach(btn => {
    btn.setAttribute('tabindex', '0');
    btn.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        btn.click();
      }
    });
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({behavior: 'smooth', block: 'start'});
      }
    });
  });
});
