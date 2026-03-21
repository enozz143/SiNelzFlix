/**
 * CINElzFlix - Movie Page Logic
 * Version: 2.1 (The "No-Cut" Heavy Edition)
 * Developed by: Nelz & Gemini
 */

// 1. URL DATA EXTRACTION
const urlParams = new URLSearchParams(window.location.search);
const movieId = urlParams.get('id');
const mediaType = urlParams.get('type') || 'movie';

// 2. CONFIGURATION
const BASE_URL = 'https://cinelzflix-worker.baquial-enozz.workers.dev/'; 
const TMDB_IMG = 'https://image.tmdb.org/t/p/original';
const TMDB_POSTER = 'https://image.tmdb.org/t/p/w500';

/**
 * MAIN INITIALIZATION
 */
async function initMoviePage() {
    console.log("🎬 INITIALIZING MOVIE PAGE ENGINE...");
    
    if (!movieId) {
        console.error("CRITICAL: No Movie ID provided in URL parameters.");
        window.location.href = '../'; // Go back to home if no ID
        return;
    }

    try {
        // Fetching Data with complete append_to_response
        const requestUrl = `${BASE_URL}?endpoint=/${mediaType}/${movieId}&append_to_response=videos,credits,similar,images,recommendations`;
        console.log("📡 FETCHING DATA FROM:", requestUrl);

        const response = await fetch(requestUrl);
        
        if (!response.ok) {
            throw new Error(`Worker responded with status: ${response.status}`);
        }

        const movieData = await response.json();

        if (!movieData || movieData.success === false) {
            throw new Error("TMDB Data is empty or invalid.");
        }

        console.log("✅ DATA RECEIVED:", movieData);

        // --- PHASE 1: HERO SECTION & TRAILER ---
        renderHeroSection(movieData);

        // --- PHASE 2: MAIN MOVIE DETAILS ---
        renderMainDetails(movieData);

        // --- PHASE 3: CASTING & CREDITS ---
        renderCastList(movieData.credits);

        // --- PHASE 4: SIMILAR CONTENT ---
        renderSimilarContent(movieData.similar);

        // --- PHASE 5: PLAYER INITIALIZATION ---
        // Defaulting to Server 1
        updateVideoPlayer('vidsrc');

    } catch (err) {
        console.error("🚨 SYSTEM FAILURE:", err);
        handleSystemError();
    }
}

/**
 * RENDERING: HERO SECTION
 */
function renderHeroSection(data) {
    const titleHeader = document.getElementById('movie-title');
    const descriptionHero = document.getElementById('movie-description-hero');
    const metaContainer = document.getElementById('movie-meta-hero');
    const heroBg = document.getElementById('movie-hero');
    const trailerDiv = document.getElementById('trailer-container');

    // Title & Description
    if (titleHeader) titleHeader.innerText = data.title || data.name || "Unknown Title";
    if (descriptionHero) {
        const overview = data.overview || "No description available for this cinematic piece.";
        // Keeping your original substring logic
        descriptionHero.innerText = overview.substring(0, 200) + "...";
    }

    // Metadata Construction
    if (metaContainer) {
        const releaseYear = (data.release_date || data.first_air_date || "N/A").split('-')[0];
        const rating = data.vote_average ? data.vote_average.toFixed(1) : "0.0";
        const runtime = data.runtime ? `${data.runtime} min` : (data.episode_run_time ? `${data.episode_run_time[0]} min` : "");
        
        metaContainer.innerHTML = `
            <span class="meta-item">📅 ${releaseYear}</span>
            <span class="meta-item">⭐ ${rating}</span>
            <span class="meta-item">🎬 ${mediaType.toUpperCase()}</span>
            ${runtime ? `<span class="meta-item">🕒 ${runtime}</span>` : ''}
        `;
    }

    // Backdrop Setup (The Black Screen Fix)
    if (heroBg && data.backdrop_path) {
        const fullImgUrl = `${TMDB_IMG}${data.backdrop_path}`;
        console.log("🖼️ Applying Backdrop:", fullImgUrl);
        heroBg.style.backgroundImage = `linear-gradient(to top, #0a0a0a 10%, rgba(0,0,0,0.3)), url('${fullImgUrl}')`;
        heroBg.style.backgroundSize = 'cover';
        heroBg.style.backgroundPosition = 'center top';
    }

    // Trailer Engine (Slider.js Inspired)
    if (trailerDiv && data.videos && data.videos.results.length > 0) {
        const mainTrailer = data.videos.results.find(v => v.type === "Trailer" && v.site === "YouTube") || 
                           data.videos.results.find(v => v.site === "YouTube") || 
                           data.videos.results[0];

        if (mainTrailer && mainTrailer.site === "YouTube") {
            console.log("📽️ MAIN TRAILER KEY:", mainTrailer.key);
            
            // Wait for 1 second before injecting to ensure background image is visible
            setTimeout(() => {
                trailerDiv.innerHTML = `
                    <iframe 
                        id="hero-youtube-iframe"
                        src="https://www.youtube.com/embed/${mainTrailer.key}?autoplay=1&mute=1&controls=0&loop=1&playlist=${mainTrailer.key}&rel=0&showinfo=0&modestbranding=1&iv_load_policy=3&enablejsapi=1" 
                        frameborder="0" 
                        allow="autoplay; encrypted-media; fullscreen" 
                        style="width:100%; height:100%; position:absolute; top:0; left:0; pointer-events:none; z-index:0; border:none;">
                    </iframe>
                `;
            }, 1500);
        }
    }
}

/**
 * RENDERING: MAIN DETAILS
 */
function renderMainDetails(data) {
    const poster = document.getElementById('movie-poster');
    const fullOverview = document.getElementById('movie-overview');
    const voteAvg = document.getElementById('vote-avg');

    if (poster) {
        poster.src = data.poster_path ? `${TMDB_POSTER}${data.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster';
    }
    
    if (fullOverview) {
        fullOverview.innerText = data.overview || "Overview is currently unavailable.";
    }

    if (voteAvg) {
        voteAvg.innerText = data.vote_average ? data.vote_average.toFixed(1) : "0.0";
    }
}

/**
 * RENDERING: CAST LIST
 */
function renderCastList(credits) {
    const castContainer = document.getElementById('movie-cast');
    if (!castContainer || !credits || !credits.cast) return;

    const topCast = credits.cast.slice(0, 8); // Top 8 actors
    castContainer.innerHTML = topCast.map(actor => `
        <div class="cast-item">
            <div class="cast-img-wrapper">
                <img src="${actor.profile_path ? 'https://image.tmdb.org/t/p/w185' + actor.profile_path : 'https://via.placeholder.com/100x100?text=No+Photo'}" alt="${actor.name}">
            </div>
            <div class="cast-text">
                <p class="actor-name"><strong>${actor.name}</strong></p>
                <p class="character-name">${actor.character}</p>
            </div>
        </div>
    `).join('');
}

/**
 * RENDERING: SIMILAR MOVIES
 */
function renderSimilarContent(similar) {
    const similarContainer = document.getElementById('similar-movies-container');
    if (!similarContainer || !similar || !similar.results.length) return;

    const limitedSimilar = similar.results.slice(0, 12);
    similarContainer.innerHTML = `
        <h2 class="section-title">Similar Content You'll Love</h2>
        <div class="similar-grid">
            ${limitedSimilar.map(item => `
                <div class="similar-card" onclick="window.location.href='?id=${item.id}&type=${mediaType}'">
                    <img src="https://image.tmdb.org/t/p/w300${item.poster_path}" alt="${item.title || item.name}">
                    <div class="similar-info">
                        <p>${item.title || item.name}</p>
                        <span>⭐ ${item.vote_average.toFixed(1)}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

/**
 * PLAYER CONTROL SYSTEM
 */
function updateVideoPlayer(server) {
    const playerFrame = document.getElementById('movie-iframe');
    if (!playerFrame) return;

    let finalEmbedUrl = "";

    switch(server) {
        case 'vidsrc':
            finalEmbedUrl = mediaType === 'movie' 
                ? `https://vidsrc.me/embed/movie?tmdb=${movieId}` 
                : `https://vidsrc.me/embed/tv?tmdb=${movieId}&sea=1&epi=1`;
            break;
        case 'vidsrc2':
            finalEmbedUrl = `https://vidsrc.to/embed/${mediaType}/${movieId}`;
            break;
        case 'videasy':
            finalEmbedUrl = `https://player.videasy.net/${mediaType}/${movieId}`;
            break;
        default:
            finalEmbedUrl = `https://vidsrc.me/embed/movie?tmdb=${movieId}`;
    }

    console.log(`📡 SWITCHING PLAYER TO [${server}]:`, finalEmbedUrl);
    playerFrame.src = finalEmbedUrl;
}

/**
 * ERROR HANDLING
 */
function handleSystemError() {
    const title = document.getElementById('movie-title');
    if (title) title.innerText = "Error: Content Unavailable";
    
    const hero = document.getElementById('movie-hero');
    if (hero) hero.style.backgroundColor = "#111";
}

/**
 * EVENT LISTENERS (UI INTERACTION)
 */
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Scroll to Player Button
    const watchBtn = document.getElementById('scroll-to-player');
    if (watchBtn) {
        watchBtn.addEventListener('click', () => {
            const playerSection = document.getElementById('player-section');
            if (playerSection) {
                playerSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    // 2. Server Selection Change
    const serverDropdown = document.getElementById('server-select');
    if (serverDropdown) {
        serverDropdown.addEventListener('change', (event) => {
            updateVideoPlayer(event.target.value);
        });
    }

    // 3. Mute/Unmute Trailer Toggle
    const muteToggle = document.getElementById('trailer-mute-toggle');
    if (muteToggle) {
        muteToggle.addEventListener('click', () => {
            const ytFrame = document.getElementById('hero-youtube-iframe');
            if (ytFrame) {
                ytFrame.contentWindow.postMessage('{"event":"command","func":"unMute","args":""}', '*');
                muteToggle.innerHTML = "🔊 Sound On";
                muteToggle.classList.add('active');
            }
        });
    }
});

// START THE ENGINE
initMoviePage();
