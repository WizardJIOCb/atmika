const content = window.ATMIKA_CONTENT;

if (!content) {
  throw new Error('ATMIKA_CONTENT is not loaded. Check public/content.js.');
}

const services = content.services || [];
const galleryItems = content.gallery?.items || [];
const audience = content.audience?.items || [];
const outcomes = content.outcomes?.items || [];
const process = content.process?.items || [];
const socialLinks = content.contact?.socialLinks || [];

const text = (value) => String(value ?? '');
const html = (value) => text(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');
const attr = html;

const setMeta = () => {
  const meta = content.meta || {};
  document.title = text(meta.title) || document.title;
  document.querySelector('meta[name="description"]')?.setAttribute('content', text(meta.description));
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', text(meta.ogTitle || meta.title));
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', text(meta.ogDescription || meta.description));
  document.querySelector('meta[property="og:url"]')?.setAttribute('content', text(meta.ogUrl));
  document.querySelector('meta[property="og:image"]')?.setAttribute('content', text(meta.ogImage));
  document.querySelector('link[rel="icon"]')?.setAttribute('href', text(meta.favicon));
};

setMeta();

document.querySelector('#app').innerHTML = `
  <header class="site-header" data-header>
    <a class="brand" href="#top" aria-label="${attr(content.brand?.ariaLabel)}">
      <span class="brand-mark">${html(content.brand?.mark || 'A')}</span>
      <span>
        <strong>${html(content.brand?.name)}</strong>
        <small>${html(content.brand?.subtitle)}</small>
      </span>
    </a>
    <nav class="desktop-nav" aria-label="Основная навигация">
      ${(content.navigation || []).map((item) => `<a href="${attr(item.href)}">${html(item.label)}</a>`).join('')}
    </nav>
    <a class="header-cta" href="${attr(content.header?.ctaHref || '#contact')}">
      <i data-lucide="calendar-days"></i>
      <span>${html(content.header?.ctaLabel)}</span>
    </a>
    <button class="menu-toggle" type="button" aria-label="${attr(content.header?.openMenuLabel)}" aria-expanded="false" data-menu-toggle>
      <i data-lucide="menu"></i>
    </button>
  </header>

  <div class="mobile-panel" data-mobile-panel>
    <button class="panel-close" type="button" aria-label="${attr(content.header?.closeMenuLabel)}" data-panel-close>
      <i data-lucide="x"></i>
    </button>
    ${(content.navigation || []).map((item) => `<a href="${attr(item.href)}">${html(item.label)}</a>`).join('')}
  </div>

  <main id="top">
    <section class="hero">
      <div class="hero-bg" aria-hidden="true"></div>
      <div class="hero-content">
        <div class="eyebrow">${html(content.hero?.eyebrow)}</div>
        <h1>${html(content.hero?.title)}</h1>
        <p>${html(content.hero?.text)}</p>
        <div class="hero-actions">
          <a class="button primary" href="${attr(content.hero?.primaryHref || '#contact')}">
            <span>${html(content.hero?.primaryLabel)}</span>
            <i data-lucide="arrow-right"></i>
          </a>
          <a class="button ghost" href="${attr(content.hero?.secondaryHref || '#work')}">
            <span>${html(content.hero?.secondaryLabel)}</span>
          </a>
        </div>
      </div>
      <div class="hero-panel" aria-label="${attr(content.hero?.panelAriaLabel)}">
        ${(content.hero?.panel || []).map((item) => `<span>${html(item)}</span>`).join('')}
      </div>
    </section>

    <section class="intro section-band">
      <canvas class="nebula-canvas" data-nebula-canvas aria-hidden="true"></canvas>
      <div class="section-heading">
        <span class="kicker">${html(content.intro?.kicker)}</span>
        <h2>${html(content.intro?.title)}</h2>
      </div>
      <div class="intro-copy">
        ${(content.intro?.paragraphs || []).map((paragraph) => `<p>${html(paragraph)}</p>`).join('')}
      </div>
    </section>

    <section class="services" id="work">
      <canvas class="warp-canvas" data-warp-canvas aria-hidden="true"></canvas>
      <div class="section-heading services-heading">
        <span class="kicker">${html(content.servicesSection?.kicker)}</span>
        <h2>${html(content.servicesSection?.title)}</h2>
      </div>
      <div class="service-grid">
        ${services.map((service) => `
          <article class="service-card">
            <div class="service-topline">
              <span class="icon-box"><i data-lucide="${attr(service.icon)}"></i></span>
              <span>${html(service.tag)}</span>
            </div>
            <h3>${html(service.title)}</h3>
            <p>${html(service.text)}</p>
            <div class="price">${html(service.price)}</div>
          </article>
        `).join('')}
      </div>
    </section>

    <section class="gallery section-band" id="gallery">
      <div class="section-heading section-heading-centered gallery-heading">
        <span class="kicker">${html(content.gallery?.kicker)}</span>
        <h2>${html(content.gallery?.title)}</h2>
      </div>
      <div class="gallery-carousel" data-gallery-carousel aria-label="${attr(content.gallery?.ariaLabel)}">
        <button class="gallery-arrow gallery-arrow-prev" type="button" aria-label="${attr(content.gallery?.prevLabel)}" data-gallery-prev>
          <i data-lucide="chevron-left"></i>
        </button>
        <div class="gallery-stage">
          ${galleryItems.map((item, index) => `
            <figure class="gallery-slide" data-gallery-item data-index="${index}">
              <div class="gallery-media">
                ${item.type === 'video'
                  ? `<video src="${attr(item.src)}" muted loop playsinline preload="metadata"></video>`
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
        <button class="gallery-arrow gallery-arrow-next" type="button" aria-label="${attr(content.gallery?.nextLabel)}" data-gallery-next>
          <i data-lucide="chevron-right"></i>
        </button>
        <div class="gallery-dots" aria-label="${attr(content.gallery?.dotsLabel)}">
          ${galleryItems.map((item, index) => `
            <button type="button" aria-label="${attr(content.gallery?.dotLabel)} ${index + 1}" data-gallery-dot="${index}"></button>
          `).join('')}
        </div>
      </div>
    </section>

    <section class="split section-band" id="for-whom">
      <canvas class="sky-canvas" data-sky-canvas aria-hidden="true"></canvas>
      <div>
        <span class="kicker">${html(content.audience?.kicker)}</span>
        <h2>${html(content.audience?.title)}</h2>
        <p>${html(content.audience?.text)}</p>
      </div>
      <div class="check-list">
        ${audience.map((item) => `
          <div class="check-item">
            <i data-lucide="circle-check"></i>
            <span>${html(item)}</span>
          </div>
        `).join('')}
      </div>
    </section>

    <section class="outcomes" id="outcomes">
      <div class="section-heading section-heading-centered">
        <span class="kicker">${html(content.outcomes?.kicker)}</span>
        <h2>${html(content.outcomes?.title)}</h2>
      </div>
      <div class="outcome-list">
        ${outcomes.map((item, index) => `
          <div class="outcome-item">
            <span class="outcome-number">${String(index + 1).padStart(2, '0')}</span>
            <span>${html(item)}</span>
          </div>
        `).join('')}
      </div>
    </section>

    <section class="process section-band" id="process">
      <div class="section-heading section-heading-stack process-heading">
        <span class="kicker">${html(content.process?.kicker)}</span>
        <h2>${html(content.process?.title)}</h2>
      </div>
      <div class="timeline">
        ${process.map((item, index) => `
          <article class="timeline-item">
            <span>${String(index + 1).padStart(2, '0')}</span>
            <h3>${html(item.title)}</h3>
            <p>${html(item.text)}</p>
          </article>
        `).join('')}
      </div>
    </section>

    <section class="story" id="story">
      <div class="story-card">
        <span class="kicker">${html(content.story?.kicker)}</span>
        <h2>${html(content.story?.title)}</h2>
        ${(content.story?.paragraphs || []).map((paragraph) => `<p>${html(paragraph)}</p>`).join('')}
      </div>
      <div class="quote-card">
        <p>${html(content.story?.quote)}</p>
      </div>
    </section>

    <section class="contact" id="contact">
      <div class="contact-inner">
        <div>
          <span class="kicker">${html(content.contact?.kicker)}</span>
          <h2>${html(content.contact?.title)}</h2>
          <p>${html(content.contact?.text)}</p>
          <div class="contact-actions">
            <a class="button primary" href="${attr(content.contact?.primaryHref)}" target="_blank" rel="noreferrer">
              <i data-lucide="message-circle"></i>
              <span>${html(content.contact?.primaryLabel)}</span>
            </a>
            <a class="button ghost light" href="${attr(content.contact?.secondaryHref)}">${html(content.contact?.secondaryLabel)}</a>
          </div>
        </div>
        <div class="social-card">
          <h3>${html(content.contact?.socialTitle)}</h3>
          ${socialLinks.map((item) => `
            <a href="${attr(item.href)}" target="_blank" rel="noreferrer">
              <i data-lucide="${attr(item.icon)}"></i>
              <span>${html(item.label)}</span>
            </a>
          `).join('')}
          <small>${html(content.contact?.disclaimer)}</small>
        </div>
      </div>
    </section>
  </main>
`;
const iconPaths = {
  'arrow-right': '<path d="M5 12h14"></path><path d="m13 6 6 6-6 6"></path>',
  'calendar-days': '<path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path><path d="M8 14h.01"></path><path d="M12 14h.01"></path><path d="M16 14h.01"></path><path d="M8 18h.01"></path><path d="M12 18h.01"></path><path d="M16 18h.01"></path>',
  'chevron-left': '<path d="m15 18-6-6 6-6"></path>',
  'chevron-right': '<path d="m9 18 6-6-6-6"></path>',
  'circle-check': '<circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-5"></path>',
  flame: '<path d="M8.5 14.5A4.5 4.5 0 0 0 12 22a4.5 4.5 0 0 0 3.5-7.5c-1.5-1.8-1.9-3.2-1.2-5.5-2.3 1.1-3.8 2.8-4.3 5.1-.9-.9-1.3-2.1-1.1-3.7-2 1.6-3.2 3.6-3.2 5.6 0 2.2 1.2 4.3 3.3 5.5"></path>',
  'heart-pulse': '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 12 5a5.5 5.5 0 0 0-10 3.5c0 2.3 1.5 4 3 5.5l7 7Z"></path><path d="M3.2 14H7l2-3 2 6 2-3h4.8"></path>',
  instagram: '<rect width="18" height="18" x="3" y="3" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><path d="M17.5 6.5h.01"></path>',
  menu: '<path d="M4 6h16"></path><path d="M4 12h16"></path><path d="M4 18h16"></path>',
  'message-circle': '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path>',
  play: '<path d="m8 5 12 7-12 7Z"></path>',
  sparkles: '<path d="M9.9 2.8 8.2 7.4 3.6 9.1l4.6 1.7 1.7 4.6 1.7-4.6 4.6-1.7-4.6-1.7Z"></path><path d="M18.6 13.4 17.7 16l-2.6.9 2.6.9.9 2.6.9-2.6 2.6-.9-2.6-.9Z"></path>',
  star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2L5.8 21 7 14.2 2 9.3l6.9-1Z"></path>',
  waves: '<path d="M2 6c3 0 3 2 6 2s3-2 6-2 3 2 6 2 3-2 6-2"></path><path d="M2 12c3 0 3 2 6 2s3-2 6-2 3 2 6 2 3-2 6-2"></path><path d="M2 18c3 0 3 2 6 2s3-2 6-2 3 2 6 2 3-2 6-2"></path>',
  x: '<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>',
  youtube: '<path d="M2.5 17a24.1 24.1 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.6 49.6 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.1 24.1 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.6 49.6 0 0 1-16.2 0A2 2 0 0 1 2.5 17"></path><path d="m10 15 5-3-5-3z"></path>',
};

document.querySelectorAll('[data-lucide]').forEach((node) => {
  const name = node.getAttribute('data-lucide');
  node.outerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconPaths[name] || ''}</svg>`;
});

if (window.location.hash) {
  setTimeout(() => {
    document.querySelector(window.location.hash)?.scrollIntoView();
  }, 50);
}

const header = document.querySelector('[data-header]');
const menuToggle = document.querySelector('[data-menu-toggle]');
const mobilePanel = document.querySelector('[data-mobile-panel]');
const panelClose = document.querySelector('[data-panel-close]');

const closePanel = () => {
  mobilePanel.classList.remove('is-open');
  menuToggle.setAttribute('aria-expanded', 'false');
};

menuToggle.addEventListener('click', () => {
  const isOpen = mobilePanel.classList.toggle('is-open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});

panelClose.addEventListener('click', closePanel);
mobilePanel.querySelectorAll('a').forEach((link) => link.addEventListener('click', closePanel));

window.addEventListener('scroll', () => {
  header.classList.toggle('is-scrolled', window.scrollY > 12);
});

const initGalleryCarousel = () => {
  const carousel = document.querySelector('[data-gallery-carousel]');

  if (!carousel) {
    return;
  }

  const slides = [...carousel.querySelectorAll('[data-gallery-item]')];
  const dots = [...carousel.querySelectorAll('[data-gallery-dot]')];
  const prevButton = carousel.querySelector('[data-gallery-prev]');
  const nextButton = carousel.querySelector('[data-gallery-next]');
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
    slides.forEach((slide, index) => {
      const video = slide.querySelector('video');

      if (!video) {
        return;
      }

      if (Math.abs(normalizeOffset(index)) <= 1) {
        video.play().catch(() => {});
      } else {
        video.pause();
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

  const goTo = (index) => {
    activeIndex = (index + slides.length) % slides.length;
    render();
  };

  const restartAuto = () => {
    window.clearInterval(autoTimer);
    autoTimer = window.setInterval(() => goTo(activeIndex + 1), 6200);
  };

  prevButton.addEventListener('click', () => {
    goTo(activeIndex - 1);
    restartAuto();
  });

  nextButton.addEventListener('click', () => {
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
    window.clearInterval(autoTimer);
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
    }

    pointerStartX = 0;
    pointerDeltaX = 0;
    restartAuto();
  });

  carousel.addEventListener('pointercancel', () => {
    pointerStartX = 0;
    pointerDeltaX = 0;
    restartAuto();
  });

  carousel.addEventListener('mouseenter', () => window.clearInterval(autoTimer));
  carousel.addEventListener('mouseleave', restartAuto);
  carousel.addEventListener('focusin', () => window.clearInterval(autoTimer));
  carousel.addEventListener('focusout', restartAuto);

  render();
  restartAuto();
};

initGalleryCarousel();

const initNebulaBackground = async () => {
  const canvas = document.querySelector('[data-nebula-canvas]');

  if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  try {
    const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js');
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'low-power',
    });
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
    const group = new THREE.Group();
    const prefersFineMotion = window.matchMedia('(min-width: 720px)').matches;
    let animationFrame = 0;
    let isVisible = true;

    camera.position.z = 36;
    scene.add(group);

    const makeGlowTexture = () => {
      const textureCanvas = document.createElement('canvas');
      textureCanvas.width = 256;
      textureCanvas.height = 256;
      const context = textureCanvas.getContext('2d');
      const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128);

      gradient.addColorStop(0, 'rgba(255,255,255,0.68)');
      gradient.addColorStop(0.26, 'rgba(255,238,206,0.32)');
      gradient.addColorStop(0.58, 'rgba(180,211,218,0.12)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      context.fillStyle = gradient;
      context.fillRect(0, 0, 256, 256);

      const texture = new THREE.CanvasTexture(textureCanvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture;
    };

    const glowTexture = makeGlowTexture();
    const nebulaColors = [0xd9aa61, 0x9cb9b9, 0xf7f1e5, 0x5f8f8a, 0xb77952];

    for (let i = 0; i < 44; i += 1) {
      const material = new THREE.SpriteMaterial({
        map: glowTexture,
        color: nebulaColors[i % nebulaColors.length],
        transparent: true,
        opacity: 0.18 + (i % 5) * 0.026,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const sprite = new THREE.Sprite(material);
      const scale = 22 + Math.random() * 58;

      sprite.position.set(
        (Math.random() - 0.5) * 88,
        (Math.random() - 0.5) * 34,
        -16 - Math.random() * 42,
      );
      sprite.scale.set(scale * (2.15 + Math.random() * 1.15), scale * 0.72, 1);
      sprite.material.rotation = Math.random() * Math.PI;
      group.add(sprite);
    }

    const starGeometry = new THREE.BufferGeometry();
    const starCount = prefersFineMotion ? 1500 : 760;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const color = new THREE.Color();

    for (let i = 0; i < starCount; i += 1) {
      const index = i * 3;
      positions[index] = (Math.random() - 0.5) * 92;
      positions[index + 1] = (Math.random() - 0.5) * 32;
      positions[index + 2] = -18 - Math.random() * 64;
      color.setHex(i % 4 === 0 ? 0xd9aa61 : 0xbfd3d5);
      colors[index] = color.r;
      colors[index + 1] = color.g;
      colors[index + 2] = color.b;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    group.add(new THREE.Points(
      starGeometry,
      new THREE.PointsMaterial({
        size: 0.16,
        vertexColors: true,
        transparent: true,
        opacity: 0.78,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    ));

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.6);

      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(Math.max(1, width), Math.max(1, height), false);
      camera.aspect = Math.max(1, width) / Math.max(1, height);
      camera.updateProjectionMatrix();
    };

    const render = (time = 0) => {
      if (!isVisible) {
        animationFrame = requestAnimationFrame(render);
        return;
      }

      const speed = time * 0.00018;
      group.rotation.z = Math.sin(speed * 1.5) * 0.075;
      group.rotation.y = Math.sin(speed) * 0.18;
      group.position.x = Math.sin(speed * 1.7) * 2.4;
      group.position.y = Math.cos(speed * 1.25) * 0.9;
      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(render);
    };

    new ResizeObserver(resize).observe(canvas);
    resize();
    render();

    new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    }, { threshold: 0.05 }).observe(canvas);

    window.addEventListener('pagehide', () => {
      cancelAnimationFrame(animationFrame);
      renderer.dispose();
      starGeometry.dispose();
      glowTexture.dispose();
    }, { once: true });
  } catch (error) {
    canvas.classList.add('is-fallback');
  }
};

initNebulaBackground();

const initWarpBackground = async () => {
  const canvas = document.querySelector('[data-warp-canvas]');

  if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  try {
    const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js');
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      preserveDrawingBuffer: true,
      powerPreference: 'low-power',
    });
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
    };
    let animationFrame = 0;
    let isVisible = true;

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms,
      vertexShader: `
        varying vec2 vUv;

        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;

        uniform float uTime;
        uniform vec2 uResolution;
        varying vec2 vUv;

        mat2 rotate2d(float angle) {
          float s = sin(angle);
          float c = cos(angle);
          return mat2(c, -s, s, c);
        }

        float hash(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
            u.y
          );
        }

        float fbm(vec2 p) {
          float value = 0.0;
          float amplitude = 0.55;

          for (int i = 0; i < 5; i++) {
            value += amplitude * noise(p);
            p = rotate2d(0.62) * p * 2.03 + 17.1;
            amplitude *= 0.5;
          }

          return value;
        }

        void main() {
          vec2 uv = vUv - 0.5;
          uv.x *= uResolution.x / max(uResolution.y, 1.0);

          float time = uTime * 0.32;
          vec2 drift = uv;
          drift *= rotate2d(sin(time * 0.22) * 0.18);

          float radial = length(drift);
          float angle = atan(drift.y, drift.x);
          float tunnel = 1.0 / max(radial * 3.8, 0.16);
          float rayNoise = fbm(vec2(angle * 2.2 + time * 0.65, tunnel + time * 0.9));
          float cloud = fbm(drift * 3.4 + vec2(time * 0.38, -time * 0.22));
          float fineCloud = fbm(drift * 8.0 - vec2(time * 0.6, time * 0.34));

          float rays = pow(abs(sin(angle * 10.0 + rayNoise * 4.0 + time * 1.8)), 18.0);
          rays *= smoothstep(0.12, 0.82, radial) * (1.0 - smoothstep(0.78, 1.15, radial));

          float core = smoothstep(0.54, 0.02, radial);
          float mist = smoothstep(0.22, 0.9, cloud * 0.72 + fineCloud * 0.38);
          float pulse = 0.72 + 0.28 * sin(time * 2.2 + radial * 8.0);
          float intensity = (mist * 0.72 + rays * 0.9 + core * 0.42) * pulse;

          vec3 teal = vec3(0.24, 0.58, 0.58);
          vec3 amber = vec3(1.0, 0.58, 0.22);
          vec3 ink = vec3(0.02, 0.035, 0.04);
          vec3 color = mix(teal, amber, smoothstep(-0.8, 0.9, sin(angle * 2.0 + time) + cloud));
          color = mix(ink, color, intensity);
          color += vec3(0.95, 0.77, 0.48) * rays * 0.3;
          color += vec3(0.52, 0.82, 0.86) * core * 0.18;

          float vignette = smoothstep(1.25, 0.2, radial);
          float alpha = clamp((intensity * 0.74 + core * 0.18) * vignette, 0.0, 0.86);
          gl_FragColor = vec4(color, alpha);
        }
      `,
    });

    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.45);

      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(Math.max(1, width), Math.max(1, height), false);
      uniforms.uResolution.value.set(
        Math.max(1, width) * pixelRatio,
        Math.max(1, height) * pixelRatio,
      );
    };

    const render = (time = 0) => {
      if (isVisible) {
        uniforms.uTime.value = time * 0.001;
        renderer.render(scene, camera);
      }

      animationFrame = requestAnimationFrame(render);
    };

    new ResizeObserver(resize).observe(canvas);
    resize();
    render();

    new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    }, { threshold: 0.05 }).observe(canvas);

    window.addEventListener('pagehide', () => {
      cancelAnimationFrame(animationFrame);
      renderer.dispose();
      material.dispose();
    }, { once: true });
  } catch (error) {
    canvas.classList.add('is-fallback');
  }
};

initWarpBackground();

const initSkyBackground = async () => {
  const canvas = document.querySelector('[data-sky-canvas]');

  if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  try {
    const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js');
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      preserveDrawingBuffer: true,
      powerPreference: 'low-power',
    });
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
    };
    let animationFrame = 0;
    let isVisible = true;

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms,
      vertexShader: `
        varying vec2 vUv;

        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;

        uniform float uTime;
        uniform vec2 uResolution;
        varying vec2 vUv;

        mat2 rotate2d(float angle) {
          float s = sin(angle);
          float c = cos(angle);
          return mat2(c, -s, s, c);
        }

        float hash(vec2 p) {
          p = fract(p * vec2(127.1, 311.7));
          p += dot(p, p + 34.23);
          return fract(p.x * p.y);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);

          return mix(
            mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
            u.y
          );
        }

        float fbm(vec2 p) {
          float value = 0.0;
          float amplitude = 0.5;

          for (int i = 0; i < 6; i++) {
            value += amplitude * noise(p);
            p = rotate2d(0.42) * p * 2.04 + 19.17;
            amplitude *= 0.52;
          }

          return value;
        }

        void main() {
          vec2 uv = vUv;
          vec2 centered = uv - 0.5;
          centered.x *= uResolution.x / max(uResolution.y, 1.0);

          float time = uTime * 0.085;
          float horizon = smoothstep(0.08, 0.72, uv.y);
          vec3 night = vec3(0.018, 0.045, 0.052);
          vec3 dawn = vec3(0.72, 0.39, 0.20);
          vec3 pale = vec3(0.84, 0.73, 0.53);
          vec3 sky = mix(dawn, night, horizon);

          float sun = 1.0 - smoothstep(0.0, 0.74, length((centered - vec2(0.16, -0.08)) * vec2(1.0, 1.55)));
          sky += pale * sun * 0.38;

          vec2 cloudUv = centered * vec2(1.42, 0.72);
          cloudUv.x += time;
          cloudUv.y += sin(centered.x * 2.2 + time * 1.7) * 0.12;

          float lowCloud = fbm(cloudUv * 2.1 + vec2(0.0, time * 0.6));
          float highCloud = fbm(cloudUv * 5.2 - vec2(time * 1.4, 0.0));
          float cloudBand = smoothstep(0.12, 0.82, uv.y) * (1.0 - smoothstep(0.84, 1.0, uv.y));
          float clouds = smoothstep(0.42, 0.83, lowCloud * 0.78 + highCloud * 0.42);
          clouds *= cloudBand;

          float streaks = pow(abs(sin((centered.x + centered.y * 0.24 + time * 1.6) * 8.0 + fbm(cloudUv * 1.3) * 2.8)), 8.0);
          streaks *= smoothstep(0.1, 0.62, uv.y) * 0.18;

          vec3 cloudColor = mix(vec3(0.25, 0.54, 0.54), vec3(1.0, 0.71, 0.36), smoothstep(-0.35, 0.7, centered.x + sun));
          vec3 color = mix(sky, cloudColor, clouds * 0.74 + streaks);

          float grain = noise(uv * uResolution.xy * 0.42 + uTime);
          color += (grain - 0.5) * 0.026;

          float edge = smoothstep(1.18, 0.22, length(centered * vec2(0.82, 1.22)));
          float alpha = clamp((0.58 + clouds * 0.34 + sun * 0.14) * edge, 0.0, 0.92);

          gl_FragColor = vec4(color, alpha);
        }
      `,
    });

    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.35);

      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(Math.max(1, width), Math.max(1, height), false);
      uniforms.uResolution.value.set(
        Math.max(1, width) * pixelRatio,
        Math.max(1, height) * pixelRatio,
      );
    };

    const render = (time = 0) => {
      if (isVisible) {
        uniforms.uTime.value = time * 0.001;
        renderer.render(scene, camera);
      }

      animationFrame = requestAnimationFrame(render);
    };

    new ResizeObserver(resize).observe(canvas);
    resize();
    render();

    new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    }, { threshold: 0.05 }).observe(canvas);

    window.addEventListener('pagehide', () => {
      cancelAnimationFrame(animationFrame);
      renderer.dispose();
      material.dispose();
    }, { once: true });
  } catch (error) {
    canvas.classList.add('is-fallback');
  }
};

initSkyBackground();

