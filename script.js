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

// --- BRIDGE TO HTML ---
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

// ============================================
// LIVE SEARCH DROPDOWN - NEW FEATURE!
// ============================================

let searchDebounceTimer;

/**
 * Live search with dropdown suggestions
 */
window.handleSearchWithDropdown = async function(query) {
    const dropdown = document.getElementById('search-dropdown');
    
    if (!dropdown) return;
    
    if (!query || !query.trim()) {
        dropdown.style.display = 'none';
        return;
    }
    
    // Show loading state
    dropdown.innerHTML = '<div class="search-dropdown-loading">🔍 Searching...</div>';
    dropdown.style.display = 'block';
    
    // Debounce para hindi masyadong madaming request
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(async () => {
        try {
            const res = await fetch(`${BASE_URL}?endpoint=/search/multi&query=${encodeURIComponent(query)}`);
            const data = await res.json();
            const results = data.results || [];
            
            if (results.length === 0) {
                dropdown.innerHTML = `<div class="search-dropdown-empty">😢 No results found for "${escapeHtml(query)}"</div>`;
                return;
            }
            
            // Show top 8 results
            dropdown.innerHTML = results.slice(0, 8).map(item => {
                const title = item.title || item.name || 'Unknown';
                const year = (item.release_date || item.first_air_date || '').split('-')[0];
                const type = item.title ? 'Movie' : (item.name ? 'TV' : 'Person');
                const rating = item.vote_average ? `⭐ ${item.vote_average.toFixed(1)}` : '';
                const poster = item.poster_path 
                    ? `https://image.tmdb.org/t/p/w92${item.poster_path}` 
                    : '';
                
                // Skip if no title or invalid type
                if (type === 'Person') return '';
                
                return `
                    <div class="search-dropdown-item" onclick="window.location.href='/movie/?id=${item.id}&type=${item.title ? 'movie' : 'tv'}'">
                        ${poster ? `<img class="search-dropdown-img" src="${poster}" alt="${escapeHtml(title)}" onerror="this.style.display='none'">` : '<div style="width:45px;"></div>'}
                        <div class="search-dropdown-info">
                            <div class="search-dropdown-title">${escapeHtml(title)}</div>
                            <div class="search-dropdown-meta">
                                <span class="search-dropdown-type">${type}</span>
                                <span class="search-dropdown-year">${year || 'N/A'}</span>
                                <span class="search-dropdown-rating">${rating}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).filter(item => item !== '').join('');
            
            // If all items were filtered out
            if (dropdown.innerHTML === '') {
                dropdown.innerHTML = '<div class="search-dropdown-empty">😢 No valid results found</div>';
            }
            
        } catch (err) {
            console.error('Search error:', err);
            dropdown.innerHTML = '<div class="search-dropdown-empty">⚠️ Search failed. Please try again.</div>';
        }
    }, 300);
};

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Close dropdown when clicking outside
 */
document.addEventListener('click', function(e) {
    const searchBox = document.querySelector('.search-box');
    const dropdown = document.getElementById('search-dropdown');
    if (searchBox && dropdown && !searchBox.contains(e.target)) {
        dropdown.style.display = 'none';
    }
});

// Also close on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const dropdown = document.getElementById('search-dropdown');
        if (dropdown) dropdown.style.display = 'none';
    }
});

/**
 * --- INITIALIZATION ENGINE ---
 */
async function init() {
    console.log("🚀 CINElzFlix Engine is now LIVE, bro!"); 
    try {
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

        // --- 3. DEEP LINKING SUPPORT ---
        const params = new URLSearchParams(window.location.search);
        const movieId = params.get('movie'); 
        const tvId = params.get('tv');        

        if (movieId || tvId) {
            const id = (movieId || tvId).split('-')[0];
            const type = movieId ? 'movie' : 'tv';
            window.location.href = `/movie/?id=${id}&type=${type}`;
        }

    } catch (err) { 
        console.error("Initialization Error, Bro:", err); 
    }
}

// --- GLOBAL EVENT LISTENERS ---

/**
 * FIXED: EVENT DELEGATION PARA SA DYNAMIC ELEMENTS
 * Sinasalo nito ang clicks sa "Watch Now" (Slider) AT sa "Movie Cards" (Grid)
 */
document.addEventListener('click', (e) => {
    // 1. Hanapin kung ang ki-nlick ay Watch Now button O ang mismong Movie Card
    const target = e.target.closest('.watch-now') || e.target.closest('.movie-card');
    
    if (target) {
        e.preventDefault();
        const id = target.getAttribute('data-id');
        const type = target.getAttribute('data-type') || 'movie';
        
        if (id) {
            console.log(`🎬 Navigation Triggered: ${type} ${id}`);
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

init();
