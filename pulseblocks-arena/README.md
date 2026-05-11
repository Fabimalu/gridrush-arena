# GridRush Arena

Prototipo PWA di un puzzle battle ispirato ai block puzzle, con nome, grafica e asset originali.

## Avvio

```powershell
npm start
```

Poi apri:

```text
http://localhost:4173
```

## Cosa include

- Inserimento nome all'ingresso.
- Partite da 1, 2, 5 e 10 minuti.
- Stanza amici con codice condivisibile.
- Matchmaking online sul server locale.
- Sezione situazioni con griglie iniziali preimpostate.
- Temi selezionabili.
- UI da gioco/PWA, pronta come base per futura app mobile.
- Spazio pubblicitario placeholder nel pannello partita.

## Note multiplayer

Il server attuale usa memoria locale. Funziona per browser collegati allo stesso server, ma per giocare online su internet va pubblicato su un hosting Node con HTTPS. Per produzione servono anche account, anti-cheat server-side, rate limit e persistenza delle partite.
