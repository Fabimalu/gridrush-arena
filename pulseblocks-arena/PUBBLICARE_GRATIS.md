# Pubblicare GridRush Arena gratis

Aggiornato al 2026-05-11.

## Soluzione consigliata: Render Free

Per questo progetto la soluzione gratis piu semplice e pubblicarlo tutto su Render come **Web Service Node**. In questo modo funzionano sia il sito sia le API multiplayer (`/api/rooms`, `/api/matchmake`, eventi live).

Netlify va bene per il solo frontend statico, ma non per tenere acceso `server.js` come server Node persistente.

## Passaggi

1. Crea un account su https://render.com
2. Metti questa cartella su GitHub come repository, oppure caricala in un repo esistente.
3. Su Render clicca **New**.
4. Scegli **Web Service**.
5. Collega il repository GitHub.
6. Seleziona il piano **Free**.
7. Usa queste impostazioni:

```text
Name: gridrush-arena
Runtime: Node
Build Command: npm install
Start Command: npm start
Plan: Free
```

8. Pubblica.
9. Render ti dara un link tipo:

```text
https://gridrush-arena.onrender.com
```

Quello e il link da mandare agli amici.

## Limiti del piano gratis

- Dopo circa 15 minuti senza traffico, il server puo andare in sleep.
- Quando qualcuno riapre il sito, puo servire circa un minuto per riaccendersi.
- Le stanze sono salvate in memoria: se il server si riavvia o dorme, le stanze aperte spariscono.
- Va bene per test, amici e prototipo. Per produzione seria servira un backend a pagamento o un database/realtime service.

## Variante Netlify + Render

Se vuoi usare Netlify comunque:

1. Pubblica il frontend su Netlify.
2. Pubblica `server.js` su Render.
3. Modifica il frontend per chiamare l'URL Render invece di `/api/...`.

Questa variante e piu complessa. Per ora conviene Render unico.
