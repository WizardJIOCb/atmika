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

const app = document.querySelector('#sdd-app');
const nav = [
  { label: 'Кто такая Атмика', href: '#about' },
  { label: 'Форматы', href: '#services' },
  { label: 'Боли', href: '#pains' },
  { label: 'Галерея', href: '#gallery' },
  { label: 'Контакты', href: '#contact' }
];
const services = (content.services || []).slice(0, 6);
const gallery = content.gallery?.items || [];
const pains = content.audience?.items || [];
const outcomes = content.outcomes?.items || [];

app.innerHTML = `
  <div class="sdd-shell">
    <header class="sdd-nav">
      <a class="sdd-brand" href="#top" aria-label="${attr(content.brand?.ariaLabel)}">
        <span class="sdd-mark">${html(content.brand?.mark || 'A')}</span>
        <span>
          <strong>${html(content.brand?.name)}</strong>
          <small>${html(content.brand?.subtitle)}</small>
        </span>
      </a>
      <nav class="sdd-links" aria-label="Навигация">
        ${nav.map((item) => `<a href="${attr(item.href)}">${html(item.label)}</a>`).join('')}
      </nav>
    </header>

    <main id="top">
      <section class="sdd-hero" id="hero">
        <div class="sdd-hero-grid">
          <div class="hero-copy">
            <span class="sdd-label">${html(content.hero?.eyebrow)}</span>
            <h1 class="hero-title">${html(content.hero?.title)}</h1>
            <p class="hero-sub">${html(content.hero?.text)}</p>
            <div class="hero-divider"></div>
            <div class="hero-quote">Матрица - это иллюзия. Ты - сознание, которое смотрит сквозь нее.</div>
            <div class="sdd-actions">
              <a class="sdd-button primary" href="${attr(content.hero?.primaryHref)}">${html(content.hero?.primaryLabel)}</a>
              <a class="sdd-button" href="#services">Смотреть форматы</a>
            </div>
          </div>

          <div class="orb-stage" aria-hidden="true">
            <div class="orb">
              <div class="orb-glow"></div>
              <div class="orb-ring"></div>
              <div class="orb-core"></div>
            </div>
          </div>

          <div class="hero-codes" aria-label="${attr(content.hero?.panelAriaLabel)}">
            ${(content.hero?.panel || []).map((item, index) => `<span>0${index + 1} / ${html(item)}</span>`).join('')}
          </div>
        </div>
      </section>

      <section class="sdd-section" id="about">
        <div class="section-head">
          <div>
            <span class="sdd-label">${html(content.intro?.kicker)}</span>
            <h2 class="section-title">${html(content.intro?.title)}</h2>
          </div>
          <p class="section-copy">${html(content.intro?.paragraphs?.[0])}</p>
        </div>
        <div class="about-grid">
          <article class="about-card">
            ${(content.intro?.paragraphs || []).map((paragraph) => `<p>${html(paragraph)}</p>`).join('')}
          </article>
          <aside class="about-signal">
            ${outcomes.slice(0, 4).map((item, index) => `<div>signal.${index + 1}: ${html(item)}</div>`).join('')}
          </aside>
        </div>
      </section>

      <section class="sdd-section" id="services">
        <div class="section-head">
          <div>
            <span class="sdd-label">${html(content.servicesSection?.kicker)}</span>
            <h2 class="section-title">${html(content.servicesSection?.title)}</h2>
          </div>
          <p class="section-copy">Форматы собраны как разные уровни глубины: от первой настройки поля до долгой программы, где меняется не декор жизни, а внутренний способ смотреть на реальность.</p>
        </div>
        <div class="service-grid">
          ${services.map((service, index) => `
            <article class="service-card" data-index="${String(index + 1).padStart(2, '0')}">
              <span>${html(service.tag)}</span>
              <h3>${html(service.title)}</h3>
              <p>${html(service.text)}</p>
              <div class="service-price">${html(service.price)}</div>
            </article>
          `).join('')}
        </div>
      </section>

      <section class="sdd-section" id="pains">
        <div class="pains-layout">
          <aside class="pain-lead">
            <span class="sdd-label">// почему люди приходят</span>
            <h2 class="section-title">Из каких болей выходит человек</h2>
            <p>Здесь нет задачи “починить” себя. Есть задача увидеть слой программы, вернуть внимание в тело и перестать жить из автоматической реакции.</p>
          </aside>
          <div class="pain-stack">
            ${pains.map((item, index) => `
              <article class="pain-card">
                <span class="pain-number">${String(index + 1).padStart(2, '0')}</span>
                <div>
                  <h3>${html(['Сбой картины мира', 'Сигналы тонкого опыта', 'Повторяющиеся сценарии', 'Желание управлять состоянием'][index] || 'Внутренний сигнал')}</h3>
                  <p>${html(item)}</p>
                </div>
              </article>
            `).join('')}
          </div>
        </div>
      </section>

      <section class="sdd-section" id="gallery">
        <div class="section-head">
          <div>
            <span class="sdd-label">${html(content.gallery?.kicker)}</span>
            <h2 class="section-title">${html(content.gallery?.title)}</h2>
          </div>
          <p class="section-copy">Фрагменты визуального поля: огонь, вода, тело, тишина и образы перехода. Без фильтров поверх медиа, чтобы материал дышал своим цветом.</p>
        </div>
        <div class="media-grid">
          ${gallery.map((item, index) => `
            <figure class="media-card" style="--lift:${(index - 2) * 18}px">
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

      <section class="sdd-section" id="contact">
        <div class="contact-grid">
          <article class="contact-card">
            <span class="sdd-label">${html(content.contact?.kicker)}</span>
            <h2>${html(content.contact?.title)}</h2>
            <p>${html(content.contact?.text)}</p>
            <div class="sdd-actions">
              <a class="sdd-button primary" href="${attr(content.contact?.primaryHref)}" target="_blank" rel="noreferrer">${html(content.contact?.primaryLabel)}</a>
              <a class="sdd-button" href="${attr(content.contact?.secondaryHref)}">${html(content.contact?.secondaryLabel)}</a>
            </div>
          </article>
          <aside class="contact-card">
            <h2>${html(content.contact?.socialTitle)}</h2>
            <div class="social-links">
              ${(content.contact?.socialLinks || []).map((item) => `<a href="${attr(item.href)}" target="_blank" rel="noreferrer">${html(item.label)}</a>`).join('')}
            </div>
            <p>${html(content.contact?.disclaimer)}</p>
          </aside>
        </div>
      </section>
    </main>
  </div>
`;

const initRain = () => {
  const canvas = document.querySelector('[data-sdd-rain]');
  const context = canvas.getContext('2d');
  const glyphs = '0123456789ATMIKAСОЗНАНИЕПОЛЕМАТРИЦА';
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
    columns = Array.from({ length: Math.ceil(width / 22) }, () => Math.random() * -height);
  };

  const draw = () => {
    context.fillStyle = 'rgba(2, 4, 8, 0.18)';
    context.fillRect(0, 0, width, height);
    context.font = '15px "Courier New", monospace';

    columns.forEach((y, index) => {
      const x = index * 22;
      const char = glyphs[Math.floor(Math.random() * glyphs.length)];
      context.fillStyle = Math.random() > 0.985 ? '#f5d77e' : '#00ff41';
      context.fillText(char, x, y);
      columns[index] = y > height + Math.random() * 800 ? 0 : y + 20;
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

  if (!rabbit) {
    return;
  }

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

initRain();
initWhiteRabbit();
