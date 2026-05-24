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

// Console egg per i nerd che aprono F12
console.log(
  '%c👋 Ciao. Hai aperto la console.%c\n' +
  'Questo portfolio è single-page, vanilla JS, no build.\n' +
  'Sorgenti: https://github.com/999purple999/portfolio\n' +
  'Se vuoi parlarne: klabindustries.hq@gmail.com',
  'background:linear-gradient(135deg,#c084fc,#7c3aed); color:#fff; padding:6px 12px; border-radius:6px; font-weight:700;',
  'color:#a8b4d0; font-family:monospace; line-height:1.6;',
);
