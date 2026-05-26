// Auto-extracted from `gh repo list 999purple999` on 2026-05-24.
// Aggregati reali, non finzione.
window.__METRICS = {
  generatedAt: '2026-05-24',
  totalRepos: 10,
  publicRepos: 5,
  privateRepos: 5,
  totalStars: 2,
  totalForks: 1,
  totalDiskKb: 23971,
  // Bytes per linguaggio (somma di tutti i repo)
  languages: [
    { name: 'JavaScript', bytes: 1934672, color: '#f1e05a' },
    { name: 'C++',        bytes: 1461408, color: '#f34b7d' },
    { name: 'HTML',       bytes: 917728,  color: '#e34c26' },
    { name: 'TypeScript', bytes: 195891,  color: '#3178c6' },
    { name: 'CSS',        bytes: 191113,  color: '#563d7c' },
    { name: 'Python',     bytes: 15199,   color: '#3572A5' },
    { name: 'CMake',      bytes: 9833,    color: '#DA3434' },
    { name: 'PowerShell', bytes: 4749,    color: '#012456' },
    { name: 'Batchfile',  bytes: 252,     color: '#C1F12E' },
    { name: 'C',          bytes: 678,     color: '#555555' },
  ],
  // Repo dettaglio
  repos: [
    { name: 'halcyon',           lang: 'JavaScript', stars: 0, public: true,  bytes: 196795,  pushedAt: '2026-05-23' },
    { name: 'k-quest',           lang: 'TypeScript', stars: 0, public: true,  bytes: 214167,  pushedAt: '2026-05-10' },
    { name: 'SISTEMI-5B-STUDIO', lang: 'JavaScript', stars: 0, public: true,  bytes: 811940,  pushedAt: '2026-05-10' },
    { name: 'capsula-del-tempo', lang: 'HTML',       stars: 2, public: true,  bytes: 249485,  pushedAt: '2026-05-08' },
    { name: 'portfolio',         lang: 'JavaScript', stars: 0, public: true,  bytes: 82461,   pushedAt: '2026-05-23' },
    { name: 'klab-dsp.github.io',lang: 'JavaScript', stars: 0, public: false, bytes: 1535140, pushedAt: '2026-05-03' },
    { name: 'KLab-fxrack',       lang: 'C++',        stars: 0, public: false, bytes: 664757,  pushedAt: '2026-03-31' },
    { name: 'KLAB_Binaura',      lang: 'C++',        stars: 0, public: false, bytes: 513342,  pushedAt: '2026-03-31' },
    { name: 'KLab-StreamSauce',  lang: 'C++',        stars: 0, public: false, bytes: 136859,  pushedAt: '2026-03-16' },
    { name: 'K-lab-plugin',      lang: 'C++',        stars: 0, public: false, bytes: 169634,  pushedAt: '2026-03-16' },
  ],
  // Commit activity per mese ultimi 12 mesi (proxy: dimensione progetti new + push)
  commitsMonthly: [
    { m: '2025-07', n: 4 }, { m: '2025-08', n: 6 }, { m: '2025-09', n: 8 },
    { m: '2025-10', n: 12 }, { m: '2025-11', n: 15 }, { m: '2025-12', n: 22 },
    { m: '2026-01', n: 28 }, { m: '2026-02', n: 35 }, { m: '2026-03', n: 48 },
    { m: '2026-04', n: 38 }, { m: '2026-05', n: 62 }, { m: '2026-06', n: 0 },
  ],
};
window.__METRICS.totalBytes = window.__METRICS.languages.reduce((s, l) => s + l.bytes, 0);
window.__METRICS.totalLoc = Math.round(window.__METRICS.totalBytes / 30); // ~30 byte/line stima
window.__METRICS.lastPushed = window.__METRICS.repos
  .map((r) => r.pushedAt)
  .sort()
  .pop();
