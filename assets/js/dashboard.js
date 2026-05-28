// Dashboard renderer. Chart.js da CDN, animated counters, no build. v2 fix grafici.
const M = window.__METRICS;
const root = document.getElementById('dashboard-root');
if (root && M) {
  root.innerHTML = `
    <div class="dash-counter">
      <div class="dc-num" data-count="${M.totalRepos}">0</div>
      <div class="dc-lbl">repositories</div>
    </div>
    <div class="dash-counter">
      <div class="dc-num" data-count="${M.totalLoc}">0</div>
      <div class="dc-lbl">lines of code</div>
    </div>
    <div class="dash-counter">
      <div class="dc-num" data-count="${M.languages.length}">0</div>
      <div class="dc-lbl">languages mastered</div>
    </div>
    <div class="dash-counter">
      <div class="dc-num" data-count="${Math.round(M.totalBytes / 1024)}">0</div>
      <div class="dc-lbl">KB of source shipped</div>
    </div>

    <div class="dash-chart dash-chart-wide">
      <h4>commits, last 12 months</h4>
      <div class="chart-box"><canvas id="chart-commits"></canvas></div>
    </div>

    <div class="dash-chart">
      <h4>language breakdown</h4>
      <div class="chart-box"><canvas id="chart-langs"></canvas></div>
    </div>

    <div class="dash-langs">
      <h4>by bytes shipped</h4>
      <ul>
        ${M.languages
          .slice(0, 6)
          .map((l) => {
            const pct = Math.round((l.bytes / M.totalBytes) * 100);
            return `<li>
              <span class="ll-name">${l.name}</span>
              <div class="ll-bar"><div class="ll-fill" data-pct="${pct}" style="width:0%;background:${l.color}"></div></div>
              <span class="ll-pct">${pct}%</span>
            </li>`;
          })
          .join('')}
      </ul>
    </div>

    <div class="dash-latest">
      <h4>last activity</h4>
      <div class="dl-date">${M.lastPushed}</div>
      <div class="dl-desc">most recent push across ${M.publicRepos} public + ${M.privateRepos} private repos</div>
    </div>
  `;

  // Counters
  const counters = root.querySelectorAll('.dc-num');
  const animateCount = (el, target) => {
    const start = performance.now(), dur = 1400;
    function step(now) {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased).toLocaleString();
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  };
  const animateBars = () => {
    root.querySelectorAll('.ll-fill').forEach((b) => {
      const pct = b.dataset.pct;
      requestAnimationFrame(() => { b.style.width = pct + '%'; });
    });
  };
  const cio = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          animateCount(e.target, parseInt(e.target.dataset.count, 10));
          cio.unobserve(e.target);
        }
      });
    },
    { threshold: 0.3 },
  );
  counters.forEach((c) => cio.observe(c));

  function loadChartJs() {
    return new Promise((resolve, reject) => {
      if (window.Chart) return resolve();
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
      s.onload = () => resolve();
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  const dashSection = document.getElementById('dashboard');
  if (dashSection) {
    const dio = new IntersectionObserver(
      async (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          dio.disconnect();
          animateBars();
          try { await loadChartJs(); renderCharts(); } catch (e) { console.warn('Chart.js fail', e); }
        }
      },
      { rootMargin: '120px' },
    );
    dio.observe(dashSection);
  }

  function renderCharts() {
    const C = window.Chart;
    if (!C) return;
    const purple = '#a855f7', cyan = '#67e8f9', text2 = '#9aa4c0', grid = 'rgba(255,255,255,.06)';
    C.defaults.font.family = "'Geist Mono', ui-monospace, monospace";
    C.defaults.font.size = 11;
    C.defaults.color = text2;
    C.defaults.responsive = true;
    C.defaults.maintainAspectRatio = false;

    const monthLabels = { '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec' };

    const cmt = document.getElementById('chart-commits');
    if (cmt) {
      const ctx = cmt.getContext('2d');
      const grad = ctx.createLinearGradient(0, 0, 0, 220);
      grad.addColorStop(0, 'rgba(168,85,247,.35)');
      grad.addColorStop(1, 'rgba(168,85,247,0)');
      new C(cmt, {
        type: 'line',
        data: {
          labels: M.commitsMonthly.map((c) => monthLabels[c.m.slice(5)] + ' ' + c.m.slice(2, 4)),
          datasets: [{
            label: 'commits',
            data: M.commitsMonthly.map((c) => c.n),
            borderColor: purple,
            borderWidth: 2.5,
            backgroundColor: grad,
            fill: true,
            tension: 0.42,
            pointBackgroundColor: cyan,
            pointBorderColor: '#0a0c18',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 7,
          }],
        },
        options: {
          plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(8,10,20,.95)', borderColor: 'rgba(168,85,247,.4)', borderWidth: 1, padding: 10, titleColor: '#f5f7ff', bodyColor: cyan, displayColors: false } },
          scales: {
            x: { grid: { color: grid, drawTicks: false }, ticks: { color: text2, padding: 8 }, border: { display: false } },
            y: { beginAtZero: true, grid: { color: grid, drawTicks: false }, ticks: { color: text2, padding: 8, stepSize: 20 }, border: { display: false } },
          },
          interaction: { intersect: false, mode: 'index' },
          animation: { duration: 1200, easing: 'easeOutCubic' },
        },
      });
    }

    const lng = document.getElementById('chart-langs');
    if (lng) {
      const top6 = M.languages.slice(0, 6);
      new C(lng, {
        type: 'doughnut',
        data: {
          labels: top6.map((l) => l.name),
          datasets: [{
            data: top6.map((l) => l.bytes),
            backgroundColor: top6.map((l) => l.color),
            borderColor: '#0a0c18',
            borderWidth: 3,
            hoverOffset: 8,
          }],
        },
        options: {
          cutout: '64%',
          plugins: {
            legend: { position: 'right', labels: { color: text2, padding: 8, boxWidth: 10, boxHeight: 10, font: { size: 11 } } },
            tooltip: { backgroundColor: 'rgba(8,10,20,.95)', borderColor: 'rgba(168,85,247,.4)', borderWidth: 1, padding: 10, callbacks: { label: (ctx) => `${ctx.label}: ${(ctx.parsed / 1024).toFixed(0)} KB` } },
          },
          animation: { animateRotate: true, animateScale: true, duration: 1200 },
        },
      });
    }
  }
}

// Theme toggle
const themeBtn = document.getElementById('theme-toggle');
if (themeBtn) {
  const saved = (() => { try { return localStorage.getItem('portfolio:theme'); } catch { return null; } })();
  if (saved === 'light') document.documentElement.classList.add('light');
  themeBtn.textContent = document.documentElement.classList.contains('light') ? '🌙' : '☀';
  themeBtn.addEventListener('click', () => {
    const isLight = document.documentElement.classList.toggle('light');
    themeBtn.textContent = isLight ? '🌙' : '☀';
    try { localStorage.setItem('portfolio:theme', isLight ? 'light' : 'dark'); } catch {}
  });
}
