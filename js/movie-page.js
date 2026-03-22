/**
 * CINElzFlix - Movie Page Engine
 * Version: 4.4 (Improved Cast Display + Modal Trailer)
 */

const urlParams = new URLSearchParams(window.location.search);
const movieId = urlParams.get('id');
const mediaType = urlParams.get('type') || 'movie';

const BASE_URL = 'https://cinelzflix-worker.baquial-enozz.workers.dev/'; 
const TMDB_IMG = 'https://image.tmdb.org/t/p/original';
const TMDB_POSTER = 'https://image.tmdb.org/t/p/w500';

// Global store
window.currentMovieData = null;
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
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        if (!data || data.success === false) throw new Error("Invalid API Data");

        // Store current movie data for trailer modal
        window.currentMovieData = data;
        window.movieTitle = data.title || data.name || "Unknown Title";
        
        // Update page title
        document.title = `${window.movieTitle} - CINElzFlix Movies`;
        
        renderHero(data);
        renderDetails(data);
        renderCast(data.credits);  // ✅ Updated cast render
        renderSimilar(data.similar);

        updateVideoPlayer('vidsrc');
        
        console.log("✅ Movie Page Ready!");

    } catch (err) {
        console.error("🚨 Error:", err);
        document.title = "Error - CINElzFlix";
        showErrorMessage(`Failed to load: ${err.message}`);
    } finally {
        hideLoadingState();
    }
}

/**
 * ✅ Play Trailer with Modal (Same as Main Branch!)
 */
async function playTrailer() {
    if (!window.currentMovieData) {
        showNotification("Movie data not ready yet.");
        return;
    }
    
    console.log("🎬 Opening trailer for:", window.movieTitle);
    
    try {
        showModalLoading();
        
        const videoUrl = `${BASE_URL}?endpoint=/${mediaType}/${movieId}/videos`;
        console.log("📡 Fetching videos:", videoUrl);
        
        const response = await fetch(videoUrl);
        const videoData = await response.json();
        
        const trailer = videoData.results?.find(v => 
            v.type === "Trailer" && 
            v.site === "YouTube" &&
            v.key &&
            v.key.trim() !== ""
        );
        
        if (trailer) {
            console.log("✅ Trailer found:", trailer.key);
            showTrailerModal(trailer.key);
        } else {
            console.log("❌ No trailer found in TMDB");
            showNoTrailerModal();
        }
        
    } catch (err) {
        console.error("Trailer fetch error:", err);
        showNotification("Failed to load trailer. Please try again.");
        hideModalLoading();
    }
}

/**
 * Show modal with YouTube trailer
 */
function showTrailerModal(trailerKey) {
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
            background: rgba(0,0,0,0.95);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease;
        `;
        
        modal.innerHTML = `
            <div style="position: relative; width: 90%; max-width: 1000px; background: #000; border-radius: 15px; overflow: hidden;">
                <button id="close-modal-btn" style="
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: rgba(0,0,0,0.8);
                    color: #00d4ff;
                    border: none;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    font-size: 24px;
                    cursor: pointer;
                    z-index: 10;
                    font-weight: bold;
                ">✕</button>
                <div id="trailer-player-container" style="position: relative; padding-bottom: 56.25%; height: 0;">
                    <iframe 
                        id="trailer-iframe"
                        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"
                        allow="autoplay; encrypted-media"
                        allowfullscreen>
                    </iframe>
                </div>
                <div style="padding: 15px; background: #111;">
                    <h3 style="color: #00d4ff; margin: 0;">${window.movieTitle}</h3>
                    <p style="color: #ccc; margin: 5px 0 0; font-size: 0.85rem;">Official Trailer</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('close-modal-btn')?.addEventListener('click', () => {
            closeTrailerModal();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeTrailerModal();
        });
        
        if (!document.getElementById('modal-animation')) {
            const style = document.createElement('style');
            style.id = 'modal-animation';
            style.textContent = `@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`;
            document.head.appendChild(style);
        }
    }
    
    const trailerIframe = document.getElementById('trailer-iframe');
    if (trailerIframe) {
        trailerIframe.src = `https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1`;
    }
    
    modal.style.display = 'flex';
    hideModalLoading();
}

function closeTrailerModal() {
    const modal = document.getElementById('trailer-modal');
    if (modal) {
        const iframe = document.getElementById('trailer-iframe');
        if (iframe) iframe.src = '';
        modal.style.display = 'none';
    }
}

function showModalLoading() {
    let loadingDiv = document.getElementById('modal-loading');
    if (!loadingDiv) {
        loadingDiv = document.createElement('div');
        loadingDiv.id = 'modal-loading';
        loadingDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.9);
            color: #00d4ff;
            padding: 20px;
            border-radius: 10px;
            z-index: 10001;
            font-weight: bold;
        `;
        loadingDiv.innerHTML = `
            <div style="width: 40px; height: 40px; border: 3px solid #333; border-top-color: #00d4ff; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto;"></div>
            <p style="margin-top: 10px;">Loading trailer...</p>
        `;
        document.body.appendChild(loadingDiv);
        
        if (!document.getElementById('spin-keyframes')) {
            const style = document.createElement('style');
            style.id = 'spin-keyframes';
            style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
            document.head.appendChild(style);
        }
    }
    loadingDiv.style.display = 'block';
}

function hideModalLoading() {
    const loadingDiv = document.getElementById('modal-loading');
    if (loadingDiv) loadingDiv.style.display = 'none';
}

function showNoTrailerModal() {
    hideModalLoading();
    
    let modal = document.getElementById('no-trailer-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'no-trailer-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        modal.innerHTML = `
            <div style="background: #1a1a1a; border-radius: 15px; max-width: 400px; width: 90%; padding: 30px; text-align: center; border: 1px solid #00d4ff;">
                <div style="font-size: 64px; margin-bottom: 20px;">🎬</div>
                <h2 style="color: #fff;">No Trailer Available</h2>
                <p style="color: #ccc; margin: 15px 0;">No official trailer found for "${window.movieTitle}" in TMDB.</p>
                <button id="close-no-trailer" style="background: #00d4ff; color: #000; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold;">Close</button>
            </div>
        `;
        document.body.appendChild(modal);
        
        document.getElementById('close-no-trailer')?.addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }
    modal.style.display = 'flex';
}

// --- RENDER FUNCTIONS ---

function renderHero(data) {
    const heroBg = document.getElementById('movie-hero');
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
    if (overview) overview.innerText = data.overview || "The plot for this title is currently unavailable.";
    if (vote) vote.innerText = data.vote_average ? data.vote_average.toFixed(1) : "0.0";
}

/**
 * ✅ IMPROVED: Render Cast with better styling
 */
function renderCast(credits) {
    const castList = document.getElementById('movie-cast');
    if (!castList) {
        console.warn("Cast container not found");
        return;
    }
    
    if (!credits?.cast || credits.cast.length === 0) {
        castList.innerHTML = '<p style="color: #888; text-align: center; width: 100%;">No cast information available.</p>';
        return;
    }
    
    // Get top 10 cast members
    const topCast = credits.cast.slice(0, 10);
    
    castList.innerHTML = topCast.map(actor => `
        <div class="cast-item">
            <div class="cast-img-wrapper">
                <img 
                    src="${actor.profile_path ? 'https://image.tmdb.org/t/p/w185' + actor.profile_path : 'https://via.placeholder.com/185x278?text=No+Photo'}" 
                    alt="${actor.name}"
                    loading="lazy"
                    onerror="this.src='https://via.placeholder.com/185x278?text=No+Photo'"
                >
            </div>
            <div class="cast-info">
                <p class="cast-name"><strong>${actor.name}</strong></p>
                <p class="cast-character">${actor.character || 'Unknown Role'}</p>
            </div>
        </div>
    `).join('');
    
    console.log(`✅ Cast rendered: ${topCast.length} actors`);
}

function renderSimilar(similar) {
    const container = document.getElementById('similar-movies-container');
    if (!container || !similar?.results.length) return;
    
    container.innerHTML = `
        <h2 style="margin: 30px 0 15px;">More Like This</h2>
        <div class="similar-grid" style="display: flex; gap: 15px; overflow-x: auto; padding-bottom: 20px;">
            ${similar.results.slice(0, 12).map(m => `
                <div class="similar-card" style="min-width: 160px; cursor: pointer;" onclick="window.location.href='?id=${m.id}&type=${mediaType}'">
                    <img src="https://image.tmdb.org/t/p/w300${m.poster_path}" style="width: 100%; border-radius: 10px;" loading="lazy">
                    <p style="font-size: 0.85rem; margin-top: 8px; font-weight: bold;">${m.title || m.name}</p>
                    <span style="font-size: 0.7rem; color: #00d4ff;">⭐ ${m.vote_average ? m.vote_average.toFixed(1) : 'N/A'}</span>
                </div>
            `).join('')}
        </div>
    `;
}

function updateVideoPlayer(server) {
    const iframe = document.getElementById('movie-iframe');
    const loadingIndicator = document.getElementById('player-loading');
    if (!iframe) return;
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
    
    iframe.onerror = () => {
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
    setTimeout(() => notif.style.display = 'none', 3000);
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
    // Watch Full Movie button
    document.getElementById('scroll-to-player')?.addEventListener('click', () => {
        updateVideoPlayer('vidsrc');
        document.getElementById('player-section')?.scrollIntoView({ behavior: 'smooth' });
    });
    
    // Trailer button - uses modal like main branch!
    document.getElementById('play-trailer-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        playTrailer();
    });
    
    // Server switcher
    document.getElementById('server-select')?.addEventListener('change', (e) => {
        updateVideoPlayer(e.target.value);
    });
});

// START!
initMoviePage();
