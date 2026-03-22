/**
 * CINElzFlix - Movie Page Engine
 * Version: 4.2 (Simple Hero + Dynamic Page Title)
 */

const urlParams = new URLSearchParams(window.location.search);
const movieId = urlParams.get('id');
const mediaType = urlParams.get('type') || 'movie';

const BASE_URL = 'https://cinelzflix-worker.baquial-enozz.workers.dev/'; 
const TMDB_IMG = 'https://image.tmdb.org/t/p/original';
const TMDB_POSTER = 'https://image.tmdb.org/t/p/w500';

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
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        if (!data || data.success === false) throw new Error("Invalid API Data");

        window.movieTitle = data.title || data.name || "Unknown Title";
        
        // ✅ UPDATE PAGE TITLE
        document.title = `${window.movieTitle} - CINElzFlix Movies`;
        console.log("📄 Page title set to:", document.title);
        
        window.movieTrailerKey = await getTrailerKey(data);
        
        renderHero(data);
        renderDetails(data);
        renderCast(data.credits);
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

async function getTrailerKey(data) {
    if (!data.videos || !data.videos.results.length) return "";
    const priority = ["Trailer", "Teaser", "Featurette", "Clip"];
    for (const type of priority) {
        const video = data.videos.results.find(v => v.type === type && v.site === "YouTube" && v.key);
        if (video) return video.key;
    }
    return data.videos.results[0]?.key || "";
}

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
    
    // Set hero background image
    if (heroBg && data.backdrop_path) {
        heroBg.style.backgroundImage = `linear-gradient(to top, #0a0a0a 15%, rgba(0,0,0,0.4)), url('${TMDB_IMG}${data.backdrop_path}')`;
        heroBg.style.backgroundSize = 'cover';
        heroBg.style.backgroundPosition = 'center top';
        console.log("✅ Hero background image set");
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

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('scroll-to-player')?.addEventListener('click', () => {
        updateVideoPlayer('vidsrc');
        document.getElementById('player-section')?.scrollIntoView({ behavior: 'smooth' });
    });

    document.getElementById('server-select')?.addEventListener('change', (e) => {
        updateVideoPlayer(e.target.value);
    });
});

initMoviePage();
