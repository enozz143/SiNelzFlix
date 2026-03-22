/**
 * CINElzFlix - Movie Page Engine
 * Version: 4.5 (Working Cast Display + Modal Trailer)
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
        
        // ✅ CORRECT API URL with credits
        const apiUrl = `${BASE_URL}?endpoint=/${mediaType}/${movieId}&append_to_response=videos,credits,similar`;
        console.log("📡 Fetching URL:", apiUrl);
        
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        console.log("📡 API Response received");
        console.log("📡 Movie title:", data.title || data.name);
        console.log("📡 Credits data exists:", !!data.credits);
        console.log("📡 Cast count:", data.credits?.cast?.length || 0);
        
        if (!data || data.success === false) throw new Error("Invalid API Data");

        // Store current movie data
        window.currentMovieData = data;
        window.movieTitle = data.title || data.name || "Unknown Title";
        
        // Update page title
        document.title = `${window.movieTitle} - CINElzFlix Movies`;
        
        // Render all sections
        renderHero(data);
        renderDetails(data);
        renderCast(data.credits);  // Pass credits directly
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
 * Play Trailer with Modal
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
 * ✅ FULLY FIXED: Render Cast with proper data handling
 */
function renderCast(credits) {
    const castList = document.getElementById('movie-cast');
    
    console.log("🎨 renderCast called");
    console.log("🎨 Credits object:", credits);
    console.log("🎨 Cast list element exists:", !!castList);
    
    if (!castList) {
        console.warn("❌ Cast container element not found!");
        return;
    }
    
    // Check if credits exists and has cast
    if (!credits) {
        console.warn("❌ No credits data received");
        castList.innerHTML = '<p style="color: #888; text-align: center; width: 100%; padding: 20px;">No cast data received from API.</p>';
        return;
    }
    
    if (!credits.cast) {
        console.warn("❌ Credits.cast is undefined");
        castList.innerHTML = '<p style="color: #888; text-align: center; width: 100%; padding: 20px;">Cast information not available for this title.</p>';
        return;
    }
    
    if (credits.cast.length === 0) {
        console.warn("❌ Cast array is empty");
        castList.innerHTML = '<p style="color: #888; text-align: center; width: 100%; padding: 20px;">No cast members found for this title.</p>';
        return;
    }
    
    console.log(`✅ Found ${credits.cast.length} cast members`);
    
    // Get top 10 cast members
    const topCast = credits.cast.slice(0, 10);
    
    castList.innerHTML = topCast.map(actor => {
        const profileUrl = actor.profile_path 
            ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` 
            : 'https://via.placeholder.com/185x278?text=No+Photo';
        
        return `
            <div class="cast-item">
                <div class="cast-img-wrapper">
                    <img 
                        src="${profileUrl}" 
                        alt="${actor.name || 'Actor'}"
                        loading="lazy"
                        onerror="this.src='https://via.placeholder.com/185x278?text=No+Photo'"
                    >
                </div>
                <div class="cast-info">
                    <p class="cast-name"><strong>${actor.name || 'Unknown'}</strong></p>
                    <p class="cast-character">${actor.character || 'Unknown Role'}</p>
                </div>
            </div>
        `;
    }).join('');
    
    console.log(`✅ Cast rendered successfully: ${topCast.length} actors shown`);
}

function renderSimilar(similar) {
    const container = document.getElementById('similar-movies-container');
    if (!container) {
        console.warn("Similar container not found");
        return;
    }
    
    if (!similar?.results || similar.results.length === 0) {
        container.innerHTML = '<p style="color: #888; text-align: center; padding: 40px;">No similar movies found.</p>';
        return;
    }
    
    container.innerHTML = `
        <h2 style="margin: 30px 0 15px;">More Like This</h2>
        <div class="similar-grid" style="display: flex; gap: 15px; overflow-x: auto; padding-bottom: 20px;">
            ${similar.results.slice(0, 12).map(m => `
                <div class="similar-card" style="min-width: 160px; cursor: pointer;" onclick="window.location.href='?id=${m.id}&type=${mediaType}'">
                    <img src="https://image.tmdb.org/t/p/w300${m.poster_path}" style="width: 100%; border-radius: 10px;" loading="lazy" onerror="this.src='https://via.placeholder.com/300x450?text=No+Poster'">
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
            box-shadow: 0 0 15px rgba(0,212,255,0.5);
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
        watchBtn.addEventListener('click', () => {
            console.log("🎬 Watch Full Movie clicked");
            updateVideoPlayer('vidsrc');
            document.getElementById('player-section')?.scrollIntoView({ behavior: 'smooth' });
        });
    } else {
        console.warn("⚠️ Watch button not found");
    }
    
    // Trailer button
    const trailerBtn = document.getElementById('play-trailer-btn');
    if (trailerBtn) {
        trailerBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log("🎬 Trailer button clicked");
            playTrailer();
        });
        console.log("✅ Trailer button listener attached");
    } else {
        console.warn("⚠️ Trailer button not found");
    }
    
    // Server switcher
    const serverSelect = document.getElementById('server-select');
    if (serverSelect) {
        serverSelect.addEventListener('change', (e) => {
            console.log("🔄 Server changed to:", e.target.value);
            updateVideoPlayer(e.target.value);
        });
        console.log("✅ Server select listener attached");
    } else {
        console.warn("⚠️ Server select not found");
    }
});

// START!
initMoviePage();
