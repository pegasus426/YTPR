# YouTube Music Random Playlist Generator

Una web app Node.js completa che permette di creare playlist casuali su YouTube Music utilizzando brani dai canali che segui.

## 🎵 Caratteristiche

- **Autenticazione OAuth2**: Accesso sicuro al tuo account YouTube
- **Due Modalità di Generazione**:
  - **🎲 Casuali dai Seguiti**: Crea playlist con brani scelti casualmente dai canali che segui
  - **❤️ Dai Preferiti**: Genera playlist basate sui tuoi video piaciuti, selezionando gli artisti più presenti nei tuoi like
- **Personalizzazione Avanzata**: 
  - Scegli quanti artisti includere (slider da 5 a 100 per i preferiti)
  - Imposta quanti brani per artista
  - Visualizza statistiche sui tuoi artisti più likati
- **Salvataggio Automatico**: Salva le playlist direttamente su YouTube Music
- **Interfaccia Intuitiva**: UI moderna e responsive con switch tra modalità

## 📋 Prerequisiti

- Node.js (v14 o superiore)
- Un account Google/YouTube
- Credenziali OAuth2 da Google Cloud Console

## 🚀 Installazione

### 1. Clona/Scarica il progetto

```bash
cd youtube-music-randomizer
```

### 2. Installa le dipendenze

```bash
npm install
```

### 3. Configura le credenziali OAuth2

#### a. Vai su Google Cloud Console
Visita [Google Cloud Console](https://console.cloud.google.com/)

#### b. Crea un nuovo progetto
1. Clicca su "Seleziona un progetto" in alto
2. Clicca "Nuovo progetto"
3. Inserisci un nome (es. "YouTube Playlist Randomizer")
4. Clicca "Crea"

#### c. Abilita YouTube Data API v3
1. Nel menu laterale, vai su "API e servizi" > "Libreria"
2. Cerca "YouTube Data API v3"
3. Clicca sulla API e poi su "Abilita"

#### d. Crea credenziali OAuth 2.0
1. Vai su "API e servizi" > "Credenziali"
2. Clicca "Crea credenziali" > "ID client OAuth"
3. Se richiesto, configura la schermata consenso OAuth:
   - Tipo di utente: Esterno
   - Compila i campi obbligatori (nome app, email)
   - Aggiungi scope: `youtube.readonly` e `youtube.force-ssl`
4. Torna a "Credenziali" e crea un nuovo "ID client OAuth"
5. Tipo di applicazione: "Applicazione web"
6. URI di reindirizzamento autorizzati: `http://localhost:3000/oauth2callback`
7. Clicca "Crea"

#### e. Copia le credenziali
1. Copia il tuo CLIENT_ID e CLIENT_SECRET
2. Crea un file `.env` nella root del progetto:

```bash
cp .env.example .env
```

3. Modifica `.env` e inserisci le tue credenziali:

```env
CLIENT_ID=il_tuo_client_id
CLIENT_SECRET=il_tuo_client_secret
REDIRECT_URI=http://localhost:3000/oauth2callback
PORT=3000
SESSION_SECRET=una_stringa_casuale_segreta
```

## 🎮 Utilizzo

### 1. Avvia il server

```bash
npm start
```

Oppure in modalità sviluppo con auto-reload:

```bash
npm run dev
```

### 2. Apri il browser

Vai su `http://localhost:3000`

### 3. Autorizza l'applicazione

1. Clicca su "Accedi con YouTube"
2. Accedi con il tuo account Google
3. Autorizza l'applicazione ad accedere ai tuoi dati YouTube

### 4. Genera playlist

1. Imposta il numero di artisti da includere
2. Imposta il numero di brani per artista
3. Clicca "Genera Playlist Casuale"
4. Visualizza l'anteprima dei brani selezionati
5. Inserisci un nome per la playlist
6. Clicca "Salva su YouTube"

### 5. Modalità Preferiti (Opzionale)

La modalità "Dai Preferiti" analizza i tuoi video piaciuti su YouTube e crea playlist basate sui tuoi artisti più ascoltati:

1. Clicca sul pulsante "❤️ Dai Preferiti"
2. Usa lo slider per selezionare quanti artisti includere (es. Top 10, Top 50, Top 100)
3. L'algoritmo conta i like per ogni canale/artista
4. Seleziona casualmente brani dai tuoi video preferiti degli artisti più likati
5. Visualizza la classifica dei tuoi top artisti con il numero di like
6. Salva la playlist su YouTube

## 📁 Struttura del Progetto

```
youtube-music-randomizer/
├── server.js              # Server Express principale
├── package.json           # Dipendenze del progetto
├── .env.example          # Template variabili d'ambiente
├── .env                  # Variabili d'ambiente (non committare!)
├── README.md             # Questo file
├── public/               # File statici
│   ├── style.css        # Stili CSS
│   └── app.js           # JavaScript frontend
└── views/               # Template EJS
    ├── index.ejs        # Pagina principale
    └── dashboard.ejs    # Dashboard
```

## 🔧 API Endpoints

### GET `/`
Pagina principale con login

### GET `/auth`
Inizia il processo di autenticazione OAuth2

### GET `/oauth2callback`
Callback OAuth2 (configurato in Google Cloud Console)

### GET `/dashboard`
Dashboard principale (richiede autenticazione)

### GET `/api/liked-videos`
Ottiene i video piaciuti dall'utente (massimo 500)

### POST `/api/generate-random-playlist`
Genera una playlist casuale dai canali seguiti
```json
{
  "artistCount": 5,
  "songsPerArtist": 3
}
```

### POST `/api/generate-liked-playlist`
Genera una playlist basata sui video preferiti
```json
{
  "topArtistsCount": 10,
  "songsPerArtist": 3
}
```
Risposta include: videos, artistCount, topArtists (con nome e numero di like), totalLikedVideos

### POST `/api/create-playlist`
Salva la playlist su YouTube
```json
{
  "title": "La mia playlist",
  "description": "Descrizione",
  "videoIds": ["id1", "id2", ...]
}
```

### GET `/logout`
Disconnessione

## 🛡️ Sicurezza

- Le credenziali OAuth2 sono memorizzate in variabili d'ambiente
- Le sessioni utilizzano cookie sicuri
- Non vengono salvate password
- I token di accesso sono gestiti da Google OAuth2

## ⚠️ Note Importanti

1. **Quote API**: YouTube Data API ha limiti giornalieri. L'app usa una quota per ogni operazione.
2. **Privacy**: Le playlist create sono private per default
3. **Canali Musicali**: L'app funziona meglio con canali che pubblicano musica
4. **Test Mode**: In sviluppo, Google richiede l'aggiunta manuale degli utenti di test

## 🐛 Troubleshooting

### "Errore durante l'autenticazione"
- Verifica che CLIENT_ID e CLIENT_SECRET siano corretti
- Controlla che l'URI di reindirizzamento sia esattamente `http://localhost:3000/oauth2callback`
- Assicurati che YouTube Data API v3 sia abilitata

### "Nessun video trovato"
- Verifica di seguire canali che pubblicano video
- Alcuni canali potrebbero non avere video musicali
- Prova ad aumentare il numero di artisti

### "Quota exceeded"
- Hai raggiunto il limite giornaliero di API calls
- Aspetta 24 ore o richiedi un aumento quota in Google Cloud Console

## 📝 Licenza

ISC

## 🤝 Contributi

I contributi sono benvenuti! Sentiti libero di aprire issue o pull request.

## 📧 Supporto

Per problemi o domande, apri un issue su GitHub.

---

Creato con ❤️ per gli amanti della musica casuale
