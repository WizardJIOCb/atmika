const api = {
  session: '/api/admin/session',
  login: '/api/admin/login',
  logout: '/api/admin/logout',
  content: '/api/admin/content',
};

const sections = [
  ['meta', 'SEO'],
  ['brand', 'Бренд'],
  ['navigation', 'Меню'],
  ['header', 'Шапка'],
  ['hero', 'Первый экран'],
  ['intro', 'Новый сайт'],
  ['servicesSection', 'Заголовок форматов'],
  ['services', 'Форматы работы'],
  ['gallery', 'Галерея'],
  ['audience', 'Кому подходит'],
  ['outcomes', 'Результаты'],
  ['process', 'Процесс'],
  ['story', 'История'],
  ['contact', 'Контакты'],
];

const labels = {
  ariaLabel: 'ARIA подпись',
  ctaHref: 'Ссылка кнопки',
  ctaLabel: 'Текст кнопки',
  closeMenuLabel: 'Подпись закрытия меню',
  description: 'Описание',
  disclaimer: 'Дисклеймер',
  dotLabel: 'Подпись точки',
  dotsLabel: 'Подпись списка точек',
  eyebrow: 'Надзаголовок',
  favicon: 'Favicon',
  href: 'Ссылка',
  icon: 'Иконка',
  items: 'Элементы',
  kicker: 'Метка',
  label: 'Название',
  mark: 'Знак',
  name: 'Название',
  nextLabel: 'Следующий слайд',
  ogDescription: 'OG описание',
  ogImage: 'OG картинка',
  ogTitle: 'OG заголовок',
  ogUrl: 'OG URL',
  openMenuLabel: 'Подпись открытия меню',
  panel: 'Плашки',
  panelAriaLabel: 'ARIA подпись плашек',
  paragraphs: 'Абзацы',
  prevLabel: 'Предыдущий слайд',
  price: 'Цена',
  primaryHref: 'Ссылка главной кнопки',
  primaryLabel: 'Текст главной кнопки',
  quote: 'Цитата',
  secondaryHref: 'Ссылка второй кнопки',
  secondaryLabel: 'Текст второй кнопки',
  socialLinks: 'Соцсети',
  socialTitle: 'Заголовок соцсетей',
  src: 'Файл',
  subtitle: 'Подзаголовок',
  tag: 'Тип/метка',
  text: 'Текст',
  title: 'Заголовок',
  type: 'Тип',
};

let content = null;
let activeSection = 'hero';
let isSaving = false;

const root = document.querySelector('#admin');

const clone = (value) => JSON.parse(JSON.stringify(value));

const getByPath = (path) => path.reduce((acc, key) => acc?.[key], content);

const setByPath = (path, value) => {
  const last = path.at(-1);
  const parent = path.slice(0, -1).reduce((acc, key) => acc[key], content);
  parent[last] = value;
};

const sectionLabel = (key) => sections.find(([sectionKey]) => sectionKey === key)?.[1] || key;
const fieldLabel = (key) => labels[key] || key;

const isLongField = (key, value) => (
  ['description', 'disclaimer', 'ogDescription', 'quote', 'text'].includes(key)
  || String(value || '').length > 76
);

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Ошибка запроса');
  }

  return data;
};

const notify = (message, isError = false) => {
  const status = document.querySelector('[data-status]');

  if (!status) {
    return;
  }

  status.textContent = message;
  status.classList.toggle('is-error', isError);
};

const renderLogin = (message = '') => {
  root.innerHTML = `
    <div class="login-wrap">
      <form class="login-card" data-login-form>
        <div>
          <h1>Админка Атмики</h1>
          <p class="status">Введите пароль, чтобы редактировать контент сайта.</p>
        </div>
        ${message ? `<div class="notice is-error">${message}</div>` : ''}
        <div class="field">
          <label for="password">Пароль</label>
          <input id="password" name="password" type="password" autocomplete="current-password" required />
        </div>
        <button type="submit">Войти</button>
      </form>
    </div>
  `;

  root.querySelector('[data-login-form]').addEventListener('submit', async (event) => {
    event.preventDefault();
    const password = new FormData(event.currentTarget).get('password');

    try {
      await requestJson(api.login, {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      await loadContent();
    } catch (error) {
      renderLogin(error.message);
    }
  });
};

const defaultItemFor = (path, array) => {
  if (array.length > 0) {
    const last = clone(array.at(-1));

    if (typeof last === 'string') {
      return 'Новый пункт';
    }

    if (last && typeof last === 'object') {
      Object.keys(last).forEach((key) => {
        if (typeof last[key] === 'string') {
          last[key] = key === 'type' ? last[key] : '';
        }
      });
      return last;
    }
  }

  const joined = path.join('.');

  if (joined.includes('gallery.items')) {
    return { type: 'image', src: 'public/gallery/file.jpg', title: 'Новый слайд', tag: 'Фото' };
  }

  if (joined.includes('services')) {
    return { icon: 'sparkles', title: 'Новый формат', tag: 'Формат', price: '', text: '' };
  }

  if (joined.includes('socialLinks')) {
    return { icon: 'instagram', label: 'Соцсеть', href: 'https://' };
  }

  if (joined.includes('process.items')) {
    return { title: 'Новый этап', text: '' };
  }

  return 'Новый пункт';
};

const renderPrimitiveField = (path, key, value) => {
  const inputId = `field-${path.join('-')}`;
  const safeValue = String(value ?? '');
  const isType = key === 'type' && path.join('.').includes('gallery.items');

  if (isType) {
    return `
      <div class="field">
        <label for="${inputId}">${fieldLabel(key)}</label>
        <select id="${inputId}" data-path="${path.join('.')}">
          <option value="image" ${safeValue === 'image' ? 'selected' : ''}>image</option>
          <option value="video" ${safeValue === 'video' ? 'selected' : ''}>video</option>
        </select>
      </div>
    `;
  }

  if (isLongField(key, safeValue)) {
    return `
      <div class="field">
        <label for="${inputId}">${fieldLabel(key)}</label>
        <textarea id="${inputId}" data-path="${path.join('.')}">${safeValue}</textarea>
      </div>
    `;
  }

  return `
    <div class="field">
      <label for="${inputId}">${fieldLabel(key)}</label>
      <input id="${inputId}" data-path="${path.join('.')}" value="${safeValue.replaceAll('"', '&quot;')}" />
    </div>
  `;
};

const renderValue = (path, value, key = path.at(-1)) => {
  if (Array.isArray(value)) {
    return `
      <div class="array" data-array="${path.join('.')}">
        <div class="array-header">
          <div class="array-title">${fieldLabel(key)}</div>
          <button type="button" data-add="${path.join('.')}">Добавить</button>
        </div>
        ${value.map((item, index) => `
          <div class="array-item">
            <div class="item-actions">
              <button type="button" data-up="${path.join('.')}" data-index="${index}">Выше</button>
              <button type="button" data-down="${path.join('.')}" data-index="${index}">Ниже</button>
              <button type="button" class="danger" data-remove="${path.join('.')}" data-index="${index}">Удалить</button>
            </div>
            ${renderValue([...path, index], item, `${fieldLabel(key)} ${index + 1}`)}
          </div>
        `).join('')}
      </div>
    `;
  }

  if (value && typeof value === 'object') {
    return `
      <div class="group">
        <div class="group-title">${fieldLabel(key)}</div>
        <div class="field-grid">
          ${Object.entries(value).map(([childKey, childValue]) => renderValue([...path, childKey], childValue, childKey)).join('')}
        </div>
      </div>
    `;
  }

  return renderPrimitiveField(path, key, value);
};

const bindEditorEvents = () => {
  root.querySelectorAll('[data-path]').forEach((field) => {
    field.addEventListener('input', (event) => {
      setByPath(event.currentTarget.dataset.path.split('.'), event.currentTarget.value);
    });
  });

  root.querySelectorAll('[data-add]').forEach((button) => {
    button.addEventListener('click', () => {
      const path = button.dataset.add.split('.');
      const array = getByPath(path);
      array.push(defaultItemFor(path, array));
      renderApp();
    });
  });

  root.querySelectorAll('[data-remove]').forEach((button) => {
    button.addEventListener('click', () => {
      const array = getByPath(button.dataset.remove.split('.'));
      array.splice(Number(button.dataset.index), 1);
      renderApp();
    });
  });

  root.querySelectorAll('[data-up], [data-down]').forEach((button) => {
    button.addEventListener('click', () => {
      const path = (button.dataset.up || button.dataset.down).split('.');
      const array = getByPath(path);
      const index = Number(button.dataset.index);
      const target = button.dataset.up ? index - 1 : index + 1;

      if (target < 0 || target >= array.length) {
        return;
      }

      [array[index], array[target]] = [array[target], array[index]];
      renderApp();
    });
  });
};

const saveContent = async () => {
  if (isSaving) {
    return;
  }

  isSaving = true;
  notify('Сохраняю...');

  try {
    await requestJson(api.content, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
    notify('Сохранено. Публичный сайт обновлён.');
  } catch (error) {
    notify(error.message, true);
  } finally {
    isSaving = false;
  }
};

const logout = async () => {
  await requestJson(api.logout, { method: 'POST', body: '{}' }).catch(() => {});
  content = null;
  renderLogin();
};

const renderApp = () => {
  const currentValue = content[activeSection];

  root.innerHTML = `
    <div class="admin-shell">
      <aside class="admin-sidebar">
        <div class="admin-brand">
          <strong>АТМИКА</strong>
          <span>Управление контентом</span>
        </div>
        <nav class="section-tabs">
          ${sections.map(([key, label]) => `
            <button type="button" class="${key === activeSection ? 'is-active' : ''}" data-section="${key}">${label}</button>
          `).join('')}
        </nav>
        <div class="status" data-status>Готово к редактированию.</div>
      </aside>
      <main class="admin-main">
        <div class="admin-toolbar">
          <div>
            <h1>${sectionLabel(activeSection)}</h1>
            <p class="status">Изменения сохраняются в content.json и сразу попадают на сайт.</p>
          </div>
          <div class="action-row">
            <button type="button" onclick="window.open('/', '_blank')">Открыть сайт</button>
            <button type="button" class="primary" data-save>Сохранить</button>
            <button type="button" class="danger" data-logout>Выйти</button>
          </div>
        </div>
        <section class="editor-panel">
          <h2>${sectionLabel(activeSection)}</h2>
          ${renderValue([activeSection], currentValue, activeSection)}
        </section>
      </main>
    </div>
  `;

  root.querySelectorAll('[data-section]').forEach((button) => {
    button.addEventListener('click', () => {
      activeSection = button.dataset.section;
      renderApp();
    });
  });

  root.querySelector('[data-save]').addEventListener('click', saveContent);
  root.querySelector('[data-logout]').addEventListener('click', logout);
  bindEditorEvents();
};

const loadContent = async () => {
  const data = await requestJson(api.content);
  content = data.content;
  renderApp();
};

const boot = async () => {
  try {
    const session = await requestJson(api.session);

    if (session.authenticated) {
      await loadContent();
    } else {
      renderLogin();
    }
  } catch (error) {
    renderLogin(error.message);
  }
};

boot();
