// js/movie-page.js - FULL DEBUGGED VERSION (155+ Lines Logic)
const params = new URLSearchParams(window.location.search);
const movieId = params.get('id');
const mediaType = params.get('type') || 'movie';

const BASE_URL = 'https://cinelzflix-worker.baquial-enozz.workers.dev/'; 

async function loadMovieDetails() {
    if (!movieId) { 
        window.location.href = '/'; 
        return; 
    }

    try {
        console.log(`🚀 Loading cinematic experience for ${mediaType} ID: ${movieId}...`);
        
        const response = await fetch(`${BASE_URL}?endpoint=/${mediaType}/${movieId}&append_to_response=videos,credits,similar`);
        
        if (!response.ok) throw new Error(`Worker Error: ${response.status}`);
        const data = await response.json();

        if (!data || data.success === false) throw new Error("Content not found");

        // --- RENDER EVERYTHING ---
        updateHeroSection(data);
        updateDetailsSection(data);
        setPlayer('vidsrc');

    } catch (error) {
        console.error("Error loading movie page, bro:", error);
        const titleEl = document.getElementById('movie-title');
        if (titleEl) titleEl.innerText = "Content Unavailable ☹️";
    }
}

function updateHeroSection(data) {
    const titleEl = document.getElementById('movie-title');
    const descHero = document.getElementById('movie-description-hero');
    const trailerContainer = document.getElementById('trailer-container');
    const heroSection = document.getElementById('movie-hero');
    const metaHero = document.getElementById('movie-meta-hero');

    if (titleEl) titleEl.innerText = data.title || data.name;
    
    // Substring logic to keep it clean
    if (descHero) descHero.innerText = data.overview ? data.overview.substring(0, 200) + "..." : "";

    // 1. SET BACKDROP (Eto yung safety net para hindi mag-black screen)
    if (heroSection && data.backdrop_path) {
        heroSection.style.backgroundImage = `linear-gradient(to top, #0a0a0a, transparent), url(https://image.tmdb.org/t/p/original${data.backdrop_path})`;
        heroSection.style.backgroundSize = 'cover';
        heroSection.style.backgroundPosition = 'center';
    }

    const year = (data.release_date || data.first_air_date || "N/A").split('-')[0];
    const rating = data.vote_average ? data.vote_average.toFixed(1) : "N/A";
    if (metaHero) metaHero.innerHTML = `<span>📅 ${year}</span> | <span style="color: #00d4ff;">⭐ ${rating}</span> | <span>🎬 ${mediaType.toUpperCase()}</span>`;

    // 2. TRAILER LOGIC (The Index-Style Injector)
    if (trailerContainer && data.videos && data.videos.results.length > 0) {
        const video = data.videos.results.find(v => v.type === "Trailer" && v.site === "YouTube") || 
                      data.videos.results.find(v => v.type === "Teaser" && v.site === "YouTube") ||
                      data.videos.results[0];
        
        if (video && video.site === "YouTube") {
            console.log("🎥 Found video key: " + video.key);
            
            // Inject Iframe but keep it hidden first (opacity 0)
            trailerContainer.innerHTML = `
                <iframe 
                    id="hero-video"
                    src="https://www.youtube.com/embed/${video.key}?autoplay=1&mute=1&controls=0&loop=1&playlist=${video.key}&modestbranding=1&rel=0&enablejsapi=1&iv_load_policy=3" 
                    frameborder="0" 
                    allow="autoplay; fullscreen"
                    style="width:100%; height:100%; border:none; position:absolute; top:0; left:0; z-index:1; opacity:0; transition: opacity 1.5s ease; pointer-events: none;">
                </iframe>
            `;

            // Wait for YouTube to "warm up" before hiding the picture
            const iframe = document.getElementById('hero-video');
            if (iframe) {
                setTimeout(() => {
                    iframe.style.opacity = "1"; // Fade in video
                    if (heroSection) {
                        // Huwag i-set sa 'none' agad. Hayaan siyang mag-blend.
                        heroSection.style.backgroundColor = "#000"; 
                    }
                }, 2000); 
            }
        } else {
            console.log("❌ No YouTube trailer found for this ID.");
        }
    } else {
        console.log("❌ No video results in TMDB data.");
    }
}

function updateDetailsSection(data) {
    const posterImg = document.getElementById('movie-poster');
    const overviewFull = document.getElementById('movie-overview');
    const castEl = document.getElementById('movie-cast');

    if (posterImg) {
        posterImg.src = data.poster_path 
            ? `https://image.tmdb.org/t/p/w500${data.poster_path}` 
            : 'https://via.placeholder.com/500x750?text=No+Poster';
    }

    if (overviewFull) overviewFull.innerText = data.overview || "No description available.";

    if (castEl && data.credits && data.credits.cast) {
        castEl.innerHTML = data.credits.cast.slice(0, 6).map(person => `
            <div class="cast-item">
                <img src="${person.profile_path ? 'https://image.tmdb.org/t/p/w185' + person.profile_path : 'https://via.placeholder.com/100x100?text=No+Photo'}" alt="${person.name}">
                <p><strong>${person.name}</strong></p>
                <p style="font-size: 0.65rem; color: #777;">${person.character}</p>
            </div>
        `).join('');
    }
}

function setPlayer(server) {
    const iframe = document.getElementById('movie-iframe');
    if (!iframe) return;

    let src = "";
    if (server === 'vidsrc') {
        src = mediaType === 'movie' 
            ? `https://vidsrc.me/embed/movie?tmdb=${movieId}` 
            : `https://vidsrc.me/embed/tv?tmdb=${movieId}&sea=1&epi=1`;
    } else if (server === 'vidsrc2') {
        src = `https://vidsrc.to/embed/${mediaType}/${movieId}`;
    } else {
        src = `https://player.videasy.net/${mediaType}/${movieId}`;
    }
    
    iframe.src = src;
}

// --- CONTROLS & LISTENERS ---

const muteBtn = document.querySelector('.hero-actions button:nth-child(2)');
if (muteBtn) {
    muteBtn.addEventListener('click', () => {
        const iframe = document.getElementById('hero-video');
        if (iframe) {
            iframe.contentWindow.postMessage('{"event":"command","func":"unMute","args":""}', '*');
            muteBtn.innerHTML = "🔊 Sound On";
        }
    });
}

const scrollBtn = document.getElementById('scroll-to-player');
if (scrollBtn) {
    scrollBtn.addEventListener('click', () => {
        const playerSec = document.getElementById('player-section');
        if(playerSec) playerSec.scrollIntoView({ behavior: 'smooth' });
    });
}

const serverSelect = document.getElementById('server-select');
if (serverSelect) {
    serverSelect.addEventListener('change', (e) => setPlayer(e.target.value));
}

loadMovieDetails();
