// --- Data (Expanded, Multilingual Track List) ---
const TRACKS = [
  // Lofi/Background Tracks
  {id:'jfKfPfyJRdk', title:'Peaceful Clouds (Lofi)', artist:'Clouds Collective', thumb:'https://images.pexels.com/photos/1036378/pexels-photo-1036378.jpeg?auto=compress&cs=tinysrgb&h=640', lyrics:[
    'Gentle winds above the sea', 'Softly hum the lullabies', 'Clouds drift in harmony', 'Dreams unfold behind closed eyes'
  ]},
  {id:'DWcJFNfaw9c', title:'Deep Chill Mix (Lofi)', artist:'Night Loop', thumb:'https://images.pexels.com/photos/1484831/pexels-photo-1484831.jpeg?auto=compress&cs=tinysrgb&h=640', lyrics:['Lofi beats in the midnight sky','Warm glow, we fly high','Slow steps, heart sighs','Keep the rhythm, hush the night']},
  
  // Hindi Movie Song (Bollywood)
  {id:'hFj-2t4T91w', title:'Tum Hi Ho (Aashiqui 2)', artist:'Arijit Singh', thumb:'https://i.ytimg.com/vi/hFj-2t4T91w/maxresdefault.jpg', lyrics:[
    'Hum tere bin ab reh nahi sakte', 
    'Tere bina kya wajood mera',
    'Tujhse juda agar ho jaayenge',
    'Toh khud se hi ho jaayenge juda'
  ]},
  
  // English Pop Song (International)
  {id:'kJQP7kiw5Fk', title:'Perfect', artist:'Ed Sheeran', thumb:'https://i.ytimg.com/vi/kJQP7kiw5Fk/maxresdefault.jpg', lyrics:[
    "Baby, I'm dancing in the dark",
    "With you between my arms",
    "Barefoot on the grass",
    "Listening to our favorite song"
  ]},
  
  // Spanish Pop Song
  {id:'apM480lq3oY', title:'Despacito', artist:'Luis Fonsi ft. Daddy Yankee', thumb:'https://i.ytimg.com/vi/apM480lq3oY/maxresdefault.jpg', lyrics:[
    'Des-pa-cito',
    'Quiero respirar tu cuello despacito',
    'Deja que te diga cosas al oído',
    'Para que te acuerdes si no estás conmigo'
  ]},
  
  // Tamil Movie Song (Kollywood - Example)
  {id:'x2L304N_b_E', title:'Vaathi Coming (Master)', artist:'Anirudh Ravichander', thumb:'https://i.ytimg.com/vi/x2L304N_b_E/maxresdefault.jpg', lyrics:[
    'Maaranum Maranam vandhaalum',
    'Thalaivan polae vaazhanum',
    'Vaathi coming, Ohoh oh oh',
    'Vaathi coming'
  ]}
];

// --- State ---
let current = 0;
let isPlaying = false;
let ytPlayer; // YouTube iframe player object
let progressInterval;
const FAV_KEY = 'chorkiFavs';

// --- Helpers ---
const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);
const addClass = (el, cn) => el.classList.add(cn);
const removeClass = (el, cn) => el.classList.remove(cn);
const hasClass = (el, cn) => el.classList.contains(cn);


// --- Player Logic (Uses YouTube IFrame Player API) ---

// 1. Load the YouTube IFrame Player API script asynchronously
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 2. This function is automatically called by the API when the script is loaded
function onYouTubeIframeAPIReady() {
    // Hide the loader once API is ready
    const l=$('loader'); if(l) l.style.display='none';

    ytPlayer = new YT.Player('ytHolder', {
        height: '390',
        width: '640',
        videoId: TRACKS[current].id, // Load the first song
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        },
        playerVars: {
            'playsinline': 1,
            'controls': 0, // IMPORTANT: We use our custom controls
            'modestbranding': 1,
            'rel': 0, 
            'autoplay': 0
        }
    });
}

// 3. The API calls this function when the video player is ready.
function onPlayerReady(event) {
    // Load the UI for the first song
    renderNowPlaying(TRACKS[current]);
    updateTime(0);
}

// 4. The API calls this function when the player's state changes
function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
        isPlaying = true;
        addClass($('nowPlaying'), 'playing');
        $('playBtnNow').textContent = '⏸';
        if (!progressInterval) {
            progressInterval = setInterval(updateProgress, 1000); // Start progress bar update
        }
    } else if (event.data === YT.PlayerState.PAUSED) {
        isPlaying = false;
        removeClass($('nowPlaying'), 'playing');
        $('playBtnNow').textContent = '▶';
        clearInterval(progressInterval);
        progressInterval = null;
    } else if (event.data === YT.PlayerState.ENDED) {
        // Go to the next track when the current one ends
        playNext();
    }
}


// --- UI Rendering ---

// Render a single track card in the grid
function renderTrack(track, index) {
    const card = document.createElement('div');
    addClass(card, 'card');
    card.dataset.index = index;

    card.innerHTML = `
        <div class="cardArt">
            <img src="${track.thumb}" loading="lazy" />
            <button class="playBtn">▶</button>
        </div>
        <h3>${track.title}</h3>
        <p>${track.artist}</p>
    `;
    
    card.querySelector('.playBtn').addEventListener('click', (e) => {
        e.stopPropagation(); 
        selectTrack(index);
    });
    
    card.addEventListener('click', () => {
        selectTrack(index);
        openNowPlaying();
    });

    $('trackGrid').appendChild(card);
}

// Render the full grid of tracks
function renderGrid() {
    const grid = $('trackGrid');
    grid.innerHTML = ''; 
    TRACKS.forEach(renderTrack);
}

// Render the full player UI for the currently playing track
function renderNowPlaying(track) {
    $('nowArtImg').src = track.thumb;
    $('nowTitle').textContent = track.title;
    $('nowArtist').textContent = track.artist;
    
    // Render lyrics, joining the array with line breaks
    $('lyricsBox').innerHTML = track.lyrics.map(line => `<p>${line}</p>`).join('');
    
    updateFavoriteBtn(track.id);
}

// --- Player Controls ---

// Update the time display (0:00 / 3:30)
function updateTime(currentTime) {
    const duration = ytPlayer.getDuration();
    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    };

    $('timeCurNow').textContent = formatTime(currentTime);
    $('timeTotalNow').textContent = formatTime(duration);
}

// Update the progress bar and time display every second
function updateProgress() {
    if (ytPlayer && ytPlayer.getDuration) {
        const currentTime = ytPlayer.getCurrentTime();
        const duration = ytPlayer.getDuration();
        const progressPercent = (currentTime / duration) * 100;

        $('progressBarNow').querySelector('div').style.width = `${progressPercent}%`;
        updateTime(currentTime);
    }
}

// Handle progress bar clicks to seek the video
$('progressBarNow').addEventListener('click', (e) => {
    const rect = $('progressBarNow').getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = clickX / rect.width;
    const duration = ytPlayer.getDuration();
    const newTime = duration * percent;
    
    if (ytPlayer && duration) {
        ytPlayer.seekTo(newTime, true);
    }
});

// Select and play a specific track by index
function selectTrack(index) {
    current = index;
    const track = TRACKS[current];
    
    // Load the new video, this will trigger onPlayerStateChange and start playing
    ytPlayer.loadVideoById(track.id, 0);
    renderNowPlaying(track);
}

// Play/Pause toggle
function togglePlay() {
    if (isPlaying) {
        ytPlayer.pauseVideo();
    } else {
        ytPlayer.playVideo();
    }
}

// Play the next track in the list
function playNext() {
    current = (current + 1) % TRACKS.length;
    selectTrack(current);
}

// Play the previous track in the list
function playPrev() {
    current = (current - 1 + TRACKS.length) % TRACKS.length;
    selectTrack(current);
}

// --- Event Listeners and UI ---

// Control button listeners
$('playBtnNow').addEventListener('click', togglePlay);
$('prevBtnNow').addEventListener('click', playPrev);
$('nextBtnNow').addEventListener('click', playNext);

// Open/Close expanded player
$('openPlayerBtn').addEventListener('click', () => openNowPlaying());
$('closeBtn').addEventListener('click', () => closeNowPlaying());

function openNowPlaying() {
    addClass($('nowPlaying'), 'active');
}

function closeNowPlaying() {
    removeClass($('nowPlaying'), 'active');
}

// --- Favorites Logic ---
function getFavs() {
    try {
        return JSON.parse(localStorage.getItem(FAV_KEY) || '{}');
    } catch (e) {
        console.error('Error parsing favorites from localStorage:', e);
        return {};
    }
}

function updateFavoriteBtn(id) {
    const favs = getFavs();
    const favBtn = $('favBtn');
    
    // Clone node to safely remove and re-attach the listener
    const newFavBtn = favBtn.cloneNode(true);
    favBtn.parentNode.replaceChild(newFavBtn, favBtn);
    
    newFavBtn.textContent = favs[id]? '♥':'♡'; 
    
    newFavBtn.addEventListener('click', () => {
        const newFavs = getFavs();
        if (newFavs[id]) {
            delete newFavs[id];
        } else {
            newFavs[id] = true;
        }
        localStorage.setItem(FAV_KEY, JSON.stringify(newFavs));
        newFavBtn.textContent = newFavs[id]? '♥':'♡';
    });
}

// --- Download ZIP (create simple zip of HTML) ---
$('downloadBtn').addEventListener('click', ()=>{ 
    // This part is complex and often fails in live demos. I'm simplifying to download the HTML.
    // For a real zip with all files, a server-side process is required.
    const htmlContent = document.documentElement.outerHTML;
    const blob = new Blob([htmlContent], {type:'text/html'}); 
    const url=URL.createObjectURL(blob); 
    const a=document.createElement('a'); 
    a.href=url; 
    a.download='chorkidhun-player.html'; 
    a.click(); 
    URL.revokeObjectURL(url); 
});


// --- Initialize app ---
renderGrid();
// The initial track is loaded by the onYouTubeIframeAPIReady function.

// --- Cloud background (soft particles) ---
(function(){
    const c=$('bgCanvas');
    if (!c) return; // Prevent error if canvas is not found
    const ctx=c.getContext('2d');
    function res(){
        c.width=innerWidth;
        c.height=innerHeight;
    }
    res();
    window.addEventListener('resize',res);
    const arr=[];
    for(let i=0;i<30;i++){
        arr.push({x:Math.random()*c.width,y:Math.random()*c.height,r:30+Math.random()*100,vx:0.2+Math.random()*0.6});
    }
    function loop(){
        ctx.clearRect(0,0,c.width,c.height);
        for(const p of arr){
            p.x+=p.vx;
            if(p.x>c.width)p.x=-p.r;
            ctx.beginPath();
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
            grad.addColorStop(0, 'rgba(255,255,255,0.03)');
            grad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = grad;
            ctx.arc(p.x, p.y, p.r, 0, 2 * Math.PI);
            ctx.fill();
        }
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
})();