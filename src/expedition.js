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

const app = document.querySelector('#expedition-app');
const nav = content.navigation || [];
const services = content.services || [];
const gallery = content.gallery?.items || [];
const audience = content.audience?.items || [];
const outcomes = content.outcomes?.items || [];
const process = content.process?.items || [];
const heroMedia = gallery.find((item) => item.type === 'video') || gallery[0];

const mediaMarkup = (item, className = '') => {
  if (!item) {
    return '';
  }

  if (item.type === 'video') {
    return `<video class="${attr(className)}" src="${attr(item.src)}" muted loop playsinline autoplay preload="auto"></video>`;
  }

  return `<img class="${attr(className)}" src="${attr(item.src)}" alt="${attr(item.title)}" loading="lazy" />`;
};

app.innerHTML = `
  <header class="expedition-header">
    <a class="expedition-brand" href="#top" aria-label="${attr(content.brand?.ariaLabel)}">
      <span class="brand-mark">${html(content.brand?.mark || 'A')}</span>
      <span>
        <strong>${html(content.brand?.name)}</strong>
        <small>${html(content.brand?.subtitle)}</small>
      </span>
    </a>
    <nav class="expedition-nav" aria-label="Site navigation">
      ${nav.map((item) => `<a href="${attr(item.href)}">${html(item.label)}</a>`).join('')}
    </nav>
    <a class="header-cta" href="${attr(content.header?.ctaHref || '#contact')}">${html(content.header?.ctaLabel)}</a>
    <button class="menu-toggle" type="button" aria-label="${attr(content.header?.openMenuLabel || 'Open menu')}" aria-expanded="false" data-menu-toggle>
      <span></span>
      <span></span>
    </button>
  </header>

  <main id="top">
    <section class="hero-expedition">
      <div class="hero-backdrop">
        ${mediaMarkup(heroMedia, 'hero-video')}
      </div>
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <span class="eyebrow">${html(content.hero?.eyebrow)}</span>
        <h1>${html(content.hero?.title)}</h1>
        <p>${html(content.hero?.text)}</p>
        <div class="hero-actions">
          <a class="button button-primary" href="${attr(content.hero?.primaryHref)}">${html(content.hero?.primaryLabel)}</a>
          <a class="button button-ghost" href="#gallery">${html(content.hero?.secondaryLabel)}</a>
        </div>
      </div>
      <div class="route-strip" aria-label="${attr(content.hero?.panelAriaLabel)}">
        ${(content.hero?.panel || []).map((item, index) => `
          <a href="#work">
            <span>${String(index + 1).padStart(2, '0')}</span>
            <strong>${html(item)}</strong>
          </a>
        `).join('')}
      </div>
    </section>

    <section class="section intro-section" id="intro-expedition">
      <div class="section-copy">
        <span class="eyebrow">${html(content.intro?.kicker)}</span>
        <h2>${html(content.intro?.title)}</h2>
      </div>
      <div class="prose">
        ${(content.intro?.paragraphs || []).map((paragraph) => `<p>${html(paragraph)}</p>`).join('')}
      </div>
    </section>

    <section class="section" id="work">
      <div class="center-head">
        <span class="eyebrow">${html(content.servicesSection?.kicker)}</span>
        <h2>${html(content.servicesSection?.title)}</h2>
      </div>
      <div class="tour-row">
        ${services.slice(0, 4).map((service, index) => {
          const media = gallery[index % gallery.length];
          return `
            <article class="tour-card">
              <div class="tour-media">${mediaMarkup(media)}</div>
              <span>Route ${String(index + 1).padStart(2, '0')}</span>
              <h3>${html(service.title)}</h3>
              <p>${html(service.tag)}</p>
              <strong>${html(service.price)}</strong>
            </article>
          `;
        }).join('')}
      </div>
      <div class="service-list">
        ${services.map((service, index) => `
          <article class="service-line">
            <span>${String(index + 1).padStart(2, '0')}</span>
            <div>
              <h3>${html(service.title)}</h3>
              <p>${html(service.text)}</p>
            </div>
            <strong>${html(service.price)}</strong>
          </article>
        `).join('')}
      </div>
    </section>

    <section class="discover-section" id="gallery">
      <div class="discover-copy">
        <span class="eyebrow">${html(content.gallery?.kicker)}</span>
        <h2>${html(content.gallery?.title)}</h2>
        <p>Fragments of practice become a route map: movement, body, silence, field and attention.</p>
      </div>
      <div class="video-mosaic">
        ${gallery.map((item, index) => `
          <figure class="mosaic-card ${index === 0 ? 'is-large' : ''}">
            ${mediaMarkup(item)}
            <figcaption>
              <span>${html(item.tag)}</span>
              <strong>${html(item.title)}</strong>
            </figcaption>
          </figure>
        `).join('')}
      </div>
      <div class="gallery-carousel expedition-mobile-carousel" data-expedition-carousel aria-label="${attr(content.gallery?.ariaLabel || 'Gallery')}">
        <button class="gallery-arrow gallery-arrow-prev" type="button" aria-label="${attr(content.gallery?.prevLabel || 'Previous slide')}" data-expedition-prev>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div class="gallery-stage">
          ${gallery.map((item, index) => `
            <figure class="gallery-slide" data-expedition-item data-index="${index}">
              <div class="gallery-media">
                ${item.type === 'video'
                  ? `<video src="${attr(item.src)}" muted loop playsinline autoplay preload="auto"></video>`
                  : `<img src="${attr(item.src)}" alt="${attr(item.title)}" loading="lazy" />`
                }
              </div>
              <figcaption>
                <span>${html(item.tag)}</span>
                <strong>${html(item.title)}</strong>
              </figcaption>
            </figure>
          `).join('')}
        </div>
        <button class="gallery-arrow gallery-arrow-next" type="button" aria-label="${attr(content.gallery?.nextLabel || 'Next slide')}" data-expedition-next>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
        <div class="gallery-dots" aria-label="${attr(content.gallery?.dotsLabel || 'Gallery slides')}">
          ${gallery.map((item, index) => `
            <button type="button" aria-label="${attr(content.gallery?.dotLabel || 'Slide')} ${index + 1}" data-expedition-dot="${index}"></button>
          `).join('')}
        </div>
      </div>
    </section>

    <section class="section split-section" id="for-whom">
      <div class="section-copy">
        <span class="eyebrow">${html(content.audience?.kicker)}</span>
        <h2>${html(content.audience?.title)}</h2>
        <p>${html(content.audience?.text)}</p>
      </div>
      <div class="check-grid">
        ${audience.map((item) => `<div class="check-card">${html(item)}</div>`).join('')}
      </div>
    </section>

    <section class="section outcomes-section" id="outcomes">
      <div class="center-head">
        <span class="eyebrow">${html(content.outcomes?.kicker)}</span>
        <h2>${html(content.outcomes?.title)}</h2>
      </div>
      <div class="outcome-grid">
        ${outcomes.map((item, index) => `
          <article>
            <span>${String(index + 1).padStart(2, '0')}</span>
            <p>${html(item)}</p>
          </article>
        `).join('')}
      </div>
    </section>

    <section class="section process-section" id="process">
      <div class="section-copy">
        <span class="eyebrow">${html(content.process?.kicker)}</span>
        <h2>${html(content.process?.title)}</h2>
      </div>
      <div class="process-track">
        ${process.map((item, index) => `
          <article>
            <span>${String(index + 1).padStart(2, '0')}</span>
            <h3>${html(item.title)}</h3>
            <p>${html(item.text)}</p>
          </article>
        `).join('')}
      </div>
    </section>

    <section class="section story-section" id="story">
      <div class="story-card">
        <span class="eyebrow">${html(content.story?.kicker)}</span>
        <h2>${html(content.story?.title)}</h2>
        ${(content.story?.paragraphs || []).map((paragraph) => `<p>${html(paragraph)}</p>`).join('')}
      </div>
      <blockquote>${html(content.story?.quote)}</blockquote>
    </section>

    <section class="contact-section" id="contact">
      <div>
        <span class="eyebrow">${html(content.contact?.kicker)}</span>
        <h2>${html(content.contact?.title)}</h2>
        <p>${html(content.contact?.text)}</p>
      </div>
      <div class="contact-panel">
        <a class="button button-primary" href="${attr(content.contact?.primaryHref)}" target="_blank" rel="noreferrer">${html(content.contact?.primaryLabel)}</a>
        <a class="button button-ghost" href="${attr(content.contact?.secondaryHref)}">${html(content.contact?.secondaryLabel)}</a>
        <div class="social-links">
          ${(content.contact?.socialLinks || []).map((item) => `<a href="${attr(item.href)}" target="_blank" rel="noreferrer">${html(item.label)}</a>`).join('')}
        </div>
        <small>${html(content.contact?.disclaimer)}</small>
      </div>
    </section>
  </main>
`;

const initMenu = () => {
  const toggle = document.querySelector('[data-menu-toggle]');
  const navEl = document.querySelector('.expedition-nav');

  if (!toggle || !navEl) {
    return;
  }

  toggle.addEventListener('click', () => {
    const isOpen = document.body.classList.toggle('menu-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  navEl.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      document.body.classList.remove('menu-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
};

const initVideoPlayback = () => {
  document.querySelectorAll('video').forEach((video) => {
    video.muted = true;
    video.play().catch(() => {});
  });
};

const initMobileGalleryCarousel = () => {
  const carousel = document.querySelector('[data-expedition-carousel]');

  if (!carousel) {
    return;
  }

  const slides = [...carousel.querySelectorAll('[data-expedition-item]')];
  const dots = [...carousel.querySelectorAll('[data-expedition-dot]')];
  const prevButton = carousel.querySelector('[data-expedition-prev]');
  const nextButton = carousel.querySelector('[data-expedition-next]');
  let activeIndex = 0;
  let autoTimer = 0;
  let pointerStartX = 0;
  let pointerDeltaX = 0;

  const normalizeOffset = (index) => {
    let offset = index - activeIndex;
    const half = slides.length / 2;

    if (offset > half) {
      offset -= slides.length;
    }

    if (offset < -half) {
      offset += slides.length;
    }

    return offset;
  };

  const updateVideos = () => {
    slides.forEach((slide) => {
      const video = slide.querySelector('video');

      if (video) {
        video.play().catch(() => {});
      }
    });
  };

  const render = () => {
    slides.forEach((slide, index) => {
      const offset = normalizeOffset(index);
      const distance = Math.min(Math.abs(offset), 3);

      slide.style.setProperty('--offset', offset);
      slide.style.setProperty('--distance', distance);
      slide.style.zIndex = String(20 - distance);
      slide.toggleAttribute('aria-current', offset === 0);
      slide.setAttribute('aria-hidden', String(distance > 2));
    });

    dots.forEach((dot, index) => {
      dot.classList.toggle('is-active', index === activeIndex);
      dot.setAttribute('aria-current', String(index === activeIndex));
    });

    updateVideos();
  };

  const goTo = (nextIndex) => {
    activeIndex = (nextIndex + slides.length) % slides.length;
    render();
  };

  const restartAuto = () => {
    window.clearInterval(autoTimer);
    autoTimer = window.setInterval(() => goTo(activeIndex + 1), 5200);
  };

  prevButton?.addEventListener('click', () => {
    goTo(activeIndex - 1);
    restartAuto();
  });

  nextButton?.addEventListener('click', () => {
    goTo(activeIndex + 1);
    restartAuto();
  });

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      goTo(index);
      restartAuto();
    });
  });

  carousel.addEventListener('pointerdown', (event) => {
    if (event.target.closest('.gallery-arrow, .gallery-dots button')) {
      return;
    }

    pointerStartX = event.clientX;
    pointerDeltaX = 0;
    carousel.setPointerCapture(event.pointerId);
  });

  carousel.addEventListener('pointermove', (event) => {
    if (!pointerStartX) {
      return;
    }

    pointerDeltaX = event.clientX - pointerStartX;
  });

  carousel.addEventListener('pointerup', () => {
    if (Math.abs(pointerDeltaX) > 44) {
      goTo(activeIndex + (pointerDeltaX < 0 ? 1 : -1));
      restartAuto();
    }

    pointerStartX = 0;
    pointerDeltaX = 0;
  });

  carousel.addEventListener('pointercancel', () => {
    pointerStartX = 0;
    pointerDeltaX = 0;
  });

  carousel.addEventListener('mouseenter', () => window.clearInterval(autoTimer));
  carousel.addEventListener('mouseleave', restartAuto);
  carousel.addEventListener('focusin', () => window.clearInterval(autoTimer));
  carousel.addEventListener('focusout', restartAuto);

  render();
  restartAuto();
};

initMenu();
initVideoPlayback();
initMobileGalleryCarousel();
