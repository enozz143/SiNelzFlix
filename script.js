// script.js (Root Directory)
import { BASE_URL, fetchMovies } from './js/api.js';
import { setupHeroSlider, nextSlide, goToSlide } from './js/slider.js';
import { displayList, handleSearch, filterGenre, loadMore } from './js/ui.js';
// Dinagdag ang playTrailer dito sa import 👇
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


window.showDetails = showDetails;
window.closeModal = closeModal;
window.changeServer = changeServer;
window.playTrailer = playTrailer; // Dinagdag ito para ma-access ng buttons sa HTML 👈
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

        // Sabay-sabay nating i-fetch pero naka-skeleton bawat isa
        for (const cat of categories) {
            try {
                const res = await fetch(`${BASE_URL}?endpoint=${cat.endpoint}`);
                const data = await res.json();
                // Pag dating ng data, mapapalitan na yung skeletons
                displayList(data.results, cat.container);
            } catch (catErr) {
                console.error(`Error loading category ${cat.container}:`, catErr);
            }
        }

        // 3. Deep Linking Support
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

init();
