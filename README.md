# Medusa Ledger — Open Source landing (gh-pages)

Landing + usage manual for the **Medusa Ledger** open source library.

- Site: https://wbsckt3.github.io/medusa-ledger/
- Repo (code + this site on `gh-pages`): https://github.com/wbsckt3/medusa-ledger
- Commercial Cloud product: https://wbsckt3.github.io/medusa-ledger-business/

## Local preview

Open `index.html` or serve the folder with any static server.

## i18n

Edit `locales/es.json` and `locales/en.json`, then rebuild embed:

```bash
node -e "const fs=require('fs');const path=require('path');const d=__dirname;const es=JSON.parse(fs.readFileSync(path.join(d,'locales','es.json'),'utf8'));const en=JSON.parse(fs.readFileSync(path.join(d,'locales','en.json'),'utf8'));fs.writeFileSync(path.join(d,'scripts','locales-embed.js'),'window.TUKI_I18N_RESOURCES = '+JSON.stringify({es:{translation:es},en:{translation:en}})+';');"
```
