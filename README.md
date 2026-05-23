# portfolio

Portfolio personale di Francesco (`999purple999`).

🌐 **Live**: https://999purple999.github.io/portfolio/

Sito statico single-page, vanilla JS + Three.js da CDN, **zero build step**.
Deploy automatico GitHub Pages da `main`.

## Struttura

```
.
├── index.html      markup + sezioni
├── style.css       design system + responsive
├── hero.js         Three.js particle scene (25k points, mobile 8k)
├── app.js          scroll reveals, tilt cards, phone reveal anti-bot
└── README.md
```

## Configurare il numero anti-bot

Per privacy il numero non è nel codice del repo. In `app.js` setta `TEL_B64`:

```js
// console browser:
btoa('XXXXXXXXXX')   // → 'BASE64STRING'
// poi in app.js:
const TEL_B64 = 'BASE64STRING';
```

Il numero appare solo dopo click utente esplicito (gesture = bot semplici non lo leggono).

## Local preview

```cmd
python -m http.server 8080
```
