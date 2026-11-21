(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Reveal animations on scroll
  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
          setTimeout(() => {
            entry.target.style.transitionDelay = '';
          }, 800);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealItems.forEach((item) => revealObserver.observe(item));

    // Stagger case study cards
    document.querySelectorAll('.case-study.reveal').forEach((card, i) => {
      card.style.transitionDelay = `${i * 90}ms`;
    });

    // Stagger process steps
    document.querySelectorAll('.process-step.reveal').forEach((step, i) => {
      step.style.transitionDelay = `${i * 60}ms`;
    });
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  // 2. Point of View Word-by-word reveal
  const wordLine = document.querySelector('[data-word-reveal]');
  if (wordLine && !reduceMotion && 'IntersectionObserver' in window) {
    const words = wordLine.textContent.trim().split(/\s+/);
    wordLine.textContent = '';
    words.forEach((word, index) => {
      const span = document.createElement('span');
      span.className = 'word';
      span.textContent = word;
      span.style.setProperty('--word-delay', `${Math.min(index, 18) * 28}ms`);
      wordLine.append(span, document.createTextNode(' '));
    });

    const wordObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-lit');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '-5% 0px -10% 0px' });

    wordLine.querySelectorAll('.word').forEach((word) => wordObserver.observe(word));
  }

  // 3. Dynamic current year in footer
  const yearEl = document.querySelector('#year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // 4. Header scroll effect & Reading progress bar
  const header = document.querySelector('.site-header');
  const progress = document.querySelector('.reading-progress span');
  let ticking = false;

  const updateScrollEffects = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progressRatio = scrollable > 0 ? window.scrollY / scrollable : 0;
    if (progress) {
      progress.style.width = `${Math.min(100, Math.max(0, progressRatio * 100))}%`;
    }
    if (header) {
      header.classList.toggle('is-scrolled', window.scrollY > 48);
    }
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateScrollEffects);
      ticking = true;
    }
  }, { passive: true });
  updateScrollEffects();

  // 5. Navbar section tracking (FIXED: strictly tracks in-page anchors starting with '#')
  const navAnchorLinks = [...document.querySelectorAll('.desktop-nav a[href^="#"]')];
  const trackedSections = navAnchorLinks
    .map((link) => {
      const href = link.getAttribute('href');
      if (href && href.length > 1 && href.startsWith('#')) {
        try {
          return document.querySelector(href);
        } catch (e) {
          return null;
        }
      }
      return null;
    })
    .filter(Boolean);

  if (header && trackedSections.length && 'IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navAnchorLinks.forEach((link) => {
          if (link.getAttribute('href') === `#${entry.target.id}`) {
            link.setAttribute('aria-current', 'location');
          } else {
            link.removeAttribute('aria-current');
          }
        });
      });
    }, { rootMargin: '-25% 0px -55% 0px', threshold: 0 });

    trackedSections.forEach((section) => sectionObserver.observe(section));
  }

  // 6. 1-Click Copy Email interaction
  const copyBtn = document.querySelector('.copy-email-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const email = copyBtn.dataset.email || '24211a05q9@bvrit.ac.in';
      const textEl = copyBtn.querySelector('.copy-text');
      const originalText = textEl ? textEl.textContent : 'Copy';

      const showSuccess = () => {
        copyBtn.classList.add('is-copied');
        if (textEl) textEl.textContent = 'Copied! ✓';
        setTimeout(() => {
          copyBtn.classList.remove('is-copied');
          if (textEl) textEl.textContent = originalText;
        }, 2200);
      };

      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(email);
          showSuccess();
          return;
        } catch (err) {
          // fallback below
        }
      }

      // Fallback for non-secure contexts or older browsers
      const textarea = document.createElement('textarea');
      textarea.value = email;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        const successful = document.execCommand('copy');
        if (successful) showSuccess();
      } catch (err) {
        console.warn('Copy failed:', err);
      }
      document.body.removeChild(textarea);
    });
  }
})();
