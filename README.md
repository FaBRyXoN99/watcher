<h1 align="center">
  <img src="public/logo.png" width="100" alt="Watcher Logo" />
  <br>
  Watcher
</h1>

<p align="center">
  <b>Il tuo tracker personale, moderno e definitivo per Film e Serie TV.</b><br>
  Tieni traccia di ciò che guardi, esplora nuovi titoli, sincronizza i tuoi dispositivi e scopri le tue abitudini di visione.
</p>

---

## 🌟 Panoramica delle Funzionalità

**Watcher** è una Web App / PWA (Progressive Web App) pensata per offrirti un'esperienza premium, simile a quella delle piattaforme di streaming reali, ma dedicata esclusivamente al tracciamento della tua libreria personale. 

### 🎬 Esplorazione e Ricerca (Powered by TMDB & JustWatch)
- **Home & Scopri**: Esplora i titoli di tendenza, i film più popolari, le serie TV in onda oggi e molto altro.
- **Ricerca Globale**: Cerca qualsiasi film o serie TV in tempo reale grazie all'integrazione con *The Movie Database (TMDB)*.
- **Dove Guardare**: Scopri immediatamente su quale piattaforma (Netflix, Prime Video, Disney+, ecc.) un titolo è disponibile in streaming, noleggio o acquisto tramite l'integrazione con *JustWatch*.
- **Trailer**: Guarda i trailer ufficiali su YouTube direttamente dall'app.

### 📅 Tracking Avanzato e Uscite
- **Segna come Visto**: Aggiungi il tuo voto (da 0.5 a 5 stelle), indica la piattaforma su cui lo hai visto e la data esatta.
- **Gestione Serie TV**: Segna intere stagioni o singoli episodi come visti.
- **Date d'Uscita e Countdown**: Visualizza esattamente quando uscirà un nuovo film o un nuovo episodio. I titoli non ancora usciti mostreranno un comodo banner "*Esce tra X giorni*".

### 📊 Il tuo Profilo e Statistiche
- **Profili Multipli**: Crea profili diversi per te, la tua famiglia o i tuoi amici, mantenendo i dati completamente separati (stile Netflix).
- **Statistiche Dinamiche**: Scopri quanto tempo hai speso guardando film e serie TV, i tuoi generi preferiti, le piattaforme che usi di più e la distribuzione degli anni di uscita.
- **Heatmap delle Visioni**: Un calendario interattivo che mostra la tua costanza nel guardare titoli durante l'anno.

### 🗂️ Watchlist e Collezioni
- **Watchlist**: Salva i titoli che vuoi guardare in futuro in una lista dedicata.
- **Collezioni Personalizzate**: Crea cartelle tematiche (es. "Film Horror da vedere ad Halloween", "Maratona Marvel") per organizzare al meglio i tuoi titoli.

### ☁️ Sincronizzazione e Backup
- **Google Drive Sync**: Collega il tuo account Google e attiva la *Sincronizzazione Automatica*. I tuoi dati saranno sempre al sicuro e aggiornati su tutti i tuoi dispositivi.
- **Backup Locale**: Esporta o importa comodamente tutti i tuoi dati o quelli di un singolo profilo in formato JSON.
- **Importa da TV Time**: Stanco di TV Time? Puoi importare facilmente la tua cronologia e la tua watchlist scaricando l'esportazione dei tuoi dati in CSV/JSON e caricandola direttamente su Watcher!

### 🎨 Personalizzazione dell'Interfaccia
- **Temi e Colori**: Scegli il tuo colore di accento preferito per adattare l'interfaccia ai tuoi gusti.
- **Icona dell'App Personalizzata**: Scegli tra diverse icone predefinite o carica un'immagine dalla tua galleria per personalizzare l'icona che apparirà sulla schermata Home del tuo smartphone.

---

## 📱 Come installare l'App su Smartphone / PC (PWA)

Watcher è costruito per funzionare perfettamente sia su browser Desktop che come App nativa sui dispositivi mobili:

1. Visita il link di Watcher dal tuo browser mobile (es. Safari su iOS o Chrome su Android).
2. Nelle impostazioni del browser, tocca **"Aggiungi a schermata Home"** (o "Installa App").
3. L'App verrà aggiunta al tuo dispositivo. Goditi l'esperienza a schermo intero, fluida e senza bordi del browser!

---

## ⚙️ Configurazione per Sviluppatori

Per eseguire il progetto localmente:

1. Clona il repository.
2. Assicurati di avere `Node.js` e `npm` installati.
3. Installa le dipendenze:
   ```bash
   npm install
   ```
4. Avvia il server di sviluppo:
   ```bash
   npm run dev
   ```
5. *(Opzionale)* Per compilare l'app per la produzione:
   ```bash
   npm run build
   ```

### Chiave API TMDB
Watcher utilizza un token di lettura (Bearer Token) gratuito di TMDB per funzionare. All'interno delle **Impostazioni** dell'app è possibile inserire la propria chiave API (generabile registrandosi gratuitamente su [themoviedb.org](https://www.themoviedb.org/)). Se non viene inserita alcuna chiave, l'app funzionerà offline limitandosi a mostrare i dati mock di esempio.

---

## 🤝 Supporto

Sviluppato con ❤️ per gli amanti del cinema e delle serie TV.  
Se riscontri bug o hai idee per nuove funzionalità, sentiti libero di aprire una *Issue* su GitHub!
