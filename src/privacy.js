(() => {
  const METRIKA_ID = 110844909;

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
    webvisor: false,
    clickmap: true,
    ecommerce: 'dataLayer',
    referrer: document.referrer ? new URL(document.referrer).origin : '',
    url: `${window.location.origin}${window.location.pathname}`,
    accurateTrackBounce: true,
    trackLinks: true,
  });

  window.ATMIKA_PRIVACY = {
    open: () => { window.location.href = '/legal/privacy/'; },
    choice: () => 'analytics',
  };
})();
