(() => {
  const section = document.querySelector('[data-academy-home]');
  const footer = document.querySelector('[data-academy-footer]');
  if (!section && !footer) return;

  const escapeHtml = (value) => String(value ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  const freeLabel = () => '<span class="free-label"><s>Бесплатно</s> <b>Безоплатно</b></span>';

  const media = (item) => {
    if (!item?.coverUrl) return '<div class="home-academy-media-empty"><span>A</span></div>';
    return item.coverType === 'video'
      ? `<video src="${escapeHtml(item.coverUrl)}" poster="${escapeHtml(item.coverPoster || '')}" muted loop playsinline autoplay preload="metadata"></video>`
      : `<img src="${escapeHtml(item.coverUrl)}" alt="${escapeHtml(item.title || '')}" loading="lazy" />`;
  };

  const renderFooter = (settings) => {
    if (!footer) return;
    footer.innerHTML = `
      <div class="site-commerce-footer-grid">
        <div class="site-commerce-footer-brand"><strong>АТМИКА</strong><p>Программы, индивидуальные сессии, практики и цифровые материалы.</p><span>Оплата банковскими картами и через СБП производится на защищённой странице ЮKassa.</span></div>
        <div><strong>Форматы</strong><a href="/courses/">Все категории</a><a href="/account/">Личный кабинет</a><span>${escapeHtml(settings.accessInstructions || 'Доступ открывается после успешной оплаты.')}</span></div>
        <div><strong>Документы</strong><a href="/legal/offer/">Публичная оферта</a><a href="/legal/privacy/">Политика оператора в отношении обработки персональных данных</a><a href="/legal/consent/">Согласие на обработку персональных данных</a><a href="/legal/payment/">Оплата и возвраты</a></div>
        <div><strong>Продавец</strong><span>${escapeHtml(settings.sellerLegalName || settings.sellerName || 'Реквизиты заполняются')}</span>${settings.sellerStatus ? `<span>${escapeHtml(settings.sellerStatus)}</span>` : ''}${settings.inn ? `<span>ИНН ${escapeHtml(settings.inn)}</span>` : ''}${settings.ogrn ? `<span>ОГРН/ОГРНИП ${escapeHtml(settings.ogrn)}</span>` : ''}${settings.legalAddress ? `<span>${escapeHtml(settings.legalAddress)}</span>` : ''}${settings.postalAddress && settings.postalAddress !== settings.legalAddress ? `<span>${escapeHtml(settings.postalAddress)}</span>` : ''}${settings.phone ? `<a href="tel:${escapeHtml(settings.phone.replace(/[^+\d]/g, ''))}">${escapeHtml(settings.phone)}</a>` : ''}${settings.email ? `<a href="mailto:${escapeHtml(settings.email)}">${escapeHtml(settings.email)}</a>` : ''}</div>
      </div>
      <div class="site-commerce-footer-bottom"><span>© ${new Date().getFullYear()} Атмика</span><span>iam-atmika.com</span></div>`;
  };

  fetch('/api/academy/catalog', { credentials: 'same-origin' })
    .then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ошибка загрузки');
      return data;
    })
    .then((data) => {
      renderFooter(data.settings || {});
      if (!section) return;
      const categories = data.categories || [];
      const materials = (data.materials || []).slice(-6).reverse();
      section.innerHTML = `
        <div class="home-academy-head">
          <div><span class="eyebrow">${escapeHtml(data.settings?.eyebrow || 'Пространство практик и обучения')}</span><h2>${escapeHtml(data.settings?.title || 'Программы и сессии Атмики')}</h2><p>${escapeHtml(data.settings?.description || '')}</p></div>
          <a href="/courses/">Открыть все форматы ↗</a>
        </div>
        ${categories.length ? `<div class="home-category-grid">${categories.slice(0, 4).map((item) => `<a href="/courses/${escapeHtml(item.slug)}/"><div class="home-academy-media">${media(item)}</div><div class="home-academy-shade"></div><div><span>${data.courses.filter((course) => course.categoryId === item.id).length} формат(ов)</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description || '')}</p></div></a>`).join('')}</div>` : '<div class="home-academy-empty">Категории форматов скоро появятся.</div>'}
        ${materials.length ? `<div class="home-materials-head"><span>Материалы программ и сессий</span><h3>Статьи и практики</h3></div><div class="home-material-grid">${materials.map((item) => {
          const course = data.courses.find((entry) => entry.id === item.courseId);
          return `<a href="/article/${escapeHtml(course?.slug || '')}/${escapeHtml(item.slug)}/"><div class="home-academy-media">${media(item)}</div><div>${item.accessType === 'free' ? freeLabel() : `<span>${item.canAccess ? 'Доступ открыт' : 'Платный материал'}</span>`}<h4>${escapeHtml(item.title)}</h4><p>${escapeHtml(item.excerpt || '')}</p><strong>Открыть →</strong></div></a>`;
        }).join('')}</div>` : ''}`;
    })
    .catch(() => {
      if (section) section.innerHTML = '<div class="home-academy-empty">Форматы временно недоступны.</div>';
    });
})();
