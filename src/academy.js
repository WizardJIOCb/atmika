(() => {
  const root = document.querySelector('#academy-app');
  const page = document.body.dataset.academyPage;
  let sessionUser = null;
  let checkoutTarget = null;

  const escapeHtml = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const attr = escapeHtml;
  const money = (kopecks) => new Intl.NumberFormat('ru-RU', {
    style: 'currency', currency: 'RUB', maximumFractionDigits: Number(kopecks) % 100 ? 2 : 0,
  }).format((Number(kopecks) || 0) / 100);

  const requestJson = async (url, options = {}) => {
    const response = await fetch(url, {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Не удалось выполнить запрос');
    return result;
  };

  const routeParts = () => decodeURIComponent(window.location.pathname).split('/').filter(Boolean);

  const sanitizeRichHtml = (value) => {
    const allowedTags = new Set(['P', 'H2', 'H3', 'H4', 'STRONG', 'B', 'EM', 'I', 'U', 'A', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'BR', 'SPAN']);
    const template = document.createElement('template');
    template.innerHTML = String(value || '');
    template.content.querySelectorAll('*').forEach((node) => {
      if (!allowedTags.has(node.tagName)) {
        node.replaceWith(...node.childNodes);
        return;
      }
      [...node.attributes].forEach((attribute) => {
        const name = attribute.name.toLowerCase();
        if (node.tagName !== 'A' || name !== 'href') node.removeAttribute(attribute.name);
      });
      if (node.tagName === 'A') {
        const href = node.getAttribute('href') || '';
        if (!/^(https?:|mailto:|tel:|\/|#)/i.test(href)) node.removeAttribute('href');
        node.setAttribute('rel', 'noreferrer');
        if (/^https?:/i.test(href)) node.setAttribute('target', '_blank');
      }
    });
    return template.innerHTML;
  };

  const media = (item, className = '') => {
    if (!item?.coverUrl) return `<div class="academy-media-empty ${className}"><span>A</span></div>`;
    return item.coverType === 'video'
      ? `<video class="${className}" src="${attr(item.coverUrl)}" poster="${attr(item.coverPoster || '')}" muted loop playsinline autoplay preload="metadata"></video>`
      : `<img class="${className}" src="${attr(item.coverUrl)}" alt="${attr(item.title || '')}" loading="lazy" />`;
  };

  const priceBadge = (item) => item.accessType === 'paid'
    ? `<span class="academy-price">${money(item.priceKopecks)}</span>`
    : '<span class="academy-price is-free">Бесплатно</span>';

  const header = (settings = {}) => `
    <header class="academy-header">
      <a class="academy-brand" href="/" aria-label="На главную Атмики"><span>A</span><strong>АТМИКА</strong></a>
      <nav><a href="/">Главная</a><a href="/courses/">Курсы</a><a href="/account/">Личный кабинет</a></nav>
      <button type="button" data-academy-menu aria-label="Открыть меню"><span></span><span></span></button>
    </header>`;

  const footer = (settings = {}) => {
    const legalName = settings.sellerLegalName || settings.sellerName || 'АТМИКА';
    return `
      <footer class="academy-footer">
        <div class="academy-footer-main">
          <div><a class="academy-brand" href="/"><span>A</span><strong>АТМИКА</strong></a><p>Курсы и цифровые материалы для самостоятельного прохождения.</p></div>
          <div><strong>Обучение</strong><a href="/courses/">Категории и курсы</a><a href="/account/">Личный кабинет</a><span>${escapeHtml(settings.accessInstructions || 'Доступ открывается после успешной оплаты.')}</span></div>
          <div><strong>Документы</strong><a href="/legal/offer/">Публичная оферта</a><a href="/legal/privacy/">Политика конфиденциальности</a><a href="/legal/payment/">Оплата, доступ и возвраты</a></div>
          <div><strong>Продавец</strong><span>${escapeHtml(legalName)}</span>${settings.inn ? `<span>ИНН ${escapeHtml(settings.inn)}</span>` : ''}${settings.ogrn ? `<span>ОГРН/ОГРНИП ${escapeHtml(settings.ogrn)}</span>` : ''}${settings.legalAddress ? `<span>${escapeHtml(settings.legalAddress)}</span>` : ''}${settings.postalAddress && settings.postalAddress !== settings.legalAddress ? `<span>${escapeHtml(settings.postalAddress)}</span>` : ''}${settings.phone ? `<a href="tel:${attr(settings.phone.replace(/[^+\d]/g, ''))}">${escapeHtml(settings.phone)}</a>` : ''}${settings.email ? `<a href="mailto:${attr(settings.email)}">${escapeHtml(settings.email)}</a>` : ''}</div>
        </div>
        <div class="academy-footer-bottom"><span>© ${new Date().getFullYear()} ${escapeHtml(settings.sellerName || 'Атмика')}</span><span>Безопасная оплата картой и через СБП на стороне ЮKassa</span><span>iam-atmika.com</span></div>
      </footer>`;
  };

  const shell = (content, settings = {}) => `${header(settings)}<main class="academy-main">${content}</main>${footer(settings)}<div data-checkout-root></div>`;

  const categoryCard = (category, courseCount) => `
    <a class="academy-category-card" href="/courses/${attr(category.slug)}/">
      <div class="academy-card-media">${media(category)}</div>
      <div class="academy-card-overlay"></div>
      <div class="academy-category-copy"><span>${courseCount} курс(ов)</span><h2>${escapeHtml(category.title)}</h2><p>${escapeHtml(category.description || '')}</p><strong>Открыть категорию ↗</strong></div>
    </a>`;

  const courseCard = (course, category) => `
    <a class="academy-course-card" href="/course/${attr(course.slug)}/">
      <div class="academy-card-media">${media(course)}</div>
      <div class="academy-course-copy"><div><span>${escapeHtml(category?.title || 'Курс')}</span>${priceBadge(course)}</div><h3>${escapeHtml(course.title)}</h3><p>${escapeHtml(course.summary || '')}</p><strong>${course.owned ? 'Продолжить обучение' : 'Подробнее'} →</strong></div>
    </a>`;

  const materialCard = (item, course) => `
    <a class="academy-material-card" href="/article/${attr(course.slug)}/${attr(item.slug)}/">
      <div class="academy-card-media">${media(item)}</div><div class="academy-material-copy"><div><span>${item.canAccess ? 'Доступен' : 'Закрыт'}</span>${priceBadge(item)}</div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.excerpt || '')}</p><strong>${item.canAccess ? 'Читать' : 'Узнать условия'} →</strong></div>
    </a>`;

  const updateMeta = ({ title, description, image, url }) => {
    if (title) { document.title = `${title} | Атмика`; document.querySelector('meta[property="og:title"]')?.setAttribute('content', title); }
    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.append(meta); }
      meta.content = description;
    }
    if (image) {
      let meta = document.querySelector('meta[property="og:image"]');
      if (!meta) { meta = document.createElement('meta'); meta.setAttribute('property', 'og:image'); document.head.append(meta); }
      meta.content = new URL(image, window.location.origin).href;
    }
    if (url) document.querySelector('meta[property="og:url"]')?.setAttribute('content', url);
  };

  const renderCatalog = async () => {
    const data = await requestJson('/api/academy/catalog');
    sessionUser = data.user;
    const categorySlug = routeParts()[1] || '';
    const selected = categorySlug ? data.categories.find((item) => item.slug === categorySlug) : null;
    if (categorySlug && !selected) throw new Error('Категория не найдена');
    const visibleCourses = selected ? data.courses.filter((item) => item.categoryId === selected.id) : data.courses;
    const intro = selected
      ? `<a class="academy-back-link" href="/courses/">← Все категории</a><span class="academy-eyebrow">Категория курсов</span><h1>${escapeHtml(selected.title)}</h1><p>${escapeHtml(selected.description || '')}</p>`
      : `<span class="academy-eyebrow">${escapeHtml(data.settings.eyebrow)}</span><h1>${escapeHtml(data.settings.title)}</h1><p>${escapeHtml(data.settings.description)}</p>`;
    const content = `
      <section class="academy-catalog-hero">${selected ? `<div class="academy-catalog-hero-media">${media(selected)}</div>` : '<div class="academy-orbit" aria-hidden="true"><span>A</span></div>'}<div class="academy-catalog-intro">${intro}</div></section>
      ${!selected ? `<section class="academy-section"><div class="academy-section-head"><span>01</span><div><h2>Категории</h2><p>Выберите направление и откройте входящие в него курсы.</p></div></div><div class="academy-category-grid">${data.categories.length ? data.categories.map((item) => categoryCard(item, data.courses.filter((course) => course.categoryId === item.id).length)).join('') : '<div class="academy-public-empty">Категории скоро появятся.</div>'}</div></section>` : ''}
      <section class="academy-section"><div class="academy-section-head"><span>${selected ? '01' : '02'}</span><div><h2>${selected ? 'Курсы категории' : 'Все курсы'}</h2><p>${selected ? 'Откройте подробную программу и материалы курса.' : 'Бесплатные и платные программы в одном пространстве.'}</p></div></div><div class="academy-course-grid">${visibleCourses.length ? visibleCourses.map((item) => courseCard(item, data.categories.find((category) => category.id === item.categoryId))).join('') : '<div class="academy-public-empty">В этой категории пока нет опубликованных курсов.</div>'}</div></section>
      ${!selected && data.materials.length ? `<section class="academy-section"><div class="academy-section-head"><span>03</span><div><h2>Свежие материалы</h2><p>Статьи и практики из опубликованных курсов.</p></div></div><div class="academy-material-grid">${data.materials.slice(-6).reverse().map((item) => materialCard(item, data.courses.find((course) => course.id === item.courseId))).join('')}</div></section>` : ''}`;
    root.innerHTML = shell(content, data.settings);
    updateMeta({ title: selected?.title || data.settings.title, description: selected?.description || data.settings.description, image: selected?.coverUrl, url: window.location.href });
    bindCommon();
  };

  const renderBlocks = (blocks = []) => blocks.map((block) => {
    const data = block.data || {};
    if (block.type === 'text') return `<section class="article-rich-text">${sanitizeRichHtml(data.html)}</section>`;
    if (block.type === 'image') return `<figure class="article-image is-${data.size === 'compact' ? 'compact' : 'wide'}"><img src="${attr(data.url)}" alt="${attr(data.alt || '')}" loading="lazy" />${data.caption ? `<figcaption>${escapeHtml(data.caption)}</figcaption>` : ''}</figure>`;
    if (block.type === 'video') return `<figure class="article-video"><video src="${attr(data.url)}" poster="${attr(data.poster || '')}" controls playsinline ${data.autoplay ? 'autoplay muted' : ''} ${data.loop ? 'loop' : ''}></video>${data.caption ? `<figcaption>${escapeHtml(data.caption)}</figcaption>` : ''}</figure>`;
    if (block.type === 'carousel') {
      const items = Array.isArray(data.items) ? data.items : [];
      return `<section class="article-carousel" data-article-carousel>${data.title ? `<h2>${escapeHtml(data.title)}</h2>` : ''}<div class="article-carousel-stage">${items.map((item, index) => `<figure class="${index === 0 ? 'is-active' : ''}" data-carousel-slide>${item.type === 'video' ? `<video src="${attr(item.url)}" controls playsinline></video>` : `<img src="${attr(item.url)}" alt="${attr(item.caption || '')}" loading="lazy" />`}${item.caption ? `<figcaption>${escapeHtml(item.caption)}</figcaption>` : ''}</figure>`).join('')}</div>${items.length > 1 ? `<button class="article-carousel-prev" type="button" aria-label="Предыдущий слайд">←</button><button class="article-carousel-next" type="button" aria-label="Следующий слайд">→</button><div class="article-carousel-dots">${items.map((_, index) => `<button type="button" data-carousel-dot="${index}" class="${index === 0 ? 'is-active' : ''}" aria-label="Слайд ${index + 1}"></button>`).join('')}</div>` : ''}</section>`;
    }
    if (block.type === 'quote') return `<blockquote class="article-quote"><p>${escapeHtml(data.text || '')}</p>${data.author ? `<cite>${escapeHtml(data.author)}</cite>` : ''}</blockquote>`;
    if (block.type === 'audio') return `<section class="article-audio"><div><span>Аудиопрактика</span><h3>${escapeHtml(data.title || 'Аудио')}</h3>${data.caption ? `<p>${escapeHtml(data.caption)}</p>` : ''}</div><audio src="${attr(data.url)}" controls preload="metadata"></audio></section>`;
    if (block.type === 'file') return `<a class="article-file" href="${attr(data.url)}" target="_blank" rel="noreferrer"><span>Материал</span><div><strong>${escapeHtml(data.label || 'Скачать файл')}</strong>${data.description ? `<small>${escapeHtml(data.description)}</small>` : ''}</div><em>Скачать ↓</em></a>`;
    if (block.type === 'button') return `<div class="article-button-wrap"><a class="academy-button ${data.style === 'outline' ? 'is-outline' : ''}" href="${attr(data.url)}" target="_blank" rel="noreferrer">${escapeHtml(data.label || 'Перейти')}</a></div>`;
    return '<div class="article-divider"></div>';
  }).join('');

  const renderCourse = async () => {
    const slug = routeParts()[1] || '';
    const data = await requestJson(`/api/academy/course?slug=${encodeURIComponent(slug)}`);
    sessionUser = data.user;
    const course = data.course;
    const accessCopy = course.accessType === 'paid' ? money(course.priceKopecks) : 'Бесплатный курс';
    const buyAction = course.accessType === 'paid' && !course.owned
      ? `<button class="academy-button" type="button" data-checkout="course:${course.id}">Купить курс · ${money(course.priceKopecks)}</button>`
      : `<a class="academy-button" href="#course-materials">${course.owned ? 'Продолжить обучение' : 'Открыть материалы'}</a>`;
    const content = `
      <section class="course-hero"><div class="course-hero-media">${media(course)}</div><div class="course-hero-shade"></div><div class="course-hero-content"><a class="academy-back-link" href="/courses/${attr(data.category?.slug || '')}/">← ${escapeHtml(data.category?.title || 'Все курсы')}</a><span class="academy-eyebrow">${escapeHtml(accessCopy)}</span><h1>${escapeHtml(course.title)}</h1><p>${escapeHtml(course.summary || '')}</p><div class="course-hero-actions">${buyAction}<a class="academy-button is-outline" href="#course-program">Программа</a></div></div></section>
      ${course.content?.length ? `<article class="course-description" id="course-program">${renderBlocks(course.content)}</article>` : ''}
      <section class="academy-section" id="course-materials"><div class="academy-section-head"><span>01</span><div><h2>Материалы курса</h2><p>${escapeHtml(data.settings.accessInstructions || '')}</p></div></div><div class="course-material-list">${data.materials.length ? data.materials.map((item, index) => `<a href="/article/${attr(course.slug)}/${attr(item.slug)}/"><span>${String(index + 1).padStart(2, '0')}</span><div><small>${item.accessType === 'free' ? 'Бесплатно' : item.canAccess ? 'Доступ открыт' : item.priceKopecks ? money(item.priceKopecks) : 'После покупки курса'}</small><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.excerpt || '')}</p></div><strong>${item.canAccess ? 'Открыть →' : 'Закрыто 🔒'}</strong></a>`).join('') : '<div class="academy-public-empty">Материалы курса скоро появятся.</div>'}</div></section>`;
    root.innerHTML = shell(content, data.settings);
    updateMeta({ title: course.title, description: course.summary, image: course.coverUrl, url: window.location.href });
    bindCommon();
    bindCheckoutButtons(course);
    initCarousels();
  };

  const renderArticle = async () => {
    const [, courseSlug = '', materialSlug = ''] = routeParts();
    const data = await requestJson(`/api/academy/material?course=${encodeURIComponent(courseSlug)}&slug=${encodeURIComponent(materialSlug)}`);
    sessionUser = data.user;
    const item = data.material;
    let body;
    if (item.canAccess) {
      body = `<article class="article-body">${renderBlocks(item.content)}</article>`;
    } else {
      const purchase = item.priceKopecks > 0
        ? `<button class="academy-button" type="button" data-checkout="material:${item.id}">Купить материал · ${money(item.priceKopecks)}</button>`
        : `<a class="academy-button" href="/course/${attr(data.course.slug)}/">Купить курс</a>`;
      body = `<section class="article-locked"><div class="article-lock-icon">🔒</div><span class="academy-eyebrow">Платный материал</span><h2>Полный текст откроется после оплаты</h2><p>${escapeHtml(item.priceKopecks > 0 ? 'Можно приобрести этот материал отдельно.' : 'Этот материал входит в платный курс.')}</p>${purchase}</section>`;
    }
    const currentIndex = data.adjacent.findIndex((entry) => entry.slug === item.slug);
    const previous = data.adjacent[currentIndex - 1];
    const next = data.adjacent[currentIndex + 1];
    const content = `
      <section class="article-hero"><div class="article-hero-media">${media(item)}</div><div class="article-hero-copy"><a class="academy-back-link" href="/course/${attr(data.course.slug)}/">← ${escapeHtml(data.course.title)}</a><span class="academy-eyebrow">${item.accessType === 'free' ? 'Бесплатный материал' : item.canAccess ? 'Доступ открыт' : 'Платный материал'}</span><h1>${escapeHtml(item.title)}</h1><p>${escapeHtml(item.excerpt || '')}</p></div></section>
      ${body}
      <nav class="article-navigation">${previous ? `<a href="/article/${attr(data.course.slug)}/${attr(previous.slug)}/"><span>Предыдущий</span><strong>← ${escapeHtml(previous.title)}</strong></a>` : '<span></span>'}${next ? `<a class="is-next" href="/article/${attr(data.course.slug)}/${attr(next.slug)}/"><span>Следующий</span><strong>${escapeHtml(next.title)} →</strong></a>` : ''}</nav>`;
    root.innerHTML = shell(content, data.settings);
    updateMeta({ title: item.title, description: item.excerpt, image: item.coverUrl, url: window.location.href });
    bindCommon();
    bindCheckoutButtons(item);
    initCarousels();
  };

  const checkoutModal = (target) => {
    const userFields = sessionUser ? `<div class="checkout-user"><span>Покупатель</span><strong>${escapeHtml(sessionUser.name || sessionUser.email)}</strong><small>${escapeHtml(sessionUser.email)}</small></div>` : `
      <label><span>Имя</span><input name="name" autocomplete="name" required /></label>
      <label><span>Email</span><input name="email" type="email" autocomplete="email" required /></label>
      <label><span>Пароль для личного кабинета</span><input name="password" type="password" minlength="8" autocomplete="new-password" required /><small>Не менее 8 символов. Если аккаунт уже есть — укажите его пароль.</small></label>`;
    return `<div class="checkout-modal" data-checkout-modal><div class="checkout-dialog" role="dialog" aria-modal="true" aria-labelledby="checkout-title"><button class="checkout-close" type="button" data-checkout-close aria-label="Закрыть">×</button><span class="academy-eyebrow">Безопасная оплата</span><h2 id="checkout-title">${escapeHtml(target.title)}</h2><div class="checkout-price">${money(target.priceKopecks)}</div><form data-checkout-form>${userFields}<label class="checkout-consent"><input type="checkbox" name="accepted" required /><span>Я принимаю <a href="/legal/offer/" target="_blank">условия оферты</a> и соглашаюсь с <a href="/legal/privacy/" target="_blank">политикой конфиденциальности</a>.</span></label><button class="academy-button" type="submit">Перейти к оплате в ЮKassa</button><p class="checkout-note">Платёжные данные вводятся на защищённой странице ЮKassa. После оплаты доступ появится в личном кабинете.</p><div class="checkout-error" data-checkout-error></div></form></div></div>`;
  };

  const bindCheckoutButtons = (entity) => {
    document.querySelectorAll('[data-checkout]').forEach((button) => button.addEventListener('click', () => {
      const [targetType, targetId] = button.dataset.checkout.split(':');
      checkoutTarget = { targetType, targetId, title: entity.title, priceKopecks: entity.priceKopecks };
      const container = document.querySelector('[data-checkout-root]');
      container.innerHTML = checkoutModal(checkoutTarget);
      document.body.classList.add('checkout-open');
      container.querySelector('[data-checkout-close]').addEventListener('click', closeCheckout);
      container.querySelector('[data-checkout-modal]').addEventListener('click', (event) => { if (event.target === event.currentTarget) closeCheckout(); });
      container.querySelector('[data-checkout-form]').addEventListener('submit', submitCheckout);
    }));
  };

  const closeCheckout = () => {
    document.querySelector('[data-checkout-root]').innerHTML = '';
    document.body.classList.remove('checkout-open');
  };

  const submitCheckout = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('button[type="submit"]');
    const error = form.querySelector('[data-checkout-error]');
    button.disabled = true;
    button.textContent = 'Создаём платёж…';
    error.textContent = '';
    const values = Object.fromEntries(new FormData(form));
    try {
      const result = await requestJson('/api/academy/checkout', {
        method: 'POST',
        body: JSON.stringify({
          ...checkoutTarget,
          name: values.name,
          email: values.email,
          password: values.password,
          accepted: values.accepted === 'on',
        }),
      });
      if (result.alreadyOwned) { window.location.href = result.destination; return; }
      if (!result.confirmationUrl) throw new Error('ЮKassa не вернула ссылку на оплату');
      window.location.href = result.confirmationUrl;
    } catch (requestError) {
      error.textContent = requestError.message;
      button.disabled = false;
      button.textContent = 'Перейти к оплате в ЮKassa';
    }
  };

  const renderPayment = async () => {
    const orderId = new URLSearchParams(window.location.search).get('order_id');
    if (!orderId) throw new Error('Не указан номер заказа');
    let attempts = 0;
    const draw = async () => {
      const data = await requestJson(`/api/academy/payment?order_id=${encodeURIComponent(orderId)}`);
      const succeeded = data.status === 'succeeded';
      const canceled = data.status === 'canceled';
      const content = `<section class="payment-result ${succeeded ? 'is-success' : canceled ? 'is-canceled' : ''}"><div class="payment-result-icon">${succeeded ? '✓' : canceled ? '×' : '···'}</div><span class="academy-eyebrow">Заказ ${escapeHtml(orderId.slice(0, 8))}</span><h1>${succeeded ? 'Оплата прошла' : canceled ? 'Оплата отменена' : 'Проверяем оплату'}</h1><p>${escapeHtml(data.title)}</p><strong>${money(data.amountKopecks)}</strong>${succeeded ? `<a class="academy-button" href="${attr(data.destination)}">Открыть покупку</a>` : canceled ? '<a class="academy-button is-outline" href="/courses/">Вернуться к курсам</a>' : '<span class="payment-wait">Обычно это занимает несколько секунд. Страница обновится автоматически.</span>'}</section>`;
      root.innerHTML = shell(content, {});
      bindCommon();
      if (!succeeded && !canceled && attempts < 12) { attempts += 1; window.setTimeout(draw, 3000); }
    };
    await draw();
  };

  const authForm = () => `<section class="account-auth"><div><span class="academy-eyebrow">Личный кабинет</span><h1>Ваши курсы и материалы</h1><p>Войдите в аккаунт, который использовали при покупке, или зарегистрируйтесь заранее.</p></div><div class="account-auth-card"><div class="account-auth-tabs"><button class="is-active" type="button" data-auth-mode="login">Вход</button><button type="button" data-auth-mode="register">Регистрация</button></div><form data-auth-form><label data-name-field hidden><span>Имя</span><input name="name" autocomplete="name" /></label><label><span>Email</span><input name="email" type="email" autocomplete="email" required /></label><label><span>Пароль</span><input name="password" type="password" minlength="8" autocomplete="current-password" required /></label><button class="academy-button" type="submit">Войти</button><div class="checkout-error" data-auth-error></div></form></div></section>`;

  const renderAccount = async () => {
    try {
      const data = await requestJson('/api/academy/account');
      sessionUser = data.user;
      const catalog = data.catalog;
      const cards = data.entitlements.map((entitlement) => {
        if (entitlement.target_type === 'course') {
          const item = catalog.courses.find((entry) => entry.id === entitlement.target_id);
          return item ? courseCard(item, catalog.categories.find((entry) => entry.id === item.categoryId)) : '';
        }
        const item = catalog.materials.find((entry) => entry.id === entitlement.target_id);
        const parent = item && catalog.courses.find((entry) => entry.id === item.courseId);
        return item && parent ? materialCard(item, parent) : '';
      }).join('');
      const content = `<section class="account-head"><div><span class="academy-eyebrow">Личный кабинет</span><h1>${escapeHtml(data.user.name || 'Мои покупки')}</h1><p>${escapeHtml(data.user.email)}</p></div><button class="academy-button is-outline" type="button" data-logout>Выйти</button></section><section class="academy-section"><div class="academy-section-head"><span>01</span><div><h2>Доступные покупки</h2><p>Оплаченные курсы и отдельные материалы.</p></div></div><div class="academy-course-grid">${cards || '<div class="academy-public-empty">Покупок пока нет. Бесплатные материалы доступны в каталоге.</div>'}</div></section>`;
      root.innerHTML = shell(content, catalog.settings);
      bindCommon();
      document.querySelector('[data-logout]').addEventListener('click', async () => { await requestJson('/api/academy/logout', { method: 'POST', body: '{}' }); window.location.reload(); });
    } catch (error) {
      if (!/Войдите/.test(error.message)) throw error;
      root.innerHTML = shell(authForm(), {});
      bindCommon();
      bindAuth();
    }
  };

  const bindAuth = () => {
    let mode = 'login';
    const form = document.querySelector('[data-auth-form]');
    document.querySelectorAll('[data-auth-mode]').forEach((button) => button.addEventListener('click', () => {
      mode = button.dataset.authMode;
      document.querySelectorAll('[data-auth-mode]').forEach((entry) => entry.classList.toggle('is-active', entry === button));
      form.querySelector('[data-name-field]').hidden = mode !== 'register';
      form.querySelector('[name="name"]').required = mode === 'register';
      form.querySelector('button[type="submit"]').textContent = mode === 'register' ? 'Создать аккаунт' : 'Войти';
    }));
    form.addEventListener('submit', async (event) => {
      event.preventDefault(); const values = Object.fromEntries(new FormData(form)); const error = form.querySelector('[data-auth-error]'); error.textContent = '';
      try { await requestJson(`/api/academy/${mode}`, { method: 'POST', body: JSON.stringify(values) }); window.location.reload(); }
      catch (requestError) { error.textContent = requestError.message; }
    });
  };

  const generatedLegal = (type, settings) => {
    const seller = escapeHtml(settings.sellerLegalName || settings.sellerName || '[укажите продавца]');
    const email = escapeHtml(settings.supportEmail || settings.email || '[укажите email]');
    if (type === 'privacy') return `<h1>Политика обработки персональных данных</h1><p>Настоящая Политика определяет порядок обработки персональных данных пользователей сайта iam-atmika.com оператором ${seller}.</p><h2>Какие данные обрабатываются</h2><p>Имя, адрес электронной почты, сведения о заказах и техническая информация, необходимая для работы сайта и обеспечения доступа к приобретённым материалам.</p><h2>Цели обработки</h2><ul><li>создание личного кабинета;</li><li>оформление и исполнение заказа;</li><li>предоставление доступа к курсам;</li><li>ответы на обращения пользователей.</li></ul><h2>Передача данных</h2><p>Данные могут передаваться платёжному оператору ЮKassa и техническим подрядчикам в объёме, необходимом для оплаты и работы сервиса.</p><h2>Обращения</h2><p>Для уточнения, изменения или удаления данных напишите на ${email}.</p>`;
    if (type === 'offer') return `<h1>Публичная оферта</h1><p>Настоящий документ является предложением ${seller} заключить договор предоставления доступа к цифровым образовательным и информационным материалам, размещённым на iam-atmika.com.</p><h2>Предмет договора</h2><p>Продавец предоставляет пользователю доступ к выбранному курсу или отдельному материалу в объёме и на условиях, указанных на странице соответствующего продукта.</p><h2>Оформление и оплата</h2><p>Пользователь выбирает продукт, создаёт личный кабинет, принимает условия оферты и оплачивает заказ на защищённой странице ЮKassa. Цена указывается на странице продукта в рублях.</p><h2>Предоставление доступа</h2><p>${escapeHtml(settings.accessInstructions || 'Доступ открывается в личном кабинете после подтверждения оплаты.')}</p><h2>Возвраты</h2><p>${escapeHtml(settings.refundSummary || `Для обращения по вопросу возврата напишите на ${email}.`)}</p><h2>Реквизиты</h2><p>${seller}${settings.inn ? `<br>ИНН ${escapeHtml(settings.inn)}` : ''}${settings.ogrn ? `<br>ОГРН/ОГРНИП ${escapeHtml(settings.ogrn)}` : ''}${settings.legalAddress ? `<br>${escapeHtml(settings.legalAddress)}` : ''}<br>${email}</p>`;
    return `<h1>Оплата, получение доступа и возвраты</h1><h2>Как оплатить</h2><p>Выберите платный курс или материал, заполните данные личного кабинета и перейдите на защищённую страницу ЮKassa. Доступные способы оплаты показываются на платёжной странице.</p><h2>Как получить покупку</h2><p>${escapeHtml(settings.accessInstructions || 'После успешной оплаты вернитесь на сайт и откройте покупку в личном кабинете.')}</p><h2>Если оплата не завершилась</h2><p>Вернитесь на страницу курса и создайте новый заказ. Деньги за отменённый платёж не списываются.</p><h2>Возврат</h2><p>${escapeHtml(settings.refundSummary || 'Напишите продавцу, указав email аккаунта, название покупки и дату оплаты.')}</p><p>Контакт поддержки: ${email}.</p>`;
  };

  const renderLegal = async () => {
    const type = routeParts()[1] || 'payment';
    const data = await requestJson(`/api/academy/legal?type=${encodeURIComponent(type)}`);
    const titles = { offer: 'Публичная оферта', privacy: 'Политика конфиденциальности', payment: 'Оплата и возвраты' };
    const html = data.html ? sanitizeRichHtml(data.html) : generatedLegal(type, data.settings);
    const incomplete = !data.settings.sellerLegalName || !data.settings.inn || !data.settings.ogrn;
    const content = `<article class="legal-document"><a class="academy-back-link" href="/courses/">← К курсам</a><span class="academy-eyebrow">Правовая информация</span>${incomplete ? '<div class="legal-draft">Владелец сайта ещё заполняет реквизиты продавца. До их публикации приём оплаты не должен запускаться.</div>' : ''}<div class="article-rich-text">${html}</div><p class="legal-updated">Дата публикации: ${new Intl.DateTimeFormat('ru-RU').format(new Date())}</p></article>`;
    root.innerHTML = shell(content, data.settings);
    document.title = `${titles[type] || titles.payment} | Атмика`;
    bindCommon();
  };

  const initCarousels = () => document.querySelectorAll('[data-article-carousel]').forEach((carousel) => {
    const slides = [...carousel.querySelectorAll('[data-carousel-slide]')];
    const dots = [...carousel.querySelectorAll('[data-carousel-dot]')];
    let index = 0;
    const show = (next) => { index = (next + slides.length) % slides.length; slides.forEach((slide, i) => slide.classList.toggle('is-active', i === index)); dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index)); };
    carousel.querySelector('.article-carousel-prev')?.addEventListener('click', () => show(index - 1));
    carousel.querySelector('.article-carousel-next')?.addEventListener('click', () => show(index + 1));
    dots.forEach((dot, i) => dot.addEventListener('click', () => show(i)));
  });

  const bindCommon = () => {
    const menu = document.querySelector('[data-academy-menu]');
    menu?.addEventListener('click', () => document.body.classList.toggle('academy-menu-open'));
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && document.body.classList.contains('checkout-open')) closeCheckout(); }, { once: true });
  };

  const renderError = (error) => {
    root.innerHTML = shell(`<section class="academy-error"><span>A</span><h1>Не удалось открыть страницу</h1><p>${escapeHtml(error.message)}</p><a class="academy-button" href="/courses/">Перейти к курсам</a></section>`, {});
    bindCommon();
  };

  const boot = async () => {
    try {
      if (page === 'catalog') await renderCatalog();
      else if (page === 'course') await renderCourse();
      else if (page === 'article') await renderArticle();
      else if (page === 'payment') await renderPayment();
      else if (page === 'account') await renderAccount();
      else await renderLegal();
    } catch (error) {
      renderError(error);
    }
  };

  boot();
})();
