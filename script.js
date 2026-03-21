import { BASE_URL, fetchMovies } from './js/api.js';
import { setupHeroSlider, nextSlide, goToSlide } from './js/slider.js';
import { displayList, handleSearch, filterGenre, loadMore } from './js/ui.js';
import { showDetails, closeModal, changeServer, playTrailer } from './js/modal.js';
import { initCountdown } from './js/countdown.js';

// --- HELPER: SKELETON LOADER ---
function showSkeletons(containerId, count = 10) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let skeletonHTML = '';
    for (let i = 0; i < count; i++) {
        skeletonHTML += `<div class="skeleton skeleton-card"></div>`;
    }
    container.innerHTML = skeletonHTML;
}

// --- BRIDGE TO HTML (Para gumana ang inline onclick calls) ---
window.showDetails = showDetails;
window.closeModal = closeModal;
window.changeServer = changeServer;
window.playTrailer = playTrailer; 
window.nextSlide = nextSlide;
window.goToSlide = goToSlide;
window.handleSearch = handleSearch;
window.filterGenre = filterGenre; 
window.loadMore = loadMore;         
window.BASE_URL = BASE_URL; 

/**
 * --- INITIALIZATION ENGINE ---
 */
async function init() {
    console.log("🚀 CINElzFlix Engine is now LIVE, bro!"); 
    try {
        // 0. Initialize Countdown Timer
        initCountdown();

        // --- START LOADING SKELETONS ---
        showSkeletons("movies-list", 8);
        showSkeletons("upcoming-list", 6);
        showSkeletons("tvshows-list", 6);
        showSkeletons("anime-list", 6);
        showSkeletons("top-rated-list", 6);

        // 1. Load Trending & Setup Hero
        const movies = await fetchMovies("movie", 1);
        if (movies && movies.length > 0) {
            setupHeroSlider(movies);
            displayList(movies, "movies-list");
        }
        
        // 2. Load Other Categories
        const categories = [
            { endpoint: '/movie/upcoming', container: 'upcoming-list' },
            { endpoint: '/trending/tv/week', container: 'tvshows-list' },
            { endpoint: '/discover/tv&with_genres=16', container: 'anime-list' },
            { endpoint: '/movie/top_rated', container: 'top-rated-list' }
        ];

        for (const cat of categories) {
            try {
                const res = await fetch(`${BASE_URL}?endpoint=${cat.endpoint}`);
                const data = await res.json();
                displayList(data.results, cat.container);
            } catch (catErr) {
                console.error(`Error loading category ${cat.container}:`, catErr);
            }
        }

        // --- 3. DEEP LINKING SUPPORT (Updated to /movie/ folder) ---
        const params = new URLSearchParams(window.location.search);
        const movieId = params.get('movie'); 
        const tvId = params.get('tv');        

        if (movieId || tvId) {
            const id = (movieId || tvId).split('-')[0];
            const type = movieId ? 'movie' : 'tv';
            
            console.log(`Detected deep link for ${type} ${id}. Redirecting to /movie/ folder...`);
            window.location.href = `/movie/?id=${id}&type=${type}`;
        }

    } catch (err) { 
        console.error("Initialization Error, Bro:", err); 
    }
}

// --- GLOBAL EVENT LISTENERS ---

/**
 * FIXED: EVENT DELEGATION PARA SA DYNAMIC BUTTONS
 * Sinisigurado nito na lahat ng clicks sa slider at posters ay gagana.
 */
document.addEventListener('click', (e) => {
    // Hanapin ang pinakamalapit na button element (watch-now, btn-watch, o play-btn)
    const watchBtn = e.target.closest('.watch-now') || e.target.closest('.btn-watch') || e.target.closest('.play-btn');
    
    if (watchBtn) {
        e.preventDefault();
        const id = watchBtn.getAttribute('data-id');
        const type = watchBtn.getAttribute('data-type') || 'movie';
        
        if (id) {
            console.log(`🎬 Redirecting to play ${type}: ${id}`);
            // FIXED: Path pointing to the folder /movie/
            window.location.href = `/movie/?id=${id}&type=${type}`;
        }
        return;
    }
});

/**
 * Handle Escape key for UI close actions
 */
document.addEventListener('keydown', (e) => {
    if (e.key === "Escape") {
        const modal = document.getElementById("modal");
        const searchResults = document.getElementById("search-results-section");
        
        if (modal && modal.style.display === "flex") {
            closeModal();
            return;
        }
        
        if (searchResults && searchResults.style.display === "block") {
            const searchInput = document.getElementById("search-input");
            if (searchInput) searchInput.value = "";
            searchResults.style.display = "none";
            document.getElementById("trending-section").style.display = "block";
        }
    }
});

// Fire the engine!
init();
