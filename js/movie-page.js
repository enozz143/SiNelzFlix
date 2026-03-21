// js/movie-page.js - THE DEFINITIVE FULL VERSION
const params = new URLSearchParams(window.location.search);
const movieId = params.get('id');
const mediaType = params.get('type') || 'movie';

const BASE_URL = 'https://cinelzflix-worker.baquial-enozz.workers.dev/'; 

/**
 * MAIN LOADER FUNCTION
 */
async function loadMovieDetails() {
    if (!movieId) { 
        console.error("No Movie ID found in URL.");
        window.location.href = '/'; 
        return; 
    }

    try {
        console.log(`🚀 Loading cinematic experience for ${mediaType} ID: ${movieId}...`);
        
        // Fetching with append_to_response to get everything in one go
        const response = await fetch(`${BASE_URL}?endpoint=/${mediaType}/${movieId}&append_to_response=videos,credits,similar`);
        
        if (!response.ok) throw new Error(`Worker Error Status: ${response.status}`);
        const data = await response.json();

        if (!data || data.success === false) {
            throw new Error("API returned success:false or empty data");
        }

        // --- PHASE 1: UI RENDERING ---
        updateHeroSection(data);
        updateDetailsSection(data);
        updateSimilarSection(data.similar);

        // --- PHASE 2: PLAYER SETUP ---
        setPlayer('vidsrc');

    } catch (error) {
        console.error("CRITICAL ERROR on movie-page.js:", error);
        const titleEl = document.getElementById('movie-title');
        if (titleEl) titleEl.innerText = "Error Loading Content ☹️";
    }
}

/**
 * HERO & TRAILER LOGIC (Slider-Hybrid Engine)
 */
function updateHeroSection(data) {
    const titleEl = document.getElementById('movie-title');
    const descHero = document.getElementById('movie-description-hero');
    const trailerContainer = document.getElementById('trailer-container');
    const heroSection = document.getElementById('movie-hero');
    const metaHero = document.getElementById('movie-meta-hero');

    // Text Content
    if (titleEl) titleEl.innerText = data.title || data.name;
    if (descHero) {
        const fullDesc = data.overview || "No overview available for this title.";
        descHero.innerText = fullDesc.length > 180 ? fullDesc.substring(0, 180) + "..." : fullDesc;
    }

    // Metadata (Year | Rating | Type)
    const year = (data.release_date || data.first_air_date || "N/A").split('-')[0];
    const rating = data.vote_average ? data.vote_average.toFixed(1) : "0.0";
    if (metaHero) {
        metaHero.innerHTML = `
            <span>📅 ${year}</span>
            <span class="separator">•</span>
            <span style="color: #00d4ff;">⭐ ${rating}</span>
            <span class="separator">•</span>
            <span style="text-transform: uppercase; font-weight: bold; font-size: 0.7rem; border: 1px solid #333; padding: 2px 8px; border-radius: 4px;">${mediaType}</span>
        `;
    }

    // STEP 1: LOAD BACKDROP IMMEDIATELY (Safety Net)
    if (heroSection && data.backdrop_path) {
        heroSection.style.backgroundImage = `linear-gradient(to top, #0a0a0a 15%, transparent), url(https://image.tmdb.org/t/p/original${data.backdrop_path})`;
        heroSection.style.backgroundSize = 'cover';
        heroSection.style.backgroundPosition = 'center';
    }

    // STEP 2: INJECT TRAILER (Using Slider.js Working Formula)
    if (trailerContainer) {
        let trailerKey = "";
        
        if (data.videos && data.videos.results) {
            const video = data.videos.results.find(v => v.type === "Trailer" && v.site === "YouTube") || 
                          data.videos.results.find(v => v.site === "YouTube");
            if (video) trailerKey = video.key;
        }

        if (trailerKey) {
            console.log("🎥 Trailer Found: " + trailerKey);
            // Iframe params from your working slider
            trailerContainer.innerHTML = `
                <iframe 
                    id="hero-video-frame"
                    src="https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailerKey}&rel=0&showinfo=0&modestbranding=1&iv_load_policy=3&enablejsapi=1" 
                    frameborder="0" 
                    allow="autoplay; encrypted-media; fullscreen" 
                    style="width:100%; height:100%; position:absolute; top:0; left:0; border:none; z-index:0; opacity:0; transition: opacity 1.5s ease;">
                </iframe>
            `;

            // Transition logic to prevent black flicker
            const frame = document.getElementById('hero-video-frame');
            if (frame) {
                setTimeout(() => {
                    frame.style.opacity = "1";
                    // Once video is visible, we can darken the background
                    if (heroSection) heroSection.style.backgroundColor = "#000";
                }, 2500);
            }
        } else {
            console.log("❌ No trailer found. Keeping backdrop image.");
        }
    }
}

/**
 * POSTER & CAST DETAILS
 */
function updateDetailsSection(data) {
    const posterImg = document.getElementById('movie-poster');
    const overviewFull = document.getElementById('movie-overview');
    const castEl = document.getElementById('movie-cast');
    const ratingBadge = document.getElementById('vote-avg');

    if (posterImg) {
        posterImg.src = data.poster_path 
            ? `https://image.tmdb.org/t/p/w500${data.poster_path}` 
            : 'https://via.placeholder.com/500x750?text=No+Poster';
    }

    if (ratingBadge) ratingBadge.innerText = data.vote_average ? data.vote_average.toFixed(1) : "0.0";
    if (overviewFull) overviewFull.innerText = data.overview || "No detailed description available.";

    if (castEl && data.credits && data.credits.cast) {
        castEl.innerHTML = data.credits.cast.slice(0, 6).map(person => `
            <div class="cast-item">
                <img src="${person.profile_path ? 'https://image.tmdb.org/t/p/w185' + person.profile_path : 'https://via.placeholder.com/100x100?text=No+Photo'}" alt="${person.name}">
                <div class="cast-info">
                    <p class="cast-name">${person.name}</p>
                    <p class="cast-role">${person.character}</p>
                </div>
            </div>
        `).join('');
    }
}

/**
 * SIMILAR MOVIES SECTION
 */
function updateSimilarSection(similarData) {
    const container = document.getElementById('similar-movies-container');
    if (!container || !similarData || !similarData.results.length) return;

    const movies = similarData.results.slice(0, 10);
    container.innerHTML = `
        <h2 class="section-title">Similar Content</h2>
        <div class="movie-row horizontal-scroll">
            ${movies.map(m => `
                <div class="movie-card" onclick="window.location.href='?id=${m.id}&type=${mediaType}'">
                    <img src="https://image.tmdb.org/t/p/w300${m.poster_path}" alt="${m.title || m.name}">
                    <div class="card-overlay">
                        <p>${m.title || m.name}</p>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

/**
 * PLAYER EMBED LOGIC
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

/**
 * GLOBAL EVENT LISTENERS
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Scroll Button
    const scrollBtn = document.getElementById('scroll-to-player');
    if (scrollBtn) {
        scrollBtn.onclick = () => {
            document.getElementById('player-section')?.scrollIntoView({ behavior: 'smooth' });
        };
    }

    // 2. Mute Toggle
    const muteBtn = document.getElementById('trailer-mute-toggle');
    if (muteBtn) {
        muteBtn.onclick = () => {
            const frame = document.getElementById('hero-video-frame');
            if (frame) {
                frame.contentWindow.postMessage('{"event":"command","func":"unMute","args":""}', '*');
                muteBtn.innerHTML = "🔊 Sound On";
            }
        };
    }

    // 3. Server Select
    const serverSelect = document.getElementById('server-select');
    if (serverSelect) {
        serverSelect.onchange = (e) => setPlayer(e.target.value);
    }
});

// Run Initialization
loadMovieDetails();
