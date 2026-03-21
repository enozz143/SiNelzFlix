// js/movie-page.js
const params = new URLSearchParams(window.location.search);
const movieId = params.get('id');
const mediaType = params.get('type') || 'movie';

/** * IMPORTANT: Ang BASE_URL dito ay dapat yung Cloudflare WORKER mo, 
 * HINDI yung nopopup.sinelzflix2.pages.dev.
 */
const BASE_URL = 'https://cinelzflix-worker.nelz.workers.dev/'; 

async function loadMovieDetails() {
    // Kung walang ID, balik sa home page ng nopopup branch
    if (!movieId) { window.location.href = 'index.html'; return; }

    try {
        console.log(`Fetching details for ${mediaType} ID: ${movieId}...`);
        
        const response = await fetch(`${BASE_URL}?endpoint=/${mediaType}/${movieId}&append_to_response=credits`);
        const data = await response.json();

        if (!data || data.success === false) {
            throw new Error("Movie not found in TMDB");
        }

        // --- UPDATE UI ---
        document.title = `${data.title || data.name} - CINElzFlix`;
        document.getElementById('movie-title').innerText = data.title || data.name;
        
        // Poster check
        const posterImg = document.getElementById('movie-poster');
        posterImg.src = data.poster_path 
            ? `https://image.tmdb.org/t/p/w500${data.poster_path}` 
            : 'https://via.placeholder.com/500x750?text=No+Poster';
        
        // Overview & Meta
        document.getElementById('movie-overview').innerText = data.overview || "No description available, bro.";
        const releaseDate = data.release_date || data.first_air_date || "N/A";
        const rating = data.vote_average ? data.vote_average.toFixed(1) : "N/A";
        document.getElementById('movie-meta').innerText = `${releaseDate} • ⭐ ${rating}`;

        // --- SETUP PLAYER ---
        setPlayer('vidsrc');

        // --- CAST ---
        if (data.credits && data.credits.cast) {
            const castNames = data.credits.cast.slice(0, 5).map(c => c.name).join(', ');
            document.getElementById('movie-cast').innerText = castNames ? `Cast: ${castNames}` : "";
        }

    } catch (error) {
        console.error("Error loading movie page:", error);
        document.getElementById('movie-title').innerText = "Error Loading Content, Bro!";
    }
}

function setPlayer(server) {
    const iframe = document.getElementById('movie-iframe');
    if (!iframe) return;

    if (server === 'vidsrc') {
        iframe.src = mediaType === 'movie' 
            ? `https://vidsrc.me/embed/movie?tmdb=${movieId}` 
            : `https://vidsrc.me/embed/tv?tmdb=${movieId}&sea=1&epi=1`;
    } else {
        iframe.src = `https://vidsrc.to/embed/${mediaType}/${movieId}`;
    }
}

// Listener para sa server switcher
const serverSelect = document.getElementById('server-select');
if (serverSelect) {
    serverSelect.addEventListener('change', (e) => setPlayer(e.target.value));
}

// Initial Run
loadMovieDetails();
