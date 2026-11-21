(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealItems = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -35px 0px' });
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

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
    }, { threshold: 0.12, rootMargin: '-5% 0px -10% 0px' });
    wordLine.querySelectorAll('.word').forEach((word) => wordObserver.observe(word));
  }

  const year = document.querySelector('#year');
  if (year) year.textContent = new Date().getFullYear();

  const header = document.querySelector('.site-header');
  const sectionLinks = [...document.querySelectorAll('.desktop-nav a')];
  const trackedSections = sectionLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);
  if (header && trackedSections.length && 'IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        sectionLinks.forEach((link) => {
          if (link.getAttribute('href') === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-32% 0px -56% 0px', threshold: 0 });
    trackedSections.forEach((section) => sectionObserver.observe(section));
  }

  const field = document.querySelector('.signal-canvas');
  const heroArt = document.querySelector('.hero-art');
  if (field && heroArt) {
    const context = field.getContext('2d');
    const particles = [];
    const pointer = { x: -1000, y: -1000 };
    let fieldWidth = 0;
    let fieldHeight = 0;
    let frame = 0;
    let isVisible = true;
    const particleCount = window.innerWidth < 700 ? 12 : 24;

    const resizeField = () => {
      const bounds = heroArt.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      fieldWidth = bounds.width;
      fieldHeight = bounds.height;
      field.width = Math.round(fieldWidth * ratio);
      field.height = Math.round(fieldHeight * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      if (!particles.length) {
        for (let i = 0; i < particleCount; i += 1) {
          particles.push({
            x: Math.random() * fieldWidth,
            y: Math.random() * fieldHeight,
            vx: (Math.random() - .5) * .13,
            vy: (Math.random() - .5) * .13,
            r: i % 8 === 0 ? 1.7 : .8,
          });
        }
      }
    };

    const drawField = () => {
      if (!isVisible) return;
      context.clearRect(0, 0, fieldWidth, fieldHeight);
      for (let i = 0; i < particles.length; i += 1) {
        const point = particles[i];
        if (!reduceMotion) {
          const dx = pointer.x - point.x;
          const dy = pointer.y - point.y;
          const distance = Math.hypot(dx, dy);
          if (distance < 150 && distance > 0) {
            point.vx += (dx / distance) * .00045;
            point.vy += (dy / distance) * .00045;
          }
          point.vx = Math.max(-.25, Math.min(.25, point.vx * .998));
          point.vy = Math.max(-.25, Math.min(.25, point.vy * .998));
          point.x += point.vx;
          point.y += point.vy;
          if (point.x < 0 || point.x > fieldWidth) point.vx *= -1;
          if (point.y < 0 || point.y > fieldHeight) point.vy *= -1;
        }

        for (let j = i + 1; j < particles.length; j += 1) {
          const next = particles[j];
          const distance = Math.hypot(point.x - next.x, point.y - next.y);
          if (distance < 78) {
            context.strokeStyle = `rgba(200,255,112,${(1 - distance / 78) * .1})`;
            context.lineWidth = .7;
            context.beginPath();
            context.moveTo(point.x, point.y);
            context.lineTo(next.x, next.y);
            context.stroke();
          }
        }
        context.fillStyle = point.r > 1 ? 'rgba(200,255,112,.68)' : 'rgba(210,220,197,.34)';
        context.beginPath();
        context.arc(point.x, point.y, point.r, 0, Math.PI * 2);
        context.fill();
      }
      if (!reduceMotion) frame = window.requestAnimationFrame(drawField);
    };

    resizeField();
    drawField();
    const resizeObserver = new ResizeObserver(resizeField);
    resizeObserver.observe(heroArt);
    heroArt.addEventListener('pointermove', (event) => {
      const bounds = heroArt.getBoundingClientRect();
      pointer.x = event.clientX - bounds.left;
      pointer.y = event.clientY - bounds.top;
      const tiltX = ((pointer.x / bounds.width) - .5) * 3;
      const tiltY = ((pointer.y / bounds.height) - .5) * 3;
      heroArt.style.setProperty('--tilt-x', `${tiltX.toFixed(2)}deg`);
      heroArt.style.setProperty('--tilt-y', `${tiltY.toFixed(2)}deg`);
    }, { passive: true });
    heroArt.addEventListener('pointerleave', () => {
      pointer.x = -1000;
      pointer.y = -1000;
      heroArt.style.removeProperty('--tilt-x');
      heroArt.style.removeProperty('--tilt-y');
    });
    document.addEventListener('visibilitychange', () => {
      isVisible = document.visibilityState === 'visible';
      if (isVisible && !reduceMotion) {
        window.cancelAnimationFrame(frame);
        frame = window.requestAnimationFrame(drawField);
      }
    });
  }

  const progress = document.querySelector('.reading-progress span');
  let ticking = false;
  const updateScrollEffects = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progressRatio = scrollable > 0 ? window.scrollY / scrollable : 0;
    if (progress) progress.style.width = `${Math.min(100, Math.max(0, progressRatio * 100))}%`;

    if (!reduceMotion && window.innerWidth > 700) {
      document.querySelectorAll('.hero-art [data-depth]').forEach((layer) => {
        const depth = Number(layer.dataset.depth || 0);
        layer.style.translate = `0 ${window.scrollY * depth}px`;
      });
    }
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 48);
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateScrollEffects);
      ticking = true;
    }
  }, { passive: true });
  updateScrollEffects();

  if (!reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('[data-tilt]').forEach((card) => {
      const link = card.querySelector('.project-link');
      card.addEventListener('pointermove', (event) => {
        const bounds = card.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - .5;
        const y = (event.clientY - bounds.top) / bounds.height - .5;
        const visual = card.querySelector('.project-visual');
        if (visual) {
          visual.style.setProperty('--spot-x', `${(x + .5) * 100}%`);
          visual.style.setProperty('--spot-y', `${(y + .5) * 100}%`);
        }
        link.style.transform = `perspective(900px) rotateX(${-y * 2.4}deg) rotateY(${x * 2.8}deg) translateY(-3px)`;
      });
      card.addEventListener('pointerleave', () => { link.style.transform = ''; });
    });
  }
})();
