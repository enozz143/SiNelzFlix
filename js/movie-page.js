/**
 * CINElzFlix - Ultimate Movie Page Engine
 * Version: 3.1 (Trailer Fix + Enhanced UX)
 * Developed by: Nelz & Gemini
 */

const urlParams = new URLSearchParams(window.location.search);
const movieId = urlParams.get('id');
const mediaType = urlParams.get('type') || 'movie';

const BASE_URL = 'https://cinelzflix-worker.baquial-enozz.workers.dev/'; 
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
        // Show loading state
        showLoadingState();
        
        const response = await fetch(`${BASE_URL}?endpoint=/${mediaType}/${movieId}&append_to_response=videos,credits,similar`);
        const data = await response.json();

        if (!data || data.success === false) throw new Error("API Connection Failed");

        // Store movie title globally
        window.movieTitle = data.title || data.name;
        
        // --- 1. IMPROVED TRAILER SEARCH ---
        window.movieTrailerKey = await getTrailerKey(data);
        
        // Log trailer status for debugging
        if (window.movieTrailerKey) {
            console.log("✅ Trailer found! Key:", window.movieTrailerKey);
        } else {
            console.log("❌ No trailer found in TMDB for:", window.movieTitle);
        }

        // --- 2. FULL UI RENDERING ---
        renderHero(data);
        renderDetails(data);
        renderCast(data.credits);
        renderSimilar(data.similar);
        
        // Update trailer button state
        updateTrailerButtonState();

        // --- 3. AUTO-LOAD PLAYER ---
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
 * IMPROVED: Get trailer key with better search logic
 */
async function getTrailerKey(data) {
    if (!data.videos || !data.videos.results.length) {
        return "";
    }
    
    // Expanded priority list
    const videoTypes = [
        "Trailer",
        "Teaser", 
        "Featurette",
        "Behind the Scenes",
        "Clip"
    ];
    
    // Try to find by priority types
    for (const type of videoTypes) {
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
    const anyVideo = data.videos.results.find(v => 
        v.site === "YouTube" && 
        v.key && 
        v.key.trim() !== ""
    );
    
    if (anyVideo) {
        console.log("🎬 Using fallback video:", anyVideo.type);
        return anyVideo.key;
    }
    
    return "";
}

/**
 * NEW: Update trailer button UI based on availability
 */
function updateTrailerButtonState() {
    const trailerBtn = document.getElementById('play-trailer-btn');
    if (!trailerBtn) return;
    
    if (window.movieTrailerKey) {
        // Trailer available - enable button
        trailerBtn.style.opacity = "1";
        trailerBtn.style.cursor = "pointer";
        trailerBtn.title = "Watch Trailer";
        trailerBtn.classList.remove('disabled');
    } else {
        // No trailer - disable button but still functional (will open YouTube search)
        trailerBtn.style.opacity = "0.7";
        trailerBtn.style.cursor = "pointer"; // Still clickable for fallback
        trailerBtn.title = "No official trailer found. Click to search YouTube.";
        
        // Optional: Add indicator
        const originalHtml = trailerBtn.innerHTML;
        if (!trailerBtn.hasAttribute('data-modified')) {
            trailerBtn.setAttribute('data-modified', 'true');
            // You can add a small icon or leave as is
        }
    }
}

/**
 * FIXED: Player system with better trailer handling
 */
function updateVideoPlayer(server) {
    const iframe = document.getElementById('movie-iframe');
    const playerError = document.getElementById('player-error');
    const loadingIndicator = document.getElementById('player-loading');
    
    if (!iframe) return;
    
    // Hide any previous errors
    if (playerError) playerError.style.display = 'none';
    
    // Show loading
    if (loadingIndicator) loadingIndicator.style.display = 'flex';
    
    if (server === 'trailer') {
        handleTrailerPlayback(iframe, loadingIndicator);
    } else {
        handleServerPlayback(server, iframe, loadingIndicator);
    }
}

/**
 * NEW: Handle trailer playback with better UX
 */
function handleTrailerPlayback(iframe, loadingIndicator) {
    const title = window.movieTitle || document.getElementById('movie-title')?.innerText || "this title";
    
    if (window.movieTrailerKey && window.movieTrailerKey.trim() !== "") {
        // We have a trailer key - play it!
        console.log("🎬 Playing trailer:", window.movieTrailerKey);
        iframe.src = `https://www.youtube.com/embed/${window.movieTrailerKey}?autoplay=1&rel=0&modestbranding=1`;
        
        // Clear loading after iframe loads
        iframe.onload = () => {
            if (loadingIndicator) loadingIndicator.style.display = 'none';
        };
        
        // Timeout fallback
        setTimeout(() => {
            if (loadingIndicator) loadingIndicator.style.display = 'none';
        }, 5000);
        
    } else {
        // No trailer key - show modal/dialog instead of alert
        iframe.style.display = 'none';
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        
        showTrailerNotFoundModal(title);
    }
}

/**
 * NEW: Handle server playback
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
    
    // Handle iframe errors
    iframe.onerror = () => {
        console.error("Failed to load iframe:", server);
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        showServerErrorMessage(server);
    };
    
    iframe.onload = () => {
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    };
    
    // Timeout fallback
    setTimeout(() => {
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    }, 8000);
}

/**
 * NEW: Show modal for missing trailer
 */
function showTrailerNotFoundModal(title) {
    // Check if modal already exists
    let modal = document.getElementById('trailer-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'trailer-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease;
        `;
        
        modal.innerHTML = `
            <div style="background: #1a1a1a; border-radius: 15px; max-width: 400px; width: 90%; padding: 30px; text-align: center; border: 1px solid #00d4ff;">
                <div style="font-size: 64px; margin-bottom: 20px;">🎬</div>
                <h2 style="color: #fff; margin-bottom: 15px;">No Trailer Available</h2>
                <p style="color: #ccc; margin-bottom: 25px; line-height: 1.5;">
                    We couldn't find an official trailer for "${title}" in our database.
                </p>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button id="search-youtube-btn" style="background: #00d4ff; color: #000; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold;">
                        🔍 Search YouTube
                    </button>
                    <button id="close-modal-btn" style="background: #333; color: #fff; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                        Close
                    </button>
                </div>
                <p style="color: #888; font-size: 12px; margin-top: 20px;">
                    Tip: You can also search manually on YouTube using the title.
                </p>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add styles for animation
        if (!document.getElementById('modal-styles')) {
            const style = document.createElement('style');
            style.id = 'modal-styles';
            style.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Event listeners
        document.getElementById('search-youtube-btn')?.addEventListener('click', () => {
            window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(title)}+official+trailer`, '_blank');
            modal.remove();
        });
        
        document.getElementById('close-modal-btn')?.addEventListener('click', () => {
            modal.remove();
        });
        
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }
}

/**
 * NEW: Show server error message
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
 * NEW: Loading state functions
 */
function showLoadingState() {
    const spinner = document.getElementById('global-loading');
    if (!spinner) {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'global-loading';
        loadingDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 9999;
            text-align: center;
        `;
        loadingDiv.innerHTML = `
            <div style="width: 50px; height: 50px; border: 3px solid #333; border-top-color: #00d4ff; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
            <p style="color: #00d4ff; margin-top: 10px;">Loading...</p>
        `;
        document.body.appendChild(loadingDiv);
        
        // Add spin animation if not exists
        if (!document.getElementById('spin-keyframes')) {
            const style = document.createElement('style');
            style.id = 'spin-keyframes';
            style.textContent = `
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
    } else {
        spinner.style.display = 'block';
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
        animation: slideIn 0.3s ease;
    `;
    errorMsg.innerText = message;
    document.body.appendChild(errorMsg);
    
    setTimeout(() => {
        errorMsg.remove();
    }, 5000);
}

/**
 * RENDER FUNCTIONS (Same as before, but with fixes)
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
 * EVENT LISTENERS (Improved)
 */
document.addEventListener('DOMContentLoaded', () => {
    // Watch Movie Click
    document.getElementById('scroll-to-player')?.addEventListener('click', () => {
        updateVideoPlayer('vidsrc'); 
        document.getElementById('player-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // Watch Trailer Click - Improved with feedback
    const trailerBtn = document.getElementById('play-trailer-btn');
    if (trailerBtn) {
        trailerBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log("🎬 Trailer button clicked");
            updateVideoPlayer('trailer');
            document.getElementById('player-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    // Server Switcher
    const serverSelect = document.getElementById('server-select');
    if (serverSelect) {
        serverSelect.addEventListener('change', (e) => {
            updateVideoPlayer(e.target.value);
        });
    }
});

// INITIALIZE
initMoviePage();
