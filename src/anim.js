(() => {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (!window.location.hash) window.scrollTo(0, 0);

  const content = window.ATMIKA_CONTENT;
  const loading = document.querySelector('[data-anim-loading]');
  const root = document.querySelector('#scroll-world');

  if (!content || !root || typeof window.mountScrollWorld !== 'function') {
    if (loading) loading.querySelector('span').textContent = 'Не удалось загрузить маршрут';
    return;
  }

  const text = (value) => String(value ?? '');
  const html = (value) => text(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
  const safeUrl = (value, fallback = '#') => {
    const url = text(value).trim();
    return /^(?:https?:|mailto:|tel:|\/|#)/i.test(url) ? html(url) : fallback;
  };
  const pad = (value) => String(value).padStart(2, '0');
  const freeLabel = () => '<span class="free-label"><s>Бесплатно</s> <b>Безоплатно</b></span>';
  const sceneClips = [
    '/public/gallery/compressed/state-visible-03.mp4',
    '/public/gallery/compressed/state-visible-01.mp4',
    '/public/gallery/compressed/state-visible-05.mp4',
    '/public/gallery/compressed/state-visible-06.mp4',
    '/public/gallery/compressed/visual-rhythm-04.mp4',
    '/public/gallery/compressed/state-visible-07.mp4',
    '/public/gallery/compressed/visual-rhythm-01.mp4',
    '/public/gallery/compressed/state-visible-04.mp4',
    '/public/gallery/compressed/visual-rhythm-03.mp4',
    '/public/gallery/compressed/visual-rhythm-05.mp4',
  ];
  const sceneMedia = (number) => ({
    still: `/public/anim/posters/scene-${pad(number)}.webp`,
    clip: sceneClips[number - 1],
  });

  const card = ({ eyebrow, title, description, meta, href, free = false }) => {
    const tag = href ? 'a' : 'div';
    const link = href ? ` href="${safeUrl(href)}"` : '';
    return `<${tag} class="sw-rich-card"${link}>${free ? freeLabel() : eyebrow ? `<span>${html(eyebrow)}</span>` : ''}<strong>${html(title)}</strong>${description ? `<p>${html(description)}</p>` : ''}${meta ? `<em>${html(meta)}</em>` : ''}</${tag}>`;
  };

  const row = ({ number, title, description }) => `
    <div class="sw-rich-row">
      <span>${html(number)}</span>
      <div><strong>${html(title)}</strong>${description ? `<p>${html(description)}</p>` : ''}</div>
    </div>`;

  const fallbackCatalog = () => ({
    settings: {
      eyebrow: 'Пространство практик и обучения',
      title: 'Программы и сессии Атмики',
      description: 'Индивидуальные сессии, программы, практики и материалы Атмики.',
      sellerLegalName: 'ИП Панкратова Оксана Сергеевна',
      inn: '236504298920',
      ogrn: '326237500235369',
      email: content.contact?.secondaryLabel || 'eygru@proton.me',
    },
    categories: [
      {
        id: 'category-consciousness-programs',
        slug: 'programmy-soznaniya-i-tela',
        title: 'Программы сознания и тела',
        description: 'Онлайн-программы и индивидуальные форматы Атмики: наблюдение за жизненными сценариями, контакт с телом, внутренняя опора и практики осознанности.',
      },
      {
        id: 'category-offline-retreats',
        slug: 'oflayn-praktiki-i-retrity',
        title: 'Офлайн-практики и ретриты',
        description: 'Подготовка к индивидуальным и групповым встречам, практикам со звуком и огнём, выездным программам и последующей интеграции опыта.',
      },
    ],
    courses: [
      ['course-matrix-exit', 'osoznannyy-vyhod-iz-matricy', 'category-consciousness-programs'],
      ['course-soul-field-cleansing', 'kvantovaya-chistka-polya-dushi', 'category-consciousness-programs'],
      ['course-quantum-surgeon', 'kvantovyy-hirurg', 'category-consciousness-programs'],
      ['course-quantum-rejuvenation', 'kvantovoe-omolozhenie-tela', 'category-consciousness-programs'],
      ['course-quantum-self-healing', 'kvantovoe-samoiscelenie', 'category-consciousness-programs'],
      ['course-offline-retreats', 'oflayn-praktiki-i-retrity', 'category-offline-retreats'],
    ].map(([id, slug, categoryId]) => ({ id, slug, categoryId })),
    materials: [
      {
        id: 'material-matrix-exit-04',
        courseId: 'course-matrix-exit',
        slug: 'novyy-vybor-i-integraciya',
        title: 'Новый выбор и интеграция',
        excerpt: 'Закрепляем новый маршрут через небольшие эксперименты, обратную связь и план на четырнадцать дней.',
        accessType: 'paid',
      },
      {
        id: 'material-soul-field-cleansing-04',
        courseId: 'course-soul-field-cleansing',
        slug: 'integraciya-posle-sessii',
        title: 'Интеграция после индивидуальной сессии',
        excerpt: 'План первых суток и недели после встречи: наблюдение, восстановление и связь при необходимости.',
        accessType: 'paid',
      },
      {
        id: 'material-quantum-surgeon-04',
        courseId: 'course-quantum-surgeon',
        slug: 'ezhednevnyy-protokol-kontakta',
        title: 'Ежедневный протокол контакта с собой',
        excerpt: 'Короткая утренняя и вечерняя схема для устойчивого навыка без перегрузки.',
        accessType: 'paid',
      },
      {
        id: 'material-quantum-rejuvenation-04',
        courseId: 'course-quantum-rejuvenation',
        slug: 'dnevnik-30-dney',
        title: 'Дневник состояния на 30 дней',
        excerpt: 'Финальный протокол наблюдения без фотографического контроля и навязчивого сравнения.',
        accessType: 'paid',
      },
      {
        id: 'material-quantum-self-healing-04',
        courseId: 'course-quantum-self-healing',
        slug: 'lichnyy-protokol-podderzhki',
        title: 'Личный протокол поддержки',
        excerpt: 'Собираем конкретный план на обычный день, сложный день и кризисную ситуацию.',
        accessType: 'paid',
      },
      {
        id: 'material-offline-retreats-04',
        courseId: 'course-offline-retreats',
        slug: 'integraciya-posle-retrita',
        title: 'Интеграция после ретрита',
        excerpt: 'Первые дни после возвращения: сон, решения, общение и перенос опыта в обычную жизнь.',
        accessType: 'paid',
      },
    ],
  });

  const fetchCatalog = async () => {
    const fallback = fallbackCatalog();
    try {
      const response = await fetch('/api/academy/catalog', { credentials: 'same-origin' });
      if (!response.ok) throw new Error(`Academy ${response.status}`);
      const data = await response.json();
      return {
        ...data,
        settings: { ...fallback.settings, ...(data.settings || {}) },
        categories: data.categories?.length ? data.categories : fallback.categories,
        courses: data.courses?.length ? data.courses : fallback.courses,
        materials: data.materials?.length ? data.materials : fallback.materials,
      };
    } catch {
      return fallback;
    }
  };

  const build = async () => {
    const catalog = await fetchCatalog();
    const settings = catalog.settings || {};
    const services = content.services || [];
    const audience = content.audience?.items || [];
    const outcomes = content.outcomes?.items || [];
    const process = content.process?.items || [];
    const gallery = content.gallery?.items || [];
    const socialLinks = content.contact?.socialLinks || [];
    const categories = catalog.categories || [];
    const courses = catalog.courses || [];
    const materials = (catalog.materials || []).slice(-6).reverse();
    const bottomGallery = [
      'Дыхание поля',
      'Тишина внутри движения',
      'Световой переход',
      'Встреча с состоянием',
      'Пульс присутствия',
      'Мягкая настройка',
      'Маршрут к ясности',
    ];

    const serviceCards = services.map((service, index) => card({
      eyebrow: `Route ${pad(index + 1)} · ${service.tag}`,
      title: service.title,
      description: service.text,
      meta: service.price,
      href: service.courseSlug ? `/course/${encodeURIComponent(service.courseSlug)}/` : '#contact',
    })).join('');

    const categoryCards = categories.slice(0, 4).map((category) => {
      const count = courses.filter((course) => course.categoryId === category.id).length;
      return card({
        eyebrow: `${count} формат(ов)`,
        title: category.title,
        description: category.description,
        href: `/courses/${encodeURIComponent(category.slug)}/`,
      });
    }).join('');

    const materialCards = materials.map((material) => {
      const course = courses.find((entry) => entry.id === material.courseId);
      return card({
        eyebrow: 'Материал курса',
        free: material.accessType === 'free',
        title: material.title,
        description: material.excerpt,
        href: `/article/${encodeURIComponent(course?.slug || '')}/${encodeURIComponent(material.slug)}/`,
      });
    }).join('');

    const audienceRows = audience.map((item, index) => row({
      number: pad(index + 1),
      title: item,
    })).join('');

    const outcomeCards = outcomes.map((item, index) => card({
      eyebrow: pad(index + 1),
      title: item,
    })).join('');

    const processRows = process.map((item, index) => row({
      number: pad(index + 1),
      title: item.title,
      description: item.text,
    })).join('');

    const galleryCards = gallery.map((item, index) => card({
      eyebrow: `Видео ${pad(index + 1)}`,
      title: item.title,
    })).join('');

    const stateCards = bottomGallery.map((title, index) => card({
      eyebrow: `Ритм ${pad(index + 1)}`,
      title,
    })).join('');

    const storyParagraphs = (content.story?.paragraphs || [])
      .map((paragraph) => `<p>${html(paragraph)}</p>`)
      .join('');

    const socialActions = socialLinks.map((link) => (
      `<a href="${safeUrl(link.href)}" target="_blank" rel="noreferrer">${html(link.label)}</a>`
    )).join('');

    const legalDetails = [
      settings.sellerLegalName || settings.sellerName,
      settings.inn ? `ИНН ${settings.inn}` : '',
      settings.ogrn ? `ОГРНИП ${settings.ogrn}` : '',
    ].filter(Boolean).join(' · ');

    const sections = [
      {
        ...sceneMedia(1),
        id: 'awakening',
        label: 'Пробуждение',
        accent: '#55f7e6',
        scroll: 1.65,
        linger: 0.42,
        eyebrow: content.hero?.eyebrow,
        title: content.hero?.title,
        body: content.hero?.text,
        tags: content.hero?.panel || [],
        cta: {
          primary: { label: content.hero?.primaryLabel || 'Записаться', href: '#contact' },
          secondary: { label: content.hero?.secondaryLabel || 'Форматы', href: '#formats' },
        },
      },
      {
        ...sceneMedia(2),
        id: 'experience',
        label: 'Опыт',
        accent: '#72d8b1',
        scroll: 1.42,
        linger: 0.3,
        eyebrow: content.intro?.kicker,
        title: content.intro?.title,
        body: content.intro?.paragraphs?.[0],
        html: `<p>${html(content.intro?.paragraphs?.[1])}</p>`,
      },
      {
        ...sceneMedia(3),
        id: 'formats',
        label: 'Форматы',
        accent: '#62e5d6',
        scroll: 1.75,
        linger: 0.5,
        wide: true,
        eyebrow: content.servicesSection?.kicker,
        title: content.servicesSection?.title,
        html: `<div class="sw-rich-grid sw-rich-grid--three">${serviceCards}</div>`,
        cta: {
          secondary: { label: 'Все форматы', href: '/courses/' },
        },
      },
      {
        ...sceneMedia(4),
        id: 'academy',
        label: 'Форматы',
        accent: '#88e7bd',
        scroll: 1.65,
        linger: 0.45,
        wide: true,
        eyebrow: settings.eyebrow || 'Пространство практик и обучения',
        title: settings.title || 'Программы и сессии Атмики',
        body: settings.description,
        html: `
          <span class="sw-rich-group-title">Категории</span>
          <div class="sw-rich-grid">${categoryCards}</div>
          ${materialCards ? `<span class="sw-rich-group-title">Статьи и практики</span><div class="sw-rich-grid sw-rich-grid--three">${materialCards}</div>` : ''}
        `,
        cta: {
          primary: { label: 'Открыть все форматы', href: '/courses/' },
          secondary: { label: 'Личный кабинет', href: '/account/' },
        },
      },
      {
        ...sceneMedia(5),
        id: 'audience',
        label: 'Кому подходит',
        accent: '#d7ad67',
        scroll: 1.42,
        linger: 0.34,
        wide: true,
        eyebrow: content.audience?.kicker,
        title: content.audience?.title,
        body: content.audience?.text,
        html: `<div class="sw-rich-list">${audienceRows}</div>`,
      },
      {
        ...sceneMedia(6),
        id: 'outcomes',
        label: 'Состояние',
        accent: '#6de8ee',
        scroll: 1.38,
        linger: 0.34,
        wide: true,
        eyebrow: content.outcomes?.kicker,
        title: content.outcomes?.title,
        html: `<div class="sw-rich-grid sw-rich-grid--three">${outcomeCards}</div>`,
      },
      {
        ...sceneMedia(7),
        id: 'rhythm',
        label: 'Ритм',
        accent: '#ef965e',
        scroll: 1.55,
        linger: 0.45,
        wide: true,
        eyebrow: 'После сессии',
        title: 'Когда состояние становится видимым',
        html: `
          <span class="sw-rich-group-title">Видеоритм практик</span>
          <div class="sw-rich-grid sw-rich-grid--three">${stateCards}</div>
          <span class="sw-rich-group-title">${html(content.gallery?.title || 'Визуальный ритм')}</span>
          <div class="sw-rich-grid sw-rich-grid--three">${galleryCards}</div>
        `,
      },
      {
        ...sceneMedia(8),
        id: 'process',
        label: 'Процесс',
        accent: '#9c87ef',
        scroll: 1.48,
        linger: 0.38,
        wide: true,
        eyebrow: content.process?.kicker,
        title: content.process?.title,
        html: `<div class="sw-rich-list">${processRows}</div>`,
      },
      {
        ...sceneMedia(9),
        id: 'story',
        label: 'История',
        accent: '#e0c58b',
        scroll: 1.5,
        linger: 0.42,
        wide: true,
        eyebrow: content.story?.kicker,
        title: content.story?.title,
        html: `${storyParagraphs}<blockquote class="sw-rich-quote">${html(content.story?.quote)}</blockquote>`,
      },
      {
        ...sceneMedia(10),
        id: 'contact',
        label: 'Контакт',
        accent: '#55f7e6',
        scroll: 1.85,
        linger: 0.54,
        wide: true,
        eyebrow: content.contact?.kicker,
        title: content.contact?.title,
        body: content.contact?.text,
        html: `
          <div class="sw-rich-actions">${socialActions}</div>
          <p>${html(content.contact?.disclaimer)}</p>
          ${legalDetails ? `<p>${html(legalDetails)}</p>` : ''}
          <div class="sw-rich-actions">
            <a href="/legal/offer/">Публичная оферта</a>
            <a href="/legal/privacy/">Обработка данных</a>
            <a href="/legal/consent/">Согласие</a>
            <a href="/legal/payment/">Оплата и возвраты</a>
          </div>
        `,
        cta: {
          primary: {
            label: content.contact?.primaryLabel || 'Написать в WhatsApp',
            href: content.contact?.primaryHref,
            target: '_blank',
          },
          secondary: {
            label: content.contact?.secondaryLabel || settings.email,
            href: content.contact?.secondaryHref || `mailto:${settings.email}`,
          },
        },
      },
    ];

    const meta = content.meta || {};
    document.title = `Atmika Flight · ${meta.title || 'Осознанный выход из Матрицы'}`;
    document.querySelector('meta[name="description"]')?.setAttribute(
      'content',
      `Scroll-flight прототип Atmika. ${meta.description || ''}`.trim(),
    );

    window.mountScrollWorld(root, {
      brand: {
        mark: content.brand?.mark || 'A',
        name: content.brand?.name || 'АТМИКА',
        subtitle: content.brand?.subtitle,
        href: '#awakening',
      },
      cta: {
        label: content.header?.ctaLabel || 'Записаться',
        href: '#contact',
      },
      flightLabel: 'ATMIKA FIELD / SCROLL FLIGHT 01',
      hint: 'прокрутите, чтобы начать полёт',
      routeLabel: 'Маршрут Atmika',
      diveScroll: 1.35,
      crossfade: 0.42,
      settle: true,
      settleDelay: 180,
      sections,
      connectors: [],
      connectorsMobile: [],
    });

    requestAnimationFrame(() => {
      if (loading) loading.hidden = true;
    });
  };

  build().catch((error) => {
    console.error(error);
    if (loading) loading.querySelector('span').textContent = 'Маршрут временно недоступен';
  });
})();
