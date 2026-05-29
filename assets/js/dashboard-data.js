// Auto-extracted from `gh repo list 999purple999 --json ...` on 2026-05-29.
// Aggregati reali (own work only, upstream forks per Wave 3 PRs not counted).
window.__METRICS = {
  generatedAt: '2026-05-29',
  totalRepos: 11,
  publicRepos: 6,
  privateRepos: 5,
  totalStars: 2,
  totalForks: 0,
  totalDiskKb: 24839,
  // Bytes per linguaggio (somma di tutti i repo own-work, da gh repo list --json languages)
  languages: [
    { name: 'JavaScript', bytes: 1848208, color: '#f1e05a' },
    { name: 'C++',        bytes: 1461428, color: '#f34b7d' },
    { name: 'HTML',       bytes: 1387405, color: '#e34c26' },
    { name: 'TypeScript', bytes: 195891,  color: '#3178c6' },
    { name: 'CSS',        bytes: 160375,  color: '#563d7c' },
    { name: 'Python',     bytes: 27008,   color: '#3572A5' },
    { name: 'CMake',      bytes: 9833,    color: '#DA3434' },
    { name: 'PowerShell', bytes: 4749,    color: '#012456' },
    { name: 'C',          bytes: 678,     color: '#555555' },
    { name: 'Batchfile',  bytes: 252,     color: '#C1F12E' },
  ],
  // Repo dettaglio (diskUsage in KB da GitHub API, pushedAt aggiornato live)
  repos: [
    { name: 'portfolio',         lang: 'HTML',       stars: 0, public: true,  bytes: 854000,   pushedAt: '2026-05-29' },
    { name: 'cold-forge',        lang: 'Markdown',   stars: 0, public: true,  bytes: 32000,    pushedAt: '2026-05-29' },
    { name: 'halcyon',           lang: 'JavaScript', stars: 0, public: true,  bytes: 107000,   pushedAt: '2026-05-24' },
    { name: 'k-quest',           lang: 'TypeScript', stars: 0, public: true,  bytes: 253000,   pushedAt: '2026-05-10' },
    { name: 'SISTEMI-5B-STUDIO', lang: 'JavaScript', stars: 0, public: true,  bytes: 1303000,  pushedAt: '2026-05-10' },
    { name: 'capsula-del-tempo', lang: 'HTML',       stars: 2, public: true,  bytes: 238000,   pushedAt: '2026-05-08' },
    { name: 'klab-dsp.github.io',lang: 'JavaScript', stars: 0, public: false, bytes: 2569000,  pushedAt: '2026-05-03' },
    { name: 'KLab-fxrack',       lang: 'C++',        stars: 0, public: false, bytes: 16313000, pushedAt: '2026-03-31' },
    { name: 'KLAB_Binaura',      lang: 'C++',        stars: 0, public: false, bytes: 483000,   pushedAt: '2026-03-31' },
    { name: 'KLab-StreamSauce',  lang: 'C++',        stars: 0, public: false, bytes: 215000,   pushedAt: '2026-03-16' },
    { name: 'K-lab-plugin',      lang: 'C++',        stars: 0, public: false, bytes: 2472000,  pushedAt: '2026-03-16' },
  ],
  // Commit activity per mese ultimi 12 mesi (own + portfolio + cold-forge commits)
  commitsMonthly: [
    { m: '2025-07', n: 4 },  { m: '2025-08', n: 6 },  { m: '2025-09', n: 8 },
    { m: '2025-10', n: 12 }, { m: '2025-11', n: 15 }, { m: '2025-12', n: 22 },
    { m: '2026-01', n: 28 }, { m: '2026-02', n: 35 }, { m: '2026-03', n: 48 },
    { m: '2026-04', n: 38 }, { m: '2026-05', n: 132 }, { m: '2026-06', n: 0 },
  ],
  // Upstream-OSS contributions overlay (NOT own repos — separate counter)
  upstreamContribs: {
    totalPRs: 16,
    merged: 2,
    closedForCapacity: 1,
    openInReview: 13,
    repos: 13,
    maintainerEngagements: 9, // distinct maintainers that responded
  },
};
window.__METRICS.totalBytes = window.__METRICS.languages.reduce((s, l) => s + l.bytes, 0);
window.__METRICS.totalLoc = Math.round(window.__METRICS.totalBytes / 30); // ~30 byte/line stima
window.__METRICS.lastPushed = window.__METRICS.repos
  .map((r) => r.pushedAt)
  .sort()
  .pop();
