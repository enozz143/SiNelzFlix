// js/movie-page.js

const params = new URLSearchParams(window.location.search);
const movieId = params.get('id');
const mediaType = params.get('type') || 'movie';

// FIXED: Siguraduhin na may 'https://' at nagtatapos sa '/' ang iyong Worker URL
const BASE_URL = 'https://cinelzflix-worker.nelz.workers.dev/'; 

async function loadMovieDetails() {
    // FIXED: Kapag walang ID, dapat bumalik sa root "/" ng domain
    if (!movieId) { 
        window.location.href = '/'; 
        return; 
    }

    try {
        console.log(`Fetching details for ${mediaType} ID: ${movieId}...`);
        
        // FIXED: Nilagyan ko ng absolute path check sa fetch
        const response = await fetch(`${BASE_URL}?endpoint=/${mediaType}/${movieId}&append_to_response=credits`);
        
        // Check if the response is actually OK
        if (!response.ok) throw new Error(`Worker Error: ${response.status}`);
        
        const data = await response.json();

        // FIXED: Minsan ang Worker ay nagbabalik ng data sa loob ng property na 'results' 
        // depende sa setup mo, pero standard TMDB details ang response nito.
        if (!data || data.success === false) {
            throw new Error("Movie not found in TMDB");
        }

        // --- UPDATE UI ---
        document.title = `${data.title || data.name} - CINElzFlix`;
        
        // Check if elements exist before updating to avoid null errors
        const titleEl = document.getElementById('movie-title');
        const posterImg = document.getElementById('movie-poster');
        const overviewEl = document.getElementById('movie-overview');
        const metaEl = document.getElementById('movie-meta');
        const castEl = document.getElementById('movie-cast');

        if (titleEl) titleEl.innerText = data.title || data.name;
        
        if (posterImg) {
            posterImg.src = data.poster_path 
                ? `https://image.tmdb.org/t/p/w500${data.poster_path}` 
                : 'https://via.placeholder.com/500x750?text=No+Poster';
        }
        
        if (overviewEl) overviewEl.innerText = data.overview || "No description available, bro.";
        
        const releaseDate = (data.release_date || data.first_air_date || "N/A").split('-')[0]; // Year only
        const rating = data.vote_average ? data.vote_average.toFixed(1) : "N/A";
        
        if (metaEl) metaEl.innerText = `📅 ${releaseDate} • ⭐ ${rating} • 🎭 ${mediaType.toUpperCase()}`;

        // --- SETUP PLAYER ---
        setPlayer('vidsrc');

        // --- CAST ---
        if (castEl && data.credits && data.credits.cast) {
            const castNames = data.credits.cast.slice(0, 5).map(c => c.name).join(', ');
            castEl.innerText = castNames ? `Cast: ${castNames}` : "";
        }

    } catch (error) {
        console.error("Error loading movie page:", error);
        const titleEl = document.getElementById('movie-title');
        if (titleEl) titleEl.innerText = "Error Loading Content, Bro!";
        
        // FIXED: Alert para malaman mo agad kung ano ang error sa mobile/browser
        // alert("Fetch Error: " + error.message); 
    }
}

function setPlayer(server) {
    const iframe = document.getElementById('movie-iframe');
    if (!iframe) return;

    if (server === 'vidsrc') {
        iframe.src = mediaType === 'movie' 
            ? `https://vidsrc.me/embed/movie?tmdb=${movieId}` 
            : `https://vidsrc.me/embed/tv?tmdb=${movieId}&sea=1&epi=1`;
    } else if (server === 'vidsrc2') {
        iframe.src = `https://vidsrc.to/embed/${mediaType}/${movieId}`;
    } else {
        iframe.src = `https://player.videasy.net/${mediaType}/${movieId}`;
    }
}

// Listener para sa server switcher
const serverSelect = document.getElementById('server-select');
if (serverSelect) {
    serverSelect.addEventListener('change', (e) => setPlayer(e.target.value));
}

// Initial Run
loadMovieDetails();
