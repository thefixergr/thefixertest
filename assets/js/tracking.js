/* istoselides.ai tracking
   GA4 + Google Ads via gtag.js, Consent Mode v2, click events.
   Το script φορτώνεται sync στο <head> ώστε τα consent defaults να μπουν πριν από το gtag. */
(function () {
  var GA4 = 'G-T9QM7XYXDG';
  var ADS = 'AW-18431031652';
  var LABELS = {
    form_lead: 'kRqACPjRyu4cEOTyzNRE',
    whatsapp: '_iFXCPvRyu4cEOTyzNRE',
    phone: '-v-sCP7Ryu4cEOTyzNRE',
    email: '6pFqCPnSyu4cEOTyzNRE'
  };
  var KEY = 'ist_consent';

  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;

  /* 1. Consent Mode v2: default denied, ενεργοποίηση μετά από αποδοχή */
  var stored = null;
  try { stored = localStorage.getItem(KEY); } catch (e) {}
  var granted = stored === 'granted';
  gtag('consent', 'default', {
    ad_storage: granted ? 'granted' : 'denied',
    ad_user_data: granted ? 'granted' : 'denied',
    ad_personalization: granted ? 'granted' : 'denied',
    analytics_storage: granted ? 'granted' : 'denied',
    functionality_storage: 'granted',
    security_storage: 'granted',
    wait_for_update: 500
  });
  gtag('set', 'url_passthrough', true);
  gtag('set', 'ads_data_redaction', true);

  /* 2. gtag.js */
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4;
  document.head.appendChild(s);
  gtag('js', new Date());
  gtag('config', GA4, { send_page_view: true });
  gtag('config', ADS, { allow_enhanced_conversions: true });

  /* 3. Conversion helper */
  function conversion(name, value) {
    gtag('event', 'conversion', {
      send_to: ADS + '/' + LABELS[name],
      value: value,
      currency: 'EUR'
    });
  }
  window.istTrack = { conversion: conversion, gtag: gtag };

  /* 4. Thank-you pages = form lead */
  var p = location.pathname.replace(/\/+$/, '');
  if (p === '/efcharisto' || p === '/efcharisto-erotimatologio') {
    gtag('event', 'form_submitted', { form_type: p === '/efcharisto' ? 'contact' : 'questionnaire' });
    conversion('form_lead', 40);
  }

  /* 5. Click events: WhatsApp, τηλέφωνο, email */
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('a[href]');
    if (!a) return;
    var h = a.getAttribute('href') || '';
    if (/^https?:\/\/(wa\.me|api\.whatsapp\.com)/.test(h)) {
      gtag('event', 'whatsapp_click', { link_url: h });
      conversion('whatsapp', 15);
    } else if (/^tel:/.test(h)) {
      gtag('event', 'phone_click', { link_url: h });
      conversion('phone', 15);
    } else if (/^mailto:/.test(h)) {
      gtag('event', 'email_click', { link_url: h });
      conversion('email', 5);
    }
  }, true);

  /* 6. Cookie banner (μόνο αν δεν έχει απαντήσει) */
  function update(state) {
    try { localStorage.setItem(KEY, state); } catch (e) {}
    var v = state === 'granted' ? 'granted' : 'denied';
    gtag('consent', 'update', {
      ad_storage: v, ad_user_data: v, ad_personalization: v, analytics_storage: v
    });
    var b = document.getElementById('ist-consent');
    if (b) b.remove();
  }
  window.istConsent = update;

  function banner() {
    if (stored) return;
    var d = document.createElement('div');
    d.id = 'ist-consent';
    d.setAttribute('role', 'dialog');
    d.setAttribute('aria-label', 'Cookies');
    d.innerHTML =
      '<style>#ist-consent{position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;max-width:520px;margin:0 auto;' +
      'background:#161416;color:#f4efe9;border:1px solid #2a2628;border-radius:14px;padding:14px 16px;' +
      'font:14px/1.45 Manrope,system-ui,sans-serif;box-shadow:0 10px 40px rgba(0,0,0,.45);display:flex;flex-wrap:wrap;gap:10px;align-items:center}' +
      '#ist-consent p{margin:0;flex:1 1 260px}#ist-consent a{color:#ff6a4d}' +
      '#ist-consent button{cursor:pointer;border:0;border-radius:999px;padding:9px 16px;font:600 14px Manrope,system-ui,sans-serif}' +
      '#ist-consent .ok{background:#ff6a4d;color:#0b0a0b}#ist-consent .no{background:transparent;color:#f4efe9;border:1px solid #3a3538}</style>' +
      '<p>Χρησιμοποιούμε cookies για στατιστικά και για να μετράμε τις διαφημίσεις μας. <a href="/aporrito/">Περισσότερα</a></p>' +
      '<button class="no" type="button">Απόρριψη</button><button class="ok" type="button">Αποδοχή</button>';
    d.querySelector('.ok').onclick = function () { update('granted'); };
    d.querySelector('.no').onclick = function () { update('denied'); };
    document.body.appendChild(d);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', banner);
  else banner();
})();
