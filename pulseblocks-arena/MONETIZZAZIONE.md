# Monetizzazione con pubblicita

Aggiornato al 2026-05-11. Prima di pubblicare controlla sempre le pagine ufficiali, perche policy e requisiti possono cambiare.

## Strategia consigliata

1. Prima monetizza il sito/PWA con AdSense.
2. Quando diventa app Android/iOS, passa ad AdMob per l'app nativa o ibrida.
3. Usa annunci solo fuori dalla partita attiva: lobby, schermata finale, pausa, reward opzionali.
4. In Italia/UE prepara privacy policy, cookie policy e consenso prima di attivare annunci personalizzati.

## Fase 1: sito web/PWA con AdSense

1. Compra o collega un dominio serio, per esempio `gridrusharena.it`.
2. Pubblica il sito via HTTPS.
3. Aggiungi pagine minime: Privacy Policy, Cookie Policy, Contatti, Termini.
4. Crea contenuto originale attorno al gioco: pagina gioco, changelog, regole, classifica, supporto.
5. Apri AdSense e verifica di rispettare i requisiti: contenuto originale, accesso al codice HTML, eta minima e policy del programma.
6. Aggiungi il sito in AdSense e attendi approvazione.
7. Dopo approvazione, scegli tra:
   - Auto ads per una prima configurazione rapida.
   - Ad units manuali per controllare meglio posizione e frequenza.
8. Nel codice, sostituisci il placeholder `.ad-slot` con una unita annuncio reale.
9. Non mostrare annunci sopra la board durante una partita. Meglio banner piccolo in lobby e pannello finale.
10. Misura retention e sessioni: se la pubblicita rovina il gioco, guadagni meno nel medio periodo.

Fonti ufficiali utili:

- AdSense requisiti: https://support.google.com/adsense/answer/9724
- Setup annunci sito: https://support.google.com/adsense/answer/7037624
- Auto ads: https://support.google.com/adsense/answer/9261307

## Fase 2: consenso privacy per UE

1. Prima di servire annunci a utenti in EEA, UK o Svizzera, usa una CMP certificata Google integrata con IAB TCF quando richiesto.
2. Configura il messaggio consenso da Privacy & messaging o da una CMP certificata.
3. Mostra il consenso prima di caricare annunci personalizzati.
4. Salva e rispetta la scelta dell'utente.
5. Offri un link sempre visibile per modificare le preferenze privacy.

Fonti ufficiali utili:

- Requisiti CMP Google: https://support.google.com/adsense/answer/13554116
- EU User Consent Policy: https://support.google.com/adsense/answer/7670013
- AdMob Privacy & messaging: https://support.google.com/admob/answer/10107561

## Fase 3: futura app con AdMob

1. Crea account AdMob.
2. Inserisci i dati di pagamento.
3. Aggiungi l'app come unpublished durante sviluppo.
4. Quando e pronta, pubblicala su Google Play o App Store.
5. Collega la scheda store all'app in AdMob.
6. Verifica la proprieta app.
7. Pubblica `app-ads.txt` sul sito sviluppatore, alla radice del dominio.
8. Crea le ad unit:
   - Banner: lobby o schermata finale.
   - Interstitial: solo tra una partita e l'altra, mai durante il timer.
   - Rewarded: ricompensa opzionale, per esempio tema temporaneo o doppia XP cosmetica.
   - App open: da usare con cautela all'avvio, se non rovina l'esperienza.
9. Integra Google Mobile Ads SDK nella futura app.
10. In sviluppo usa solo annunci demo o test device.
11. Prima del lancio, controlla policy, frequenza, consenso, crash e performance.

Fonti ufficiali utili:

- AdMob getting started: https://support.google.com/admob/answer/15948559
- App ID e Ad Unit ID: https://support.google.com/admob/answer/7356431
- Test device: https://support.google.com/admob/answer/9691433
- App-ads.txt: https://support.google.com/admob/answer/9363762
- Formati AdMob: https://support.google.com/admob/answer/6128738

## Dove mettere gli annunci in GridRush Arena

1. Nel sito attuale: sostituisci il blocco `ad-slot` nel pannello partita con un banner responsivo, ma tienilo lontano dalla board.
2. A fine match: mostra un riepilogo con banner o interstitial dopo che il risultato e gia visibile.
3. Nel matchmaking: un banner leggero mentre si aspetta un giocatore.
4. Rewarded: solo su azioni volontarie, mai per obbligare a continuare una partita competitiva.

## Checklist prima del primo euro

- Dominio e HTTPS attivi.
- Privacy Policy, Cookie Policy, Termini e Contatti online.
- CMP/consenso configurati per UE.
- AdSense o AdMob approvato.
- Annunci testati senza click manuali sugli annunci reali.
- Nessun annuncio copre pulsanti o board.
- Frequenza interstitial limitata.
- Analytics configurato per capire retention, sessioni e RPM.
