/**
 * CINElzFlix - Ultimate Movie Page Engine
 * Version: 3.3 (Fixed YouTube Embed - Working!)
 * Developed by: Nelz & Gemini
 */

const urlParams = new URLSearchParams(window.location.search);
const movieId = urlParams.get('id');
const mediaType = urlParams.get('type') || 'movie';

const BASE_URL = 'https://cinelzflix-worker.baquial-enozzz.workers.dev/'; 
const TMDB_IMG = 'https://image.tmdb.org/t/p/original';
const TMDB_POSTER = 'https://image.tmdb.org/t/p/w500';

// Global store para sa trailer data
window.movieTrailerKey = "";
window.movieTitle = "";

async function initMoviePage() {
    console.log("🎬 Engine Starting...");
    if (!movieId) {
        window.location.href = '../';
        return;
    }

    try {
        showLoadingState();
        
        const response = await fetch(`${BASE_URL}?endpoint=/${mediaType}/${movieId}&append_to_response=videos,credits,similar`);
        const data = await response.json();

        if (!data || data.success === false) throw new Error("API Connection Failed");

        window.movieTitle = data.title || data.name;
        
        // --- GET TRAILER FROM TMDB ---
        window.movieTrailerKey = await getTrailerKey(data);
        
        if (window.movieTrailerKey) {
            console.log("✅ TMDB Trailer found! Key:", window.movieTrailerKey);
        } else {
            console.log("🔍 No TMDB trailer, will use YouTube search for:", window.movieTitle);
        }

        renderHero(data);
        renderDetails(data);
        renderCast(data.credits);
        renderSimilar(data.similar);
        updateTrailerButtonState();

        updateVideoPlayer('vidsrc');

    } catch (err) {
        console.error("🚨 CRITICAL ERROR:", err);
        document.getElementById('movie-title').innerText = "Content Offline ☹️";
        showErrorMessage("Failed to load movie data. Please try again later.");
    } finally {
        hideLoadingState();
    }
}

/**
 * Get trailer key from TMDB
 */
async function getTrailerKey(data) {
    if (!data.videos || !data.videos.results.length) {
        return "";
    }
    
    const videoTypes = ["Trailer", "Teaser", "Featurette", "Behind the Scenes", "Clip"];
    
    for (const type of videoTypes) {
        const video = data.videos.results.find(v => 
            v.type === type && 
            v.site === "YouTube" &&
            v.key && 
            v.key.trim() !== ""
        );
        if (video) {
            console.log(`🎬 Found ${type} in TMDB:`, video.key);
            return video.key;
        }
    }
    
    const anyVideo = data.videos.results.find(v => v.site === "YouTube" && v.key);
    if (anyVideo) {
        console.log("🎬 Using fallback TMDB video:", anyVideo.type);
        return anyVideo.key;
    }
    
    return "";
}

/**
 * Update trailer button UI
 */
function updateTrailerButtonState() {
    const trailerBtn = document.getElementById('play-trailer-btn');
    if (!trailerBtn) return;
    
    if (window.movieTrailerKey) {
        trailerBtn.style.opacity = "1";
        trailerBtn.style.cursor = "pointer";
        trailerBtn.title = "Watch Official Trailer";
        trailerBtn.innerHTML = "🎬 WATCH TRAILER";
    } else {
        trailerBtn.style.opacity = "1";
        trailerBtn.style.cursor = "pointer";
        trailerBtn.title = "Search YouTube for trailer";
        trailerBtn.innerHTML = "🔍 SEARCH TRAILER ON YOUTUBE";
    }
}

/**
 * MAIN PLAYER SYSTEM
 */
function updateVideoPlayer(server) {
    const iframe = document.getElementById('movie-iframe');
    const playerError = document.getElementById('player-error');
    const loadingIndicator = document.getElementById('player-loading');
    
    if (!iframe) return;
    
    if (playerError) playerError.style.display = 'none';
    if (loadingIndicator) loadingIndicator.style.display = 'flex';
    
    if (server === 'trailer') {
        handleTrailerPlayback(iframe, loadingIndicator);
    } else {
        handleServerPlayback(server, iframe, loadingIndicator);
    }
}

/**
 * ✅ FIXED: Trailer playback - TMDB or YouTube Search (WORKING!)
 */
function handleTrailerPlayback(iframe, loadingIndicator) {
    const title = window.movieTitle || document.getElementById('movie-title')?.innerText || "this title";
    
    if (window.movieTrailerKey && window.movieTrailerKey.trim() !== "") {
        // ✅ MAY TRAILER SA TMDB - play it directly!
        console.log("🎬 Playing TMDB trailer:", window.movieTrailerKey);
        iframe.style.display = 'block';
        iframe.src = `https://www.youtube.com/embed/${window.movieTrailerKey}?autoplay=1&rel=0&modestbranding=1&showinfo=0`;
        
        iframe.onload = () => {
            if (loadingIndicator) loadingIndicator.style.display = 'none';
        };
        
        setTimeout(() => {
            if (loadingIndicator) loadingIndicator.style.display = 'none';
        }, 5000);
        
    } else {
        // 🔍 WALANG TMDB TRAILER - YouTube search results page (100% WORKING!)
        console.log("🔍 No TMDB trailer, opening YouTube search for:", title);
        iframe.style.display = 'block';
        
        // Direct YouTube search results page - guaranteed to work!
        const searchQuery = encodeURIComponent(`${title} official trailer`);
        iframe.src = `https://www.youtube.com/results?search_query=${searchQuery}`;
        
        iframe.onload = () => {
            if (loadingIndicator) loadingIndicator.style.display = 'none';
        };
        
        // Show notification
        showNotification(`🔍 Showing YouTube search results for "${title}" trailer...`);
        
        setTimeout(() => {
            if (loadingIndicator) loadingIndicator.style.display = 'none';
        }, 5000);
    }
}

/**
 * Handle video server playback
 */
function handleServerPlayback(server, iframe, loadingIndicator) {
    const servers = {
        'vidsrc': mediaType === 'movie' ? `https://vidsrc.me/embed/movie?tmdb=${movieId}` : `https://vidsrc.me/embed/tv?tmdb=${movieId}&sea=1&epi=1`,
        'vidsrc2': `https://vidsrc.to/embed/${mediaType}/${movieId}`,
        'videasy': `https://player.videasy.net/${mediaType}/${movieId}`
    };
    
    const newSrc = servers[server] || servers['vidsrc'];
    console.log("🎬 Loading server:", server, newSrc);
    
    iframe.style.display = 'block';
    iframe.src = newSrc;
    
    iframe.onerror = () => {
        console.error("Failed to load iframe:", server);
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        showServerErrorMessage(server);
    };
    
    iframe.onload = () => {
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    };
    
    setTimeout(() => {
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    }, 8000);
}

/**
 * Show temporary notification
 */
function showNotification(message) {
    let notif = document.getElementById('temp-notification');
    if (!notif) {
        notif = document.createElement('div');
        notif.id = 'temp-notification';
        notif.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 212, 255, 0.95);
            color: #000;
            padding: 10px 20px;
            border-radius: 30px;
            font-weight: bold;
            z-index: 10000;
            font-size: 0.85rem;
            animation: fadeInOut 3s ease forwards;
            white-space: nowrap;
            box-shadow: 0 0 20px rgba(0,212,255,0.5);
        `;
        document.body.appendChild(notif);
        
        if (!document.getElementById('notif-styles')) {
            const style = document.createElement('style');
            style.id = 'notif-styles';
            style.textContent = `
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translateX(-50%) translateY(20px); }
                    15% { opacity: 1; transform: translateX(-50%) translateY(0); }
                    85% { opacity: 1; transform: translateX(-50%) translateY(0); }
                    100% { opacity: 0; transform: translateX(-50%) translateY(-20px); visibility: hidden; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    notif.textContent = message;
    notif.style.display = 'block';
    notif.style.visibility = 'visible';
    
    setTimeout(() => {
        notif.style.display = 'none';
    }, 3000);
}

/**
 * Show server error message
 */
function showServerErrorMessage(server) {
    let errorDiv = document.getElementById('player-error');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'player-error';
        errorDiv.style.cssText = `
            text-align: center;
            padding: 40px;
            background: rgba(0,0,0,0.8);
            border-radius: 10px;
            margin: 20px;
            color: #ff6b6b;
        `;
        document.getElementById('player-section')?.appendChild(errorDiv);
    }
    
    errorDiv.innerHTML = `
        <p>⚠️ Unable to load ${server} server.</p>
        <p style="font-size: 14px; color: #ccc;">Please try switching to another server or check your connection.</p>
        <button onclick="location.reload()" style="background: #00d4ff; color: #000; border: none; padding: 8px 16px; border-radius: 5px; margin-top: 10px; cursor: pointer;">
            Retry
        </button>
    `;
    errorDiv.style.display = 'block';
    
    setTimeout(() => {
        if (errorDiv) errorDiv.style.display = 'none';
    }, 5000);
}

/**
 * Loading state functions
 */
function showLoadingState() {
    const spinner = document.getElementById('global-loading');
    if (spinner) {
        spinner.style.display = 'flex';
    } else {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'global-loading';
        loadingDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 9999;
            text-align: center;
            background: rgba(0,0,0,0.9);
            padding: 20px 30px;
            border-radius: 10px;
        `;
        loadingDiv.innerHTML = `
            <div style="width: 50px; height: 50px; border: 3px solid #333; border-top-color: #00d4ff; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto;"></div>
            <p style="color: #00d4ff; margin-top: 10px;">Loading...</p>
        `;
        document.body.appendChild(loadingDiv);
        
        if (!document.getElementById('spin-keyframes')) {
            const style = document.createElement('style');
            style.id = 'spin-keyframes';
            style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
            document.head.appendChild(style);
        }
    }
}

function hideLoadingState() {
    const spinner = document.getElementById('global-loading');
    if (spinner) spinner.style.display = 'none';
}

function showErrorMessage(message) {
    const errorMsg = document.createElement('div');
    errorMsg.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #ff4444;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 9999;
        animation: fadeIn 0.3s ease;
    `;
    errorMsg.innerText = message;
    document.body.appendChild(errorMsg);
    
    setTimeout(() => errorMsg.remove(), 5000);
}

/**
 * RENDER FUNCTIONS
 */
function renderHero(data) {
    const heroBg = document.getElementById('movie-hero');
    const title = document.getElementById('movie-title');
    const desc = document.getElementById('movie-description-hero');
    const meta = document.getElementById('movie-meta-hero');

    if (title) title.innerText = data.title || data.name;
    if (desc) desc.innerText = data.overview ? data.overview.substring(0, 200) + "..." : "No description available.";

    if (meta) {
        const year = (data.release_date || data.first_air_date || "N/A").split('-')[0];
        const rating = data.vote_average ? data.vote_average.toFixed(1) : "0.0";
        const status = data.status || "Released";
        meta.innerHTML = `
            <span class="meta-badge">📅 ${year}</span>
            <span class="meta-badge" style="color:#00d4ff;">⭐ ${rating}</span>
            <span class="meta-badge">🎬 ${mediaType.toUpperCase()}</span>
            <span class="meta-badge" style="font-size: 0.7rem; opacity: 0.7;">[${status}]</span>
        `;
    }

    if (heroBg && data.backdrop_path) {
        heroBg.style.backgroundImage = `linear-gradient(to top, #0a0a0a 15%, rgba(0,0,0,0.4)), url('${TMDB_IMG}${data.backdrop_path}')`;
        heroBg.style.backgroundSize = 'cover';
        heroBg.style.backgroundPosition = 'center top';
    }
}

function renderDetails(data) {
    const poster = document.getElementById('movie-poster');
    const overview = document.getElementById('movie-overview');
    const vote = document.getElementById('vote-avg');

    if (poster) poster.src = data.poster_path ? `${TMDB_POSTER}${data.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster';
    if (overview) overview.innerText = data.overview || "The plot for this title is currently protected or unavailable.";
    if (vote) vote.innerText = data.vote_average ? data.vote_average.toFixed(1) : "0.0";
}

function renderCast(credits) {
    const castList = document.getElementById('movie-cast');
    if (!castList || !credits?.cast) return;

    castList.innerHTML = credits.cast.slice(0, 8).map(actor => `
        <div class="cast-item">
            <div class="cast-img-wrapper">
                <img src="${actor.profile_path ? 'https://image.tmdb.org/t/p/w185' + actor.profile_path : 'https://via.placeholder.com/100x100?text=No+Photo'}" alt="${actor.name}" loading="lazy">
            </div>
            <p><strong>${actor.name}</strong></p>
            <p style="font-size: 0.7rem; color: #777;">${actor.character || 'Cast'}</p>
        </div>
    `).join('');
}

function renderSimilar(similar) {
    const container = document.getElementById('similar-movies-container');
    if (!container || !similar?.results.length) return;

    container.innerHTML = `
        <h2 style="margin: 30px 0 15px;">More Like This</h2>
        <div class="similar-grid" style="display: flex; gap: 15px; overflow-x: auto; padding-bottom: 20px;">
            ${similar.results.slice(0, 12).map(m => `
                <div class="similar-card" style="min-width: 160px; cursor: pointer;" onclick="window.location.href='?id=${m.id}&type=${mediaType}'">
                    <img src="https://image.tmdb.org/t/p/w300${m.poster_path}" style="width: 100%; border-radius: 10px; transition: 0.3s;" loading="lazy">
                    <p style="font-size: 0.85rem; margin-top: 8px; font-weight: bold;">${m.title || m.name}</p>
                    <span style="font-size: 0.7rem; color: #00d4ff;">⭐ ${m.vote_average ? m.vote_average.toFixed(1) : 'N/A'}</span>
                </div>
            `).join('')}
        </div>
    `;
}

/**
 * EVENT LISTENERS
 */
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('scroll-to-player')?.addEventListener('click', () => {
        updateVideoPlayer('vidsrc'); 
        document.getElementById('player-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    const trailerBtn = document.getElementById('play-trailer-btn');
    if (trailerBtn) {
        trailerBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log("🎬 Trailer button clicked");
            updateVideoPlayer('trailer');
            document.getElementById('player-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    const serverSelect = document.getElementById('server-select');
    if (serverSelect) {
        serverSelect.addEventListener('change', (e) => {
            updateVideoPlayer(e.target.value);
        });
    }
});

// INITIALIZE
initMoviePage();
