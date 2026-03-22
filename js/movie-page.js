/**
 * CINElzFlix - Ultimate Movie Page Engine
 * Version: 4.0 (Hero Video Background - No Trailer Button)
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
    console.log("🎬 Movie Page Engine Starting...");
    
    if (!movieId) {
        window.location.href = '../';
        return;
    }

    try {
        showLoadingState();
        
        const apiUrl = `${BASE_URL}?endpoint=/${mediaType}/${movieId}&append_to_response=videos,credits,similar`;
        console.log("📡 Fetching:", apiUrl);
        
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        if (!data || data.success === false) throw new Error("Invalid API Data");

        window.movieTitle = data.title || data.name || "Unknown Title";
        window.movieTrailerKey = await getTrailerKey(data);
        
        console.log(window.movieTrailerKey ? "✅ Trailer found" : "🔍 No trailer, using backdrop only");
        
        // Render everything
        renderHeroVideoBackground(window.movieTrailerKey);
        renderHeroInfo(data);
        renderDetails(data);
        renderCast(data.credits);
        renderSimilar(data.similar);

        // Load movie server by default
        updateVideoPlayer('vidsrc');
        
        console.log("✅ Movie Page Ready!");

    } catch (err) {
        console.error("🚨 Error:", err);
        showErrorMessage(`Failed to load: ${err.message}`);
        // Fallback: show backdrop only
        document.getElementById('movie-title').innerText = "Unable to Load";
    } finally {
        hideLoadingState();
    }
}

/**
 * Get trailer key from TMDB
 */
async function getTrailerKey(data) {
    if (!data.videos || !data.videos.results.length) {
        console.log("No videos found in TMDB");
        return "";
    }
    
    const priority = ["Trailer", "Teaser", "Featurette", "Clip"];
    for (const type of priority) {
        const video = data.videos.results.find(v => 
            v.type === type && 
            v.site === "YouTube" && 
            v.key && 
            v.key.trim() !== ""
        );
        if (video) {
            console.log(`🎬 Found ${type}:`, video.key);
            return video.key;
        }
    }
    
    // Fallback: any YouTube video
    const anyVideo = data.videos.results.find(v => v.site === "YouTube" && v.key);
    if (anyVideo) {
        console.log("🎬 Using fallback video:", anyVideo.type);
        return anyVideo.key;
    }
    
    return "";
}

/**
 * ✅ NEW: Render Hero Video Background (same as main site!)
 */
function renderHeroVideoBackground(trailerKey) {
    const heroVideoContainer = document.getElementById('hero-video-container');
    if (!heroVideoContainer) {
        console.warn("Hero video container not found");
        return;
    }
    
    if (trailerKey && trailerKey.trim() !== "") {
        // May trailer - play as background video (muted, loop)
        console.log("🎬 Playing hero background trailer:", trailerKey);
        heroVideoContainer.innerHTML = `
            <iframe 
                src="https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailerKey}&rel=0&showinfo=0&modestbranding=1&iv_load_policy=3" 
                frameborder="0" 
                allow="autoplay; encrypted-media"
                allowfullscreen>
            </iframe>
        `;
    } else {
        // Walang trailer - clear container, use backdrop image only
        console.log("🎨 No trailer, using backdrop image only");
        heroVideoContainer.innerHTML = '';
    }
}

/**
 * Render Hero Info (Title, Meta, Description)
 */
function renderHeroInfo(data) {
    const title = document.getElementById('movie-title');
    const desc = document.getElementById('movie-description-hero');
    const meta = document.getElementById('movie-meta-hero');

    if (title) title.innerText = data.title || data.name;
    if (desc) desc.innerText = data.overview ? data.overview.substring(0, 180) + "..." : "No description available.";
    
    if (meta) {
        const year = (data.release_date || data.first_air_date || "").split('-')[0];
        const rating = data.vote_average ? data.vote_average.toFixed(1) : "0.0";
        meta.innerHTML = `
            <span>📅 ${year || 'N/A'}</span>
            <span>⭐ ${rating}</span>
            <span>🎬 ${mediaType.toUpperCase()}</span>
        `;
    }
}

/**
 * Render Poster and Overview
 */
function renderDetails(data) {
    const poster = document.getElementById('movie-poster');
    const overview = document.getElementById('movie-overview');
    const vote = document.getElementById('vote-avg');
    
    if (poster) {
        poster.src = data.poster_path ? `${TMDB_POSTER}${data.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster';
    }
    if (overview) overview.innerText = data.overview || "The plot for this title is currently unavailable.";
    if (vote) vote.innerText = data.vote_average ? data.vote_average.toFixed(1) : "0.0";
}

/**
 * Render Cast Section
 */
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

/**
 * Render Similar Movies
 */
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
 * MAIN PLAYER SYSTEM
 */
function updateVideoPlayer(server) {
    const iframe = document.getElementById('movie-iframe');
    const loadingIndicator = document.getElementById('player-loading');
    
    if (!iframe) return;
    
    if (loadingIndicator) loadingIndicator.style.display = 'flex';
    
    if (server === 'trailer') {
        // Trailer playback (in case may mag-call, pero wala na dapat)
        handleTrailerDirectEmbed(iframe, loadingIndicator);
    } else {
        // Movie servers
        handleServerPlayback(server, iframe, loadingIndicator);
    }
}

/**
 * Trailer playback (fallback - hindi na ginagamit sa UI)
 */
function handleTrailerDirectEmbed(iframe, loadingIndicator) {
    const title = window.movieTitle;
    iframe.style.display = 'block';
    
    if (window.movieTrailerKey) {
        iframe.src = `https://www.youtube.com/embed/${window.movieTrailerKey}?autoplay=1&rel=0&modestbranding=1`;
    } else {
        const searchQuery = encodeURIComponent(`${title} official trailer`);
        iframe.src = `https://www.youtube.com/results?search_query=${searchQuery}`;
    }

    iframe.onload = () => {
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    };
}

/**
 * Movie server playback
 */
function handleServerPlayback(server, iframe, loadingIndicator) {
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
    
    iframe.onerror = () => {
        console.error("Failed to load server:", server);
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        showNotification(`Unable to load ${server}. Try another server.`);
    };
}

// --- UTILITIES ---

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
            background: #00d4ff;
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

function showLoadingState() {
    const spinner = document.getElementById('global-loading');
    if (spinner) spinner.style.display = 'flex';
}

function hideLoadingState() {
    const spinner = document.getElementById('global-loading');
    if (spinner) spinner.style.display = 'none';
}

function showErrorMessage(message) {
    console.error(message);
    showNotification(message);
}

// --- EVENT LISTENERS ---

document.addEventListener('DOMContentLoaded', () => {
    console.log("📄 DOM Ready - Setting up event listeners");
    
    // Watch Full Movie button
    const watchBtn = document.getElementById('scroll-to-player');
    if (watchBtn) {
        watchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log("🎬 Watch Full Movie clicked");
            updateVideoPlayer('vidsrc');
            document.getElementById('player-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    } else {
        console.warn("⚠️ Watch button not found");
    }

    // Note: Wala nang trailer button sa UI!

    // Server switcher
    const serverSelect = document.getElementById('server-select');
    if (serverSelect) {
        serverSelect.addEventListener('change', (e) => {
            console.log("🔄 Server changed to:", e.target.value);
            updateVideoPlayer(e.target.value);
        });
    }
});

// START!
initMoviePage();
