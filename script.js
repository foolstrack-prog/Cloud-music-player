// --- I18N (Multi-Language) Data and Functions ---

const translations = {
    en: { 
        'hi_user': 'Hi, Samantha', 
        'now_playing': 'Now Playing',
        'my_music': 'My Music',
        'discover_weekly': 'Discover weekly',
        'top_playlists': 'Top daily playlists',
        'tracks': 'Tracks',
        'songs': 'Songs',
        'library': 'Library',
        'sleep_timer_title': 'Set Sleep Timer',
        'timer_set_msg': (mins) => `Sleep timer set for ${mins} minutes.`,
        'timer_end_msg': 'Sleep timer ended. Music paused.'
    },
    fr: { 
        'hi_user': 'Salut, Samantha', 
        'now_playing': 'En cours de lecture',
        'my_music': 'Ma Musique',
        'discover_weekly': 'Découvrir chaque semaine',
        'top_playlists': 'Meilleures playlists quotidiennes',
        'tracks': 'Pistes',
        'songs': 'Chansons',
        'library': 'Bibliothèque',
        'sleep_timer_title': 'Régler la minuterie de sommeil',
        'timer_set_msg': (mins) => `Minuterie réglée pour ${mins} minutes.`,
        'timer_end_msg': 'Minuterie terminée. Musique en pause.'
    }
};

let currentLanguage = 'en';

function setLanguage(langCode) {
    currentLanguage = langCode;
    // Iterate through all elements with a 'data-i18n' attribute and update their text
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translationValue = translations[langCode][key];
        
        if (typeof translationValue === 'string') {
            el.textContent = translationValue;
        }
        // Note: Functional translations (like timer_set_msg) are handled directly in the relevant event listeners.
    });
    
    // Re-render playlists to update the language-specific word "Songs"/"Chansons"
    // This assumes MOCK_DATA.playlists has already been loaded once
    if (MOCK_DATA.playlists.length > 0) {
        renderHomePlaylists(MOCK_DATA.playlists);
    }
}

// --- Spotify API Integration (MOCK Endpoints) ---
// IMPORTANT: These URLs are placeholders and rely on a secure backend server you must create.

const API_PLACEHOLDERS = {
    GET_TOKEN: '/api/spotify/get-token', // Your backend endpoint
    GET_PLAYLISTS: '/api/spotify/featured-playlists', // Your backend endpoint
};

let spotifyAccessToken = null;
// This is a publicly available Spotify preview track URL used for demonstration
const MOCK_PREVIEW_URL = 'https://p.scdn.co/mp3-preview/a84f3f1e9e7b2a95c4793d9e075d6910a56e01a8?cid=ec16e537d1184a4497e6417721835926'; 

// MOCK DATA structure to be used if the API call fails
const MOCK_DATA = {
    // Added more mock data for the Library screen as seen in the image
    playlists: [
        { id: '1', name: 'Starlit Reverie', artist: 'Budiarti', songs: 8, image_url: 'https://i.pravatar.cc/80?img=4', preview_url: MOCK_PREVIEW_URL },
        { id: '2', name: 'Midnight Confessions', artist: 'Alexiao', songs: 24, image_url: 'https://i.pravatar.cc/80?img=5', preview_url: MOCK_PREVIEW_URL },
        { id: '3', name: 'Lost in the Echo', artist: 'Alexiao', songs: 24, image_url: 'https://i.pravatar.cc/80?img=8', preview_url: MOCK_PREVIEW_URL },
        { id: '4', name: 'Letters I Never Sent', artist: 'Budiarti', songs: 24, image_url: 'https://i.pravatar.cc/80?img=11', preview_url: MOCK_PREVIEW_URL },
        { id: '5', name: 'Breaking the Silence', artist: 'Alexiao', songs: 24, image_url: 'https://i.pravatar.cc/80?img=12', preview_url: MOCK_PREVIEW_URL },
        { id: '6', name: 'Tears on the Vinyl', artist: 'Budiarti', songs: 24, image_url: 'https://i.pravatar.cc/80?img=13', preview_url: MOCK_PREVIEW_URL },
    ]
};

async function authenticateAndFetch() {
    console.log("Attempting to fetch data via API (MOCK mode)...");
    
    // In a real application, replace this with your actual token fetching logic.
    // For now, we render mock data immediately.
    renderHomePlaylists(MOCK_DATA.playlists); 

    /* Example of real API interaction structure:
    try {
        const response = await fetch(API_PLACEHOLDERS.GET_TOKEN); 
        const data = await response.json();
        spotifyAccessToken = data.access_token;
        if (spotifyAccessToken) {
            fetchFeaturedPlaylists();
        }
    } catch (error) {
        console.warn("API Error - Using mock data.");
        renderHomePlaylists(MOCK_DATA.playlists);
    }
    */
}

// --- Audio Playback and Control ---

const audioPlayer = new Audio();
let isPlaying = false;
let sleepTimerId = null;

/**
 * Loads track data into the player UI and starts playback.
 * @param {object} track - A mock track object containing name, artist, image_url, and preview_url.
 */
function loadAndPlayTrack(track) {
    if (!track || !track.preview_url) {
        alert("Track not available for preview.");
        return;
    }
    
    // Update player UI
    document.querySelector('.track-title').textContent = track.name;
    document.querySelector('.track-artist').textContent = track.artist;
    // Update artwork in the player screen
    document.querySelector('#now-playing-screen .artwork-circle img').src = track.image_url; 
    
    // Load and play audio
    audioPlayer.src = track.preview_url;
    audioPlayer.load();
    audioPlayer.play().catch(e => console.error("Playback error:", e));
    
    isPlaying = true;
    updatePlayPauseButton();
    navigateTo('nowPlaying'); // Transition to Now Playing screen
}

function updatePlayPauseButton() {
    const playPauseBtn = document.querySelector('.play-pause-btn');
    playPauseBtn.textContent = isPlaying ? '⏸️' : '▶️';
}

function togglePlayPause() {
    if (audioPlayer.paused) {
        audioPlayer.play().catch(e => console.error("Playback resume error:", e));
        isPlaying = true;
    } else {
        audioPlayer.pause();
        isPlaying = false;
    }
    updatePlayPauseButton();
}

function pauseTrack() {
    audioPlayer.pause();
    isPlaying = false;
    updatePlayPauseButton();
}

// --- New Feature: Sleep Timer ---

function openSleepTimerModal() {
    const lang = currentLanguage;
    const minutes = prompt(
        translations[lang]['sleep_timer_title'] + "\n\n" + (sleepTimerId ? 'Timer is currently active. Enter 0 to cancel.' : 'Enter number of minutes (e.g., 30):')
    );
    
    const mins = parseInt(minutes);

    if (mins > 0) {
        startSleepTimer(mins);
    } else if (mins === 0 && sleepTimerId) {
        clearTimeout(sleepTimerId);
        sleepTimerId = null;
        alert("Sleep timer cancelled.");
    } else if (minutes !== null && minutes !== '') {
        alert("Please enter a valid number of minutes.");
    }
}

function startSleepTimer(minutes) {
    if (sleepTimerId) {
        clearTimeout(sleepTimerId);
    }

    const lang = currentLanguage;
    const durationMs = minutes * 60 * 1000;
    
    alert(translations[lang]['timer_set_msg'](minutes));

    sleepTimerId = setTimeout(() => {
        pauseTrack();
        alert(translations[lang]['timer_end_msg']);
        sleepTimerId = null;
    }, durationMs);
}


// --- Dynamic UI Rendering ---

function renderHomePlaylists(playlists) {
    const playlistContainer = document.querySelector('.daily-playlists .playlist-list');
    playlistContainer.innerHTML = ''; 

    // Render only the top 2 playlists for the Home Screen view
    playlists.slice(0, 2).forEach(p => {
        const item = document.createElement('div');
        item.className = 'playlist-item';
        // Mock play on click
        item.onclick = () => loadAndPlayTrack(p); 
        item.innerHTML = `
            <img src="${p.image_url}" alt="Playlist Cover">
            <div class="item-info">
                <p class="title">${p.name}</p>
                <p class="subtitle">By ${p.artist} • ${p.songs} ${translations[currentLanguage]['songs']}</p>
            </div>
        `;
        playlistContainer.appendChild(item);
    });
    
    // Also render the full list for the Library screen
    renderLibraryList(playlists);
}

function renderLibraryList(playlists) {
    const libraryContainer = document.querySelector('.library-list');
    libraryContainer.innerHTML = ''; 

    playlists.forEach(p => {
        const item = document.createElement('div');
        item.className = 'library-item';
        item.onclick = () => loadAndPlayTrack(p); 
        item.innerHTML = `
            <img src="${p.image_url}" alt="Cover" class="list-cover">
            <div class="item-info">
                <p class="title">${p.name}</p>
                <p class="subtitle">By ${p.artist} • ${p.songs} ${translations[currentLanguage]['songs']}</p>
            </div>
            <button class="play-icon-small">▶️</button>
        `;
        libraryContainer.appendChild(item);
    });
}


// --- Screen Navigation Logic (SPA Routing) ---

const screenMap = {
    home: document.getElementById('home-screen'),
    nowPlaying: document.getElementById('now-playing-screen'),
    myMusic: document.getElementById('my-music-screen'),
};

const navIcons = document.querySelectorAll('.nav-icon');
let currentScreen = 'home';
const historyStack = ['home']; 

/**
 * Transitions to a new screen, simulating a Single Page Application (SPA) router.
 * @param {string} screenName - The ID suffix of the screen to navigate to (e.g., 'home', 'myMusic').
 */
function navigateTo(screenName) {
    if (currentScreen === screenName) return;

    // Logic to manage history, excluding 'nowPlaying' from the main back stack 
    // unless it's explicitly the target from the main nav (which it isn't).
    if (screenName !== 'nowPlaying' && historyStack[historyStack.length - 1] !== screenName) {
        historyStack.push(screenName);
    }
    
    // Deactivate all screens
    Object.values(screenMap).forEach(screen => screen.classList.remove('active'));

    // Activate the target screen
    if (screenMap[screenName]) {
        screenMap[screenName].classList.add('active');
        currentScreen = screenName;
    }

    // Update global navigation icons
    navIcons.forEach(icon => {
        icon.classList.remove('active');
        if (icon.getAttribute('data-screen') === screenName) {
            icon.classList.add('active');
        }
    });
}

function goBack() {
    if (historyStack.length > 1) {
        // Pop the current screen off the stack
        historyStack.pop(); 
        // Get the previous screen
        const lastScreen = historyStack[historyStack.length - 1];
        // Navigate back to it
        navigateTo(lastScreen);
    }
}


// --- Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. Set initial language
    // Read the language from the select dropdown or default to 'en'
    const initialLang = document.getElementById('lang-select')?.value || 'en';
    setLanguage(initialLang);
    
    // 2. Load data and playlists (MOCK mode)
    authenticateAndFetch();
    
    // 3. Global Navigation Listeners
    navIcons.forEach(icon => {
        icon.addEventListener('click', () => {
            const targetScreen = icon.getAttribute('data-screen');
            if (targetScreen) navigateTo(targetScreen);
        });
    });

    // 4. Play/Pause Listener
    document.querySelector('.play-pause-btn').addEventListener('click', togglePlayPause);
    
    // 5. Curated Card Listener (Mock play)
    document.querySelector('.curated-card').onclick = () => {
        loadAndPlayTrack({
            name: 'Starlit Reverie (Curated Mix)',
            artist: 'Budiarti',
            image_url: 'https://i.pravatar.cc/300?img=3',
            preview_url: MOCK_PREVIEW_URL 
        });
    };
});