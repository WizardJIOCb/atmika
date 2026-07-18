(() => {
  const STORAGE_KEY = 'atmika_privacy_choice_v1';
  const ANALYTICS = 'analytics';
  const NECESSARY = 'necessary';
  const METRIKA_ID = 110844909;

  const storage = {
    get: () => {
      try { return localStorage.getItem(STORAGE_KEY) || ''; } catch { return ''; }
    },
    set: (value) => {
      try { localStorage.setItem(STORAGE_KEY, value); } catch { /* Storage can be disabled. */ }
    },
  };

  const addStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
      .atmika-privacy-banner{position:fixed;z-index:2147483000;right:16px;bottom:16px;width:min(680px,calc(100% - 32px));padding:22px;border:1px solid rgba(103,232,249,.42);background:rgba(5,10,16,.97);box-shadow:0 24px 90px rgba(0,0,0,.55);color:#eefaf7;font-family:Inter,Manrope,Arial,sans-serif}
      .atmika-privacy-banner[hidden]{display:none}
      .atmika-privacy-banner strong{display:block;margin-bottom:8px;font-size:17px;line-height:1.25}
      .atmika-privacy-banner p{margin:0;color:rgba(238,250,247,.74);font-size:13px;line-height:1.55}
      .atmika-privacy-banner a{color:#67e8f9;text-decoration:underline;text-underline-offset:3px}
      .atmika-privacy-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}
      .atmika-privacy-actions button{min-height:42px;padding:0 16px;border:1px solid rgba(103,232,249,.42);background:transparent;color:#eefaf7;cursor:pointer;font:700 12px/1 Inter,Manrope,Arial,sans-serif}
      .atmika-privacy-actions button[data-privacy-allow]{border-color:#67e8f9;background:#67e8f9;color:#071010}
      .atmika-privacy-launcher{position:fixed;z-index:2147482000;left:10px;bottom:10px;padding:7px 10px;border:1px solid rgba(103,232,249,.28);border-radius:999px;background:rgba(5,10,16,.88);color:rgba(238,250,247,.72);cursor:pointer;font:600 10px/1.2 Inter,Manrope,Arial,sans-serif;backdrop-filter:blur(8px)}
      .atmika-privacy-launcher:hover{border-color:#67e8f9;color:#67e8f9}
      @media(max-width:640px){.atmika-privacy-banner{right:10px;bottom:10px;width:calc(100% - 20px);padding:18px}.atmika-privacy-actions{display:grid}.atmika-privacy-actions button{width:100%}.atmika-privacy-launcher{bottom:6px;left:6px}}
    `;
    document.head.append(style);
  };

  const loadMetrika = () => {
    if (window.__atmikaMetrikaLoaded) return;
    window.__atmikaMetrikaLoaded = true;
    window.ym = window.ym || function ym() {
      (window.ym.a = window.ym.a || []).push(arguments);
    };
    window.ym.l = Number(new Date());
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://mc.yandex.ru/metrika/tag.js?id=${METRIKA_ID}`;
    document.head.append(script);
    window.ym(METRIKA_ID, 'init', {
      ssr: true,
      webvisor: true,
      clickmap: true,
      ecommerce: 'dataLayer',
      referrer: document.referrer,
      url: window.location.href,
      accurateTrackBounce: true,
      trackLinks: true,
    });
  };

  addStyles();

  const banner = document.createElement('section');
  banner.className = 'atmika-privacy-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', 'Настройки конфиденциальности');
  banner.innerHTML = `
    <strong>Конфиденциальность и cookies</strong>
    <p>Необходимые cookies и localStorage обеспечивают вход, оплату, настройки и работу чата. Яндекс Метрика подключается только с вашего согласия. Подробнее — в <a href="/legal/privacy/" target="_blank">Политике оператора в отношении обработки персональных данных</a>.</p>
    <div class="atmika-privacy-actions">
      <button type="button" data-privacy-necessary>Только необходимые</button>
      <button type="button" data-privacy-allow>Разрешить аналитику</button>
    </div>`;
  document.body.append(banner);

  const launcher = document.createElement('button');
  launcher.className = 'atmika-privacy-launcher';
  launcher.type = 'button';
  launcher.textContent = 'Конфиденциальность';
  launcher.setAttribute('aria-label', 'Открыть настройки cookies');
  document.body.append(launcher);

  const open = () => {
    banner.hidden = false;
    banner.querySelector('button')?.focus();
  };

  const choose = (choice) => {
    const previous = storage.get();
    storage.set(choice);
    banner.hidden = true;
    if (choice === ANALYTICS) loadMetrika();
    if (choice === NECESSARY && previous === ANALYTICS) window.location.reload();
  };

  banner.querySelector('[data-privacy-necessary]').addEventListener('click', () => choose(NECESSARY));
  banner.querySelector('[data-privacy-allow]').addEventListener('click', () => choose(ANALYTICS));
  launcher.addEventListener('click', open);
  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-privacy-settings]')) open();
  });

  const choice = storage.get();
  banner.hidden = Boolean(choice);
  if (choice === ANALYTICS) loadMetrika();
  window.ATMIKA_PRIVACY = { open, choice: () => storage.get() };
})();
