// --- Data (sample tracks) ---
const TRACKS = [
  // FIXED: Replaced broken imgur links with working placeholder image URLs
  {id:'jfKfPfyJRdk', title:'Peaceful Clouds', artist:'Clouds Collective', thumb:'https://images.pexels.com/photos/1036378/pexels-photo-1036378.jpeg?auto=compress&cs=tinysrgb&h=640', lyrics:[
    'Gentle winds above the sea', 'Softly hum the lullabies', 'Clouds drift in harmony', 'Dreams unfold behind closed eyes'
  ]},
  {id:'DWcJFNfaw9c', title:'Deep Chill Mix', artist:'Night Loop', thumb:'https://images.pexels.com/photos/1484831/pexels-photo-1484831.jpeg?auto=compress&cs=tinysrgb&h=640', lyrics:['Lofi beats in the midnight sky','Warm glow, we fly high','Slow steps, heart sighs','Keep the rhythm, hush the night']},
  {id:'5qap5aO4i9A', title:'Lofi Beats', artist:'Lo Studio', thumb:'https://images.pexels.com/photos/210182/pexels-photo-210182.jpeg?auto=compress&cs=tinysrgb&h=640', lyrics:['Raindrops tap the window','Coffee steam and soft echo','Studio lights dim low','Lofi winds begin to blow']}
];

// --- State ---
let current = 0;
let isPlaying = false;
let ytPlayer; // YouTube iframe player object
let progressInterval;
let duration = 0; // Total duration of the current track

// --- Utility ---
function $(id){return document.getElementById(id)}
function fmt(s){const m=Math.floor(s/60), sec=Math.floor(s%60);return m+':'+(sec<10?'0'+sec:sec)}

// ----------------------------------------------------
// --- YouTube IFrame API Initialization (NEW CODE) ---
// ----------------------------------------------------

// 1. This function is called automatically by the API script once it is loaded and ready.
function onYouTubeIframeAPIReady() {
  // Create the player object and replace the 'ytHolder' div
  ytPlayer = new YT.Player('ytHolder', { 
    videoId: TRACKS[current].id, // Load the initial track
    playerVars: {
      'playsinline': 1,
      'enablejsapi': 1,
      'controls': 0, // Hide YouTube's built-in controls
      'modestbranding': 1,
      'rel': 0,
      'autoplay': 0 // Must be 0 for full control and browser compatibility
    },
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    }
  });
  // Load the initial UI after the player object is created
  updateNowPlaying();
}

// 2. Called when the player finishes loading
function onPlayerReady(event) {
  // Set the total duration once the player is ready
  duration = event.target.getDuration();
  $('timeTotalNow').textContent = fmt(duration); 
}

// 3. Called when the player's state changes (The most important function)
function onPlayerStateChange(event) {
  const state = event.data;
  
  if (state === YT.PlayerState.PLAYING) {
    isPlaying = true;
    updatePlayPauseUI('⏸');
    startProgress(); // Start the progress tracker
    // Update duration again just in case (e.g., after seeking/loading a new video)
    duration = ytPlayer.getDuration();
    $('timeTotalNow').textContent = fmt(duration); 
    
  } else if (state === YT.PlayerState.PAUSED || state === YT.PlayerState.BUFFERING) {
    isPlaying = false;
    updatePlayPauseUI('▶');
    stopProgress(); // Stop the progress tracker
    
  } else if (state === YT.PlayerState.ENDED) {
    isPlaying = false;
    updatePlayPauseUI('▶');
    stopProgress();
    nextTrack(); // Automatically go to the next track
  }
}

// Helper to update both play/pause buttons
function updatePlayPauseUI(icon) {
    if(playBtnBar) playBtnBar.textContent = icon;
    if(playBtnNow) playBtnNow.textContent = icon;
}

// ----------------------------------------------------
// --- Core Player Functions (UPDATED to use ytPlayer) ---
// ----------------------------------------------------

// --- Render grid ---
function renderGrid(){
  const g = $('grid'); g.innerHTML='';
  TRACKS.forEach((t,i)=>{
    const c = document.createElement('div'); c.className='card';
    c.innerHTML=`<img src="${t.thumb}"><div class='title'>${t.title}</div><div class='sub'>${t.artist}</div>`;
    c.onclick = ()=>selectTrack(i);
    g.appendChild(c);
  });
}

// --- Select track ---
function selectTrack(i){ 
  current=i; 
  updateNowPlaying(); 
  
  if (ytPlayer && ytPlayer.loadVideoById) {
      // Use loadVideoById to load the new track
      ytPlayer.loadVideoById(TRACKS[i].id, 0); 
      // If we were playing, try to play the new track immediately (subject to browser rules)
      if (isPlaying) {
          ytPlayer.playVideo(); 
      }
  }
}

// --- Update UI ---
function updateNowPlaying(){
  const t = TRACKS[current];
  $('barArt').src = t.thumb; $('barTitle').textContent = t.title; $('barArtist').textContent = t.artist;
  $('nowArtImg').src = t.thumb; $('nowTitle').textContent = t.title; $('nowArtist').textContent = t.artist; 
  
  // Update favorited state if needed (favBtn is removed, but keeping logic for potential future use)
  const favBtn = $('favBtn');
  if (favBtn) favBtn.textContent = (favs[t.id]) ? '♥' : '♡';
  
  renderLyrics();
}

// --- Lyrics ---
function renderLyrics(){
  const box = $('lyricsBox'); box.innerHTML=''; TRACKS[current].lyrics.forEach((l,i)=>{ const p=document.createElement('p'); p.textContent=l; p.style.margin='6px 0'; box.appendChild(p)});
}

// --- Play / Pause controls ---
const playBtnBar = $('playBtn');
const playBtnNow = $('playBtnNow'); 

playBtnBar.addEventListener('click', ()=>{ togglePlay(); });
if(playBtnNow) playBtnNow.addEventListener('click', ()=>{ togglePlay(); }); 

function togglePlay(forcePlay = false){
  if (!ytPlayer) return;

  const shouldPlay = forcePlay || !isPlaying;

  if(shouldPlay){ 
    // This will trigger onPlayerStateChange -> PLAYING
    ytPlayer.playVideo();
  } else { 
    // This will trigger onPlayerStateChange -> PAUSED
    ytPlayer.pauseVideo();
  }
}

// --- Progress bar (using real API time/duration) ---

function startProgress(){ 
    clearInterval(progressInterval); 
    // Update progress every 250ms for smoother animation
    progressInterval = setInterval(updateProgress, 250); 
}

function stopProgress(){ 
    clearInterval(progressInterval); 
}

function updateProgress(){ 
    // Check if player is initialized and is playing
    if(!ytPlayer || !isPlaying || duration === 0) return;

    const curTime = ytPlayer.getCurrentTime(); 
    const pct = Math.min(1, curTime / duration); 
    
    // Update Now Playing (expanded)
    const progressBarNow = $('progressBarNow');
    if(progressBarNow){
        progressBarNow.firstElementChild.style.width = (pct*100)+'%';
        $('timeCurNow').textContent = fmt(curTime);
    }
}

// --- Next / Prev ---
const nextBtnNow = $('nextBtnNow');
const prevBtnNow = $('prevBtnNow');

if(nextBtnNow) nextBtnNow.addEventListener('click', ()=>{ nextTrack(); });
if(prevBtnNow) prevBtnNow.addEventListener('click', ()=>{ prevTrack(); });

function nextTrack(){ 
  current=(current+1)%TRACKS.length; 
  selectTrack(current); // Use selectTrack for loading logic
}
function prevTrack(){ 
  current=(current-1+TRACKS.length)%TRACKS.length; 
  selectTrack(current); // Use selectTrack for loading logic
}

// --- Now Playing expand / collapse ---
$('playerBar').addEventListener('click', (e)=>{ 
    // Open when clicking anywhere on the bar except the play button
    if(e.target.id !== 'playBtn' && e.target.closest('#playBtn') === null){
      $('nowPlaying').style.display='flex';
    }
});

$('nowPlaying').addEventListener('click', (e)=>{ 
  // Allow closing by clicking the background
  if(e.target.id==='nowPlaying') $('nowPlaying').style.display='none'; 
});

// Hide the redundant 'openNow' button
const openNowBtn = $('openNow');
if (openNowBtn) openNowBtn.style.display = 'none';

// --- Search ---
$('searchInput').addEventListener('input', (e)=>{ 
  const q=e.target.value.toLowerCase(); 
  const g=$('grid'); g.innerHTML=''; 
  TRACKS.filter(t=>t.title.toLowerCase().includes(q)||t.artist.toLowerCase().includes(q))
        .forEach((t)=>{ 
          const c=document.createElement('div'); c.className='card'; 
          c.innerHTML=`<img src="${t.thumb}"><div class='title'>${t.title}</div><div class='sub'>${t.artist}</div>`; 
          c.onclick=()=>selectTrack(TRACKS.indexOf(t)); 
          g.appendChild(c); 
        }); 
});

// --- Theme toggle (simple) ---
let dark=true; 
const themeBtn = $('themeBtn');
if (themeBtn) {
    themeBtn.addEventListener('click', ()=>{ 
        dark=!dark; 
        const root = document.documentElement; // Get the root HTML element
        if(!dark){ 
            // Light Theme Variables
            root.style.setProperty('--bg', '#f0f3f8');
            root.style.setProperty('--panel', '#ffffff');
            root.style.setProperty('--muted', '#4a5568');
            root.style.setProperty('--accent', '#60a5fa');
            root.style.setProperty('--glass', 'rgba(0,0,0,0.08)');
            document.body.style.color='#022';
            document.body.style.background='var(--bg)';
        } else { 
            // Dark Theme Variables (new default)
            root.style.setProperty('--bg', '#000');
            root.style.setProperty('--panel', '#121212');
            root.style.setProperty('--muted', '#a7a7a7');
            root.style.setProperty('--accent', '#1ed760');
            root.style.setProperty('--glass', 'rgba(255,255,255,0.03)');
            document.body.style.color='#fff';
            document.body.style.background='var(--bg)';
        } 
    });
}

// --- Favorites (localStorage) ---
const FAV_KEY='chorkidhun_favs_v1'; 
function loadFavs(){ try{return JSON.parse(localStorage.getItem(FAV_KEY)||'{}')}catch(e){return{}} }
let favs = loadFavs(); 
const favBtn = $('favBtn');
if (favBtn) { // Listener for the now playing screen favorite button
    favBtn.addEventListener('click', ()=>{ 
        const id=TRACKS[current].id; 
        if(favs[id]) delete favs[id]; else favs[id]=true; 
        localStorage.setItem(FAV_KEY, JSON.stringify(favs)); 
        favBtn.textContent = favs[id]? '♥':'♡'; 
    });
}

// --- Download ZIP (create simple zip of HTML) ---
$('downloadBtn').addEventListener('click', ()=>{ 
    const blob = new Blob([document.documentElement.outerHTML], {type:'text/html'}); 
    const url=URL.createObjectURL(blob); 
    const a=document.createElement('a'); 
    a.href=url; 
    a.download='chorkidhun-player.html'; 
    a.click(); 
    URL.revokeObjectURL(url); 
});

// --- Auto-hide loader ---
setTimeout(()=>{ const l=$('loader'); if(l) l.style.display='none'; },900);

// --- Initialize app ---
renderGrid(); 
// The initial track is loaded by the onYouTubeIframeAPIReady function.

// --- Cloud background (soft particles) ---
(function(){ const c=$('bgCanvas'); const ctx=c.getContext('2d'); function res(){ c.width=innerWidth; c.height=innerHeight; } res(); window.addEventListener('resize',res); const arr=[]; for(let i=0;i<30;i++){ arr.push({x:Math.random()*c.width,y:Math.random()*c.height,r:30+Math.random()*100,vx:0.2+Math.random()*0.6}); }
  function loop(){ ctx.clearRect(0,0,c.width,c.height); for(const p of arr){ const g=ctx.createRadialGradient(p.x,p.y,p.r*0.1,p.x,p.y,p.r); g.addColorStop(0,'rgba(255,255,255,0.05)'); g.addColorStop(1,'rgba(255,255,255,0.01)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill(); p.x+=p.vx; if(p.x-p.r>c.width) p.x=-p.r; } requestAnimationFrame(loop); } loop(); })();