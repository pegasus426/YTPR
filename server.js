require('dotenv').config();
const express = require('express');
const session = require('express-session');
const { google } = require('googleapis');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurazione OAuth2
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// Scopes necessari per YouTube
const SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/youtube.force-ssl'
];

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Impostare true in produzione con HTTPS
}));

// Template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Route principale
app.get('/', (req, res) => {
  res.render('index', { isAuthenticated: !!req.session.tokens });
});

// Inizia il processo di autenticazione
app.get('/auth', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
  res.redirect(authUrl);
});

// Callback OAuth2
app.get('/oauth2callback', async (req, res) => {
  const { code } = req.query;
  
  try {
    const { tokens } = await oauth2Client.getToken(code);
    req.session.tokens = tokens;
    oauth2Client.setCredentials(tokens);
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Errore durante l\'autenticazione:', error);
    res.redirect('/?error=auth_failed');
  }
});

// Dashboard
app.get('/dashboard', (req, res) => {
  if (!req.session.tokens) {
    return res.redirect('/');
  }
  res.render('dashboard');
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// API: Ottieni canali seguiti
app.get('/api/subscriptions', async (req, res) => {
  if (!req.session.tokens) {
    return res.status(401).json({ error: 'Non autenticato' });
  }

  try {
    oauth2Client.setCredentials(req.session.tokens);
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    
    const subscriptions = [];
    let pageToken = null;
    
    do {
      const response = await youtube.subscriptions.list({
        part: 'snippet',
        mine: true,
        maxResults: 50,
        pageToken: pageToken
      });
      
      subscriptions.push(...response.data.items);
      pageToken = response.data.nextPageToken;
    } while (pageToken);
    
    res.json(subscriptions);
  } catch (error) {
    console.error('Errore nel recupero delle sottoscrizioni:', error);
    res.status(500).json({ error: 'Errore nel recupero delle sottoscrizioni' });
  }
});

// API: Cerca video di un canale
app.post('/api/search-videos', async (req, res) => {
  if (!req.session.tokens) {
    return res.status(401).json({ error: 'Non autenticato' });
  }

  const { channelId, maxResults = 10 } = req.body;

  try {
    oauth2Client.setCredentials(req.session.tokens);
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    
    const response = await youtube.search.list({
      part: 'snippet',
      channelId: channelId,
      type: 'video',
      videoCategoryId: '10', // Categoria Musica
      maxResults: maxResults,
      order: 'date'
    });
    
    res.json(response.data.items);
  } catch (error) {
    console.error('Errore nella ricerca dei video:', error);
    res.status(500).json({ error: 'Errore nella ricerca dei video' });
  }
});

// API: Genera playlist casuale
app.post('/api/generate-random-playlist', async (req, res) => {
  if (!req.session.tokens) {
    return res.status(401).json({ error: 'Non autenticato' });
  }

  const { artistCount = 5, songsPerArtist = 3 } = req.body;

  try {
    oauth2Client.setCredentials(req.session.tokens);
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    
    // Ottieni tutte le sottoscrizioni
    const subscriptions = [];
    let pageToken = null;
    
    do {
      const response = await youtube.subscriptions.list({
        part: 'snippet',
        mine: true,
        maxResults: 50,
        pageToken: pageToken
      });
      
      subscriptions.push(...response.data.items);
      pageToken = response.data.nextPageToken;
    } while (pageToken);
    
    // Seleziona artisti casuali
    const shuffled = subscriptions.sort(() => 0.5 - Math.random());
    const selectedArtists = shuffled.slice(0, Math.min(artistCount, subscriptions.length));
    
    // Raccogli video da ogni artista
    const allVideos = [];
    
    for (const artist of selectedArtists) {
      try {
        const searchResponse = await youtube.search.list({
          part: 'snippet',
          channelId: artist.snippet.resourceId.channelId,
          type: 'video',
          videoCategoryId: '10',
          maxResults: 50,
          order: 'date'
        });
        
        const videos = searchResponse.data.items || [];
        const shuffledVideos = videos.sort(() => 0.5 - Math.random());
        const selectedVideos = shuffledVideos.slice(0, songsPerArtist).map(v => ({
          videoId: v.id.videoId,
          title: v.snippet.title,
          artist: artist.snippet.title,
          thumbnail: v.snippet.thumbnails.default.url
        }));
        
        allVideos.push(...selectedVideos);
      } catch (error) {
        console.error(`Errore nel recupero video per ${artist.snippet.title}:`, error);
      }
    }
    
    res.json({
      videos: allVideos,
      artistCount: selectedArtists.length
    });
  } catch (error) {
    console.error('Errore nella generazione della playlist:', error);
    res.status(500).json({ error: 'Errore nella generazione della playlist' });
  }
});

// API: Crea playlist su YouTube
app.post('/api/create-playlist', async (req, res) => {
  if (!req.session.tokens) {
    return res.status(401).json({ error: 'Non autenticato' });
  }

  const { title, description, videoIds } = req.body;

  try {
    oauth2Client.setCredentials(req.session.tokens);
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    
    // Crea la playlist
    const playlistResponse = await youtube.playlists.insert({
      part: 'snippet,status',
      requestBody: {
        snippet: {
          title: title,
          description: description || 'Playlist generata casualmente'
        },
        status: {
          privacyStatus: 'private'
        }
      }
    });
    
    const playlistId = playlistResponse.data.id;
    
    // Aggiungi video alla playlist
    for (const videoId of videoIds) {
      try {
        await youtube.playlistItems.insert({
          part: 'snippet',
          requestBody: {
            snippet: {
              playlistId: playlistId,
              resourceId: {
                kind: 'youtube#video',
                videoId: videoId
              }
            }
          }
        });
      } catch (error) {
        console.error(`Errore nell'aggiunta del video ${videoId}:`, error);
      }
    }
    
    res.json({
      success: true,
      playlistId: playlistId,
      playlistUrl: `https://www.youtube.com/playlist?list=${playlistId}`
    });
  } catch (error) {
    console.error('Errore nella creazione della playlist:', error);
    res.status(500).json({ error: 'Errore nella creazione della playlist' });
  }
});

// Avvio server
app.listen(PORT, () => {
  console.log(`Server in esecuzione su http://localhost:${PORT}`);
  console.log(`Assicurati di configurare le credenziali OAuth in .env`);
});
