/**
 * CINElzFlix - Movie Page Logic (The "Force Trailer" Edition)
 */

const urlParams = new URLSearchParams(window.location.search);
const movieId = urlParams.get('id');
const mediaType = urlParams.get('type') || 'movie';

const BASE_URL = 'https://cinelzflix-worker.baquial-enozz.workers.dev/'; 
const TMDB_IMG = 'https://image.tmdb.org/t/p/original';

// Global variable
window.movieTrailerKey = ""; 

async function initMoviePage() {
    if (!movieId) return;

    try {
        // Force natin na kumuha ng videos at images
        const response = await fetch(`${BASE_URL}?endpoint=/${mediaType}/${movieId}&append_to_response=videos,credits,similar`);
        const data = await response.json();

        // --- TRAILER SEARCH LOGIC (Pinatindi) ---
        if (data.videos && data.videos.results.length > 0) {
            // 1. Hanapin muna ang official Trailer
            let video = data.videos.results.find(v => v.type === "Trailer" && v.site === "YouTube");
            
            // 2. Kung wala, hanapin ang Teaser
            if (!video) video = data.videos.results.find(v => v.type === "Teaser" && v.site === "YouTube");
            
            // 3. Kung wala pa rin, kunin ang kahit anong unang video sa listahan
            if (!video) video = data.videos.results.find(v => v.site === "YouTube");

            if (video) {
                window.movieTrailerKey = video.key;
                console.log("🎬 Trailer Key Found:", window.movieTrailerKey);
            }
        }

        renderHero(data);
        renderDetails(data);
        renderCast(data.credits);
        renderSimilar(data.similar);
        updateVideoPlayer('vidsrc');

    } catch (err) {
        console.error("Error:", err);
    }
}

function updateVideoPlayer(server) {
    const iframe = document.getElementById('movie-iframe');
    if (!iframe) return;

    if (server === 'trailer') {
        // Kung empty pa rin ang key pagkatapos ng search
        if (!window.movieTrailerKey) {
            // SUBOK NA PARAAN: Search via Title kung walang key
            const movieTitle = document.getElementById('movie-title').innerText;
            alert("No direct trailer found in database. Redirecting to YouTube search...");
            window.open(`https://www.youtube.com/results?search_query=${movieTitle}+official+trailer`, '_blank');
            return;
        }
        iframe.src = `https://www.youtube.com/embed/${window.movieTrailerKey}?autoplay=1`;
    } else {
        const urls = {
            'vidsrc': mediaType === 'movie' ? `https://vidsrc.me/embed/movie?tmdb=${movieId}` : `https://vidsrc.me/embed/tv?tmdb=${movieId}&sea=1&epi=1`,
            'vidsrc2': `https://vidsrc.to/embed/${mediaType}/${movieId}`,
            'videasy': `https://player.videasy.net/${mediaType}/${movieId}`
        };
        iframe.src = urls[server] || urls['vidsrc'];
    }
}

// Re-render functions (keep your existing renderHero, renderDetails, etc.)
function renderHero(data) {
    const heroBg = document.getElementById('movie-hero');
    document.getElementById('movie-title').innerText = data.title || data.name;
    document.getElementById('movie-description-hero').innerText = data.overview || "";
    if (heroBg && data.backdrop_path) {
        heroBg.style.backgroundImage = `linear-gradient(to top, #0a0a0a 15%, transparent), url('${TMDB_IMG}${data.backdrop_path}')`;
        heroBg.style.backgroundSize = 'cover';
        heroBg.style.backgroundPosition = 'center top';
    }
}
// ... (Idagdag mo dito yung renderDetails, renderCast, renderSimilar na binigay ko kanina)

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('scroll-to-player')?.addEventListener('click', () => {
        updateVideoPlayer('vidsrc'); 
        document.getElementById('player-section')?.scrollIntoView({ behavior: 'smooth' });
    });

    document.getElementById('play-trailer-btn')?.addEventListener('click', () => {
        updateVideoPlayer('trailer');
        document.getElementById('player-section')?.scrollIntoView({ behavior: 'smooth' });
    });
});

initMoviePage();
