const services = [
  {
    icon: 'sparkles',
    title: 'Осознанный выход из Матрицы',
    tag: 'Основная программа',
    price: 'от 300 000 ₽',
    text: 'Глубокий маршрут для тех, кто хочет перестать жить из автоматических сценариев, вернуть контакт с истинным Я и собрать новую опору внутри себя.',
  },
  {
    icon: 'star',
    title: 'Квантовая чистка поля души',
    tag: 'Индивидуальная сессия',
    price: '50 000 ₽',
    text: 'Работа с первопричинами, внутренними блоками, повторяющимися событиями и тем, что ощущается как энергетическая тяжесть.',
  },
  {
    icon: 'heart-pulse',
    title: 'Квантовый хирург',
    tag: 'Программа',
    price: '150 000 ₽',
    text: 'Практики внимания к телу, сознанию и внутренним программам для тех, кто хочет мягко перестроить контакт с собой.',
  },
  {
    icon: 'waves',
    title: 'Квантовое омоложение тела',
    tag: 'Программа',
    price: '150 000 ₽',
    text: 'Работа с восприятием тела, состоянием, жизненной энергией и внутренними настройками молодости.',
  },
  {
    icon: 'circle-check',
    title: 'Квантовое самоисцеление',
    tag: 'Программа',
    price: '150 000 ₽',
    text: 'Практический путь к большему равновесию, спокойствию и способности слышать собственное тело.',
  },
  {
    icon: 'flame',
    title: 'Офлайн-практики и ретриты',
    tag: 'Греция и выездные форматы',
    price: 'от 70 €',
    text: 'Древняя чистка огнем, звуковая терапия, индивидуальные и групповые форматы, трансформационные ретриты.',
  },
];

const audience = [
  'Вы чувствуете, что привычная картина мира больше не объясняет ваш опыт.',
  'Приходят яркие сны, мистические переживания, тонкие ощущения или сильные внутренние вопросы.',
  'Есть желание выйти из повторяющихся сценариев, тревоги, зависимости от внешней оценки.',
  'Хочется научиться управлять состоянием, телом и жизнью через осознанность.',
];

const outcomes = [
  'больше внутреннего равновесия и ясности',
  'ощущение контакта с истинным Я',
  'разбор повторяющихся жизненных сценариев',
  'мягкая работа с телом и энергией',
  'новый взгляд на отношения, деньги, цели и выбор',
  'практики для самостоятельного исследования себя',
];

const process = [
  ['Диагностика запроса', 'Смотрим, что именно болит в жизни: ситуация, тело, отношения, страх, потеря опоры или ощущение застревания.'],
  ['Поиск первопричины', 'Работа идет не только с поверхностным симптомом, а с тем, что стоит под ним: убеждениями, программами и энергетическим следом.'],
  ['Квантовая практика', 'Через проводничество, медитативное состояние, внимание к телу и полю вы проходите трансформационный опыт.'],
  ['Интеграция', 'После сессии важны наблюдение, бережные действия и возвращение в повседневность уже из нового состояния.'],
];

const socialLinks = [
  ['instagram', 'Instagram', 'https://www.instagram.com/provodnik_iz_ada?igsh=cGI1M2FhNzVqdnAw'],
  ['play', 'TikTok', 'https://www.tiktok.com/@provodnik_iz_matrix?_r=1&_t=ZG-97Lcrxl5vIu'],
  ['youtube', 'YouTube', 'https://youtube.com/@atmika_consciousness?si=s7oHtk21mwiodvL0'],
];

document.querySelector('#app').innerHTML = `
  <header class="site-header" data-header>
    <a class="brand" href="#top" aria-label="Атмика">
      <span class="brand-mark">A</span>
      <span>
        <strong>АТМИКА</strong>
        <small>проводник сознания</small>
      </span>
    </a>
    <nav class="desktop-nav" aria-label="Основная навигация">
      <a href="#work">Форматы</a>
      <a href="#for-whom">Кому подходит</a>
      <a href="#story">История</a>
      <a href="#contact">Контакты</a>
    </nav>
    <a class="header-cta" href="#contact">
      <i data-lucide="calendar-days"></i>
      <span>Записаться</span>
    </a>
    <button class="menu-toggle" type="button" aria-label="Открыть меню" aria-expanded="false" data-menu-toggle>
      <i data-lucide="menu"></i>
    </button>
  </header>

  <div class="mobile-panel" data-mobile-panel>
    <button class="panel-close" type="button" aria-label="Закрыть меню" data-panel-close>
      <i data-lucide="x"></i>
    </button>
    <a href="#work">Форматы</a>
    <a href="#for-whom">Кому подходит</a>
    <a href="#story">История</a>
    <a href="#contact">Контакты</a>
  </div>

  <main id="top">
    <section class="hero">
      <div class="hero-bg" aria-hidden="true"></div>
      <div class="hero-content">
        <div class="eyebrow">Духовный и квантовый коуч</div>
        <h1>Осознанный выход из Матрицы</h1>
        <p>
          Атмика помогает душам всех возрастов проснуться от глубокого сна, вернуть контакт с истинным сознанием и через практики самоисследования выйти из иллюзорных сценариев жизни.
        </p>
        <div class="hero-actions">
          <a class="button primary" href="#contact">
            <span>Записаться на консультацию</span>
            <i data-lucide="arrow-right"></i>
          </a>
          <a class="button ghost" href="#work">
            <span>Посмотреть форматы</span>
          </a>
        </div>
      </div>
      <div class="hero-panel" aria-label="Ключевые направления">
        <span>Квантовые сессии</span>
        <span>Практики сознания</span>
        <span>Работа с телом</span>
        <span>Ретриты и звук</span>
      </div>
    </section>

    <section class="intro section-band">
      <div class="section-heading">
        <span class="kicker">Новый сайт Атмики</span>
        <h2>Мягкая, глубокая и честная упаковка опыта</h2>
      </div>
      <div class="intro-copy">
        <p>
          Здесь нет обещания “волшебной кнопки”. Есть проводник, личный мистический опыт, семь лет практики, работа с сознанием, телом, энергией и ситуациями, которые человек уже готов увидеть глубже.
        </p>
        <p>
          Основная идея проекта: человек может выйти из автоматических программ, перестать отдавать управление страху и начать проживать реальность из гармонии, ясности и внутреннего присутствия.
        </p>
      </div>
    </section>

    <section class="services" id="work">
      <div class="section-heading services-heading">
        <span class="kicker">Форматы работы</span>
        <h2>От первой сессии до глубокой программы</h2>
      </div>
      <div class="service-grid">
        ${services.map((service) => `
          <article class="service-card">
            <div class="service-topline">
              <span class="icon-box"><i data-lucide="${service.icon}"></i></span>
              <span>${service.tag}</span>
            </div>
            <h3>${service.title}</h3>
            <p>${service.text}</p>
            <div class="price">${service.price}</div>
          </article>
        `).join('')}
      </div>
    </section>

    <section class="split section-band" id="for-whom">
      <div>
        <span class="kicker">Кому подходит</span>
        <h2>Для тех, кто уже чувствует: прежний режим больше не работает</h2>
        <p>
          Чаще всего приходят с вопросом: “Что мешает мне двигаться в жизни или достичь желаемого?”. В работе мы ищем не только внешнее препятствие, а внутренний источник напряжения.
        </p>
      </div>
      <div class="check-list">
        ${audience.map((item) => `
          <div class="check-item">
            <i data-lucide="circle-check"></i>
            <span>${item}</span>
          </div>
        `).join('')}
      </div>
    </section>

    <section class="outcomes" id="outcomes">
      <div class="section-heading section-heading-centered">
        <span class="kicker">Что может измениться</span>
        <h2>Результат начинается с состояния</h2>
      </div>
      <div class="outcome-list">
        ${outcomes.map((item, index) => `
          <div class="outcome-item">
            <span class="outcome-number">${String(index + 1).padStart(2, '0')}</span>
            <span>${item}</span>
          </div>
        `).join('')}
      </div>
    </section>

    <section class="process section-band" id="process">
      <div class="section-heading section-heading-stack process-heading">
        <span class="kicker">Как проходит работа</span>
        <h2>Структура, в которой есть место мистическому опыту</h2>
      </div>
      <div class="timeline">
        ${process.map(([title, text], index) => `
          <article class="timeline-item">
            <span>${String(index + 1).padStart(2, '0')}</span>
            <h3>${title}</h3>
            <p>${text}</p>
          </article>
        `).join('')}
      </div>
    </section>

    <section class="story" id="story">
      <div class="story-card">
        <span class="kicker">Личная история</span>
        <h2>От первых мистических переживаний к проводничеству</h2>
        <p>
          Путь Атмики начался с раннего опыта тонкого восприятия: вещих снов, астральных переживаний, контакта с невидимым и вопросов, на которые обычная логика не отвечала. Позже были обучение ясновидению, самостоятельные практики, раскрытие способностей и собственные методы работы через квантовое поле.
        </p>
        <p>
          Сегодня этот опыт собран в практические форматы: очищение поля, работа с телом через сознание, изменение внутренних программ, самоисследование и сопровождение тех, кто готов идти глубже.
        </p>
      </div>
      <div class="quote-card">
        <p>“Я помогаю душам всех возрастов достичь пробуждения истинного сознания и через практики выйти из иллюзорной матрицы.”</p>
      </div>
    </section>

    <section class="contact" id="contact">
      <div class="contact-inner">
        <div>
          <span class="kicker">Первый шаг</span>
          <h2>Начните с короткой консультации</h2>
          <p>
            15 минут, чтобы обозначить запрос, почувствовать контакт и понять, какой формат сейчас подходит: сессия, программа, офлайн-практика или ретрит.
          </p>
          <div class="contact-actions">
            <a class="button primary" href="https://wa.clck.bar/306974364351" target="_blank" rel="noreferrer">
              <i data-lucide="message-circle"></i>
              <span>Написать в WhatsApp</span>
            </a>
            <a class="button ghost light" href="mailto:magicscar8@gmail.com">magicscar8@gmail.com</a>
          </div>
        </div>
        <div class="social-card">
          <h3>Социальные сети</h3>
          ${socialLinks.map(([icon, label, href]) => `
            <a href="${href}" target="_blank" rel="noreferrer">
              <i data-lucide="${icon}"></i>
              <span>${label}</span>
            </a>
          `).join('')}
          <small>Практики не заменяют медицинскую, психотерапевтическую или юридическую помощь.</small>
        </div>
      </div>
    </section>
  </main>
`;

const iconPaths = {
  'arrow-right': '<path d="M5 12h14"></path><path d="m13 6 6 6-6 6"></path>',
  'calendar-days': '<path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path><path d="M8 14h.01"></path><path d="M12 14h.01"></path><path d="M16 14h.01"></path><path d="M8 18h.01"></path><path d="M12 18h.01"></path><path d="M16 18h.01"></path>',
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
