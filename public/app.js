// Stato globale
let currentPlaylist = {
  videos: [],
  artistCount: 0,
  mode: 'random' // 'random' o 'liked'
};

// Elementi DOM
const generateBtn = document.getElementById('generateBtn');
const generateLikedBtn = document.getElementById('generateLikedBtn');
const saveBtn = document.getElementById('saveBtn');
const regenerateBtn = document.getElementById('regenerateBtn');
const loading = document.getElementById('loading');
const playlistPreview = document.getElementById('playlistPreview');
const error = document.getElementById('error');
const videoList = document.getElementById('videoList');
const playlistStats = document.getElementById('playlistStats');
const saveResult = document.getElementById('saveResult');
const topArtistsList = document.getElementById('topArtistsList');

// Mode selector
const randomModeBtn = document.getElementById('randomModeBtn');
const likedModeBtn = document.getElementById('likedModeBtn');
const randomMode = document.getElementById('randomMode');
const likedMode = document.getElementById('likedMode');

// Slider
const topArtistsSlider = document.getElementById('topArtistsCount');
const topArtistsValue = document.getElementById('topArtistsValue');

// Event Listeners
generateBtn.addEventListener('click', generateRandomPlaylist);
generateLikedBtn.addEventListener('click', generateLikedPlaylist);
saveBtn.addEventListener('click', savePlaylist);
regenerateBtn.addEventListener('click', regenerateCurrentMode);

// Mode switching
randomModeBtn.addEventListener('click', () => switchMode('random'));
likedModeBtn.addEventListener('click', () => switchMode('liked'));

// Slider update
topArtistsSlider.addEventListener('input', (e) => {
  topArtistsValue.textContent = e.target.value;
});

// Switch between modes
function switchMode(mode) {
  if (mode === 'random') {
    randomModeBtn.classList.add('active');
    likedModeBtn.classList.remove('active');
    randomMode.classList.add('active');
    likedMode.classList.remove('active');
    currentPlaylist.mode = 'random';
  } else {
    randomModeBtn.classList.remove('active');
    likedModeBtn.classList.add('active');
    randomMode.classList.remove('active');
    likedMode.classList.add('active');
    currentPlaylist.mode = 'liked';
  }
  
  // Nascondi preview quando si cambia modalità
  playlistPreview.style.display = 'none';
}

// Rigenera playlist nella modalità corrente
function regenerateCurrentMode() {
  if (currentPlaylist.mode === 'liked') {
    generateLikedPlaylist();
  } else {
    generateRandomPlaylist();
  }
}

// Genera playlist casuale
async function generateRandomPlaylist() {
  const artistCount = parseInt(document.getElementById('artistCount').value);
  const songsPerArtist = parseInt(document.getElementById('songsPerArtist').value);
  
  // Validazione
  if (artistCount < 1 || artistCount > 20) {
    showError('Il numero di artisti deve essere tra 1 e 20');
    return;
  }
  
  if (songsPerArtist < 1 || songsPerArtist > 10) {
    showError('Il numero di brani per artista deve essere tra 1 e 10');
    return;
  }
  
  // Mostra loading
  loading.style.display = 'block';
  playlistPreview.style.display = 'none';
  error.style.display = 'none';
  generateBtn.disabled = true;
  
  try {
    const response = await fetch('/api/generate-random-playlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        artistCount,
        songsPerArtist
      })
    });
    
    if (!response.ok) {
      throw new Error('Errore nella generazione della playlist');
    }
    
    const data = await response.json();
    currentPlaylist = { ...data, mode: 'random' };
    
    // Mostra anteprima
    displayPlaylistPreview();
    
  } catch (err) {
    console.error('Errore:', err);
    showError('Si è verificato un errore durante la generazione della playlist. Riprova.');
  } finally {
    loading.style.display = 'none';
    generateBtn.disabled = false;
  }
}

// Genera playlist dai preferiti
async function generateLikedPlaylist() {
  const topArtistsCount = parseInt(document.getElementById('topArtistsCount').value);
  const songsPerArtist = parseInt(document.getElementById('songsPerArtistLiked').value);
  
  // Validazione
  if (topArtistsCount < 5 || topArtistsCount > 100) {
    showError('Il numero di artisti deve essere tra 5 e 100');
    return;
  }
  
  if (songsPerArtist < 1 || songsPerArtist > 10) {
    showError('Il numero di brani per artista deve essere tra 1 e 10');
    return;
  }
  
  // Mostra loading
  loading.style.display = 'block';
  playlistPreview.style.display = 'none';
  error.style.display = 'none';
  generateLikedBtn.disabled = true;
  
  try {
    const response = await fetch('/api/generate-liked-playlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topArtistsCount,
        songsPerArtist
      })
    });
    
    if (!response.ok) {
      throw new Error('Errore nella generazione della playlist');
    }
    
    const data = await response.json();
    currentPlaylist = { ...data, mode: 'liked' };
    
    // Mostra anteprima
    displayPlaylistPreview();
    
  } catch (err) {
    console.error('Errore:', err);
    showError('Si è verificato un errore durante la generazione della playlist. Riprova.');
  } finally {
    loading.style.display = 'none';
    generateLikedBtn.disabled = false;
  }
}

// Mostra anteprima della playlist
function displayPlaylistPreview() {
  if (currentPlaylist.videos.length === 0) {
    showError('Nessun video trovato. Prova con impostazioni diverse.');
    return;
  }
  
  // Mostra statistiche
  let statsHTML = `
    <p><strong>Totale brani:</strong> ${currentPlaylist.videos.length}</p>
    <p><strong>Artisti inclusi:</strong> ${currentPlaylist.artistCount}</p>
  `;
  
  if (currentPlaylist.mode === 'liked') {
    statsHTML += `<p><strong>Video piaciuti analizzati:</strong> ${currentPlaylist.totalLikedVideos || 0}</p>`;
  }
  
  playlistStats.innerHTML = statsHTML;
  
  // Mostra top artisti se in modalità liked
  if (currentPlaylist.mode === 'liked' && currentPlaylist.topArtists) {
    topArtistsList.style.display = 'block';
    topArtistsList.innerHTML = '<h3>🏆 Top Artisti</h3>';
    
    const artistsContainer = document.createElement('div');
    currentPlaylist.topArtists.forEach((artist, index) => {
      const artistItem = document.createElement('div');
      artistItem.className = 'artist-item';
      artistItem.innerHTML = `
        <span class="artist-name">${index + 1}. ${escapeHtml(artist.name)}</span>
        <span class="artist-likes">❤️ ${artist.likes} like</span>
      `;
      artistsContainer.appendChild(artistItem);
    });
    
    topArtistsList.appendChild(artistsContainer);
  } else {
    topArtistsList.style.display = 'none';
  }
  
  // Mostra lista video
  videoList.innerHTML = '';
  currentPlaylist.videos.forEach((video, index) => {
    const videoItem = document.createElement('div');
    videoItem.className = 'video-item';
    
    let extraInfo = '';
    if (currentPlaylist.mode === 'liked' && video.likes) {
      extraInfo = ` <span style="color: #ff0000; font-size: 0.85em;">(${video.likes} like da questo artista)</span>`;
    }
    
    videoItem.innerHTML = `
      <img src="${video.thumbnail}" alt="${escapeHtml(video.title)}">
      <div class="video-info">
        <div class="video-title">${escapeHtml(video.title)}</div>
        <div class="video-artist">🎤 ${escapeHtml(video.artist)}${extraInfo}</div>
      </div>
    `;
    videoList.appendChild(videoItem);
  });
  
  // Genera nome predefinito per la playlist
  const today = new Date().toLocaleDateString('it-IT');
  const modeText = currentPlaylist.mode === 'liked' ? 'Preferiti' : 'Casuale';
  document.getElementById('playlistTitle').value = `Playlist ${modeText} - ${today}`;
  
  let description = `Playlist generata da ${currentPlaylist.videos.length} brani`;
  if (currentPlaylist.mode === 'liked') {
    description += ` dai tuoi video preferiti (top ${currentPlaylist.artistCount} artisti).`;
  } else {
    description += ` da ${currentPlaylist.artistCount} artisti casuali.`;
  }
  document.getElementById('playlistDescription').value = description;
  
  // Mostra sezione
  playlistPreview.style.display = 'block';
  saveResult.style.display = 'none';
  
  // Scroll alla preview
  playlistPreview.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Salva playlist su YouTube
async function savePlaylist() {
  const title = document.getElementById('playlistTitle').value.trim();
  const description = document.getElementById('playlistDescription').value.trim();
  
  if (!title) {
    showError('Inserisci un nome per la playlist');
    return;
  }
  
  if (currentPlaylist.videos.length === 0) {
    showError('Nessun video da salvare');
    return;
  }
  
  saveBtn.disabled = true;
  saveBtn.textContent = '💾 Salvataggio...';
  
  try {
    const videoIds = currentPlaylist.videos.map(v => v.videoId);
    
    const response = await fetch('/api/create-playlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title,
        description,
        videoIds
      })
    });
    
    if (!response.ok) {
      throw new Error('Errore nel salvataggio della playlist');
    }
    
    const data = await response.json();
    
    // Mostra messaggio di successo
    saveResult.className = 'result-message success';
    saveResult.innerHTML = `
      <p><strong>✅ Playlist salvata con successo!</strong></p>
      <p>La tua playlist è stata creata su YouTube Music.</p>
      <p><a href="${data.playlistUrl}" target="_blank">Apri la playlist su YouTube →</a></p>
    `;
    saveResult.style.display = 'block';
    
    // Scroll al risultato
    saveResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
  } catch (err) {
    console.error('Errore:', err);
    showError('Si è verificato un errore durante il salvataggio. Riprova.');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = '💾 Salva su YouTube';
  }
}

// Mostra errore
function showError(message) {
  error.textContent = message;
  error.style.display = 'block';
  setTimeout(() => {
    error.style.display = 'none';
  }, 5000);
}

// Escape HTML per prevenire XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Auto-focus sul primo campo quando la pagina carica
document.addEventListener('DOMContentLoaded', () => {
  const artistCount = document.getElementById('artistCount');
  if (artistCount) {
    artistCount.focus();
  }
});
