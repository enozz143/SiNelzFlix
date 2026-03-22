/**
 * CINElzFlix - Ultimate Movie Page Engine
 * Version: 3.9 (FIXED: Direct In-Page Trailer Playback)
 * Developed by: Nelz & Gemini
 */

const urlParams = new URLSearchParams(window.location.search);
const movieId = urlParams.get('id');
const mediaType = urlParams.get('type') || 'movie';

const BASE_URL = 'https://cinelzflix-worker.baquial-enozz.workers.dev/'; 
const TMDB_IMG = 'https://image.tmdb.org/t/p/original';
const TMDB_POSTER = 'https://image.tmdb.org/t/p/w500';

// Global store
window.movieTrailerKey = "";
window.movieTitle = "";

async function initMoviePage() {
    if (!movieId) {
        window.location.href = '../';
        return;
    }

    try {
        showLoadingState();
        
        const apiUrl = `${BASE_URL}?endpoint=/${mediaType}/${movieId}&append_to_response=videos,credits,similar`;
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        if (!data || data.success === false) throw new Error("Invalid API Data");

        window.movieTitle = data.title || data.name || "Unknown Title";
        window.movieTrailerKey = await getTrailerKey(data);
        
        renderHero(data);
        renderDetails(data);
        renderCast(data.credits);
        renderSimilar(data.similar);
        updateTrailerButtonState();

        // Load movie server by default sa main player
        updateVideoPlayer('vidsrc');
        
        console.log("✅ Engine Ready");

    } catch (err) {
        console.error("🚨 Error:", err);
        showErrorMessage(`Failed to load: ${err.message}`);
    } finally {
        hideLoadingState();
    }
}

async function getTrailerKey(data) {
    if (!data.videos || !data.videos.results.length) return "";
    const priority = ["Trailer", "Teaser", "Clip"];
    for (const type of priority) {
        const video = data.videos.results.find(v => v.type === type && v.site === "YouTube" && v.key);
        if (video) return video.key;
    }
    return data.videos.results[0]?.key || "";
}

function updateTrailerButtonState() {
    const trailerBtn = document.getElementById('play-trailer-btn');
    if (!trailerBtn) return;
    trailerBtn.innerHTML = "🎬 WATCH TRAILER";
    trailerBtn.title = "Play Trailer in the player below";
}

/**
 * MAIN PLAYER SYSTEM
 * Traffic controller para sa movie servers at trailer.
 */
function updateVideoPlayer(server) {
    const iframe = document.getElementById('movie-iframe');
    const loadingIndicator = document.getElementById('player-loading');
    
    if (!iframe) return;
    
    if (server === 'trailer') {
        // ✅ FIX: Trailer now loads DIRECTLY in the main iframe
        handleTrailerDirectEmbed(iframe, loadingIndicator);
    } else {
        // Normal movie servers
        handleServerPlayback(server, iframe, loadingIndicator);
    }
}

/**
 * ✅ FIXED: Direct Trailer Embed
 * No Modals, No Popups, No New Tabs.
 */
function handleTrailerDirectEmbed(iframe, loadingIndicator) {
    const title = window.movieTitle;
    if (loadingIndicator) loadingIndicator.style.display = 'flex';
    
    iframe.style.display = 'block';
    
    if (window.movieTrailerKey) {
        // Case 1: May YouTube Key - Embed directly
        iframe.src = `https://www.youtube.com/embed/${window.movieTrailerKey}?autoplay=1&rel=0&modestbranding=1`;
    } else {
        // Case 2: Walang Key - Use the YouTube Search Embed trick
        const searchQuery = encodeURIComponent(`${title} official trailer`);
        iframe.src = `https://www.youtube.com/embed?listType=search&list=${searchQuery}&autoplay=1`;
        showNotification(`Searching for "${title}" trailer...`);
    }

    iframe.onload = () => {
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    };
}

function handleServerPlayback(server, iframe, loadingIndicator) {
    if (loadingIndicator) loadingIndicator.style.display = 'flex';

    const servers = {
        'vidsrc': mediaType === 'movie' ? `https://vidsrc.me/embed/movie?tmdb=${movieId}` : `https://vidsrc.me/embed/tv?tmdb=${movieId}&sea=1&epi=1`,
        'vidsrc2': `https://vidsrc.to/embed/${mediaType}/${movieId}`,
        'videasy': `https://player.videasy.net/${mediaType}/${movieId}`
    };
    
    iframe.style.display = 'block';
    iframe.src = servers[server] || servers['vidsrc'];
    
    iframe.onload = () => {
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    };
}

// --- RENDERING HELPERS ---

function renderHero(data) {
    const heroBg = document.getElementById('movie-hero');
    const title = document.getElementById('movie-title');
    const desc = document.getElementById('movie-description-hero');
    const meta = document.getElementById('movie-meta-hero');

    if (title) title.innerText = data.title || data.name;
    if (desc) desc.innerText = data.overview ? data.overview.substring(0, 180) + "..." : "No description.";
    if (meta) {
        const year = (data.release_date || data.first_air_date || "").split('-')[0];
        meta.innerHTML = `<span>📅 ${year}</span> <span style="color:#00d4ff;">⭐ ${data.vote_average?.toFixed(1)}</span>`;
    }
    if (heroBg && data.backdrop_path) {
        heroBg.style.backgroundImage = `linear-gradient(to top, #0a0a0a 15%, rgba(0,0,0,0.4)), url('${TMDB_IMG}${data.backdrop_path}')`;
    }
}

function renderDetails(data) {
    const poster = document.getElementById('movie-poster');
    const overview = document.getElementById('movie-overview');
    if (poster) poster.src = data.poster_path ? `${TMDB_POSTER}${data.poster_path}` : '';
    if (overview) overview.innerText = data.overview || "No overview.";
}

function renderCast(credits) {
    const castList = document.getElementById('movie-cast');
    if (!castList || !credits?.cast) return;
    castList.innerHTML = credits.cast.slice(0, 8).map(actor => `
        <div class="cast-item">
            <img src="${actor.profile_path ? 'https://image.tmdb.org/t/p/w185' + actor.profile_path : 'https://via.placeholder.com/100'}">
            <p><strong>${actor.name}</strong></p>
        </div>
    `).join('');
}

function renderSimilar(similar) {
    const container = document.getElementById('similar-movies-container');
    if (!container || !similar?.results.length) return;
    container.innerHTML = `
        <h2 style="margin: 20px 0;">More Like This</h2>
        <div style="display: flex; gap: 15px; overflow-x: auto; padding-bottom: 20px;">
            ${similar.results.slice(0, 10).map(m => `
                <div style="min-width: 150px; cursor: pointer;" onclick="window.location.href='?id=${m.id}&type=${mediaType}'">
                    <img src="https://image.tmdb.org/t/p/w300${m.poster_path}" style="width: 100%; border-radius: 10px;">
                    <p style="font-size: 0.8rem; margin-top: 5px;">${m.title || m.name}</p>
                </div>
            `).join('')}
        </div>`;
}

// --- UTILS ---

function showNotification(m) {
    let notif = document.getElementById('temp-notification') || document.createElement('div');
    notif.id = 'temp-notification';
    notif.style.cssText = "position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:#00d4ff; color:#000; padding:10px 20px; border-radius:20px; z-index:10000; font-weight:bold; font-size:13px;";
    notif.textContent = m;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
}

function showLoadingState() { document.getElementById('global-loading') ? document.getElementById('global-loading').style.display = 'flex' : null; }
function hideLoadingState() { document.getElementById('global-loading') ? document.getElementById('global-loading').style.display = 'none' : null; }
function showErrorMessage(m) { alert(m); }

// --- LISTENERS ---

document.addEventListener('DOMContentLoaded', () => {
    // Scroll and Play Movie
    document.getElementById('scroll-to-player')?.addEventListener('click', (e) => {
        e.preventDefault();
        updateVideoPlayer('vidsrc');
        document.getElementById('player-section')?.scrollIntoView({ behavior: 'smooth' });
    });

    // Play Trailer directly in main player
    document.getElementById('play-trailer-btn')?.addEventListener('click', (e) => {
        e.preventDefault(); // ✅ STOP REDIRECT
        updateVideoPlayer('trailer');
        document.getElementById('player-section')?.scrollIntoView({ behavior: 'smooth' });
    });

    // Switch Servers
    document.getElementById('server-select')?.addEventListener('change', (e) => {
        updateVideoPlayer(e.target.value);
    });
});

initMoviePage();
