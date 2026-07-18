(() => {
  const endpoints = {
    academy: '/api/admin/academy',
    upload: '/api/admin/academy/upload',
    payments: '/api/admin/academy/payments',
    paymentSync: '/api/admin/academy/payment-sync',
  };

  let data = null;
  let payments = [];
  let isLoading = false;
  let isSaving = false;
  let paymentsLoaded = false;
  let view = { type: 'overview', id: '' };
  let host = { rerender: () => {}, notify: () => {} };

  const escapeHtml = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const requestJson = async (url, options = {}) => {
    const response = await fetch(url, {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Ошибка запроса');
    return result;
  };

  const slugify = (value, fallback = 'item') => {
    const translit = {
      а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
      к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
      х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
    };
    return String(value || '').toLocaleLowerCase('ru-RU').split('')
      .map((character) => translit[character] ?? character).join('')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100) || fallback;
  };

  const money = (kopecks) => new Intl.NumberFormat('ru-RU', {
    style: 'currency', currency: 'RUB', maximumFractionDigits: Number(kopecks) % 100 ? 2 : 0,
  }).format((Number(kopecks) || 0) / 100);

  const date = (value) => value ? new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'short', timeStyle: 'short',
  }).format(new Date(value)) : '—';

  const uid = () => crypto.randomUUID();
  const categories = () => data?.categories || [];
  const courses = () => data?.courses || [];
  const materials = () => data?.materials || [];
  const category = (id) => categories().find((item) => item.id === id);
  const course = (id) => courses().find((item) => item.id === id);
  const material = (id) => materials().find((item) => item.id === id);
  const activeEntity = () => view.type === 'category' ? category(view.id) : view.type === 'course' ? course(view.id) : material(view.id);

  const sanitizedEditorHtml = (value) => {
    const template = document.createElement('template');
    template.innerHTML = String(value || '');
    template.content.querySelectorAll('script, style, iframe, object, embed, form').forEach((node) => node.remove());
    template.content.querySelectorAll('*').forEach((node) => {
      [...node.attributes].forEach((attribute) => {
        if (attribute.name.toLowerCase().startsWith('on')) node.removeAttribute(attribute.name);
        if (['href', 'src'].includes(attribute.name.toLowerCase()) && /^javascript:/i.test(attribute.value)) {
          node.removeAttribute(attribute.name);
        }
      });
    });
    return template.innerHTML;
  };

  const defaultBlock = (type) => {
    const defaults = {
      text: { html: '<p>Начните писать текст…</p>' },
      image: { url: '', alt: '', caption: '', size: 'wide' },
      video: { url: '', poster: '', caption: '', autoplay: false, loop: false },
      carousel: { title: '', items: [] },
      quote: { text: '', author: '' },
      audio: { url: '', title: '', caption: '' },
      file: { url: '', label: 'Скачать материал', description: '' },
      button: { label: 'Перейти', url: 'https://', style: 'primary' },
      divider: {},
    };
    return { id: uid(), type, data: defaults[type] || defaults.text };
  };

  const newCategory = () => {
    const item = {
      id: uid(), slug: `category-${categories().length + 1}`, title: 'Новая категория', description: '',
      coverType: 'image', coverUrl: '', coverPoster: '', published: false, position: categories().length,
    };
    data.categories.push(item);
    view = { type: 'category', id: item.id };
  };

  const newCourse = (categoryId = categories()[0]?.id || '') => {
    if (!categoryId) {
      host.notify('Сначала создайте категорию.', true);
      return false;
    }
    const item = {
      id: uid(), categoryId, slug: `course-${courses().length + 1}`, title: 'Новый курс', summary: '',
      coverType: 'image', coverUrl: '', coverPoster: '', accessType: 'free', priceKopecks: 0,
      published: false, featured: false, position: courses().filter((entry) => entry.categoryId === categoryId).length,
      content: [],
    };
    data.courses.push(item);
    view = { type: 'course', id: item.id };
    return true;
  };

  const newMaterial = (courseId = courses()[0]?.id || '') => {
    if (!courseId) {
      host.notify('Сначала создайте курс.', true);
      return false;
    }
    const item = {
      id: uid(), courseId, slug: `material-${materials().length + 1}`, title: 'Новый материал', excerpt: '',
      coverType: 'image', coverUrl: '', coverPoster: '', accessType: 'free', priceKopecks: 0,
      published: false, position: materials().filter((entry) => entry.courseId === courseId).length,
      content: [defaultBlock('text')],
    };
    data.materials.push(item);
    view = { type: 'material', id: item.id };
    return true;
  };

  const renderCoverPreview = (entity) => {
    if (!entity.coverUrl) return '<div class="academy-cover-empty">Обложка пока не выбрана</div>';
    if (entity.coverType === 'video') {
      return `<video src="${escapeHtml(entity.coverUrl)}" poster="${escapeHtml(entity.coverPoster || '')}" muted loop playsinline controls></video>`;
    }
    return `<img src="${escapeHtml(entity.coverUrl)}" alt="" />`;
  };

  const renderCoverFields = (entity) => `
    <section class="academy-form-section">
      <div class="academy-section-title"><h3>Обложка</h3><span>Изображение или короткое видео</span></div>
      <div class="academy-cover-editor">
        <div class="academy-cover-preview">${renderCoverPreview(entity)}</div>
        <div class="academy-field-stack">
          <label class="academy-field"><span>Тип обложки</span>
            <select data-entity-field="coverType">
              <option value="image" ${entity.coverType === 'image' ? 'selected' : ''}>Изображение</option>
              <option value="video" ${entity.coverType === 'video' ? 'selected' : ''}>Видео</option>
            </select>
          </label>
          <label class="academy-field"><span>Ссылка на файл</span><input data-entity-field="coverUrl" value="${escapeHtml(entity.coverUrl || '')}" placeholder="/public/uploads/... или https://" /></label>
          <label class="academy-upload-button">Загрузить файл<input type="file" data-cover-upload accept="image/*,video/mp4,video/webm" /></label>
          ${entity.coverType === 'video' ? `<label class="academy-field"><span>Постер видео</span><input data-entity-field="coverPoster" value="${escapeHtml(entity.coverPoster || '')}" /></label>` : ''}
        </div>
      </div>
    </section>
  `;

  const renderRichToolbar = (blockId) => `
    <div class="rich-toolbar" data-rich-toolbar="${blockId}">
      <button type="button" data-rich-command="formatBlock" data-rich-value="p" title="Обычный текст">P</button>
      <button type="button" data-rich-command="formatBlock" data-rich-value="h2" title="Заголовок 2">H2</button>
      <button type="button" data-rich-command="formatBlock" data-rich-value="h3" title="Заголовок 3">H3</button>
      <button type="button" data-rich-command="bold" title="Жирный"><b>B</b></button>
      <button type="button" data-rich-command="italic" title="Курсив"><i>I</i></button>
      <button type="button" data-rich-command="underline" title="Подчёркнутый"><u>U</u></button>
      <button type="button" data-rich-command="insertUnorderedList" title="Маркированный список">• Список</button>
      <button type="button" data-rich-command="insertOrderedList" title="Нумерованный список">1. Список</button>
      <button type="button" data-rich-command="formatBlock" data-rich-value="blockquote" title="Цитата">❝</button>
      <button type="button" data-rich-command="createLink" title="Ссылка">Ссылка</button>
      <button type="button" data-rich-command="removeFormat" title="Очистить форматирование">Очистить</button>
    </div>
  `;

  const renderBlock = (block, index, blocks) => {
    const dataValue = block.data || {};
    let body = '';
    if (block.type === 'text') {
      body = `${renderRichToolbar(block.id)}<div class="rich-editor" contenteditable="true" data-block-rich="${block.id}" data-placeholder="Начните писать…">${sanitizedEditorHtml(dataValue.html)}</div>`;
    } else if (block.type === 'image') {
      body = `
        ${dataValue.url ? `<img class="block-preview-image" src="${escapeHtml(dataValue.url)}" alt="" />` : ''}
        <div class="academy-field-grid">
          <label class="academy-field"><span>Ссылка на изображение</span><input data-block-field="${block.id}:url" value="${escapeHtml(dataValue.url || '')}" /></label>
          <label class="academy-upload-button">Загрузить изображение<input type="file" data-block-upload="${block.id}:url" accept="image/*" /></label>
          <label class="academy-field"><span>Alt-текст</span><input data-block-field="${block.id}:alt" value="${escapeHtml(dataValue.alt || '')}" /></label>
          <label class="academy-field"><span>Подпись</span><input data-block-field="${block.id}:caption" value="${escapeHtml(dataValue.caption || '')}" /></label>
          <label class="academy-field"><span>Размер</span><select data-block-field="${block.id}:size"><option value="wide" ${dataValue.size !== 'compact' ? 'selected' : ''}>Широкое</option><option value="compact" ${dataValue.size === 'compact' ? 'selected' : ''}>Компактное</option></select></label>
        </div>`;
    } else if (block.type === 'video') {
      body = `
        ${dataValue.url ? `<video class="block-preview-video" src="${escapeHtml(dataValue.url)}" poster="${escapeHtml(dataValue.poster || '')}" controls muted></video>` : ''}
        <div class="academy-field-grid">
          <label class="academy-field"><span>Ссылка на видео</span><input data-block-field="${block.id}:url" value="${escapeHtml(dataValue.url || '')}" /></label>
          <label class="academy-upload-button">Загрузить видео<input type="file" data-block-upload="${block.id}:url" accept="video/mp4,video/webm" /></label>
          <label class="academy-field"><span>Постер</span><input data-block-field="${block.id}:poster" value="${escapeHtml(dataValue.poster || '')}" /></label>
          <label class="academy-field"><span>Подпись</span><input data-block-field="${block.id}:caption" value="${escapeHtml(dataValue.caption || '')}" /></label>
          <label class="academy-check"><input type="checkbox" data-block-field="${block.id}:autoplay" ${dataValue.autoplay ? 'checked' : ''} /> Автозапуск без звука</label>
          <label class="academy-check"><input type="checkbox" data-block-field="${block.id}:loop" ${dataValue.loop ? 'checked' : ''} /> Зациклить</label>
        </div>`;
    } else if (block.type === 'carousel') {
      const items = Array.isArray(dataValue.items) ? dataValue.items : [];
      body = `
        <label class="academy-field"><span>Заголовок карусели</span><input data-block-field="${block.id}:title" value="${escapeHtml(dataValue.title || '')}" /></label>
        <div class="carousel-admin-items">
          ${items.map((item, itemIndex) => `
            <div class="carousel-admin-item">
              <div class="carousel-admin-preview">${item.url ? (item.type === 'video' ? `<video src="${escapeHtml(item.url)}" muted></video>` : `<img src="${escapeHtml(item.url)}" alt="" />`) : `<span>${itemIndex + 1}</span>`}</div>
              <div class="academy-field-stack">
                <label class="academy-field"><span>Тип</span><select data-carousel-field="${block.id}:${itemIndex}:type"><option value="image" ${item.type !== 'video' ? 'selected' : ''}>Фото</option><option value="video" ${item.type === 'video' ? 'selected' : ''}>Видео</option></select></label>
                <label class="academy-field"><span>Файл</span><input data-carousel-field="${block.id}:${itemIndex}:url" value="${escapeHtml(item.url || '')}" /></label>
                <label class="academy-upload-button">Загрузить<input type="file" data-carousel-upload="${block.id}:${itemIndex}" accept="image/*,video/mp4,video/webm" /></label>
                <label class="academy-field"><span>Подпись</span><input data-carousel-field="${block.id}:${itemIndex}:caption" value="${escapeHtml(item.caption || '')}" /></label>
              </div>
              <button class="mini-danger" type="button" data-carousel-remove="${block.id}:${itemIndex}">Удалить</button>
            </div>`).join('')}
        </div>
        <button class="academy-secondary-button" type="button" data-carousel-add="${block.id}">+ Добавить слайд</button>`;
    } else if (block.type === 'quote') {
      body = `<div class="academy-field-grid"><label class="academy-field academy-field-wide"><span>Текст цитаты</span><textarea data-block-field="${block.id}:text">${escapeHtml(dataValue.text || '')}</textarea></label><label class="academy-field"><span>Автор</span><input data-block-field="${block.id}:author" value="${escapeHtml(dataValue.author || '')}" /></label></div>`;
    } else if (block.type === 'audio') {
      body = `<div class="academy-field-grid"><label class="academy-field"><span>Название</span><input data-block-field="${block.id}:title" value="${escapeHtml(dataValue.title || '')}" /></label><label class="academy-field"><span>Аудиофайл</span><input data-block-field="${block.id}:url" value="${escapeHtml(dataValue.url || '')}" /></label><label class="academy-upload-button">Загрузить аудио<input type="file" data-block-upload="${block.id}:url" accept="audio/*" /></label><label class="academy-field"><span>Подпись</span><input data-block-field="${block.id}:caption" value="${escapeHtml(dataValue.caption || '')}" /></label></div>`;
    } else if (block.type === 'file') {
      body = `<div class="academy-field-grid"><label class="academy-field"><span>Текст ссылки</span><input data-block-field="${block.id}:label" value="${escapeHtml(dataValue.label || '')}" /></label><label class="academy-field"><span>Файл</span><input data-block-field="${block.id}:url" value="${escapeHtml(dataValue.url || '')}" /></label><label class="academy-upload-button">Загрузить файл<input type="file" data-block-upload="${block.id}:url" accept="application/pdf,application/zip" /></label><label class="academy-field academy-field-wide"><span>Описание</span><input data-block-field="${block.id}:description" value="${escapeHtml(dataValue.description || '')}" /></label></div>`;
    } else if (block.type === 'button') {
      body = `<div class="academy-field-grid"><label class="academy-field"><span>Текст кнопки</span><input data-block-field="${block.id}:label" value="${escapeHtml(dataValue.label || '')}" /></label><label class="academy-field"><span>Ссылка</span><input data-block-field="${block.id}:url" value="${escapeHtml(dataValue.url || '')}" /></label><label class="academy-field"><span>Стиль</span><select data-block-field="${block.id}:style"><option value="primary" ${dataValue.style !== 'outline' ? 'selected' : ''}>Основная</option><option value="outline" ${dataValue.style === 'outline' ? 'selected' : ''}>Контурная</option></select></label></div>`;
    } else {
      body = '<div class="divider-preview"></div>';
    }
    const typeLabels = { text: 'Текст', image: 'Изображение', video: 'Видео', carousel: 'Карусель', quote: 'Цитата', audio: 'Аудио', file: 'Файл', button: 'Кнопка', divider: 'Разделитель' };
    return `
      <article class="content-block-admin" data-block-id="${block.id}">
        <header><strong>${String(index + 1).padStart(2, '0')} · ${typeLabels[block.type] || block.type}</strong><div>
          <button type="button" data-block-up="${block.id}" ${index === 0 ? 'disabled' : ''}>↑</button>
          <button type="button" data-block-down="${block.id}" ${index === blocks.length - 1 ? 'disabled' : ''}>↓</button>
          <button class="mini-danger" type="button" data-block-remove="${block.id}">Удалить</button>
        </div></header>
        <div class="content-block-body">${body}</div>
      </article>`;
  };

  const renderBlockEditor = (blocks = []) => `
    <section class="academy-form-section">
      <div class="academy-section-title"><h3>Содержание</h3><span>Соберите страницу из блоков и меняйте их порядок</span></div>
      <div class="block-add-toolbar">
        ${[['text', 'Текст'], ['image', 'Фото'], ['video', 'Видео'], ['carousel', 'Карусель'], ['quote', 'Цитата'], ['audio', 'Аудио'], ['file', 'Файл'], ['button', 'Кнопка'], ['divider', 'Линия']]
          .map(([type, label]) => `<button type="button" data-block-add="${type}">+ ${label}</button>`).join('')}
      </div>
      <div class="content-block-list">${blocks.length ? blocks.map((block, index) => renderBlock(block, index, blocks)).join('') : '<div class="academy-empty">Добавьте первый блок.</div>'}</div>
    </section>`;

  const renderCategoryEditor = (item) => `
    <div class="academy-editor-head"><div><span>Категория</span><h2>${escapeHtml(item.title)}</h2></div><button class="academy-danger-button" type="button" data-delete-entity>Удалить категорию</button></div>
    <section class="academy-form-section"><div class="academy-field-grid">
      <label class="academy-field academy-field-wide"><span>Название</span><input data-entity-field="title" value="${escapeHtml(item.title)}" /></label>
      <label class="academy-field"><span>Адрес (slug)</span><input data-entity-field="slug" value="${escapeHtml(item.slug)}" /></label>
      <label class="academy-check"><input type="checkbox" data-entity-field="published" ${item.published ? 'checked' : ''} /> Показывать на сайте</label>
      <label class="academy-field academy-field-wide"><span>Описание</span><textarea data-entity-field="description">${escapeHtml(item.description || '')}</textarea></label>
    </div></section>
    ${renderCoverFields(item)}
    <div class="academy-context-actions"><button type="button" data-add-course="${item.id}">+ Создать курс в этой категории</button></div>`;

  const renderCourseEditor = (item) => `
    <div class="academy-editor-head"><div><span>Курс</span><h2>${escapeHtml(item.title)}</h2></div><button class="academy-danger-button" type="button" data-delete-entity>Удалить курс</button></div>
    <section class="academy-form-section"><div class="academy-field-grid">
      <label class="academy-field academy-field-wide"><span>Название</span><input data-entity-field="title" value="${escapeHtml(item.title)}" /></label>
      <label class="academy-field"><span>Категория</span><select data-entity-field="categoryId">${categories().map((entry) => `<option value="${entry.id}" ${entry.id === item.categoryId ? 'selected' : ''}>${escapeHtml(entry.title)}</option>`).join('')}</select></label>
      <label class="academy-field"><span>Адрес (slug)</span><input data-entity-field="slug" value="${escapeHtml(item.slug)}" /></label>
      <label class="academy-field academy-field-wide"><span>Краткое описание</span><textarea data-entity-field="summary">${escapeHtml(item.summary || '')}</textarea></label>
      <label class="academy-field"><span>Доступ</span><select data-entity-field="accessType"><option value="free" ${item.accessType === 'free' ? 'selected' : ''}>Бесплатный</option><option value="paid" ${item.accessType === 'paid' ? 'selected' : ''}>Платный</option></select></label>
      ${item.accessType === 'paid' ? `<label class="academy-field"><span>Цена, ₽</span><input type="number" min="0" step="1" data-price-field value="${Number(item.priceKopecks || 0) / 100}" /></label>` : ''}
      <label class="academy-check"><input type="checkbox" data-entity-field="published" ${item.published ? 'checked' : ''} /> Опубликован</label>
      <label class="academy-check"><input type="checkbox" data-entity-field="featured" ${item.featured ? 'checked' : ''} /> Выделить на главной</label>
    </div></section>
    ${renderCoverFields(item)}
    ${renderBlockEditor(item.content)}
    <div class="academy-context-actions"><button type="button" data-add-material="${item.id}">+ Добавить материал в курс</button><a href="/course/${escapeHtml(item.slug)}/" target="_blank">Открыть страницу курса ↗</a></div>`;

  const renderMaterialEditor = (item) => {
    const parent = course(item.courseId);
    return `
      <div class="academy-editor-head"><div><span>Материал курса</span><h2>${escapeHtml(item.title)}</h2></div><button class="academy-danger-button" type="button" data-delete-entity>Удалить материал</button></div>
      <section class="academy-form-section"><div class="academy-field-grid">
        <label class="academy-field academy-field-wide"><span>Название</span><input data-entity-field="title" value="${escapeHtml(item.title)}" /></label>
        <label class="academy-field"><span>Курс</span><select data-entity-field="courseId">${courses().map((entry) => `<option value="${entry.id}" ${entry.id === item.courseId ? 'selected' : ''}>${escapeHtml(entry.title)}</option>`).join('')}</select></label>
        <label class="academy-field"><span>Адрес (slug)</span><input data-entity-field="slug" value="${escapeHtml(item.slug)}" /></label>
        <label class="academy-field academy-field-wide"><span>Анонс</span><textarea data-entity-field="excerpt">${escapeHtml(item.excerpt || '')}</textarea></label>
        <label class="academy-field"><span>Доступ</span><select data-entity-field="accessType"><option value="free" ${item.accessType === 'free' ? 'selected' : ''}>Бесплатный материал</option><option value="paid" ${item.accessType === 'paid' ? 'selected' : ''}>Платный материал</option></select></label>
        ${item.accessType === 'paid' ? `<label class="academy-field"><span>Отдельная цена, ₽</span><input type="number" min="0" step="1" data-price-field value="${Number(item.priceKopecks || 0) / 100}" /><small>Если 0 ₽ — материал доступен только после покупки платного курса.</small></label>` : ''}
        <label class="academy-check"><input type="checkbox" data-entity-field="published" ${item.published ? 'checked' : ''} /> Опубликован</label>
      </div></section>
      ${renderCoverFields(item)}
      ${renderBlockEditor(item.content)}
      <div class="academy-context-actions"><a href="/article/${escapeHtml(parent?.slug || '')}/${escapeHtml(item.slug)}/" target="_blank">Открыть материал ↗</a></div>`;
  };

  const renderOverview = () => `
    <div class="academy-overview-head"><div><span class="academy-kicker">Учебное пространство</span><h2>Категории, курсы и статьи</h2><p>Создавайте структуру обучения, назначайте стоимость и собирайте публикации из визуальных блоков.</p></div>
      <div class="academy-stat-grid"><div><strong>${categories().length}</strong><span>категорий</span></div><div><strong>${courses().length}</strong><span>курсов</span></div><div><strong>${materials().length}</strong><span>материалов</span></div></div>
    </div>
    <div class="academy-quick-actions"><button type="button" data-add-category>+ Категория</button><button type="button" data-add-course>+ Курс</button><button type="button" data-add-material>+ Материал</button><button type="button" data-view-settings>Настройки и реквизиты</button></div>
    ${categories().length ? `<div class="academy-category-admin-grid">${categories().map((entry) => {
      const categoryCourses = courses().filter((item) => item.categoryId === entry.id);
      return `<article class="academy-admin-card"><button type="button" data-open-entity="category:${entry.id}"><span>${entry.published ? 'Опубликована' : 'Черновик'}</span><strong>${escapeHtml(entry.title)}</strong><small>${categoryCourses.length} курс(ов)</small></button><div>${categoryCourses.map((item) => `<button type="button" data-open-entity="course:${item.id}">${escapeHtml(item.title)} <em>${item.accessType === 'paid' ? money(item.priceKopecks) : 'Бесплатно'}</em></button>`).join('') || '<small>Курсов пока нет</small>'}</div></article>`;
    }).join('')}</div>` : '<div class="academy-empty academy-empty-large"><strong>Начните с категории</strong><span>Внутри неё появятся курсы и материалы.</span><button type="button" data-add-category>Создать категорию</button></div>'}`;

  const renderNavigator = () => `
    <aside class="academy-tree">
      <button class="academy-tree-home ${view.type === 'overview' ? 'is-active' : ''}" type="button" data-view-overview>Обзор курсов</button>
      ${categories().map((categoryItem) => `
        <div class="academy-tree-category">
          <button class="${view.type === 'category' && view.id === categoryItem.id ? 'is-active' : ''}" type="button" data-open-entity="category:${categoryItem.id}"><span>${categoryItem.published ? '●' : '○'}</span>${escapeHtml(categoryItem.title)}</button>
          ${courses().filter((courseItem) => courseItem.categoryId === categoryItem.id).map((courseItem) => `
            <div class="academy-tree-course">
              <button class="${view.type === 'course' && view.id === courseItem.id ? 'is-active' : ''}" type="button" data-open-entity="course:${courseItem.id}">${escapeHtml(courseItem.title)}</button>
              ${materials().filter((entry) => entry.courseId === courseItem.id).map((entry) => `<button class="academy-tree-material ${view.type === 'material' && view.id === entry.id ? 'is-active' : ''}" type="button" data-open-entity="material:${entry.id}">↳ ${escapeHtml(entry.title)}</button>`).join('')}
            </div>`).join('')}
        </div>`).join('')}
      <button class="academy-tree-settings ${view.type === 'settings' ? 'is-active' : ''}" type="button" data-view-settings>Настройки и документы</button>
    </aside>`;

  const renderLegalRich = (key, label, note) => `
    <section class="academy-form-section"><div class="academy-section-title"><h3>${label}</h3><span>${note}</span></div>
      ${renderRichToolbar(`setting-${key}`)}<div class="rich-editor legal-rich-editor" contenteditable="true" data-setting-rich="${key}">${sanitizedEditorHtml(data.settings[key] || '')}</div>
    </section>`;

  const renderSettings = () => {
    const s = data.settings;
    const isSelfEmployed = /самозан|нпд/i.test(String(s.sellerStatus || ''));
    const required = [['sellerLegalName', 'Наименование'], ['sellerStatus', 'Статус'], ['inn', 'ИНН'], ['legalAddress', 'Адрес'], ['phone', 'Телефон'], ['email', 'Email']];
    if (!isSelfEmployed) required.splice(3, 0, ['ogrn', 'ОГРН/ОГРНИП']);
    const missing = required.filter(([key]) => !String(s[key] || '').trim()).map(([, label]) => label);
    return `
      <div class="academy-editor-head"><div><span>Настройки школы</span><h2>Реквизиты и документы</h2></div></div>
      <div class="academy-readiness ${missing.length ? 'is-warning' : 'is-ready'}"><strong>${missing.length ? 'До подключения ЮKassa нужно заполнить данные' : 'Основные реквизиты заполнены'}</strong><span>${missing.length ? `Не хватает: ${missing.join(', ')}.` : 'Проверьте тексты документов с юристом перед публикацией.'}</span></div>
      <section class="academy-form-section"><div class="academy-section-title"><h3>Витрина курсов</h3></div><div class="academy-field-grid">
        <label class="academy-field"><span>Надзаголовок</span><input data-setting="eyebrow" value="${escapeHtml(s.eyebrow || '')}" /></label>
        <label class="academy-field"><span>Заголовок</span><input data-setting="title" value="${escapeHtml(s.title || '')}" /></label>
        <label class="academy-field academy-field-wide"><span>Описание</span><textarea data-setting="description">${escapeHtml(s.description || '')}</textarea></label>
      </div></section>
      <section class="academy-form-section"><div class="academy-section-title"><h3>Продавец и контакты</h3><span>Эти данные появятся в подвале и документах</span></div><div class="academy-field-grid">
        <label class="academy-field"><span>Публичное имя</span><input data-setting="sellerName" value="${escapeHtml(s.sellerName || '')}" placeholder="Атмика" /></label>
        <label class="academy-field"><span>ФИО / полное наименование</span><input data-setting="sellerLegalName" value="${escapeHtml(s.sellerLegalName || '')}" /></label>
        <label class="academy-field"><span>Статус продавца</span><input data-setting="sellerStatus" value="${escapeHtml(s.sellerStatus || '')}" placeholder="Самозанятый / ИП / ООО" /></label>
        <label class="academy-field"><span>ИНН</span><input data-setting="inn" value="${escapeHtml(s.inn || '')}" /></label>
        <label class="academy-field"><span>ОГРН / ОГРНИП</span><input data-setting="ogrn" value="${escapeHtml(s.ogrn || '')}" /><small>Для самозанятого без статуса ИП не требуется.</small></label>
        <label class="academy-field academy-field-wide"><span>Юридический адрес</span><input data-setting="legalAddress" value="${escapeHtml(s.legalAddress || '')}" /></label>
        <label class="academy-field academy-field-wide"><span>Почтовый / фактический адрес</span><input data-setting="postalAddress" value="${escapeHtml(s.postalAddress || '')}" /></label>
        <label class="academy-field"><span>Телефон</span><input data-setting="phone" value="${escapeHtml(s.phone || '')}" /></label>
        <label class="academy-field"><span>Email</span><input type="email" data-setting="email" value="${escapeHtml(s.email || '')}" /></label>
        <label class="academy-field"><span>Email поддержки и возвратов</span><input type="email" data-setting="supportEmail" value="${escapeHtml(s.supportEmail || '')}" /></label>
        <label class="academy-field"><span>Код НДС ЮKassa</span><input data-setting="vatCode" value="${escapeHtml(s.vatCode || '1')}" /><small>Код 1 обычно означает «без НДС». Подтвердите значение у бухгалтера.</small></label>
      </div></section>
      <section class="academy-form-section"><div class="academy-section-title"><h3>Оплата и доступ</h3></div><div class="academy-field-grid">
        <label class="academy-field academy-field-wide"><span>Как покупатель получает цифровой доступ</span><textarea data-setting="accessInstructions">${escapeHtml(s.accessInstructions || '')}</textarea></label>
        <label class="academy-field academy-field-wide"><span>Краткие условия возврата</span><textarea data-setting="refundSummary">${escapeHtml(s.refundSummary || '')}</textarea></label>
      </div></section>
      ${renderLegalRich('offerHtml', 'Публичная оферта', 'Если поле пустое, сайт покажет базовый шаблон. Перед запуском нужна юридическая проверка.')}
      ${renderLegalRich('privacyHtml', 'Политика оператора в отношении обработки персональных данных', 'Если поле пустое, сайт покажет приведённую в соответствие редакцию от 18.07.2026.')}
      ${renderLegalRich('consentHtml', 'Согласие на обработку персональных данных', 'Отдельный документ, который пользователь подтверждает независимо от оферты.')}
      ${renderLegalRich('paymentHtml', 'Оплата, доступ и возвраты', 'Дополнительные правила покупки цифровых материалов.')}
      <section class="academy-payment-config"><strong>Интеграция ЮKassa: ${data.paymentConfigured ? 'настроена' : 'ожидает ключи'}</strong><span>${data.paymentConfigured ? `Магазин ${escapeHtml(data.shopId)}` : 'На сервере задайте YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY.'}</span><code>${escapeHtml(data.webhookUrl || '')}</code><small>Этот HTTPS-адрес укажите в ЮKassa для событий payment.succeeded и payment.canceled.</small></section>`;
  };

  const renderAcademy = () => {
    if (isLoading || !data) return '<div class="academy-loading">Загружаю курсы…</div>';
    const item = activeEntity();
    const editor = view.type === 'overview' ? renderOverview()
      : view.type === 'settings' ? renderSettings()
        : view.type === 'category' && item ? renderCategoryEditor(item)
          : view.type === 'course' && item ? renderCourseEditor(item)
            : view.type === 'material' && item ? renderMaterialEditor(item)
              : renderOverview();
    return `<div class="academy-admin-layout">${renderNavigator()}<div class="academy-editor">${editor}</div></div>`;
  };

  const statusLabel = (status) => ({
    pending: 'Ожидает оплаты', waiting_for_capture: 'Ожидает подтверждения', succeeded: 'Оплачен',
    canceled: 'Отменён', refunded: 'Возвращён',
  }[status] || status);

  const renderPayments = () => {
    if (isLoading && !paymentsLoaded) return '<div class="academy-loading">Загружаю платежи…</div>';
    return `<section class="payments-admin"><div class="payments-head"><div><h2>Платежи за курсы и материалы</h2><p>Последние 500 заказов. Статус успешного платежа подтверждается через API ЮKassa.</p></div><button type="button" data-refresh-payments>Обновить</button></div>
      ${payments.length ? `<div class="payments-table-wrap"><table><thead><tr><th>Дата</th><th>Покупатель</th><th>Покупка</th><th>Сумма</th><th>Статус</th><th>ЮKassa</th><th></th></tr></thead><tbody>${payments.map((payment) => `<tr><td>${date(payment.createdAt)}${payment.test ? '<small>Тестовый</small>' : ''}</td><td><strong>${escapeHtml(payment.name || '—')}</strong><small>${escapeHtml(payment.email)}</small></td><td><strong>${escapeHtml(payment.targetTitle)}</strong><small>${payment.targetType === 'course' ? 'Курс' : 'Материал'}</small></td><td>${money(payment.amountKopecks)}</td><td><span class="payment-status is-${escapeHtml(payment.status)}">${escapeHtml(statusLabel(payment.status))}</span>${payment.paidAt ? `<small>${date(payment.paidAt)}</small>` : ''}</td><td><code>${escapeHtml(payment.yookassaId || 'не создан')}</code><small>${escapeHtml(payment.paymentMethod || '')}</small></td><td>${payment.yookassaId ? `<button type="button" data-sync-payment="${payment.id}">Сверить</button>` : ''}</td></tr>`).join('')}</tbody></table></div>` : '<div class="academy-empty academy-empty-large"><strong>Платежей пока нет</strong><span>Заказы появятся здесь после начала оформления.</span></div>'}</section>`;
  };

  const upload = async (file) => {
    if (!file) return null;
    host.notify(`Загружаю ${file.name}…`);
    const response = await fetch(endpoints.upload, {
      method: 'POST', credentials: 'same-origin', body: file,
      headers: { 'Content-Type': file.type || 'application/octet-stream', 'X-File-Name': encodeURIComponent(file.name) },
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Не удалось загрузить файл');
    host.notify('Файл загружен. Не забудьте сохранить изменения.');
    return result;
  };

  const blockById = (id) => activeEntity()?.content?.find((block) => block.id === id);

  const bind = (nextHost = {}) => {
    host = { ...host, ...nextHost };
    document.querySelectorAll('[data-view-overview]').forEach((button) => button.addEventListener('click', () => { view = { type: 'overview', id: '' }; host.rerender(); }));
    document.querySelectorAll('[data-view-settings]').forEach((button) => button.addEventListener('click', () => { view = { type: 'settings', id: '' }; host.rerender(); }));
    document.querySelectorAll('[data-open-entity]').forEach((button) => button.addEventListener('click', () => {
      const [type, id] = button.dataset.openEntity.split(':'); view = { type, id }; host.rerender();
    }));
    document.querySelectorAll('[data-add-category]').forEach((button) => button.addEventListener('click', () => { newCategory(); host.rerender(); }));
    document.querySelectorAll('[data-add-course]').forEach((button) => button.addEventListener('click', () => { if (newCourse(button.dataset.addCourse)) host.rerender(); }));
    document.querySelectorAll('[data-add-material]').forEach((button) => button.addEventListener('click', () => { if (newMaterial(button.dataset.addMaterial)) host.rerender(); }));

    document.querySelectorAll('[data-setting]').forEach((field) => field.addEventListener('input', () => { data.settings[field.dataset.setting] = field.value; }));
    document.querySelectorAll('[data-setting-rich]').forEach((field) => field.addEventListener('input', () => { data.settings[field.dataset.settingRich] = field.innerHTML; }));
    document.querySelectorAll('[data-entity-field]').forEach((field) => field.addEventListener('change', () => {
      const entity = activeEntity(); if (!entity) return;
      entity[field.dataset.entityField] = field.type === 'checkbox' ? field.checked : field.value;
      if (['coverType', 'accessType', 'categoryId', 'courseId'].includes(field.dataset.entityField)) host.rerender();
    }));
    document.querySelectorAll('[data-entity-field]').forEach((field) => field.addEventListener('input', () => {
      const entity = activeEntity(); if (!entity || field.type === 'checkbox') return;
      entity[field.dataset.entityField] = field.value;
    }));
    document.querySelector('[data-price-field]')?.addEventListener('input', (event) => { const entity = activeEntity(); if (entity) entity.priceKopecks = Math.max(0, Math.round(Number(event.currentTarget.value || 0) * 100)); });
    document.querySelector('[data-cover-upload]')?.addEventListener('change', async (event) => {
      try { const result = await upload(event.currentTarget.files[0]); const entity = activeEntity(); if (result && entity) { entity.coverUrl = result.url; entity.coverType = result.type === 'video' ? 'video' : 'image'; host.rerender(); } } catch (error) { host.notify(error.message, true); }
    });
    document.querySelector('[data-delete-entity]')?.addEventListener('click', () => {
      const entity = activeEntity(); if (!entity || !confirm(`Удалить «${entity.title}»? Связанные вложенные материалы тоже будут удалены.`)) return;
      if (view.type === 'category') {
        const courseIds = new Set(courses().filter((item) => item.categoryId === entity.id).map((item) => item.id));
        data.materials = materials().filter((item) => !courseIds.has(item.courseId)); data.courses = courses().filter((item) => item.categoryId !== entity.id); data.categories = categories().filter((item) => item.id !== entity.id);
      } else if (view.type === 'course') { data.materials = materials().filter((item) => item.courseId !== entity.id); data.courses = courses().filter((item) => item.id !== entity.id); }
      else data.materials = materials().filter((item) => item.id !== entity.id);
      view = { type: 'overview', id: '' }; host.rerender();
    });

    document.querySelectorAll('[data-block-add]').forEach((button) => button.addEventListener('click', () => { activeEntity().content.push(defaultBlock(button.dataset.blockAdd)); host.rerender(); }));
    document.querySelectorAll('[data-block-remove]').forEach((button) => button.addEventListener('click', () => { const entity = activeEntity(); entity.content = entity.content.filter((block) => block.id !== button.dataset.blockRemove); host.rerender(); }));
    document.querySelectorAll('[data-block-up], [data-block-down]').forEach((button) => button.addEventListener('click', () => {
      const entity = activeEntity(); const id = button.dataset.blockUp || button.dataset.blockDown; const index = entity.content.findIndex((block) => block.id === id); const target = button.dataset.blockUp ? index - 1 : index + 1;
      if (index >= 0 && target >= 0 && target < entity.content.length) [entity.content[index], entity.content[target]] = [entity.content[target], entity.content[index]];
      host.rerender();
    }));
    document.querySelectorAll('[data-block-rich]').forEach((field) => field.addEventListener('input', () => { const block = blockById(field.dataset.blockRich); if (block) block.data.html = field.innerHTML; }));
    document.querySelectorAll('[data-rich-command]').forEach((button) => button.addEventListener('mousedown', (event) => {
      event.preventDefault(); const command = button.dataset.richCommand; let value = button.dataset.richValue || null;
      if (command === 'createLink') { value = prompt('Адрес ссылки', 'https://'); if (!value) return; }
      document.execCommand(command, false, value); const toolbar = button.closest('[data-rich-toolbar]'); const id = toolbar?.dataset.richToolbar;
      const editor = id?.startsWith('setting-') ? document.querySelector(`[data-setting-rich="${id.slice(8)}"]`) : document.querySelector(`[data-block-rich="${id}"]`);
      editor?.dispatchEvent(new Event('input', { bubbles: true })); editor?.focus();
    }));
    document.querySelectorAll('[data-block-field]').forEach((field) => {
      const update = () => { const [id, key] = field.dataset.blockField.split(':'); const block = blockById(id); if (block) block.data[key] = field.type === 'checkbox' ? field.checked : field.value; };
      field.addEventListener('input', update); field.addEventListener('change', update);
    });
    document.querySelectorAll('[data-block-upload]').forEach((field) => field.addEventListener('change', async () => {
      try { const result = await upload(field.files[0]); const [id, key] = field.dataset.blockUpload.split(':'); const block = blockById(id); if (result && block) { block.data[key] = result.url; host.rerender(); } } catch (error) { host.notify(error.message, true); }
    }));
    document.querySelectorAll('[data-carousel-add]').forEach((button) => button.addEventListener('click', () => { const block = blockById(button.dataset.carouselAdd); block.data.items ||= []; block.data.items.push({ type: 'image', url: '', caption: '' }); host.rerender(); }));
    document.querySelectorAll('[data-carousel-remove]').forEach((button) => button.addEventListener('click', () => { const [id, index] = button.dataset.carouselRemove.split(':'); blockById(id).data.items.splice(Number(index), 1); host.rerender(); }));
    document.querySelectorAll('[data-carousel-field]').forEach((field) => {
      const update = () => { const [id, index, key] = field.dataset.carouselField.split(':'); blockById(id).data.items[Number(index)][key] = field.value; };
      field.addEventListener('input', update); field.addEventListener('change', update);
    });
    document.querySelectorAll('[data-carousel-upload]').forEach((field) => field.addEventListener('change', async () => {
      try { const result = await upload(field.files[0]); const [id, index] = field.dataset.carouselUpload.split(':'); const item = blockById(id).data.items[Number(index)]; item.url = result.url; item.type = result.type === 'video' ? 'video' : 'image'; host.rerender(); } catch (error) { host.notify(error.message, true); }
    }));

    document.querySelector('[data-refresh-payments]')?.addEventListener('click', () => loadPayments(true));
    document.querySelectorAll('[data-sync-payment]').forEach((button) => button.addEventListener('click', async () => {
      try { host.notify('Сверяю платёж с ЮKassa…'); await requestJson(endpoints.paymentSync, { method: 'POST', body: JSON.stringify({ id: button.dataset.syncPayment }) }); await loadPayments(true); host.notify('Статус платежа обновлён.'); } catch (error) { host.notify(error.message, true); }
    }));
  };

  const load = async (force = false) => {
    if (isLoading || (data && !force)) return;
    isLoading = true; host.rerender();
    try { data = await requestJson(endpoints.academy); host.notify('Курсы загружены.'); }
    catch (error) { host.notify(error.message, true); }
    finally { isLoading = false; host.rerender(); }
  };

  const loadPayments = async (force = false) => {
    if (isLoading || (paymentsLoaded && !force)) return;
    isLoading = true; host.rerender();
    try { const result = await requestJson(endpoints.payments); payments = result.payments || []; paymentsLoaded = true; }
    catch (error) { host.notify(error.message, true); }
    finally { isLoading = false; host.rerender(); }
  };

  const save = async () => {
    if (!data || isSaving) return;
    isSaving = true; host.notify('Сохраняю курсы…');
    try {
      const result = await requestJson(endpoints.academy, { method: 'POST', body: JSON.stringify(data) });
      data = { ...data, settings: result.settings, categories: result.categories, courses: result.courses, materials: result.materials };
      host.notify('Курсы и настройки опубликованы.'); host.rerender();
    } catch (error) { host.notify(error.message, true); }
    finally { isSaving = false; }
  };

  window.AtmikaAcademyAdmin = {
    bind,
    load,
    loadPayments,
    save,
    render: renderAcademy,
    renderPayments,
    get loaded() { return Boolean(data); },
    get paymentsLoaded() { return paymentsLoaded; },
  };
})();
