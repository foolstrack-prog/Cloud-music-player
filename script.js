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
let ytPlayer; // hidden YouTube iframe player
let audioCtx, analyser, dataArr, sourceNode;
let progressInterval;

// --- Utility ---
function $(id){return document.getElementById(id)}
function fmt(s){const m=Math.floor(s/60), sec=Math.floor(s%60);return m+':'+(sec<10?'0'+sec:sec)}

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
  loadTrackToYT(TRACKS[i].id); 
  
  // FIX: If the app is supposed to be playing, attempt to restart the new track immediately.
  if (isPlaying) {
      togglePlay(true); // Force play to restart UI and progress
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

// --- YouTube iframe (hidden audio) ---
function loadTrackToYT(id){
  const holder = $('ytHolder'); holder.innerHTML = '';
  const iframe = document.createElement('iframe');
  
  // FIX: Ensure autoplay=1 is in the URL
  iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&controls=0&iv_load_policy=3&modestbranding=1&rel=0&playsinline=1`;
  iframe.allow = 'autoplay';
  iframe.width = '1'; iframe.height='1'; iframe.style.opacity='0'; holder.appendChild(iframe);
  
  // FIX: Reset fake position when loading a new track
  fakePos = 0;
  
  // Note: cannot extract raw audio; we rely on iframe autoplay which some browsers may block until user interacts
}

// --- Play / Pause controls ---
const playBtnBar = $('playBtn');
const playBtnNow = $('playBtnNow'); // New button in expanded view

playBtnBar.addEventListener('click', ()=>{ togglePlay(); });
// miniPlayBtn is removed in HTML
if(playBtnNow) playBtnNow.addEventListener('click', ()=>{ togglePlay(); }); 
// nowPlay is removed in HTML

function togglePlay(forcePlay = false){ // Added optional argument to force play logic
  const shouldPlay = forcePlay || !isPlaying;

  // Attempt to start audio by focusing iframe (best-effort); some browsers require gesture
  if(shouldPlay){ 
    isPlaying=true; 
    if(playBtnBar) playBtnBar.textContent='⏸'; 
    if(playBtnNow) playBtnNow.textContent='⏸';
    startProgress(); 
  } else { 
    isPlaying=false; 
    if(playBtnBar) playBtnBar.textContent='▶'; 
    if(playBtnNow) playBtnNow.textContent='▶';
    stopProgress(); 
  }
}

// --- Progress bar simulation (since we can't read duration reliably without YouTube API) ---
let fakePos=0, fakeDur=180;
function startProgress(){ clearInterval(progressInterval); progressInterval=setInterval(()=>{ if(!isPlaying) return; fakePos+=1; if(fakePos>fakeDur){ fakePos=0; nextTrack(); } updateProgress(); },1000); }
function stopProgress(){ clearInterval(progressInterval); }
function updateProgress(){ 
  const pct = Math.min(1, fakePos/fakeDur); 
  
  // Update Now Playing (expanded)
  const progressBarNow = $('progressBarNow');
  if(progressBarNow){
      progressBarNow.firstElementChild.style.width = (pct*100)+'%';
      $('timeCurNow').textContent = fmt(fakePos);
      $('timeTotalNow').textContent = fmt(fakeDur);
  }
  // Note: There is no progress bar in the mini player (playerBar) in the mobile design
}

// --- Next / Prev ---
const nextBtnNow = $('nextBtnNow');
const prevBtnNow = $('prevBtnNow');

// Desktop bar buttons (reused for mobile skip function if needed)
const nextBtnBar = $('nextBtn');
const prevBtnBar = $('prevBtn');
if (nextBtnBar) nextBtnBar.addEventListener('click', ()=>{ nextTrack(); }); 
if (prevBtnBar) prevBtnBar.addEventListener('click', ()=>{ prevTrack(); });

// Now Playing buttons
if(nextBtnNow) nextBtnNow.addEventListener('click', ()=>{ nextTrack(); });
if(prevBtnNow) prevBtnNow.addEventListener('click', ()=>{ prevTrack(); });

function nextTrack(){ 
  current=(current+1)%TRACKS.length; 
  updateNowPlaying(); 
  loadTrackToYT(TRACKS[current].id); 
  if(isPlaying) togglePlay(true); // FIX: Restart play on new track
}
function prevTrack(){ 
  current=(current-1+TRACKS.length)%TRACKS.length; 
  updateNowPlaying(); 
  loadTrackToYT(TRACKS[current].id); 
  if(isPlaying) togglePlay(true); // FIX: Restart play on new track
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
renderGrid(); selectTrack(0);

// --- Cloud background (soft particles) ---
(function(){ const c=$('bgCanvas'); const ctx=c.getContext('2d'); function res(){ c.width=innerWidth; c.height=innerHeight; } res(); window.addEventListener('resize',res); const arr=[]; for(let i=0;i<30;i++){ arr.push({x:Math.random()*c.width,y:Math.random()*c.height,r:30+Math.random()*100,vx:0.2+Math.random()*0.6}); }
  function loop(){ ctx.clearRect(0,0,c.width,c.height); for(const p of arr){ const g=ctx.createRadialGradient(p.x,p.y,p.r*0.1,p.x,p.y,p.r); g.addColorStop(0,'rgba(255,255,255,0.05)'); g.addColorStop(1,'rgba(255,255,255,0.01)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill(); p.x+=p.vx; if(p.x-p.r>c.width) p.x=-p.r; } requestAnimationFrame(loop); } loop(); })();