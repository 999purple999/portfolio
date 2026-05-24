// Portfolio app: scroll reveals, scroll progress bar, nav toggle, tilt cards,
// phone reveal (anti-bot).

// Reveals: prima opt-in alla classe .js-ready (CSS imposta opacity:0), poi IO
// aggiunge .visible quando entrano in viewport. Se JS fallisce, le card
// restano comunque visibili (opacity:1 di default).
const reveals = document.querySelectorAll('.reveal');
reveals.forEach((el) => el.classList.add('js-ready'));
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) e.target.classList.add('visible');
    });
  },
  { threshold: 0.08, rootMargin: '0px 0px -5% 0px' },
);
reveals.forEach((el) => io.observe(el));
// Safety net: dopo 3s, forza visible su tutto (caso IO non triggera).
setTimeout(() => reveals.forEach((el) => el.classList.add('visible')), 3000);

// Scroll progress + nav scrolled state
const progress = document.getElementById('scroll-progress');
const nav = document.getElementById('nav');
function onScroll() {
  const h = document.documentElement.scrollHeight - window.innerHeight;
  const p = h > 0 ? (window.scrollY / h) * 100 : 0;
  if (progress) progress.style.width = p + '%';
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 24);
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Nav burger (mobile)
const burger = document.getElementById('nav-burger');
const links = document.querySelector('.nav-links');
if (burger && links) {
  burger.addEventListener('click', () => links.classList.toggle('open'));
  links.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => links.classList.remove('open')));
}

// Cursor follower (desktop only)
const cd = document.getElementById('cursor-dot');
const cr = document.getElementById('cursor-ring');
let cx = 0, cy = 0, rx = 0, ry = 0;
if (cd && cr && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
  window.addEventListener('mousemove', (e) => {
    cx = e.clientX; cy = e.clientY;
    cd.classList.add('active'); cr.classList.add('active');
    cd.style.transform = `translate(${cx}px,${cy}px) translate(-50%,-50%)`;
  }, { passive: true });
  function ringLoop() {
    rx += (cx - rx) * 0.18; ry += (cy - ry) * 0.18;
    cr.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
    requestAnimationFrame(ringLoop);
  }
  ringLoop();
  document.querySelectorAll('a,button,[data-tilt],.contact-card').forEach((el) => {
    el.addEventListener('mouseenter', () => cr.classList.add('hover'));
    el.addEventListener('mouseleave', () => cr.classList.remove('hover'));
  });
  window.addEventListener('mouseleave', () => { cd.classList.remove('active'); cr.classList.remove('active'); });
}

// W3: hero glow on card hover (uniform pulse via window flag, hero.js reads it)
document.querySelectorAll('[data-tilt]').forEach((el) => {
  el.addEventListener('mouseenter', () => { window.__heroGlowTarget = 1; });
  el.addEventListener('mouseleave', () => { window.__heroGlowTarget = 0; });
});

// R1: Tilt damped smooth (lerp factor 0.14, target=0 on leave)
document.querySelectorAll('[data-tilt]').forEach((card) => {
  let tx = 0, ty = 0, cx = 0, cy = 0, hovering = false, raf;
  function loop() {
    cx += (tx - cx) * 0.14;
    cy += (ty - cy) * 0.14;
    card.style.transform = `perspective(1000px) rotateY(${cx * 7}deg) rotateX(${-cy * 7}deg) translateY(${hovering ? -4 : 0}px) translateZ(0)`;
    if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001 || hovering) raf = requestAnimationFrame(loop);
    else { card.style.transform = ''; raf = null; }
  }
  function start() { if (!raf) raf = requestAnimationFrame(loop); }
  card.addEventListener('mouseenter', () => { hovering = true; start(); });
  card.addEventListener('mousemove', (e) => {
    const r = card.getBoundingClientRect();
    tx = (e.clientX - r.left) / r.width - 0.5;
    ty = (e.clientY - r.top) / r.height - 0.5;
    start();
  });
  card.addEventListener('mouseleave', () => { hovering = false; tx = 0; ty = 0; start(); });
});

// Phone reveal (anti-bot): il numero NON è nel sorgente HTML. È memorizzato
// in base64 dentro questo JS; viene decodificato e mostrato SOLO dopo un
// click esplicito (gesture). Edita la costante TEL_B64 sotto col base64 del
// tuo numero per attivarlo (usa: btoa('IL_TUO_NUMERO')).
const TEL_B64 = ''; // <-- INSERISCI QUI il numero codificato in base64, es: btoa('3516954896')
const phoneBtn = document.getElementById('phone-btn');
const phoneText = document.getElementById('phone-text');
if (phoneBtn && phoneText) {
  phoneBtn.addEventListener('click', () => {
    if (!TEL_B64) {
      phoneText.innerHTML = '<span class="muted">configura TEL_B64 in app.js</span>';
      return;
    }
    try {
      const tel = atob(TEL_B64);
      const formatted = tel.length === 10
        ? `+39 ${tel.slice(0, 3)} ${tel.slice(3, 6)} ${tel.slice(6)}`
        : tel;
      // sostituisci con link tel: cliccabile
      phoneText.innerHTML = `<a href="tel:+39${tel}" style="color:var(--text1); text-decoration:none; font-weight:600;">${formatted}</a>`;
    } catch {
      phoneText.innerHTML = '<span class="muted">errore decoding</span>';
    }
  });
}

// R9: Konami code → secret unlock (per i recruiter curiosi)
const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
let kSeq = [];
window.addEventListener('keydown', (e) => {
  kSeq.push(e.key);
  if (kSeq.length > KONAMI.length) kSeq.shift();
  if (kSeq.length === KONAMI.length && kSeq.every((k, i) => k === KONAMI[i])) {
    document.body.style.transition = 'filter .5s';
    document.body.style.filter = 'hue-rotate(180deg) saturate(1.4)';
    const toast = document.createElement('div');
    toast.textContent = '🎮  Konami unlocked. You found me.';
    toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);padding:14px 24px;background:linear-gradient(135deg,#c084fc,#7c3aed);color:#fff;border-radius:12px;font-family:var(--font-mono);font-weight:700;font-size:.85rem;z-index:9999;box-shadow:0 16px 40px rgba(168,85,247,.4);animation:popIn .4s';
    document.body.appendChild(toast);
    setTimeout(() => { toast.remove(); document.body.style.filter = ''; }, 4000);
    kSeq = [];
  }
});

// W5: PWA register + web-vitals (debug mode only via ?debug=1)
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((e) => console.warn('SW failed', e));
  });
}
if (new URLSearchParams(location.search).get('debug') === '1') {
  const s = document.createElement('script');
  s.type = 'module';
  s.textContent = `
    import {onLCP, onFID, onCLS, onINP} from 'https://unpkg.com/web-vitals@3?module';
    const badge = document.createElement('div');
    badge.style.cssText = 'position:fixed;bottom:12px;left:12px;z-index:9999;background:rgba(0,0,0,.85);color:#c084fc;font:11px/1.4 ui-monospace,monospace;padding:8px 12px;border-radius:8px;border:1px solid rgba(168,85,247,.3);min-width:140px';
    badge.innerHTML = 'LCP: —<br>CLS: —<br>INP: —';
    document.body.appendChild(badge);
    const m = { LCP: '—', CLS: '—', INP: '—' };
    const upd = () => { badge.innerHTML = Object.entries(m).map(([k,v]) => k+': '+v).join('<br>'); };
    onLCP(({value}) => { m.LCP = Math.round(value)+'ms'; upd(); });
    onCLS(({value}) => { m.CLS = value.toFixed(3); upd(); });
    onINP(({value}) => { m.INP = Math.round(value)+'ms'; upd(); });
  `;
  document.head.appendChild(s);
}

// W6: aggiorna og:title / og:description quando cambia lingua
function updateMetaTagsForLang() {
  if (!window.__i18n) return;
  const lang = window.__i18n.current();
  const total = (window.__METRICS && window.__METRICS.totalRepos) || 10;
  const titles = { en: `Francesco · ${total} projects · ITIS Q. Sella · Biella`, it: `Francesco · ${total} progetti · ITIS Q. Sella · Biella`, zh: `Francesco · ${total} 个项目 · ITIS Q. Sella · 比耶拉` };
  const set = (sel, content) => { const el = document.querySelector(sel); if (el) el.setAttribute('content', content); };
  set('meta[property="og:title"]', titles[lang] || titles.en);
}
document.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => setTimeout(updateMetaTagsForLang, 50)));
setTimeout(updateMetaTagsForLang, 200);

// W6: CV PDF export
async function exportCVPdf() {
  const btn = document.getElementById('cv-export');
  if (btn) btn.textContent = 'Generating…';
  try {
    const [{ default: jsPDF }] = await Promise.all([
      import('https://cdn.jsdelivr.net/npm/jspdf@2.5.2/+esm'),
    ]);
    const M = window.__METRICS || {};
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    let y = 18;
    doc.setFillColor(168, 85, 247);
    doc.rect(0, 0, 210, 8, 'F');
    doc.setFontSize(22); doc.setTextColor(20, 20, 30); doc.text('Francesco · 999purple999', 16, y); y += 7;
    doc.setFontSize(11); doc.setTextColor(80, 80, 100);
    doc.text('IT Technician · 19 yo · Biella, Piedmont, Italy', 16, y); y += 5;
    doc.text('klabindustries.hq@gmail.com · github.com/999purple999', 16, y); y += 10;
    doc.setDrawColor(168, 85, 247); doc.line(16, y, 194, y); y += 8;
    doc.setFontSize(14); doc.setTextColor(20, 20, 30); doc.text('METRICS', 16, y); y += 6;
    doc.setFontSize(10); doc.setTextColor(50, 50, 70);
    doc.text(`Total repositories: ${M.totalRepos || 10}  ·  Public: ${M.publicRepos || 5}  ·  Private: ${M.privateRepos || 5}`, 16, y); y += 5;
    doc.text(`Lines of code shipped: ${(M.totalLoc || 158000).toLocaleString()}  ·  Languages: ${(M.languages || []).length || 10}`, 16, y); y += 8;
    doc.setFontSize(14); doc.setTextColor(20, 20, 30); doc.text('PROJECTS', 16, y); y += 6;
    doc.setFontSize(10); doc.setTextColor(50, 50, 70);
    const lines = [
      'HALCYON — Self-hosted realtime mesh voice/video. Node + WebRTC + SQLite. GPL-3.',
      'K-Quest — Paid challenge marketplace. React + Cloudflare Workers + Stripe.',
      'K-Perception (private) — Zero-knowledge encrypted notes. Y.js CRDT + AES-256-GCM.',
      'KLab DSP suite (4 private) — Binaura, FXRack, StreamSauce, FRKX. C++20 + JUCE.',
      'Privacy Warfare — Roguelite action-RPG vanilla ES, GitHub Pages.',
      'KLab Games Arcade — 9 mini-games browser, zero dependencies.',
      'Capsula del Tempo + SISTEMI 5B — Two PWAs for ITIS Q. Sella.',
    ];
    lines.forEach((l) => { doc.text('• ' + l, 16, y); y += 5; });
    y += 5;
    doc.setFontSize(14); doc.setTextColor(20, 20, 30); doc.text('STACK', 16, y); y += 6;
    doc.setFontSize(10); doc.setTextColor(50, 50, 70);
    doc.text('JavaScript / TypeScript / C++20 / Python · WebRTC mesh · JUCE · Cloudflare Workers · Y.js CRDT · AES-256-GCM · Three.js · Stripe · Vitest / Playwright · AI orchestration', 16, y, { maxWidth: 178 });
    y += 14;
    doc.setFontSize(8); doc.setTextColor(120, 120, 140);
    doc.text(`Generated ${new Date().toISOString().slice(0, 10)} from live portfolio metrics. https://999purple999.github.io/portfolio/`, 16, 285);
    doc.save('Francesco-999purple999-CV.pdf');
    if (btn) btn.textContent = 'Download CV (PDF)';
  } catch (e) {
    console.warn('PDF export failed', e);
    if (btn) btn.textContent = 'PDF failed · retry';
  }
}
const cvBtn = document.getElementById('cv-export');
if (cvBtn) cvBtn.addEventListener('click', exportCVPdf);

// Console egg per i nerd che aprono F12
console.log(
  '%c👋 Ciao. Hai aperto la console.%c\n' +
  'Questo portfolio è single-page, vanilla JS, no build.\n' +
  'Sorgenti: https://github.com/999purple999/portfolio\n' +
  'Se vuoi parlarne: klabindustries.hq@gmail.com',
  'background:linear-gradient(135deg,#c084fc,#7c3aed); color:#fff; padding:6px 12px; border-radius:6px; font-weight:700;',
  'color:#a8b4d0; font-family:monospace; line-height:1.6;',
);
