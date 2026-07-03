const content = window.ATMIKA_CONTENT;

if (!content) {
  throw new Error('ATMIKA_CONTENT is not loaded.');
}

const text = (value) => String(value ?? '');
const html = (value) => text(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');
const attr = html;

const app = document.querySelector('#matrix-app');
const nav = content.navigation || [];
const services = content.services || [];
const gallery = content.gallery?.items || [];
const audience = content.audience?.items || [];
const outcomes = content.outcomes?.items || [];
const process = content.process?.items || [];

app.innerHTML = `
  <header class="matrix-header">
    <a class="matrix-brand" href="#top" aria-label="${attr(content.brand?.ariaLabel)}">
      <span class="matrix-mark">${html(content.brand?.mark || 'A')}</span>
      <span>
        <strong>${html(content.brand?.name)}</strong>
        <small>${html(content.brand?.subtitle)}</small>
      </span>
    </a>
    <nav class="matrix-nav" aria-label="Навигация">
      ${nav.map((item) => `<a href="${attr(item.href)}">${html(item.label)}</a>`).join('')}
    </nav>
  </header>

  <main id="top">
    <section class="matrix-hero">
      <div class="hero-grid">
        <div class="terminal-card">
          <div class="terminal-inner">
            <span class="kicker">${html(content.hero?.eyebrow)}</span>
            <h1>${html(content.hero?.title)}</h1>
            <p class="hero-text">${html(content.hero?.text)}</p>
            <div class="matrix-actions">
              <a class="matrix-button primary" href="${attr(content.hero?.primaryHref)}">${html(content.hero?.primaryLabel)}</a>
              <a class="matrix-button" href="#gallery">Следовать за кроликом</a>
            </div>
          </div>
        </div>
        <div class="signal-list">
          ${(content.hero?.panel || []).map((item) => `<span>${html(item)}</span>`).join('')}
        </div>
      </div>
    </section>

    <section class="matrix-section" id="intro-matrix">
      <div class="section-head">
        <div>
          <span class="kicker">${html(content.intro?.kicker)}</span>
          <h2>${html(content.intro?.title)}</h2>
        </div>
        <div>
          ${(content.intro?.paragraphs || []).map((paragraph) => `<p>${html(paragraph)}</p>`).join('')}
        </div>
      </div>
    </section>

    <section class="matrix-section" id="work">
      <div class="section-head">
        <div>
          <span class="kicker">${html(content.servicesSection?.kicker)}</span>
          <h2>${html(content.servicesSection?.title)}</h2>
        </div>
        <p>Выберите канал работы: короткая сессия, глубокая программа или офлайн-практика.</p>
      </div>
      <div class="matrix-grid">
        ${services.map((service, index) => `
          <article class="matrix-panel" data-code="0${index + 1}">
            <span class="tag">${html(service.tag)}</span>
            <h3>${html(service.title)}</h3>
            <p>${html(service.text)}</p>
            <div class="matrix-price">${html(service.price)}</div>
          </article>
        `).join('')}
      </div>
    </section>

    <section class="matrix-section" id="gallery">
      <div class="section-head">
        <div>
          <span class="kicker">${html(content.gallery?.kicker)}</span>
          <h2>${html(content.gallery?.title)}</h2>
        </div>
        <p>Фрагменты практик выглядят как найденные файлы из другого слоя реальности.</p>
      </div>
      <div class="matrix-gallery">
        ${gallery.map((item, index) => `
          <figure style="--i:${index}">
            ${item.type === 'video'
              ? `<video src="${attr(item.src)}" muted loop playsinline autoplay preload="metadata"></video>`
              : `<img src="${attr(item.src)}" alt="${attr(item.title)}" loading="lazy" />`
            }
            <figcaption>
              <span>${html(item.tag)}</span>
              <strong>${html(item.title)}</strong>
            </figcaption>
          </figure>
        `).join('')}
      </div>
    </section>

    <section class="matrix-section" id="for-whom">
      <div class="two-column">
        <div class="matrix-panel">
          <span class="kicker">${html(content.audience?.kicker)}</span>
          <h2>${html(content.audience?.title)}</h2>
          <p>${html(content.audience?.text)}</p>
        </div>
        <div class="check-stack">
          ${audience.map((item) => `<div class="check-item">${html(item)}</div>`).join('')}
        </div>
      </div>
    </section>

    <section class="matrix-section" id="outcomes">
      <div class="section-head">
        <div>
          <span class="kicker">${html(content.outcomes?.kicker)}</span>
          <h2>${html(content.outcomes?.title)}</h2>
        </div>
      </div>
      <div class="matrix-grid">
        ${outcomes.map((item, index) => `
          <div class="outcome-item">
            <span class="outcome-number">${String(index + 1).padStart(2, '0')}</span>
            <p>${html(item)}</p>
          </div>
        `).join('')}
      </div>
    </section>

    <section class="matrix-section" id="process">
      <div class="section-head">
        <div>
          <span class="kicker">${html(content.process?.kicker)}</span>
          <h2>${html(content.process?.title)}</h2>
        </div>
      </div>
      <div class="timeline">
        ${process.map((item, index) => `
          <article class="timeline-item">
            <span class="step">${String(index + 1).padStart(2, '0')}</span>
            <h3>${html(item.title)}</h3>
            <p>${html(item.text)}</p>
          </article>
        `).join('')}
      </div>
    </section>

    <section class="matrix-section" id="story">
      <div class="story-layout">
        <div class="matrix-panel">
          <span class="kicker">${html(content.story?.kicker)}</span>
          <h2>${html(content.story?.title)}</h2>
          ${(content.story?.paragraphs || []).map((paragraph) => `<p>${html(paragraph)}</p>`).join('')}
        </div>
        <div class="matrix-panel quote">${html(content.story?.quote)}</div>
      </div>
    </section>

    <section class="matrix-section" id="contact">
      <div class="contact-layout">
        <div class="matrix-panel">
          <span class="kicker">${html(content.contact?.kicker)}</span>
          <h2>${html(content.contact?.title)}</h2>
          <p>${html(content.contact?.text)}</p>
          <div class="matrix-actions">
            <a class="matrix-button primary" href="${attr(content.contact?.primaryHref)}" target="_blank" rel="noreferrer">${html(content.contact?.primaryLabel)}</a>
            <a class="matrix-button" href="${attr(content.contact?.secondaryHref)}">${html(content.contact?.secondaryLabel)}</a>
          </div>
        </div>
        <div class="matrix-panel">
          <h3>${html(content.contact?.socialTitle)}</h3>
          <div class="social-links">
            ${(content.contact?.socialLinks || []).map((item) => `<a href="${attr(item.href)}" target="_blank" rel="noreferrer">${html(item.label)}</a>`).join('')}
          </div>
          <p>${html(content.contact?.disclaimer)}</p>
        </div>
      </div>
    </section>
  </main>
`;

const initMatrixRain = () => {
  const canvas = document.querySelector('[data-matrix-rain]');
  const context = canvas.getContext('2d');
  const glyphs = 'アカサタナハマヤラワ0123456789АТМИКАПРОСНИСЬ';
  let columns = [];
  let width = 0;
  let height = 0;
  let frame = 0;

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    columns = Array.from({ length: Math.ceil(width / 18) }, () => Math.random() * -height);
  };

  const draw = () => {
    context.fillStyle = 'rgba(2, 5, 3, 0.14)';
    context.fillRect(0, 0, width, height);
    context.font = '16px "Courier New", monospace';

    columns.forEach((y, index) => {
      const x = index * 18;
      const char = glyphs[Math.floor(Math.random() * glyphs.length)];
      context.fillStyle = Math.random() > 0.97 ? '#f5fff8' : '#00ff88';
      context.fillText(char, x, y);
      columns[index] = y > height + Math.random() * 900 ? 0 : y + 18;
    });

    frame = requestAnimationFrame(draw);
  };

  window.addEventListener('resize', resize);
  window.addEventListener('pagehide', () => cancelAnimationFrame(frame), { once: true });
  resize();
  draw();
};

const initWhiteRabbit = () => {
  const rabbit = document.querySelector('[data-white-rabbit]');
  const bubble = rabbit.querySelector('.rabbit-bubble');
  const sections = [...document.querySelectorAll('main section')];
  const phrases = [
    'Следуй за белым кроликом.',
    'Система заметила твое пробуждение.',
    'Дыши глубже. Код уже дрожит.',
    'Там, где страшно, часто спрятана дверь.',
    'Выход начинается не с бунта, а с ясности.',
    'Проверь: это твой выбор или старая программа?',
    'Не спеши ломать Матрицу. Сначала увидь ее.',
    'Тело знает пароль раньше ума.',
    'Сверни туда, где становится тише.',
    'Иллюзия сильна, пока ты с ней споришь.',
    'Настоящий путь не шумит. Он зовет.',
    'Смотри между строк: там меняется сценарий.',
    'Каждый шаг вниз по странице снимает один слой.',
    'Ты не обязан жить в чужом алгоритме.',
    'Если реальность мерцает, значит ты близко.',
    'Верни внимание себе. Это главный ключ.',
    'Не ищи кнопку выхода. Стань тем, кто выходит.',
    'Финальный портал всегда внутри.'
  ];
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let targetY = 0;
  let currentY = 0;
  let targetX = 0;
  let currentX = 0;
  let targetTilt = 0;
  let currentTilt = 0;
  let phraseIndex = -1;
  let frame = 0;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const update = () => {
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = clamp(window.scrollY / maxScroll, 0, 1);
    const maxTravel = Math.max(0, window.innerHeight - rabbit.offsetHeight - 168);
    const nextPhraseIndex = Math.min(phrases.length - 1, Math.floor(progress * phrases.length));

    targetY = progress * maxTravel;
    targetX = Math.sin(progress * Math.PI * 2.6) * 9;
    targetTilt = Math.sin(progress * Math.PI * 7) * 4;
    rabbit.style.opacity = String(0.78 + progress * 0.22);

    if (nextPhraseIndex !== phraseIndex) {
      phraseIndex = nextPhraseIndex;
      bubble.textContent = phrases[phraseIndex];
      rabbit.setAttribute('aria-label', phrases[phraseIndex]);
      bubble.style.opacity = '0.35';
      bubble.style.transform = 'translateX(8px)';
      window.setTimeout(() => {
        bubble.style.opacity = '1';
        bubble.style.transform = 'translateX(0)';
      }, 80);
    }
  };

  const animate = () => {
    const easing = prefersReducedMotion ? 1 : 0.11;
    currentY += (targetY - currentY) * easing;
    currentX += (targetX - currentX) * easing;
    currentTilt += (targetTilt - currentTilt) * easing;
    rabbit.style.setProperty('--rabbit-y', `${currentY.toFixed(2)}px`);
    rabbit.style.setProperty('--rabbit-x', `${currentX.toFixed(2)}px`);
    rabbit.style.setProperty('--rabbit-tilt', `${currentTilt.toFixed(2)}deg`);
    frame = requestAnimationFrame(animate);
  };

  rabbit.addEventListener('click', () => {
    const next = sections.find((section) => section.getBoundingClientRect().top > 120) || sections[0];
    next.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  window.addEventListener('pagehide', () => cancelAnimationFrame(frame), { once: true });
  update();
  animate();
};

initMatrixRain();
initWhiteRabbit();
