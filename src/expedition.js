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

const safeLink = (value) => {
  const url = text(value).trim();
  return /^(https?:|mailto:|tel:)/i.test(url) ? attr(url) : '#';
};

const RABBIT_VARIANT_STORAGE_KEY = 'atmika_rabbit_variant';
const DEFAULT_RABBIT_VARIANT = 17;
const ATMIKA_RABBIT_VARIANTS = [
  {
    label: 'Исходный',
    webp: 'public/images/atmika-rabbit-mascot.webp',
    png: 'public/images/atmika-rabbit-mascot.png',
  },
  {
    label: 'Космический проводник',
    webp: 'public/images/atmika-rabbit-variant-02.webp',
    png: 'public/images/atmika-rabbit-variant-02.png',
  },
  {
    label: 'Квантовый гид',
    webp: 'public/images/atmika-rabbit-variant-03.webp',
    png: 'public/images/atmika-rabbit-variant-03.png',
  },
  {
    label: 'Дзен-целитель',
    webp: 'public/images/atmika-rabbit-variant-04.webp',
    png: 'public/images/atmika-rabbit-variant-04.png',
  },
  {
    label: 'Игривый проводник',
    webp: 'public/images/atmika-rabbit-variant-05.webp',
    png: 'public/images/atmika-rabbit-variant-05.png',
  },
  {
    label: 'Кристальная аура',
    webp: 'public/images/atmika-rabbit-variant-06.webp',
    png: 'public/images/atmika-rabbit-variant-06.png',
  },
  {
    label: 'Лунный проводник',
    webp: 'public/images/atmika-rabbit-variant-07.webp',
    png: 'public/images/atmika-rabbit-variant-07.png',
  },
  {
    label: 'Световой гид',
    webp: 'public/images/atmika-rabbit-variant-08.webp',
    png: 'public/images/atmika-rabbit-variant-08.png',
  },
  {
    label: 'Подмигивающий',
    webp: 'public/images/atmika-rabbit-variant-09.webp',
    png: 'public/images/atmika-rabbit-variant-09.png',
  },
  {
    label: 'Космический лис',
    webp: 'public/images/atmika-rabbit-variant-10.webp',
    png: 'public/images/atmika-rabbit-variant-10.png',
  },
  {
    label: 'Кот-медитатор',
    webp: 'public/images/atmika-rabbit-variant-11.webp',
    png: 'public/images/atmika-rabbit-variant-11.png',
  },
  {
    label: 'Сова-оракул',
    webp: 'public/images/atmika-rabbit-variant-12.webp',
    png: 'public/images/atmika-rabbit-variant-12.png',
  },
  {
    label: 'Грибной шаман',
    webp: 'public/images/atmika-rabbit-variant-13.webp',
    png: 'public/images/atmika-rabbit-variant-13.png',
  },
  {
    label: 'Робот-гуру',
    webp: 'public/images/atmika-rabbit-variant-14.webp',
    png: 'public/images/atmika-rabbit-variant-14.png',
  },
  {
    label: 'Аксолотль-целитель',
    webp: 'public/images/atmika-rabbit-variant-15.webp',
    png: 'public/images/atmika-rabbit-variant-15.png',
  },
  {
    label: 'Лунная медуза',
    webp: 'public/images/atmika-rabbit-variant-16.webp',
    png: 'public/images/atmika-rabbit-variant-16.png',
  },
  {
    label: 'Облачный мудрец',
    webp: 'public/images/atmika-rabbit-variant-17.webp',
    png: 'public/images/atmika-rabbit-variant-17.png',
  },
  {
    label: 'Кристальная звезда',
    webp: 'public/images/atmika-rabbit-variant-18.webp',
    png: 'public/images/atmika-rabbit-variant-18.png',
  },
];

const renderInlineMarkdown = (value) => html(value)
  .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|mailto:[^)\s]+|tel:[^)\s]+)\)/g, (_, label, href) => (
    `<a href="${safeLink(href)}" target="_blank" rel="noopener noreferrer">${label}</a>`
  ))
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/__([^_]+)__/g, '<strong>$1</strong>')
  .replace(/~~([^~]+)~~/g, '<del>$1</del>')
  .replace(/(^|[^\*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
  .replace(/(^|[^_])_([^_\n]+)_/g, '$1<em>$2</em>');

const isTableDivider = (line) => (
  /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line)
);

const isTableRow = (line) => (
  line.includes('|') && !isTableDivider(line)
);

const splitTableRow = (line) => line
  .trim()
  .replace(/^\|/, '')
  .replace(/\|$/, '')
  .split('|')
  .map((cell) => cell.trim());

const renderTable = (rows) => {
  const [head, ...body] = rows.map(splitTableRow);
  const width = Math.max(head.length, ...body.map((row) => row.length));
  const pad = (row) => Array.from({ length: width }, (_, index) => row[index] || '');

  return `
    <div class="atmika-chat-table-wrap">
      <table>
        <thead>
          <tr>${pad(head).map((cell) => `<th>${renderInlineMarkdown(cell)}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${body.map((row) => `<tr>${pad(row).map((cell) => `<td>${renderInlineMarkdown(cell)}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
};

const renderListItem = (lines) => {
  const paragraphs = [];
  let current = [];

  lines.forEach((line) => {
    if (!line.trim()) {
      if (current.length) {
        paragraphs.push(current);
        current = [];
      }
      return;
    }

    current.push(line.trim());
  });

  if (current.length) {
    paragraphs.push(current);
  }

  if (!paragraphs.length) {
    return '';
  }

  const [first, ...rest] = paragraphs;
  return [
    renderInlineMarkdown(first.join(' ')),
    ...rest.map((paragraph) => `<p>${paragraph.map(renderInlineMarkdown).join('<br>')}</p>`),
  ].join('');
};

const renderMarkdown = (value) => {
  const lines = text(value).replace(/\r\n?/g, '\n').split('\n');
  const blocks = [];
  let paragraph = [];
  let codeFence = null;
  let index = 0;

  const flushParagraph = () => {
    if (!paragraph.length) {
      return;
    }

    blocks.push(`<p>${paragraph.map(renderInlineMarkdown).join('<br>')}</p>`);
    paragraph = [];
  };

  const listMarker = (line) => {
    const unordered = line.match(/^\s*[-*]\s+(.+)$/);
    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    return unordered
      ? { type: 'ul', text: unordered[1] }
      : ordered
        ? { type: 'ol', text: ordered[1] }
        : null;
  };

  while (index < lines.length) {
    const line = lines[index];
    const fence = line.match(/^\s*```/);

    if (fence) {
      if (codeFence) {
        blocks.push(`<pre><code>${html(codeFence.join('\n'))}</code></pre>`);
        codeFence = null;
      } else {
        flushParagraph();
        codeFence = [];
      }

      index += 1;
      continue;
    }

    if (codeFence) {
      codeFence.push(line);
      index += 1;
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      index += 1;
      continue;
    }

    if (isTableRow(line) && isTableDivider(lines[index + 1] || '')) {
      flushParagraph();
      const rows = [line];
      index += 2;

      while (index < lines.length && isTableRow(lines[index])) {
        rows.push(lines[index]);
        index += 1;
      }

      blocks.push(renderTable(rows));
      continue;
    }

    const heading = line.match(/^\s{0,3}#{1,4}\s+(.+)$/);
    const quote = line.match(/^\s*>\s+(.+)$/);
    const marker = listMarker(line);

    if (heading) {
      flushParagraph();
      blocks.push(`<h3>${renderInlineMarkdown(heading[1])}</h3>`);
      index += 1;
      continue;
    }

    if (quote) {
      flushParagraph();
      blocks.push(`<blockquote>${renderInlineMarkdown(quote[1])}</blockquote>`);
      index += 1;
      continue;
    }

    if (marker) {
      flushParagraph();
      const items = [];
      const type = marker.type;

      while (index < lines.length) {
        const currentMarker = listMarker(lines[index]);

        if (!currentMarker || currentMarker.type !== type) {
          break;
        }

        index += 1;
        const itemLines = [currentMarker.text];

        while (index < lines.length) {
          const nextMarker = listMarker(lines[index]);
          const nextLine = lines[index];
          const startsNewBlock = (
            /^\s{0,3}#{1,4}\s+/.test(nextLine)
            || /^\s*>\s+/.test(nextLine)
            || /^\s*```/.test(nextLine)
            || (isTableRow(nextLine) && isTableDivider(lines[index + 1] || ''))
          );

          if (nextMarker?.type === type) {
            break;
          }

          if (startsNewBlock) {
            break;
          }

          if (!nextLine.trim()) {
            const followingMarker = listMarker(lines[index + 1] || '');
            if (followingMarker?.type === type) {
              index += 1;
              break;
            }
          }

          itemLines.push(nextLine);
          index += 1;
        }

        items.push(itemLines);
      }

      blocks.push(`<${type}>${items.map((item) => `<li>${renderListItem(item)}</li>`).join('')}</${type}>`);
      continue;
    }

    paragraph.push(line);
    index += 1;
  }

  flushParagraph();

  if (codeFence) {
    blocks.push(`<pre><code>${html(codeFence.join('\n'))}</code></pre>`);
  }

  return blocks.join('');
};

const app = document.querySelector('#expedition-app');
const nav = content.navigation || [];
const services = content.services || [];
const gallery = content.gallery?.items || [];
const audience = content.audience?.items || [];
const outcomes = content.outcomes?.items || [];
const process = content.process?.items || [];
const heroMedia = gallery.find((item) => item.type === 'video') || gallery[0];
const bottomGallery = [
  {
    fileName: 'state-visible-01.mp4',
    title: 'Дыхание поля',
  },
  {
    fileName: 'state-visible-02.mp4',
    title: 'Тишина внутри движения',
    className: 'gallery-slide-fill-height',
  },
  {
    fileName: 'state-visible-03.mp4',
    title: 'Световой переход',
  },
  {
    fileName: 'state-visible-04.mp4',
    title: 'Встреча с состоянием',
  },
  {
    fileName: 'state-visible-05.mp4',
    title: 'Пульс присутствия',
  },
  {
    fileName: 'state-visible-06.mp4',
    title: 'Мягкая настройка',
  },
  {
    fileName: 'state-visible-07.mp4',
    title: 'Маршрут к ясности',
  },
].map((item) => ({
  type: 'video',
  src: `public/gallery/compressed/${item.fileName}`,
  title: item.title,
  tag: 'Ритм',
  className: item.className || '',
}));

const mediaMarkup = (item, className = '') => {
  if (!item) {
    return '';
  }

  if (item.type === 'video') {
    return `<video class="${attr(className)}" src="${attr(item.src)}" muted loop playsinline autoplay preload="auto"></video>`;
  }

  return `<img class="${attr(className)}" src="${attr(item.src)}" alt="${attr(item.title)}" loading="lazy" />`;
};

const serviceDetails = [
  {
    label: 'Подробнее о программе',
    lead: 'Это не набор разовых практик, а последовательный путь возвращения к себе: к первозданной силе, ясности и своему свету. Работа идет глубоко, но бережно, в темпе вашей Души и готовности сознания.',
    sections: [
      {
        title: 'Что происходит в процессе',
        items: [
          'очищается многомерная структура: энергетические тела, чакры, тор, сушумна, каналы Ида и Пингала, следы прошлых воплощений;',
          'обнуляются кармические программы и матричные подключения, которые держат внимание в страхе, вине, долге и чужих сценариях;',
          'восстанавливается связь с Источником, Высшим Я и ясным пониманием того, кто вы на самом деле;',
          'возвращаются сила, энергия, утраченные потенциалы и способность творить свою реальность из осознанности.'
        ],
      },
      {
        title: 'Как выстроена работа',
        items: [
          'связь и сопровождение 7 дней в неделю;',
          'практики идут последовательно, без перегруза и гонки за результатом;',
          'обычно закладываются две квантовые сессии в месяц, чтобы изменения успевали проявиться в теле, состоянии и материи;',
          'главный фокус - подготовить сознание к настоящему выходу из Матрицы и самостоятельному контакту с глубиной мироздания.'
        ],
      },
    ],
    result: 'В итоге вы не просто «понимаете» себя лучше, а начинаете собираться целиком: освобождаетесь от иллюзий, возвращаете внутреннюю опору и меняете реальность из собственного состояния.',
  },
  {
    label: 'Подробнее о чистке',
    lead: 'Глубокая квантовая чистка поля Души - это фундаментальная работа с многомерной структурой человека. Она подходит тем, кто уже чувствует: старые сценарии, родовые следы, страхи и энергетическая тяжесть мешают идти дальше.',
    sections: [
      {
        title: 'Этапы работы',
        items: [
          'общая чистка энергетических тел, поля, чужих влияний, контрактов, кармических узлов и программ подчинения;',
          'настройка чакральной системы по естественным частотам: очищение, восстановление вращения, снятие перекосов и блоков;',
          'выравнивание Сушумны, Иды и Пингалы, баланс мужского и женского потоков, восстановление свободного движения энергии;',
          'очищение родовой линии до истока: страхи, ограничения, чужие судьбы, клятвы, обеты и запреты.'
        ],
      },
      {
        title: 'Что может проявиться',
        items: [
          'возвращается фокус внимания, внутренняя тишина и опора на себя;',
          'тело становится живее, эмоции меньше цепляют, появляется честность с собой;',
          'уходит внутренний конфликт, появляется спокойная сила и присутствие в теле;',
          'вы перестаете нести лишний груз рода и легче входите в новый этап жизни.'
        ],
      },
    ],
    result: 'После прохождения этапов человек чувствует больше целостности, свободного движения энергии и ясности. Если база уже выстроена, можно переходить к программе «Осознанный выход из Матрицы».',
  },
];

const renderServiceDetailBody = (detail, service) => `
  <div class="service-detail-body">
    <p class="service-detail-lead">${html(detail.lead)}</p>
    <div class="service-detail-columns">
      ${detail.sections.map((section) => `
        <div class="service-detail-column">
          <h4>${html(section.title)}</h4>
          <ul>
            ${section.items.map((item) => `<li>${html(item)}</li>`).join('')}
          </ul>
        </div>
      `).join('')}
    </div>
    <p class="service-detail-result">${html(detail.result)}</p>
    <a class="service-detail-cta" href="#contact">${html(service.price)} · записаться</a>
  </div>
`;

const renderTourCard = (service, index, media) => {
  const detail = serviceDetails[index];
  const title = html(service.title);
  const route = `Route ${String(index + 1).padStart(2, '0')}`;

  if (!detail) {
    return `
      <a class="tour-card" href="#contact" aria-label="${attr(`${service.title}: перейти к контактам`)}">
        <div class="tour-media">${mediaMarkup(media)}</div>
        <span>${route}</span>
        <h3>${title}</h3>
        <p>${html(service.tag)}</p>
        <strong>${html(service.price)}</strong>
      </a>
    `;
  }

  return `
    <details class="tour-card tour-card-expandable">
      <summary aria-label="${attr(`${service.title}: раскрыть описание`)}">
        <div class="tour-media">${mediaMarkup(media)}</div>
        <span>${route}</span>
        <h3>${title}</h3>
        <p>${html(service.tag)}</p>
        <strong>${html(service.price)}</strong>
        <em>${html(detail.label)}</em>
      </summary>
      ${renderServiceDetailBody(detail, service)}
    </details>
  `;
};

const renderServiceLine = (service, index) => {
  const detail = serviceDetails[index];
  const number = String(index + 1).padStart(2, '0');

  if (!detail) {
    return `
      <a class="service-line" href="#contact" aria-label="${attr(`${service.title}: перейти к контактам`)}">
        <span>${number}</span>
        <div>
          <h3>${html(service.title)}</h3>
          <p>${html(service.text)}</p>
        </div>
        <strong>${html(service.price)}</strong>
      </a>
    `;
  }

  return `
    <details class="service-line service-line-expandable" id="work-service-${number}">
      <summary aria-label="${attr(`${service.title}: раскрыть описание`)}">
        <span>${number}</span>
        <div>
          <h3>${html(service.title)}</h3>
          <p>${html(service.text)}</p>
        </div>
        <strong>${html(service.price)}</strong>
        <em>${html(detail.label)}</em>
      </summary>
      ${renderServiceDetailBody(detail, service)}
    </details>
  `;
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
      <button type="button" data-menu-chat>Чат с кроликом</button>
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
          return renderTourCard(service, index, media);
        }).join('')}
      </div>
      <div class="gallery-carousel work-mobile-carousel" data-work-carousel aria-label="${attr(content.servicesSection?.kicker || 'Formats')}">
        <button class="gallery-arrow gallery-arrow-prev" type="button" aria-label="Предыдущий формат" data-work-prev>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div class="gallery-stage">
          ${services.map((service, index) => {
            const media = gallery[index % gallery.length];
            return `
              <a class="gallery-slide work-slide" href="#contact" data-work-item data-index="${index}" aria-label="${attr(`${service.title}: перейти к контактам`)}">
                <div class="gallery-media">
                  ${mediaMarkup(media)}
                </div>
                <span class="gallery-caption">
                  <span>${html(service.tag)}</span>
                  <strong>${html(service.title)}</strong>
                  <em>${html(service.price)}</em>
                </span>
              </a>
            `;
          }).join('')}
        </div>
        <button class="gallery-arrow gallery-arrow-next" type="button" aria-label="Следующий формат" data-work-next>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
        <div class="gallery-dots" aria-label="Выбор формата">
          ${services.map((service, index) => `
            <button type="button" aria-label="Формат ${index + 1}" data-work-dot="${index}"></button>
          `).join('')}
        </div>
      </div>
      <div class="service-list">
        ${services.map(renderServiceLine).join('')}
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

    <section class="section bottom-gallery-section" id="state-video" aria-label="Видеоритм практик">
      <div class="center-head bottom-gallery-head">
        <span class="eyebrow">После сессии</span>
        <h2>Когда состояние становится видимым</h2>
      </div>
      <div class="gallery-carousel bottom-video-carousel" data-bottom-gallery-carousel aria-label="Видеоритм практик">
        <button class="gallery-arrow gallery-arrow-prev" type="button" aria-label="Предыдущее видео" data-bottom-gallery-prev>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div class="gallery-stage">
          ${bottomGallery.map((item, index) => `
            <figure class="gallery-slide ${attr(item.className || '')}" data-bottom-gallery-item data-index="${index}">
              <div class="gallery-media">
                <video src="${attr(item.src)}" muted loop playsinline autoplay preload="metadata"></video>
              </div>
              <figcaption class="gallery-caption">
                <span>${html(item.tag)}</span>
                <strong>${html(item.title)}</strong>
              </figcaption>
            </figure>
          `).join('')}
        </div>
        <button class="gallery-arrow gallery-arrow-next" type="button" aria-label="Следующее видео" data-bottom-gallery-next>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
        <div class="gallery-dots" aria-label="Выбор видео">
          ${bottomGallery.map((item, index) => `
            <button type="button" aria-label="Видео ${index + 1}" data-bottom-gallery-dot="${index}"></button>
          `).join('')}
        </div>
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
        <button class="button button-rabbit" type="button" data-contact-chat>Связаться с Кроликом</button>
        <div class="social-links">
          ${(content.contact?.socialLinks || []).map((item) => `<a href="${attr(item.href)}" target="_blank" rel="noreferrer">${html(item.label)}</a>`).join('')}
        </div>
        <small>${html(content.contact?.disclaimer)}</small>
      </div>
    </section>
  </main>
  <div class="atmika-chat" data-chat-dialog aria-hidden="true">
    <div class="atmika-chat-panel" role="dialog" aria-modal="true" aria-labelledby="atmika-chat-title">
      <div class="atmika-chat-head">
        <div>
          <span class="eyebrow">Белый кролик онлайн</span>
          <h2 id="atmika-chat-title">Диалог с проводником</h2>
        </div>
        <div class="atmika-chat-actions">
          <button type="button" data-chat-share>Поделиться</button>
          <button type="button" data-rabbit-den-toggle aria-expanded="false">Нора</button>
          <button type="button" data-chat-new>Новый</button>
          <button type="button" data-chat-close aria-label="Закрыть чат">×</button>
        </div>
      </div>
      <div class="atmika-rabbit-den" data-rabbit-den hidden>
        <div class="atmika-rabbit-den-head">
          <strong>Скины кролика</strong>
          <span>Выбор сохранится для следующих визитов.</span>
        </div>
        <div class="rabbit-skin-list" data-rabbit-skins>
          ${ATMIKA_RABBIT_VARIANTS.map((variant, index) => `
            <button class="rabbit-skin" type="button" data-rabbit-skin="${index + 1}" aria-pressed="false">
              <span class="rabbit-skin-preview">
                <img src="${attr(variant.webp)}" alt="" loading="lazy" />
              </span>
              <span class="rabbit-skin-copy">
                <strong>${String(index + 1).padStart(2, '0')}</strong>
                <em>${html(variant.label)}</em>
              </span>
            </button>
          `).join('')}
        </div>
      </div>
      <div class="atmika-chat-share" data-chat-share-status aria-live="polite"></div>
      <div class="atmika-chat-messages" data-chat-messages aria-live="polite"></div>
      <form class="atmika-chat-form" data-chat-form>
        <textarea name="message" rows="2" placeholder="Спросите про практики, форматы, состояние или первый шаг..." required></textarea>
        <button type="submit">Отправить</button>
      </form>
    </div>
  </div>
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
    toggle.setAttribute('aria-label', isOpen
      ? (content.header?.closeMenuLabel || 'Закрыть меню')
      : (content.header?.openMenuLabel || 'Открыть меню'));
  });

  navEl.addEventListener('click', (event) => {
    const chatButton = event.target.closest('[data-menu-chat]');

    if (chatButton) {
      openAtmikaChat();
    }

    if (event.target.closest('a, [data-menu-chat]')) {
      document.body.classList.remove('menu-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', content.header?.openMenuLabel || 'Открыть меню');
    }
  });
};

const getHashTarget = (hashValue) => {
  const hash = text(hashValue).trim();

  if (!hash.startsWith('#') || hash.length <= 1) {
    return null;
  }

  try {
    return document.getElementById(decodeURIComponent(hash.slice(1)));
  } catch {
    return document.getElementById(hash.slice(1));
  }
};

const scrollToHashTarget = (hashValue, behavior = 'smooth') => {
  const target = getHashTarget(hashValue);

  if (!target) {
    return false;
  }

  target.scrollIntoView({ behavior, block: 'start' });
  return true;
};

const initHashNavigation = () => {
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');

    if (!link) {
      return;
    }

    const hash = link.getAttribute('href');

    if (!scrollToHashTarget(hash)) {
      return;
    }

    event.preventDefault();

    if (window.location.hash !== hash) {
      history.pushState(null, '', hash);
    }
  });

  window.addEventListener('hashchange', () => {
    scrollToHashTarget(window.location.hash);
  });

  if (window.location.hash) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToHashTarget(window.location.hash, 'auto');
      });
    });
  }
};

const initVideoPlayback = () => {
  document.querySelectorAll('video').forEach((video) => {
    video.muted = true;
    video.play().catch(() => {});
  });
};

let openVideoLightbox = () => {};

const initVideoLightbox = () => {
  const lightbox = document.createElement('div');
  lightbox.className = 'video-lightbox';
  lightbox.setAttribute('aria-hidden', 'true');
  lightbox.innerHTML = `
    <div class="video-lightbox-panel" role="dialog" aria-modal="true" aria-label="Просмотр видео">
      <button class="video-lightbox-close" type="button" aria-label="Закрыть видео">×</button>
      <video class="video-lightbox-media" controls playsinline></video>
      <div class="video-lightbox-caption"></div>
    </div>
  `;
  document.body.append(lightbox);

  const panel = lightbox.querySelector('.video-lightbox-panel');
  const video = lightbox.querySelector('.video-lightbox-media');
  const caption = lightbox.querySelector('.video-lightbox-caption');
  const closeButton = lightbox.querySelector('.video-lightbox-close');
  let restoreScrollY = 0;
  let previousBodyStyle = {};

  const lockPageScroll = () => {
    previousBodyStyle = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
    };
    document.body.style.position = 'fixed';
    document.body.style.top = `-${restoreScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
  };

  const unlockPageScroll = () => {
    document.body.style.position = previousBodyStyle.position || '';
    document.body.style.top = previousBodyStyle.top || '';
    document.body.style.left = previousBodyStyle.left || '';
    document.body.style.right = previousBodyStyle.right || '';
    document.body.style.width = previousBodyStyle.width || '';
  };

  const restoreScroll = () => {
    window.scrollTo({ top: restoreScrollY, left: 0, behavior: 'auto' });
  };

  const close = () => {
    video.pause();
    video.removeAttribute('src');
    video.load();
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('video-lightbox-open');
    unlockPageScroll();
    restoreScroll();
    requestAnimationFrame(restoreScroll);
    window.setTimeout(restoreScroll, 80);
    window.setTimeout(restoreScroll, 180);
  };

  openVideoLightbox = (sourceVideo, title = '') => {
    const source = sourceVideo?.currentSrc || sourceVideo?.getAttribute('src') || '';

    if (!source) {
      return;
    }

    caption.textContent = title;
    caption.hidden = !title;
    restoreScrollY = window.scrollY;
    lockPageScroll();
    video.src = source;
    video.muted = false;
    video.volume = 1;

    try {
      video.currentTime = sourceVideo.currentTime || 0;
    } catch {}

    document.body.classList.add('video-lightbox-open');
    lightbox.setAttribute('aria-hidden', 'false');
    video.play().catch(() => {});
  };

  document.addEventListener('click', (event) => {
    if (event.target.closest('.video-lightbox, .gallery-arrow, .gallery-dots button')) {
      return;
    }

    const card = event.target.closest('.mosaic-card, .gallery-slide');
    const sourceVideo = card?.querySelector('video');

    if (!card || !sourceVideo) {
      return;
    }

    event.preventDefault();
    openVideoLightbox(sourceVideo, card.querySelector('.gallery-caption strong, figcaption strong')?.textContent?.trim() || '');
  });

  closeButton.addEventListener('click', close);
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox || event.target === panel) {
      close();
    }
  });
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && lightbox.getAttribute('aria-hidden') === 'false') {
      close();
    }
  });
};

const initStackCarousel = ({
  carouselSelector,
  itemSelector,
  dotSelector,
  prevSelector,
  nextSelector
}) => {
  const carousel = document.querySelector(carouselSelector);

  if (!carousel) {
    return;
  }

  const slides = [...carousel.querySelectorAll(itemSelector)];
  const dots = [...carousel.querySelectorAll(dotSelector)];
  const prevButton = carousel.querySelector(prevSelector);
  const nextButton = carousel.querySelector(nextSelector);
  let activeIndex = 0;
  let autoTimer = 0;
  let pointerStartX = 0;
  let pointerDeltaX = 0;
  let pointerStartY = 0;
  let suppressClick = false;

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
    pointerStartY = event.clientY;
    pointerDeltaX = 0;
    carousel.setPointerCapture(event.pointerId);
  });

  carousel.addEventListener('pointermove', (event) => {
    if (!pointerStartX) {
      return;
    }

    pointerDeltaX = event.clientX - pointerStartX;
  });

  carousel.addEventListener('pointerup', (event) => {
    const pointerDeltaY = event.clientY - pointerStartY;
    const isTap = pointerStartX && Math.abs(pointerDeltaX) < 10 && Math.abs(pointerDeltaY) < 10;

    if (Math.abs(pointerDeltaX) > 44) {
      goTo(activeIndex + (pointerDeltaX < 0 ? 1 : -1));
      restartAuto();
    } else if (isTap) {
      const slide = event.target.closest(itemSelector);
      const video = event.target.closest('video') || event.target.closest('.gallery-media')?.querySelector('video');

      if (slide && video) {
        suppressClick = true;
        window.setTimeout(() => {
          suppressClick = false;
        }, 250);
        openVideoLightbox(video, slide.querySelector('.gallery-caption strong, figcaption strong')?.textContent?.trim() || '');
      }
    }

    pointerStartX = 0;
    pointerStartY = 0;
    pointerDeltaX = 0;
  });

  carousel.addEventListener('pointercancel', () => {
    pointerStartX = 0;
    pointerStartY = 0;
    pointerDeltaX = 0;
  });

  carousel.addEventListener('click', (event) => {
    if (suppressClick) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  carousel.addEventListener('mouseenter', () => window.clearInterval(autoTimer));
  carousel.addEventListener('mouseleave', restartAuto);
  carousel.addEventListener('focusin', () => window.clearInterval(autoTimer));
  carousel.addEventListener('focusout', restartAuto);

  render();
  restartAuto();
};

let openAtmikaChat = () => {};

const initAtmikaChat = () => {
  const dialog = document.querySelector('[data-chat-dialog]');
  const closeButton = document.querySelector('[data-chat-close]');
  const newButton = document.querySelector('[data-chat-new]');
  const shareButton = document.querySelector('[data-chat-share]');
  const denButton = document.querySelector('[data-rabbit-den-toggle]');
  const denPanel = document.querySelector('[data-rabbit-den]');
  const skinButtons = [...document.querySelectorAll('[data-rabbit-skin]')];
  const shareStatus = document.querySelector('[data-chat-share-status]');
  const messagesEl = document.querySelector('[data-chat-messages]');
  const form = document.querySelector('[data-chat-form]');
  const input = form?.querySelector('textarea[name="message"]');

  if (!dialog || !form || !input || !messagesEl) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  let chatId = params.get('chat_id') || localStorage.getItem('atmika_chat_id') || '';
  let isReady = false;
  let isSending = false;
  let currentMessages = [];

  const setStatus = (message) => {
    if (shareStatus) {
      shareStatus.textContent = message || '';
    }
  };

  const setActiveSkinButton = (variantNumber) => {
    skinButtons.forEach((button) => {
      const isActive = Number(button.dataset.rabbitSkin) === Number(variantNumber);
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
  };

  const toggleRabbitDen = (forceOpen) => {
    if (!denButton || !denPanel) {
      return;
    }

    const isOpen = forceOpen ?? denPanel.hidden;
    denPanel.hidden = !isOpen;
    denButton.setAttribute('aria-expanded', String(isOpen));
    denButton.classList.toggle('is-active', isOpen);

    if (isOpen) {
      setActiveSkinButton(localStorage.getItem(RABBIT_VARIANT_STORAGE_KEY) || DEFAULT_RABBIT_VARIANT);
    }
  };

  const chatLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('chat_id', chatId);
    return url.toString();
  };

  const updateUrl = () => {
    if (!chatId) {
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.set('chat_id', chatId);
    window.history.replaceState({}, '', url);
  };

  const renderMessages = (messages) => {
    messagesEl.textContent = '';
    currentMessages = messages
      .filter((message) => !message.pending)
      .map(({ role, content, createdAt }) => ({ role, content, createdAt }));

    if (!messages.length) {
      const empty = document.createElement('div');
      empty.className = 'atmika-chat-empty';
      empty.textContent = 'Я рядом. Можно спросить про форматы работы, состояние, первый шаг или просто описать, что сейчас происходит.';
      messagesEl.append(empty);
      return;
    }

    messages.forEach((message) => {
      const item = document.createElement('article');
      item.className = `atmika-chat-message is-${message.role}${message.pending ? ' is-pending' : ''}`;
      const label = document.createElement('span');
      label.textContent = message.role === 'user' ? 'Вы' : 'Атмика';
      const textEl = document.createElement('div');
      textEl.className = 'atmika-chat-content';
      textEl.innerHTML = renderMarkdown(message.content);
      item.append(label, textEl);
      messagesEl.append(item);
    });

    messagesEl.scrollTop = messagesEl.scrollHeight;
  };

  const loadChat = async () => {
    const suffix = chatId ? `?chat_id=${encodeURIComponent(chatId)}` : '';
    const response = await fetch(`/api/chat${suffix}`);
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || 'Не удалось открыть чат');
    }

    chatId = payload.chat_id;
    localStorage.setItem('atmika_chat_id', chatId);
    updateUrl();
    renderMessages(payload.messages || []);
    isReady = true;
  };

  const startNewChat = async () => {
    if (isSending) {
      return;
    }

    chatId = '';
    isReady = false;
    currentMessages = [];
    localStorage.removeItem('atmika_chat_id');
    renderMessages([]);
    setStatus('Создаю новый диалог...');

    try {
      await loadChat();
      setStatus('Новый чат готов. Можно скопировать свежую ссылку.');
      input.focus();
    } catch (error) {
      setStatus(error.message || 'Не удалось создать новый чат');
    }
  };

  openAtmikaChat = async () => {
    dialog.setAttribute('aria-hidden', 'false');
    document.body.classList.add('chat-open');
    input.focus();

    if (!isReady) {
      setStatus('Открываю пространство диалога...');
      try {
        await loadChat();
        setStatus('');
      } catch (error) {
        setStatus(error.message || 'Чат временно недоступен');
      }
    }
  };

  const closeChat = () => {
    dialog.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('chat-open');
  };

  closeButton?.addEventListener('click', closeChat);
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      closeChat();
    }
  });

  newButton?.addEventListener('click', startNewChat);

  denButton?.addEventListener('click', () => {
    toggleRabbitDen();
  });

  skinButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const variantNumber = Number(button.dataset.rabbitSkin);
      const selected = window.setAtmikaRabbit?.(variantNumber) || variantNumber;

      setActiveSkinButton(selected);
    });
  });

  window.addEventListener('atmika:rabbit-variant', (event) => {
    setActiveSkinButton(event.detail?.variant || DEFAULT_RABBIT_VARIANT);
  });

  shareButton?.addEventListener('click', async () => {
    if (!isReady) {
      await openAtmikaChat();
    }

    const link = chatLink();
    await navigator.clipboard?.writeText(link).catch(() => {});
    setStatus(`Ссылка на чат: ${link}`);
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (isSending) {
      return;
    }

    const message = input.value.trim();

    if (!message) {
      return;
    }

    isSending = true;
    input.value = '';
    setStatus('');
    renderMessages([
      ...currentMessages,
      { role: 'user', content: message },
      { role: 'assistant', content: 'Атмика думает...', pending: true },
    ]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, message }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Не удалось отправить сообщение');
      }

      chatId = payload.chat_id;
      localStorage.setItem('atmika_chat_id', chatId);
      updateUrl();
      renderMessages(payload.messages || []);
      setStatus('');
    } catch (error) {
      renderMessages([
        ...currentMessages,
        {
          role: 'assistant',
          content: error.message || 'Чат временно недоступен. Попробуйте ещё раз чуть позже.',
        },
      ]);
      setStatus('');
    } finally {
      isSending = false;
    }
  });

  if (params.get('chat_id')) {
    openAtmikaChat();
  }
};

const initContactChatButton = () => {
  document.querySelector('[data-contact-chat]')?.addEventListener('click', () => {
    openAtmikaChat();
  });
};

const initWhiteRabbit = () => {
  const rabbit = document.querySelector('[data-white-rabbit]');

  if (!rabbit) {
    return;
  }

  const bubble = rabbit.querySelector('.rabbit-bubble');
  const rabbitSource = rabbit.querySelector('[data-rabbit-source]');
  const rabbitImage = rabbit.querySelector('[data-rabbit-image]');
  const rabbitVariants = ATMIKA_RABBIT_VARIANTS;
  const phrases = [
    'Поговорим?',
    'Спросить про формат, цену или запись?',
    'Я рядом: помогу выбрать маршрут.',
    'Путь начинается там, где привычная карта заканчивается.',
    'Смотри глубже: за шумом есть маршрут.',
    'Тело знает пароль раньше ума.',
    'Найди тишину между двумя мыслями.',
    'Каждый шаг снимает один слой сценария.',
    'Не ищи выход. Стань тем, кто выходит.',
    'Там, где внимание живое, поле меняется.',
    'Настоящий путь не шумит. Он зовет.',
    'Верни внимание себе. Это главный ключ.',
    'Если реальность мерцает, значит ты близко.',
    'Не спорь с иллюзией. Увидь ее структуру.',
    'Проводник рядом, но дверь открываешь ты.',
    'Сверни туда, где становится яснее.',
    'Выход начинается не с бунта, а с присутствия.'
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
  let variantKeyBuffer = '';
  let variantKeyTimer = 0;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const isFormField = (node) => {
    const tagName = node?.tagName;

    return node?.isContentEditable || tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT';
  };

  const setRabbitVariant = (variantNumber = DEFAULT_RABBIT_VARIANT) => {
    const number = Number(variantNumber);
    const index = Number.isFinite(number) ? Math.round(number) - 1 : 0;
    const safeIndex = clamp(index, 0, rabbitVariants.length - 1);
    const variant = rabbitVariants[safeIndex];

    if (rabbitSource) {
      rabbitSource.srcset = variant.webp;
    }

    if (rabbitImage) {
      rabbitImage.src = variant.png;
    }

    rabbit.dataset.rabbitVariant = String(safeIndex + 1);
    localStorage.setItem(RABBIT_VARIANT_STORAGE_KEY, String(safeIndex + 1));
    window.dispatchEvent(new CustomEvent('atmika:rabbit-variant', {
      detail: {
        variant: safeIndex + 1,
        label: variant.label,
      },
    }));
    console.info(`Atmika rabbit ${safeIndex + 1}: ${variant.label}`);

    return safeIndex + 1;
  };

  window.atmikaRabbitVariants = rabbitVariants.map((variant, index) => ({
    number: index + 1,
    label: variant.label,
    webp: variant.webp,
    png: variant.png,
  }));
  window.setAtmikaRabbit = setRabbitVariant;
  window.setAtmikaRabbitVariant = setRabbitVariant;

  const update = () => {
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = clamp(window.scrollY / maxScroll, 0, 1);
    const isCompact = window.matchMedia('(max-width: 640px)').matches;
    const maxTravel = isCompact ? 0 : Math.max(0, window.innerHeight - rabbit.offsetHeight - 168);
    const nextPhraseIndex = Math.min(phrases.length - 1, Math.floor(progress * phrases.length));

    targetY = progress * maxTravel;
    targetX = Math.sin(progress * Math.PI * 2.6) * (isCompact ? 4 : 9);
    targetTilt = Math.sin(progress * Math.PI * 7) * (isCompact ? 2 : 4);
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
    openAtmikaChat();
  });

  window.addEventListener('keydown', (event) => {
    if (
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      isFormField(document.activeElement)
    ) {
      return;
    }

    if (!/^\d$/.test(event.key)) {
      return;
    }

    window.clearTimeout(variantKeyTimer);
    variantKeyBuffer = `${variantKeyBuffer}${event.key}`.replace(/^0+/, '');

    if (!variantKeyBuffer) {
      return;
    }

    const variantNumber = Number(variantKeyBuffer);
    const hasContinuation = rabbitVariants.some((_, index) => {
      const optionNumber = String(index + 1);

      return optionNumber.startsWith(variantKeyBuffer) && optionNumber !== variantKeyBuffer;
    });

    if (variantNumber >= 1 && variantNumber <= rabbitVariants.length) {
      if (hasContinuation) {
        variantKeyTimer = window.setTimeout(() => {
          setRabbitVariant(variantNumber);
          variantKeyBuffer = '';
        }, 450);
      } else {
        setRabbitVariant(variantNumber);
        variantKeyBuffer = '';
      }
      return;
    }

    variantKeyBuffer = '';
  });

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  window.addEventListener('pagehide', () => cancelAnimationFrame(frame), { once: true });
  setRabbitVariant(localStorage.getItem(RABBIT_VARIANT_STORAGE_KEY) || DEFAULT_RABBIT_VARIANT);
  update();
  animate();
};

initMenu();
initHashNavigation();
initVideoPlayback();
initVideoLightbox();
initAtmikaChat();
initContactChatButton();
initStackCarousel({
  carouselSelector: '[data-expedition-carousel]',
  itemSelector: '[data-expedition-item]',
  dotSelector: '[data-expedition-dot]',
  prevSelector: '[data-expedition-prev]',
  nextSelector: '[data-expedition-next]'
});
initStackCarousel({
  carouselSelector: '[data-work-carousel]',
  itemSelector: '[data-work-item]',
  dotSelector: '[data-work-dot]',
  prevSelector: '[data-work-prev]',
  nextSelector: '[data-work-next]'
});
initStackCarousel({
  carouselSelector: '[data-bottom-gallery-carousel]',
  itemSelector: '[data-bottom-gallery-item]',
  dotSelector: '[data-bottom-gallery-dot]',
  prevSelector: '[data-bottom-gallery-prev]',
  nextSelector: '[data-bottom-gallery-next]'
});
initWhiteRabbit();
