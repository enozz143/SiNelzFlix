// js/movie-page.js
const params = new URLSearchParams(window.location.search);
const movieId = params.get('id');
const mediaType = params.get('type') || 'movie';

// Ang iyong Cloudflare Worker URL
const BASE_URL = 'https://cinelzflix-worker.baquial-enozz.workers.dev/'; 

async function loadMovieDetails() {
    if (!movieId) { 
        window.location.href = '/'; 
        return; 
    }

    try {
        console.log(`🚀 Loading cinematic experience for ${mediaType} ID: ${movieId}...`);
        
        // 1. FETCH DETAILS, VIDEOS, AND CREDITS IN ONE GO
        const response = await fetch(`${BASE_URL}?endpoint=/${mediaType}/${movieId}&append_to_response=videos,credits,similar`);
        
        if (!response.ok) throw new Error(`Worker Error: ${response.status}`);
        const data = await response.json();

        if (!data || data.success === false) throw new Error("Content not found");

        // --- UPDATE HERO TRAILER & INFO ---
        updateHeroSection(data);

        // --- UPDATE MAIN DETAILS & CAST ---
        updateDetailsSection(data);

        // --- SETUP PLAYER (Default Server) ---
        setPlayer('vidsrc');

    } catch (error) {
        console.error("Error loading movie page, bro:", error);
        document.getElementById('movie-title').innerText = "Content Unavailable ☹️";
    }
}

/**
 * Nag-a-update ng Trailer at Hero Information sa taas
 */
function updateHeroSection(data) {
    const titleEl = document.getElementById('movie-title');
    const descHero = document.getElementById('movie-description-hero');
    const trailerContainer = document.getElementById('trailer-container');
    const metaHero = document.getElementById('movie-meta-hero');

    if (titleEl) titleEl.innerText = data.title || data.name;
    if (descHero) descHero.innerText = data.overview ? data.overview.substring(0, 180) + "..." : "";

    // Formatting Meta (Year, Rating, Type)
    const year = (data.release_date || data.first_air_date || "N/A").split('-')[0];
    const rating = data.vote_average ? data.vote_average.toFixed(1) : "N/A";
    if (metaHero) metaHero.innerHTML = `<span>📅 ${year}</span> | <span style="color: #00d4ff;">⭐ ${rating}</span> | <span>🎬 ${mediaType.toUpperCase()}</span>`;

    // TRAILER LOGIC
    if (trailerContainer && data.videos && data.videos.results.length > 0) {
        // Hanapin ang official trailer sa YouTube
        const trailer = data.videos.results.find(v => v.type === "Trailer" && v.site === "YouTube") || data.videos.results[0];
        
        if (trailer) {
            trailerContainer.innerHTML = `
                <iframe 
                    src="https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailer.key}&showinfo=0&modestbranding=1&rel=0&iv_load_policy=3" 
                    frameborder="0" 
                    allow="autoplay; encrypted-media">
                </iframe>
            `;
        }
    }
}

/**
 * Nag-a-update ng Poster, Full Overview, at Cast with Photos
 */
function updateDetailsSection(data) {
    const posterImg = document.getElementById('movie-poster');
    const overviewFull = document.getElementById('movie-overview');
    const castEl = document.getElementById('movie-cast');
    const voteAvg = document.getElementById('vote-avg');

    if (posterImg) {
        posterImg.src = data.poster_path 
            ? `https://image.tmdb.org/t/p/w500${data.poster_path}` 
            : 'https://via.placeholder.com/500x750?text=No+Poster';
    }

    if (overviewFull) overviewFull.innerText = data.overview || "No description available, bro.";
    if (voteAvg) voteAvg.innerText = data.vote_average ? data.vote_average.toFixed(1) : "0.0";

    // CAST WITH PHOTOS (Top 6)
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

/**
 * Player Engine - Switcher ng Servers
 */
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

// --- GLOBAL EVENT LISTENERS ---

// 1. Server Switcher
const serverSelect = document.getElementById('server-select');
if (serverSelect) {
    serverSelect.addEventListener('change', (e) => setPlayer(e.target.value));
}

// 2. Scroll to Player Button
const scrollBtn = document.getElementById('scroll-to-player');
if (scrollBtn) {
    scrollBtn.addEventListener('click', () => {
        document.getElementById('player-section').scrollIntoView({ behavior: 'smooth' });
    });
}

// Fire the engine!
loadMovieDetails();
