/**
 * CINElzFlix - Movie Page Logic (Trailer Fix Edition)
 * Developed by: Nelz & Gemini
 */

const urlParams = new URLSearchParams(window.location.search);
const movieId = urlParams.get('id');
const mediaType = urlParams.get('type') || 'movie';

const BASE_URL = 'https://cinelzflix-worker.baquial-enozz.workers.dev/'; 
const TMDB_IMG = 'https://image.tmdb.org/t/p/original';
const TMDB_POSTER = 'https://image.tmdb.org/t/p/w500';

// Global variable para sa trailer
window.movieTrailerKey = ""; 

async function initMoviePage() {
    if (!movieId) {
        window.location.href = '../';
        return;
    }

    try {
        console.log(`📡 Fetching: ${mediaType} ID ${movieId}`);
        // Siguraduhin na kasama ang 'videos' sa request
        const response = await fetch(`${BASE_URL}?endpoint=/${mediaType}/${movieId}&append_to_response=videos,credits,similar`);
        const data = await response.json();

        if (!data || data.success === false) throw new Error("API Error");

        // 1. EXTRACTION NG TRAILER (Dito ang Fix)
        if (data.videos && data.videos.results.length > 0) {
            const trailer = data.videos.results.find(v => v.type === "Trailer" && v.site === "YouTube") || 
                            data.videos.results.find(v => v.site === "YouTube");
            
            if (trailer) {
                window.movieTrailerKey = trailer.key;
                console.log("✅ Trailer Found:", window.movieTrailerKey);
            }
        }

        // 2. RENDER SECTIONS
        renderHero(data);
        renderDetails(data);
        renderCast(data.credits);
        renderSimilar(data.similar);

        // 3. START PLAYER
        updateVideoPlayer('vidsrc');

    } catch (err) {
        console.error("🚨 System Failure:", err);
    }
}

function renderHero(data) {
    const heroBg = document.getElementById('movie-hero');
    const title = document.getElementById('movie-title');
    const desc = document.getElementById('movie-description-hero');
    const meta = document.getElementById('movie-meta-hero');

    if (title) title.innerText = data.title || data.name;
    if (desc) desc.innerText = data.overview ? data.overview.substring(0, 180) + "..." : "";

    if (meta) {
        const year = (data.release_date || data.first_air_date || "N/A").split('-')[0];
        const rating = data.vote_average ? data.vote_average.toFixed(1) : "0.0";
        meta.innerHTML = `<span>📅 ${year}</span> | <span style="color: #00d4ff;">⭐ ${rating}</span> | <span style="text-transform:uppercase;">🎬 ${mediaType}</span>`;
    }

    if (heroBg && data.backdrop_path) {
        heroBg.style.backgroundImage = `linear-gradient(to top, #0a0a0a 15%, transparent), url('${TMDB_IMG}${data.backdrop_path}')`;
        heroBg.style.backgroundSize = 'cover';
        heroBg.style.backgroundPosition = 'center top';
    }
}

function renderDetails(data) {
    const poster = document.getElementById('movie-poster');
    const overview = document.getElementById('movie-overview');
    const vote = document.getElementById('vote-avg');

    if (poster) poster.src = data.poster_path ? `${TMDB_POSTER}${data.poster_path}` : '';
    if (overview) overview.innerText = data.overview || "No overview available.";
    if (vote) vote.innerText = data.vote_average ? data.vote_average.toFixed(1) : "0.0";
}

function renderCast(credits) {
    const castList = document.getElementById('movie-cast');
    if (!castList || !credits?.cast) return;

    castList.innerHTML = credits.cast.slice(0, 6).map(actor => `
        <div class="cast-item">
            <img src="${actor.profile_path ? 'https://image.tmdb.org/t/p/w185' + actor.profile_path : 'https://via.placeholder.com/100x100?text=No+Photo'}">
            <p><strong>${actor.name}</strong></p>
        </div>`).join('');
}

function renderSimilar(similar) {
    const container = document.getElementById('similar-movies-container');
    if (!container || !similar?.results.length) return;

    container.innerHTML = `<h3 style="margin-bottom:15px;">Similar Content</h3>
        <div class="similar-grid" style="display: flex; gap: 15px; overflow-x: auto; padding-bottom: 20px;">
            ${similar.results.slice(0, 10).map(m => `
                <div class="similar-card" style="min-width: 150px; cursor: pointer;" onclick="window.location.href='?id=${m.id}&type=${mediaType}'">
                    <img src="https://image.tmdb.org/t/p/w300${m.poster_path}" style="width: 100%; border-radius: 8px;">
                    <p style="font-size: 0.8rem; margin-top: 5px; color: #ccc;">${m.title || m.name}</p>
                </div>`).join('')}
        </div>`;
}

function updateVideoPlayer(server) {
    const iframe = document.getElementById('movie-iframe');
    if (!iframe) return;

    if (server === 'trailer') {
        // Double check kung may key
        if (window.movieTrailerKey && window.movieTrailerKey !== "") {
            iframe.src = `https://www.youtube.com/embed/${window.movieTrailerKey}?autoplay=1`;
        } else {
            alert("Trailer currently unavailable for this specific title.");
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

// EVENT LISTENERS
document.addEventListener('DOMContentLoaded', () => {
    // Watch Full Movie
    document.getElementById('scroll-to-player')?.addEventListener('click', () => {
        updateVideoPlayer('vidsrc'); 
        document.getElementById('player-section')?.scrollIntoView({ behavior: 'smooth' });
    });

    // Watch Trailer
    document.getElementById('play-trailer-btn')?.addEventListener('click', () => {
        updateVideoPlayer('trailer');
        document.getElementById('player-section')?.scrollIntoView({ behavior: 'smooth' });
    });

    // Server Switcher
    document.getElementById('server-select')?.addEventListener('change', (e) => {
        updateVideoPlayer(e.target.value);
    });
});

initMoviePage();
