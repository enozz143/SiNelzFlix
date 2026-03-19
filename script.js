// script.js (Root Directory)
import { BASE_URL, fetchMovies } from './js/api.js';
import { setupHeroSlider, nextSlide, goToSlide } from './js/slider.js';
import { displayList, handleSearch } from './js/ui.js';
import { showDetails, closeModal, changeServer } from './js/modal.js';

// --- BRIDGE TO HTML ---
// Dahil ang ES Modules ay private, kailangan nating i-expose 
// ang mga functions sa 'window' para gumana ang onclick sa HTML.
window.showDetails = showDetails;
window.closeModal = closeModal;
window.changeServer = changeServer;
window.nextSlide = nextSlide;
window.goToSlide = goToSlide;
window.handleSearch = handleSearch;
window.BASE_URL = BASE_URL; 

/**
 * --- INITIALIZATION ENGINE ---
 */
async function init() {
    console.log("🚀 CINElzFlix Engine is now LIVE, bro!"); 
    try {
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
            const res = await fetch(`${BASE_URL}?endpoint=${cat.endpoint}`);
            const data = await res.json();
            displayList(data.results, cat.container);
        }

        // 3. Deep Linking Support (Para sa Share links)
        const params = new URLSearchParams(window.location.search);
        const movieId = params.get('movie');
        const tvId = params.get('tv');
        if (movieId || tvId) {
            const id = (movieId || tvId).split('-')[0];
            const type = movieId ? 'movie' : 'tv';
            const res = await fetch(`${BASE_URL}?endpoint=/${type}/${id}`);
            const data = await res.json();
            if (data) showDetails(data);
        }

    } catch (err) { 
        console.error("Initialization Error, Bro:", err); 
    }
}

// --- GLOBAL EVENT LISTENERS ---

// Para sa keyboard shortcuts (ESC key)
document.addEventListener('keydown', (e) => {
    if (e.key === "Escape") {
        const modal = document.getElementById("modal");
        if (modal && modal.style.display === "flex") closeModal();
    }
});

// Loading Spinner Fade Out
window.addEventListener('load', () => {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
        setTimeout(() => {
            spinner.classList.add('fade-out');
        }, 1000);
    }
});

// RUN!
init();
