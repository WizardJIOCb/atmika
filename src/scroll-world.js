/*
 * Atmika adaptation of oso95/scroll-world's portable scrub engine.
 * Upstream: https://github.com/oso95/scroll-world (MIT)
 *
 * The core model stays the same: scroll is mapped to pre-rendered video time,
 * clips are fetched as blobs for reliable seeking, and nearby scenes are loaded
 * lazily. This adaptation adds rich copy panels and soft direct transitions so
 * it can be used as a no-generation prototype with Atmika's existing media.
 */

function mountScrollWorld(container, config) {
  if (!container) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarsePointer = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  const smallScreen = window.matchMedia('(max-width: 860px)');
  const isMobile = () => coarsePointer || smallScreen.matches;
  const sections = config.sections || [];
  const connectors = config.connectors || [];
  const mobileConnectors = config.connectorsMobile || [];
  const defaultSceneScroll = config.diveScroll || 1.25;
  const defaultConnectorScroll = config.connScroll || 0.72;
  const transitionWidth = config.crossfade == null ? 0.38 : config.crossfade;
  const settleEnabled = config.settle !== false && !reduceMotion;
  const settleDelay = Math.max(80, Number(config.settleDelay) || 180);
  const settleDuration = Math.max(600, Number(config.settleDuration) || 1600);

  if (!sections.length) return;

  container.classList.add('sw-root');
  container.dataset.settleDuration = String(settleDuration);

  const segments = [];
  sections.forEach((section, index) => {
    const scene = {
      kind: 'scene',
      sectionIndex: index,
      clip: section.clip,
      clipMobile: section.clipMobile,
      still: section.still,
      stillMobile: section.stillMobile,
      accent: section.accent,
      weight: section.scroll || defaultSceneScroll,
      linger: section.linger || 0,
    };

    segments.push(scene);
    section._segment = scene;

    if (index < sections.length - 1 && connectors[index]) {
      segments.push({
        kind: 'connector',
        sectionIndex: index,
        clip: connectors[index],
        clipMobile: mobileConnectors[index],
        still: sections[index + 1].still,
        stillMobile: sections[index + 1].stillMobile,
        accent: sections[index + 1].accent,
        weight: defaultConnectorScroll,
        linger: 0,
      });
    }
  });

  const make = (tag, className) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  };
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
  })[char]);
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const smooth = (value) => {
    const x = clamp(value);
    return x * x * (3 - (2 * x));
  };
  const lingerEase = (value, amount) => {
    const x = clamp(value);
    const strength = clamp(amount);
    const centered = x - 0.5;
    return ((1 - strength) * x) + (strength * ((4 * centered * centered * centered) + 0.5));
  };
  const pad = (value) => String(value).padStart(2, '0');
  const buttonMarkup = (cta) => {
    if (!cta) return '';
    return ['primary', 'secondary'].map((kind) => {
      const button = cta[kind];
      if (!button) return '';
      const target = button.target === '_blank' ? ' target="_blank" rel="noreferrer"' : '';
      return `<a class="sw-btn sw-btn--${kind === 'primary' ? 'primary' : 'ghost'}" href="${escapeHtml(button.href || '#')}"${target}>${escapeHtml(button.label)}</a>`;
    }).join('');
  };

  const sky = make('div', 'sw-sky');
  sky.innerHTML = '<div class="sw-sky__grid"></div><div class="sw-sky__glow"></div><div class="sw-particles"></div>';
  const stage = make('div', 'sw-stage');
  const shade = make('div', 'sw-shade');
  const copyLayer = make('div', 'sw-copylayer');
  const topbar = make('header', 'sw-topbar');
  const route = make('nav', 'sw-route');
  route.setAttribute('aria-label', config.routeLabel || 'Маршрут страницы');
  const progress = make('div', 'sw-progress');
  const progressFill = make('span');
  progress.appendChild(progressFill);
  const hint = make('div', 'sw-hint');
  hint.innerHTML = `<span>${escapeHtml(config.hint || 'прокрутите, чтобы начать полёт')}</span><i aria-hidden="true"></i>`;
  const track = make('div', 'sw-track');

  if (config.brand) {
    const brand = make('a', 'sw-brand');
    brand.href = config.brand.href || '#';
    brand.innerHTML = `<span class="sw-brand__mark">${escapeHtml(config.brand.mark || 'A')}</span><span><strong>${escapeHtml(config.brand.name || '')}</strong>${config.brand.subtitle ? `<small>${escapeHtml(config.brand.subtitle)}</small>` : ''}</span>`;
    topbar.appendChild(brand);
  }

  const flightLabel = make('span', 'sw-flight-label');
  flightLabel.textContent = config.flightLabel || 'SCROLL FLIGHT / PROTOTYPE';
  topbar.appendChild(flightLabel);

  if (config.cta?.label) {
    const topCta = make('a', 'sw-topcta');
    topCta.href = config.cta.href || '#';
    topCta.textContent = config.cta.label;
    topbar.appendChild(topCta);
  }

  [sky, stage, shade, copyLayer, topbar, route, progress, hint, track].forEach((node) => container.appendChild(node));

  segments.forEach((segment, index) => {
    const scene = make('div', 'sw-scene');
    scene.style.setProperty('--sw-accent', segment.accent || '');
    scene.style.zIndex = String(100 + index);

    const image = make('img', 'sw-scene__still');
    image.alt = '';
    image.decoding = 'async';
    image.loading = index < 2 ? 'eager' : 'lazy';
    image.src = (isMobile() && segment.stillMobile) ? segment.stillMobile : segment.still;
    scene.appendChild(image);
    stage.appendChild(scene);

    Object.assign(segment, {
      element: scene,
      image,
      video: null,
      loading: false,
      ready: false,
      current: 0,
      target: 0,
      visible: false,
    });
  });

  const copies = [];
  const dots = [];

  sections.forEach((section, index) => {
    const copy = make('article', `sw-copy${section.wide ? ' sw-copy--wide' : ''}`);
    copy.id = section.id || `scene-${index + 1}`;
    copy.style.setProperty('--sw-accent', section.accent || '');
    copy.innerHTML = [
      `<span class="sw-copy__num">${pad(index + 1)} / ${pad(sections.length)}</span>`,
      section.eyebrow ? `<span class="sw-copy__eyebrow">${escapeHtml(section.eyebrow)}</span>` : '',
      section.title ? `<h${index === 0 ? '1' : '2'} class="sw-copy__title">${escapeHtml(section.title)}</h${index === 0 ? '1' : '2'}>` : '',
      section.body ? `<p class="sw-copy__body">${escapeHtml(section.body)}</p>` : '',
      section.html ? `<div class="sw-copy__rich">${section.html}</div>` : '',
      section.tags?.length ? `<ul class="sw-copy__tags">${section.tags.map((tag) => `<li>${escapeHtml(tag)}</li>`).join('')}</ul>` : '',
      section.cta ? `<div class="sw-copy__cta">${buttonMarkup(section.cta)}</div>` : '',
    ].join('');
    copyLayer.appendChild(copy);
    copies.push(copy);

    const dot = make('button', 'sw-route__dot');
    dot.type = 'button';
    dot.setAttribute('aria-label', section.label || `Сцена ${index + 1}`);
    dot.style.setProperty('--sw-accent', section.accent || '');
    dot.innerHTML = `<span>${escapeHtml(section.label || '')}</span><i></i>`;
    dot.addEventListener('click', () => jumpTo(index));
    route.appendChild(dot);
    dots.push(dot);
  });

  const jumpByHash = (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const targetId = decodeURIComponent(link.getAttribute('href').slice(1));
    const index = sections.findIndex((section) => section.id === targetId);
    if (index < 0) return;
    event.preventDefault();
    jumpTo(index);
  };
  container.addEventListener('click', jumpByHash);

  let viewportHeight = window.innerHeight;
  let totalWeight = 0;
  let activeIndex = -1;
  let ticking = false;
  let layoutWidth = window.innerWidth;
  let userReady = false;
  let settleTimer = 0;
  let settleTarget = null;
  let settleFrame = 0;
  let savedScrollBehavior = null;
  let settling = false;
  let inputDirection = 0;
  let touchY = null;

  const setScrollState = (state) => {
    container.dataset.scrollState = state;
  };

  const stableScrollTop = (index) => {
    const segment = sections[index]?._segment;
    if (!segment) return 0;
    return index === 0 ? segment.start : segment.start + ((segment.end - segment.start) * 0.5);
  };

  const stableScrollPoints = () => sections.map((_, index) => stableScrollTop(index));

  const lockInstantScroll = () => {
    if (savedScrollBehavior !== null) return;
    savedScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
  };

  const cancelSettleAnimation = () => {
    if (settleFrame) window.cancelAnimationFrame(settleFrame);
    settleFrame = 0;
    if (savedScrollBehavior !== null) {
      document.documentElement.style.scrollBehavior = savedScrollBehavior;
      savedScrollBehavior = null;
    }
  };

  function finishSettling() {
    cancelSettleAnimation();
    settling = false;
    settleTarget = null;
    setScrollState('stable');
  }

  function scrollToStable(top) {
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - viewportHeight);
    const target = clamp(top, 0, maxScroll);
    const tolerance = Math.max(3, viewportHeight * 0.004);
    window.clearTimeout(settleTimer);
    settleTimer = 0;
    inputDirection = 0;
    cancelSettleAnimation();

    if (Math.abs((window.scrollY || window.pageYOffset) - target) <= tolerance) {
      finishSettling();
      return;
    }

    settling = true;
    settleTarget = target;
    setScrollState('settling');

    if (reduceMotion) {
      lockInstantScroll();
      window.scrollTo(0, target);
      finishSettling();
      readScroll();
      return;
    }

    const start = window.scrollY || window.pageYOffset;
    const distance = target - start;
    const startedAt = performance.now();
    lockInstantScroll();

    const animate = (now) => {
      if (!settling || settleTarget !== target) return;
      const progress = clamp((now - startedAt) / settleDuration);
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - (Math.pow((-2 * progress) + 2, 3) / 2);
      window.scrollTo(0, start + (distance * eased));

      if (progress < 1) {
        settleFrame = window.requestAnimationFrame(animate);
        return;
      }

      settleFrame = 0;
      window.scrollTo(0, target);
      finishSettling();
      readScroll();
    };

    settleFrame = window.requestAnimationFrame(animate);
  }

  function settleScroll() {
    settleTimer = 0;
    if (!settleEnabled || settling) return;

    const scrollY = window.scrollY || window.pageYOffset;
    const points = stableScrollPoints();
    const intentThreshold = Math.max(10, viewportHeight * 0.025);
    let target;

    if (inputDirection > 0) {
      target = points.find((point) => point > scrollY + intentThreshold) ?? points[points.length - 1];
    } else if (inputDirection < 0) {
      target = [...points].reverse().find((point) => point < scrollY - intentThreshold) ?? points[0];
    } else {
      target = points.reduce((nearest, point) => (
        Math.abs(point - scrollY) < Math.abs(nearest - scrollY) ? point : nearest
      ), points[0]);
    }

    scrollToStable(target);
  }

  function scheduleSettle() {
    if (!settleEnabled || settling) return;
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(settleScroll, settleDelay);
  }

  function noteScrollIntent(direction) {
    if (!direction) return;
    cancelSettleAnimation();
    settling = false;
    settleTarget = null;
    inputDirection = direction;
    setScrollState('scrubbing');
    scheduleSettle();
  }

  function layout() {
    viewportHeight = window.innerHeight;
    layoutWidth = window.innerWidth;
    let offset = 0;
    segments.forEach((segment) => {
      segment.start = offset * viewportHeight;
      offset += segment.weight;
      segment.end = offset * viewportHeight;
    });
    totalWeight = offset;
    track.style.height = `${(totalWeight + 1) * viewportHeight}px`;
    finishSettling();
    readScroll();
  }

  function jumpTo(index) {
    const segment = sections[index]?._segment;
    if (!segment) return;
    scrollToStable(stableScrollTop(index));
  }

  function primeVideo(video) {
    if (!isMobile() || !video) return;
    try {
      const promise = video.play();
      if (promise?.then) promise.then(() => video.pause()).catch(() => {});
    } catch {}
  }

  function loadClip(segment) {
    if (reduceMotion || segment.loading || !segment.clip) return;
    segment.loading = true;
    const source = (isMobile() && segment.clipMobile) ? segment.clipMobile : segment.clip;

    fetch(source)
      .then((response) => response.ok ? response.blob() : Promise.reject(new Error(`Video ${response.status}`)))
      .then((blob) => {
        const video = document.createElement('video');
        video.className = 'sw-scene__video';
        video.muted = true;
        video.playsInline = true;
        video.preload = 'auto';
        video.setAttribute('muted', '');
        video.setAttribute('playsinline', '');
        video.src = URL.createObjectURL(blob);
        video.addEventListener('loadedmetadata', () => {
          segment.ready = true;
          readScroll();
        });
        video.addEventListener('seeked', () => segment.element.classList.add('has-clip'), { once: true });
        video.addEventListener('loadeddata', () => {
          try { video.pause(); } catch {}
          if (userReady) primeVideo(video);
        });
        segment.element.appendChild(video);
        segment.video = video;
      })
      .catch(() => {
        segment.loading = false;
        segment.element.classList.add('clip-failed');
      });
  }

  function readScroll() {
    const scrollY = window.scrollY || window.pageYOffset;
    const fade = Math.max(1, transitionWidth * viewportHeight);
    let currentSegment = 0;

    segments.forEach((segment, index) => {
      if (scrollY >= segment.start) currentSegment = index;
      if (scrollY > segment.start - (1.8 * viewportHeight) && scrollY < segment.end + (1.8 * viewportHeight)) {
        loadClip(segment);
      }

      const local = clamp((scrollY - segment.start) / (segment.end - segment.start));
      segment.target = segment.linger ? lingerEase(local, segment.linger) : local;

      const incoming = index === 0 ? 1 : smooth((scrollY - (segment.start - fade)) / fade);
      const outgoing = index === segments.length - 1 ? 1 : smooth(((segment.end + fade) - scrollY) / fade);
      const opacity = Math.min(incoming, outgoing);
      segment.element.style.opacity = opacity.toFixed(4);
      segment.visible = opacity > 0.002;

      if (!segment.video || !segment.ready) {
        const scale = reduceMotion ? 1 : 1.035 + (local * 0.12);
        segment.image.style.transform = `scale(${scale.toFixed(4)})`;
      }
    });

    sections.forEach((section, index) => {
      const segment = section._segment;
      const local = clamp((scrollY - segment.start) / (segment.end - segment.start));
      const before = scrollY < segment.start;
      const after = scrollY > segment.end;
      let opacity = 0;

      if (index === 0) opacity = after ? 0 : smooth(1 - (local / 0.72));
      else if (index === sections.length - 1) opacity = before ? 0 : smooth(local / 0.34);
      else if (!before && !after) opacity = smooth(1 - (Math.abs(local - 0.5) / 0.5));

      const copy = copies[index];
      copy.style.opacity = opacity.toFixed(4);
      copy.style.transform = reduceMotion ? 'translateY(-50%)' : `translateY(calc(-50% + ${(0.5 - local) * 3.2}vh))`;
      copy.style.pointerEvents = opacity > 0.48 ? 'auto' : 'none';
      copy.setAttribute('aria-hidden', opacity > 0.08 ? 'false' : 'true');
    });

    const activeSegment = segments[currentSegment];
    const nearestSection = clamp(
      activeSegment.kind === 'scene'
        ? activeSegment.sectionIndex
        : activeSegment.sectionIndex + (scrollY > ((activeSegment.start + activeSegment.end) / 2) ? 1 : 0),
      0,
      sections.length - 1,
    );

    if (nearestSection !== activeIndex) {
      activeIndex = nearestSection;
      dots.forEach((dot, index) => dot.classList.toggle('is-active', index === activeIndex));
      container.style.setProperty('--sw-accent', sections[activeIndex].accent || '');
    }

    progressFill.style.transform = `scaleX(${clamp(scrollY / (totalWeight * viewportHeight))})`;
    hint.style.opacity = String(clamp(1 - (scrollY / (0.52 * viewportHeight))));
    sky.style.setProperty('--sw-flight-y', `${(-scrollY * 0.026).toFixed(2)}px`);
    ticking = false;
  }

  function updateVideoFrames() {
    const threshold = isMobile() ? 0.018 : 0.006;

    segments.forEach((segment) => {
      if (!segment.video || !segment.ready || !segment.visible || segment.video.seeking) return;
      segment.current += (segment.target - segment.current) * (reduceMotion ? 1 : 0.2);
      const targetTime = clamp(segment.current, 0, 0.999) * (segment.video.duration || 1);
      if (Math.abs(segment.video.currentTime - targetTime) <= threshold) return;
      try { segment.video.currentTime = targetTime; } catch {}
    });

    requestAnimationFrame(updateVideoFrames);
  }

  function onFirstGesture() {
    if (userReady) return;
    userReady = true;
    segments.forEach((segment) => primeVideo(segment.video));
  }

  function onResize() {
    if (coarsePointer && window.innerWidth === layoutWidth) return;
    layout();
  }

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(readScroll);
    scheduleSettle();
  }, { passive: true });
  window.addEventListener('wheel', (event) => noteScrollIntent(Math.sign(event.deltaY)), { passive: true });
  window.addEventListener('touchstart', (event) => {
    touchY = event.touches[0]?.clientY ?? null;
  }, { passive: true });
  window.addEventListener('touchmove', (event) => {
    const nextY = event.touches[0]?.clientY;
    if (touchY == null || nextY == null) return;
    noteScrollIntent(Math.sign(touchY - nextY));
    touchY = nextY;
  }, { passive: true });
  window.addEventListener('touchend', scheduleSettle, { passive: true });
  window.addEventListener('keydown', (event) => {
    if (['ArrowDown', 'PageDown', 'Space', 'End'].includes(event.code)) noteScrollIntent(1);
    if (['ArrowUp', 'PageUp', 'Home'].includes(event.code)) noteScrollIntent(-1);
  });
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', layout);
  window.addEventListener('pointerdown', onFirstGesture, { once: true, passive: true });
  window.addEventListener('touchstart', onFirstGesture, { once: true, passive: true });

  layout();
  requestAnimationFrame(updateVideoFrames);
}

window.mountScrollWorld = mountScrollWorld;
