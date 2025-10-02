# So'mda muddatli to'lov kalkulyatori (React + Vite + Tailwind)

USD ISHTIROK ETMAYDI. Narxlar so'mda hisoblanadi.

## Lokal ishga tushirish
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```
`dist/` papkasi tayyor bo'ladi.

## Netlify deploy (GitHub orqali tavsiya)
1. Kodni GitHub repo'ga yuklang.
2. Netlify -> Add new site -> Import an existing project -> GitHub -> reponi tanlang.
3. Build command: `npm run build`, Publish directory: `dist`
4. Deploy tugadi.

## SPA marshrutlash
`netlify.toml` ichidagi redirectlar tufayli barcha yo'llar `index.html`ga yo'naltiriladi.
