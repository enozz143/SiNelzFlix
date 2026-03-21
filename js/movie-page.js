/**
 * CINElzFlix - Ultimate Movie Page Engine
 * Version: 3.0 (Full Render + Force Trailer Fix)
 * Developed by: Nelz & Gemini
 */

const urlParams = new URLSearchParams(window.location.search);
const movieId = urlParams.get('id');
const mediaType = urlParams.get('type') || 'movie';

const BASE_URL = 'https://cinelzflix-worker.baquial-enozz.workers.dev/'; 
const TMDB_IMG = 'https://image.tmdb.org/t/p/original';
const TMDB_POSTER = 'https://image.tmdb.org/t/p/w500';

// Global store para sa trailer key
window.movieTrailerKey = ""; 

async function initMoviePage() {
    console.log("🎬 Engine Starting...");
    if (!movieId) {
        window.location.href = '../';
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}?endpoint=/${mediaType}/${movieId}&append_to_response=videos,credits,similar`);
        const data = await response.json();

        if (!data || data.success === false) throw new Error("API Connection Failed");

        // --- 1. DEEP TRAILER SEARCH ---
        if (data.videos && data.videos.results.length > 0) {
            // Priority: Trailer > Teaser > Featurette > First YouTube Video
            const video = data.videos.results.find(v => v.type === "Trailer" && v.site === "YouTube") || 
                          data.videos.results.find(v => v.type === "Teaser" && v.site === "YouTube") ||
                          data.videos.results.find(v => v.site === "YouTube");
            
            if (video) window.movieTrailerKey = video.key;
        }

        // --- 2. FULL UI RENDERING ---
        renderHero(data);
        renderDetails(data);
        renderCast(data.credits);
        renderSimilar(data.similar);

        // --- 3. AUTO-LOAD PLAYER ---
        updateVideoPlayer('vidsrc');

    } catch (err) {
        console.error("🚨 CRITICAL ERROR:", err);
        document.getElementById('movie-title').innerText = "Content Offline ☹️";
    }
}

/**
 * RENDER: HERO SECTION
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

/**
 * RENDER: POSTER & OVERVIEW
 */
function renderDetails(data) {
    const poster = document.getElementById('movie-poster');
    const overview = document.getElementById('movie-overview');
    const vote = document.getElementById('vote-avg');

    if (poster) poster.src = data.poster_path ? `${TMDB_POSTER}${data.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster';
    if (overview) overview.innerText = data.overview || "The plot for this title is currently protected or unavailable.";
    if (vote) vote.innerText = data.vote_average ? data.vote_average.toFixed(1) : "0.0";
}

/**
 * RENDER: TOP CAST
 */
function renderCast(credits) {
    const castList = document.getElementById('movie-cast');
    if (!castList || !credits?.cast) return;

    castList.innerHTML = credits.cast.slice(0, 8).map(actor => `
        <div class="cast-item">
            <div class="cast-img-wrapper">
                <img src="${actor.profile_path ? 'https://image.tmdb.org/t/p/w185' + actor.profile_path : 'https://via.placeholder.com/100x100?text=No+Photo'}" alt="${actor.name}">
            </div>
            <p><strong>${actor.name}</strong></p>
            <p style="font-size: 0.7rem; color: #777;">${actor.character || 'Cast'}</p>
        </div>
    `).join('');
}

/**
 * RENDER: SIMILAR CONTENT
 */
function renderSimilar(similar) {
    const container = document.getElementById('similar-movies-container');
    if (!container || !similar?.results.length) return;

    container.innerHTML = `
        <h2 style="margin: 30px 0 15px;">More Like This</h2>
        <div class="similar-grid" style="display: flex; gap: 15px; overflow-x: auto; padding-bottom: 20px;">
            ${similar.results.slice(0, 12).map(m => `
                <div class="similar-card" style="min-width: 160px; cursor: pointer;" onclick="window.location.href='?id=${m.id}&type=${mediaType}'">
                    <img src="https://image.tmdb.org/t/p/w300${m.poster_path}" style="width: 100%; border-radius: 10px; transition: 0.3s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    <p style="font-size: 0.85rem; margin-top: 8px; font-weight: bold;">${m.title || m.name}</p>
                    <span style="font-size: 0.7rem; color: #00d4ff;">⭐ ${m.vote_average.toFixed(1)}</span>
                </div>
            `).join('')}
        </div>
    `;
}

/**
 * PLAYER SYSTEM (THE BRAIN)
 */
function updateVideoPlayer(server) {
    const iframe = document.getElementById('movie-iframe');
    if (!iframe) return;

    if (server === 'trailer') {
        if (window.movieTrailerKey) {
            iframe.src = `https://www.youtube.com/embed/${window.movieTrailerKey}?autoplay=1&rel=0`;
        } else {
            // LAST RESORT: Search YouTube if API fails
            const title = document.getElementById('movie-title').innerText;
            alert("Official trailer link not found in DB. Opening YouTube Search for: " + title);
            window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(title)}+official+trailer`, '_blank');
        }
    } else {
        const servers = {
            'vidsrc': mediaType === 'movie' ? `https://vidsrc.me/embed/movie?tmdb=${movieId}` : `https://vidsrc.me/embed/tv?tmdb=${movieId}&sea=1&epi=1`,
            'vidsrc2': `https://vidsrc.to/embed/${mediaType}/${movieId}`,
            'videasy': `https://player.videasy.net/${mediaType}/${movieId}`
        };
        iframe.src = servers[server] || servers['vidsrc'];
    }
}

/**
 * INTERACTION LISTENERS
 */
document.addEventListener('DOMContentLoaded', () => {
    // Watch Movie Click
    document.getElementById('scroll-to-player')?.addEventListener('click', () => {
        updateVideoPlayer('vidsrc'); 
        document.getElementById('player-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // Watch Trailer Click
    document.getElementById('play-trailer-btn')?.addEventListener('click', () => {
        updateVideoPlayer('trailer');
        document.getElementById('player-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // Server Switcher
    document.getElementById('server-select')?.addEventListener('change', (e) => {
        updateVideoPlayer(e.target.value);
    });
});

// INITIALIZE
initMoviePage();
