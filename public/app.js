// Stato globale
let currentPlaylist = {
  videos: [],
  artistCount: 0
};

// Elementi DOM
const generateBtn = document.getElementById('generateBtn');
const saveBtn = document.getElementById('saveBtn');
const regenerateBtn = document.getElementById('regenerateBtn');
const loading = document.getElementById('loading');
const playlistPreview = document.getElementById('playlistPreview');
const error = document.getElementById('error');
const videoList = document.getElementById('videoList');
const playlistStats = document.getElementById('playlistStats');
const saveResult = document.getElementById('saveResult');

// Event Listeners
generateBtn.addEventListener('click', generateRandomPlaylist);
saveBtn.addEventListener('click', savePlaylist);
regenerateBtn.addEventListener('click', generateRandomPlaylist);

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
    currentPlaylist = data;
    
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

// Mostra anteprima della playlist
function displayPlaylistPreview() {
  if (currentPlaylist.videos.length === 0) {
    showError('Nessun video trovato. Prova con impostazioni diverse.');
    return;
  }
  
  // Mostra statistiche
  playlistStats.innerHTML = `
    <p><strong>Totale brani:</strong> ${currentPlaylist.videos.length}</p>
    <p><strong>Artisti inclusi:</strong> ${currentPlaylist.artistCount}</p>
  `;
  
  // Mostra lista video
  videoList.innerHTML = '';
  currentPlaylist.videos.forEach((video, index) => {
    const videoItem = document.createElement('div');
    videoItem.className = 'video-item';
    videoItem.innerHTML = `
      <img src="${video.thumbnail}" alt="${escapeHtml(video.title)}">
      <div class="video-info">
        <div class="video-title">${escapeHtml(video.title)}</div>
        <div class="video-artist">🎤 ${escapeHtml(video.artist)}</div>
      </div>
    `;
    videoList.appendChild(videoItem);
  });
  
  // Genera nome predefinito per la playlist
  const today = new Date().toLocaleDateString('it-IT');
  document.getElementById('playlistTitle').value = `Playlist Casuale - ${today}`;
  document.getElementById('playlistDescription').value = 
    `Playlist generata casualmente con ${currentPlaylist.videos.length} brani da ${currentPlaylist.artistCount} artisti.`;
  
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
