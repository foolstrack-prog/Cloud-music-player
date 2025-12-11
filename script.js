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
function selectTrack(i){ current=i; updateNowPlaying(); loadTrackToYT(TRACKS[i].id); }

// --- Update UI ---
function updateNowPlaying(){
  const t = TRACKS[current];
  $('barArt').src = t.thumb; $('barTitle').textContent = t.title; $('barArtist').textContent = t.artist;
  $('nowArtImg').src = t.thumb; $('nowTitle').textContent = t.title; $('nowArtist').textContent = t.artist; $('miniImg').src=t.thumb; $('miniTitle').textContent=t.title;
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
  iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&controls=0&iv_load_policy=3&modestbranding=1&rel=0&playsinline=1`;
  iframe.allow = 'autoplay';
  iframe.width = '1'; iframe.height='1'; iframe.style.opacity='0'; holder.appendChild(iframe);
  // Note: cannot extract raw audio; we rely on iframe autoplay which some browsers may block until user interacts
  // We'll toggle play state via user actions
}

// --- Play / Pause controls ---
$('playBtn').addEventListener('click', ()=>{ togglePlay(); });
$('miniPlayBtn').addEventListener('click', (e)=>{ e.stopPropagation(); togglePlay(); });
$('nowPlay').addEventListener('click', ()=>{ togglePlay(); }); // Added click handler for 'Now Playing' panel
function togglePlay(){
  // Attempt to start audio by focusing iframe (best-effort); some browsers require gesture
  if(!isPlaying){ isPlaying=true; $('playBtn').textContent='⏸'; $('miniPlayBtn').textContent='⏸'; $('nowPlay').textContent='Pause'; startProgress(); } else { isPlaying=false; $('playBtn').textContent='▶'; $('miniPlayBtn').textContent='▶'; $('nowPlay').textContent='Play'; stopProgress(); }
}

// --- Progress bar simulation (since we can't read duration reliably without YouTube API) ---
let fakePos=0, fakeDur=180;
function startProgress(){ clearInterval(progressInterval); progressInterval=setInterval(()=>{ if(!isPlaying) return; fakePos+=1; if(fakePos>fakeDur){ fakePos=0; nextTrack(); } updateProgress(); },1000); }
function stopProgress(){ clearInterval(progressInterval); }
function updateProgress(){ const pct = Math.min(1, fakePos/fakeDur); $('progressBar').firstElementChild.style.width = (pct*100)+'%'; $('timeCur').textContent = fmt(fakePos); $('timeTotal').textContent = fmt(fakeDur); }

// --- Next / Prev ---
$('nextBtn').addEventListener('click', ()=>{ nextTrack(); });
$('prevBtn').addEventListener('click', ()=>{ prevTrack(); });
function nextTrack(){ current=(current+1)%TRACKS.length; fakePos=0; updateNowPlaying(); loadTrackToYT(TRACKS[current].id); if(isPlaying) startProgress(); }
function prevTrack(){ current=(current-1+TRACKS.length)%TRACKS.length; fakePos=0; updateNowPlaying(); loadTrackToYT(TRACKS[current].id); if(isPlaying) startProgress(); }

// --- Now Playing expand / collapse ---
$('openNow').addEventListener('click', ()=>{ $('nowPlaying').style.display='flex'; });
$('nowPlaying').addEventListener('click', (e)=>{ if(e.target.id==='nowPlaying') $('nowPlaying').style.display='none'; });

// --- Mini player open ---
$('miniPlayer').addEventListener('click', ()=>{ $('nowPlaying').style.display='flex'; });

// --- Search ---
$('searchInput').addEventListener('input', (e)=>{ 
  const q=e.target.value.toLowerCase(); 
  const g=$('grid'); g.innerHTML=''; 
  // FIXED: Use TRACKS.indexOf(t) to get the correct index from the master list
  TRACKS.filter(t=>t.title.toLowerCase().includes(q)||t.artist.toLowerCase().includes(q))
        .forEach((t)=>{ 
          const c=document.createElement('div'); c.className='card'; 
          c.innerHTML=`<img src="${t.thumb}"><div class='title'>${t.title}</div><div class='sub'>${t.artist}</div>`; 
          // FIX APPLIED HERE: Get the index from the master TRACKS array
          c.onclick=()=>selectTrack(TRACKS.indexOf(t)); 
          g.appendChild(c); 
        }); 
});

// --- Theme toggle (simple) ---
let dark=true; 
$('themeBtn').addEventListener('click', ()=>{ 
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
        document.body.style.background='linear-gradient(180deg,#f6f9ff,#eaf6ff)';
    } else { 
        // Dark Theme Variables (original)
        root.style.setProperty('--bg', '#07101a');
        root.style.setProperty('--panel', '#0f1724');
        root.style.setProperty('--muted', '#9aa6b2');
        root.style.setProperty('--accent', '#6ee7b7');
        root.style.setProperty('--glass', 'rgba(255,255,255,0.03)');
        document.body.style.color='#e6eef8';
        document.body.style.background='linear-gradient(180deg,#05121a 0%, #071025 100%)'; 
    } 
});

// --- Favorites (localStorage) ---
const FAV_KEY='clouds_favs_v1'; function loadFavs(){ try{return JSON.parse(localStorage.getItem(FAV_KEY)||'{}')}catch(e){return{}} }
let favs = loadFavs(); $('favBtn').addEventListener('click', ()=>{ const id=TRACKS[current].id; if(favs[id]) delete favs[id]; else favs[id]=true; localStorage.setItem(FAV_KEY, JSON.stringify(favs)); $('favBtn').textContent = favs[id]? '♥':'♡'; });

// --- Download ZIP (create simple zip of HTML) ---
$('downloadBtn').addEventListener('click', ()=>{ const blob = new Blob([document.documentElement.outerHTML], {type:'text/html'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='clouds-player.html'; a.click(); URL.revokeObjectURL(url); });

// --- Auto-hide loader ---
setTimeout(()=>{ const l=$('loader'); if(l) l.style.display='none'; },900);

// --- Initialize app ---
renderGrid(); selectTrack(0);

// --- Mini draggable (popout) ---
(function(){ const mini=$('miniPlayer'); let down=false, startY=0, startX=0; mini.addEventListener('mousedown',(e)=>{ down=true; startY=e.clientY; startX=e.clientX; document.body.style.cursor='grabbing'; }); window.addEventListener('mousemove',(e)=>{ if(!down) return; mini.style.right=(window.innerWidth - e.clientX - 120)+'px'; mini.style.bottom=(window.innerHeight - e.clientY - 60)+'px'; }); window.addEventListener('mouseup',()=>{ down=false; document.body.style.cursor='default'; }); })();

// --- Cloud background (soft particles) ---
(function(){ const c=$('bgCanvas'); const ctx=c.getContext('2d'); function res(){ c.width=innerWidth; c.height=innerHeight; } res(); window.addEventListener('resize',res); const arr=[]; for(let i=0;i<30;i++){ arr.push({x:Math.random()*c.width,y:Math.random()*c.height,r:30+Math.random()*100,vx:0.2+Math.random()*0.6}); }
  function loop(){ ctx.clearRect(0,0,c.width,c.height); for(const p of arr){ const g=ctx.createRadialGradient(p.x,p.y,p.r*0.1,p.x,p.y,p.r); g.addColorStop(0,'rgba(255,255,255,0.05)'); g.addColorStop(1,'rgba(255,255,255,0.01)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill(); p.x+=p.vx; if(p.x-p.r>c.width) p.x=-p.r; } requestAnimationFrame(loop); } loop(); })();