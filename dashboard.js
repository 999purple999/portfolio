// Dashboard renderer. Chart.js da CDN, animated counters, no build.
const M = window.__METRICS;
const root = document.getElementById('dashboard-root');
if (root && M) {
  root.innerHTML = `
    <div class="dash-counter" data-tilt>
      <div class="dc-num" data-count="${M.totalRepos}">0</div>
      <div class="dc-lbl">repositories</div>
    </div>
    <div class="dash-counter" data-tilt>
      <div class="dc-num" data-count="${M.totalLoc}">0</div>
      <div class="dc-lbl">lines of code</div>
    </div>
    <div class="dash-counter" data-tilt>
      <div class="dc-num" data-count="${M.languages.length}">0</div>
      <div class="dc-lbl">languages mastered</div>
    </div>
    <div class="dash-counter" data-tilt>
      <div class="dc-num" data-count="${Math.round(M.totalBytes / 1024)}">0</div>
      <div class="dc-lbl">KB of source shipped</div>
    </div>

    <div class="dash-chart dash-chart-wide" data-tilt>
      <h4>commits — last 12 months</h4>
      <canvas id="chart-commits" height="120"></canvas>
    </div>

    <div class="dash-chart" data-tilt>
      <h4>language breakdown</h4>
      <canvas id="chart-langs" height="120"></canvas>
    </div>

    <div class="dash-langs" data-tilt>
      <h4>by bytes shipped</h4>
      <ul>
        ${M.languages
          .slice(0, 6)
          .map((l) => {
            const pct = Math.round((l.bytes / M.totalBytes) * 100);
            return `<li>
              <span class="ll-name">${l.name}</span>
              <div class="ll-bar"><div class="ll-fill" style="width:${pct}%;background:${l.color}"></div></div>
              <span class="ll-pct">${pct}%</span>
            </li>`;
          })
          .join('')}
      </ul>
    </div>

    <div class="dash-latest" data-tilt>
      <h4>last activity</h4>
      <div class="dl-date">${M.lastPushed}</div>
      <div class="dl-desc">most recent push across ${M.publicRepos} public + ${M.privateRepos} private repos</div>
    </div>
  `;

  // === Animated counters (ease-out 1.2s) ===
  const counters = root.querySelectorAll('.dc-num');
  const animateCount = (el, target) => {
    const start = performance.now();
    const dur = 1400;
    function step(now) {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased).toLocaleString();
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
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

  // === Chart.js setup (load CDN dinamicamente per lazy) ===
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
          try {
            await loadChartJs();
            renderCharts();
          } catch (e) {
            console.warn('Chart.js failed to load', e);
          }
        }
      },
      { rootMargin: '120px' },
    );
    dio.observe(dashSection);
  }

  function renderCharts() {
    const purple = '#a855f7', cyan = '#67e8f9', text2 = '#9aa4c0';
    const cmt = document.getElementById('chart-commits');
    if (cmt) {
      new window.Chart(cmt, {
        type: 'line',
        data: {
          labels: M.commitsMonthly.map((c) => c.m.slice(5)),
          datasets: [{
            label: 'commits',
            data: M.commitsMonthly.map((c) => c.n),
            borderColor: purple,
            backgroundColor: 'rgba(168,85,247,.15)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: cyan,
            pointBorderColor: '#fff',
            pointRadius: 4,
            pointHoverRadius: 7,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: text2, font: { family: 'Geist Mono' } }, grid: { color: 'rgba(255,255,255,.04)' } },
            y: { ticks: { color: text2, font: { family: 'Geist Mono' } }, grid: { color: 'rgba(255,255,255,.04)' }, beginAtZero: true },
          },
        },
      });
    }
    const lng = document.getElementById('chart-langs');
    if (lng) {
      const top6 = M.languages.slice(0, 6);
      new window.Chart(lng, {
        type: 'doughnut',
        data: {
          labels: top6.map((l) => l.name),
          datasets: [{ data: top6.map((l) => l.bytes), backgroundColor: top6.map((l) => l.color), borderColor: '#0a0c18', borderWidth: 2 }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '62%',
          plugins: {
            legend: { position: 'right', labels: { color: text2, font: { family: 'Geist Mono', size: 11 } } },
          },
        },
      });
    }
  }
}

// === Theme toggle (dark default, light optional) ===
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
