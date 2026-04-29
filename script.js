// script.js (Root Directory)
import { fetchMovies } from './js/api.js';
import { setupHeroSlider, nextSlide, goToSlide } from './js/slider.js';
import { displayList, handleSearch, filterGenre, loadMore } from './js/ui.js';
import { showDetails, closeModal, changeServer, playTrailer } from './js/modal.js';
import { initCountdown } from './js/countdown.js';

// ============================================
// ✅ AUTO-DETECT ENVIRONMENT (DEV vs PRODUCTION)
// ============================================

// Detect if we're on development or production
const isDev = window.location.hostname === 'localhost' || 
              window.location.hostname.includes('127.0.0.1') ||
              window.location.hostname.includes('github.io') ||
              !window.location.hostname.includes('cinelzflix.com');

// Use different BASE_URL based on environment
const BASE_URL = isDev 
    ? 'https://cinelzflix-worker.baquial-enozz.workers.dev/'
    : '/api';

console.log(`🔧 Running in ${isDev ? 'DEVELOPMENT' : 'PRODUCTION'} mode`);
console.log(`📡 Using API URL: ${BASE_URL}`);

// Make BASE_URL available globally
window.BASE_URL = BASE_URL;

// ============================================
// ✅ GENRE ID MAPPING FOR ADDITIONAL SECTIONS
// ============================================

const genreMapping = [
    { name: 'action', id: 28, title: '🔥 Action Movies' },
    { name: 'adventure', id: 12, title: '🗺️ Adventure Movies' },
    { name: 'comedy', id: 35, title: '😂 Comedy Movies' },
    { name: 'drama', id: 18, title: '🎭 Drama Movies' },
    { name: 'horror', id: 27, title: '😱 Horror Movies' },
    { name: 'thriller', id: 53, title: '🔪 Thriller Movies' },
    { name: 'romance', id: 10749, title: '💖 Romance Movies' },
    { name: 'scifi', id: 878, title: '🚀 Sci-Fi Movies' },
    { name: 'fantasy', id: 14, title: '🧙 Fantasy Movies' },
    { name: 'mystery', id: 9648, title: '🕵️ Mystery Movies' },
    { name: 'crime', id: 80, title: '🕵️ Crime Movies' },
    { name: 'animation', id: 16, title: '🎨 Animation' },
    { name: 'documentary', id: 99, title: '📽️ Documentary' },
    { name: 'family', id: 10751, title: '👨‍👩‍👧 Family Movies' },
    { name: 'war', id: 10752, title: '⚔️ War Movies' },
    { name: 'western', id: 37, title: '🤠 Western Movies' },
    { name: 'musical', id: 10402, title: '🎵 Musical Movies' },
    { name: 'biography', id: 36, title: '📖 Biography Movies' },
    { name: 'history', id: 36, title: '📜 History Movies' },
    { name: 'sports', id: 10762, title: '🏅 Sports Movies' }
];

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

// --- LOAD GENRE MOVIES (for additional sections) ---
async function loadGenreMovies(genreName, genreId) {
    const container = document.getElementById(`genre-${genreName}-list`);
    if (!container) return;
    
    try {
        const url = `${BASE_URL}?endpoint=/discover/movie&with_genres=${genreId}&sort_by=popularity.desc&vote_count.gte=100&page=1`;
        
        console.log(`🎬 Fetching ${genreName} movies...`);
        
        const response = await fetch(url);
        const data = await response.json();
        const movies = data.results || [];
        
        console.log(`✅ ${genreName}: ${movies.length} movies loaded`);
        
        if (movies.length === 0) {
            container.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">No movies found.</p>';
            return;
        }
        
        container.innerHTML = movies.slice(0, 12).map(movie => {
            const posterPath = movie.poster_path 
                ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`
                : '';
            const posterHtml = posterPath 
                ? `<img src="${posterPath}" alt="${movie.title.replace(/"/g, '&quot;')}" loading="lazy" onerror="this.src='https://via.placeholder.com/200x300?text=No+Poster'">`
                : '<div style="width:200px; height:300px; background:#1a1a1a; display:flex; align-items:center; justify-content:center; border-radius:10px;">No Poster</div>';
            
            return `
                <div class="movie-card" onclick="window.location.href='/movie/?id=${movie.id}&type=movie'">
                    ${posterHtml}
                    <h3>${movie.title.length > 25 ? movie.title.substring(0, 22) + '...' : movie.title}</h3>
                    <p>⭐ ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</p>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error(`Error loading ${genreName} movies:`, error);
        container.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">Failed to load movies. Please try again later.</p>';
    }
}

// Load all genre movies
async function loadAllGenreMovies() {
    console.log('🎬 Loading additional genre sections...');
    
    // Load skeletons first
    for (const genre of genreMapping) {
        const container = document.getElementById(`genre-${genre.name}-list`);
        if (container) {
            showSkeletons(`genre-${genre.name}-list`, 8);
        }
    }
    
    // Load actual movies (use Promise.all for faster loading)
    const promises = genreMapping.map(genre => loadGenreMovies(genre.name, genre.id));
    await Promise.all(promises);
    
    console.log('✅ All genre sections loaded successfully!');
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

// ============================================
// LIVE SEARCH DROPDOWN
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
        // 0. Initialize Countdown Timer
        initCountdown();

        // ✅ FORCE CLEAR CONTAINERS BEFORE ADDING SKELETONS
        const containers = ["movies-list", "upcoming-list", "tvshows-list", "anime-list", "top-rated-list"];
        containers.forEach(id => {
            const container = document.getElementById(id);
            if (container) container.innerHTML = "";
        });

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
        
        // 3. Load Additional Genre Sections
        await loadAllGenreMovies();

        // 4. Deep Linking Support
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

// ============================================
// MOBILE BOTTOM NAVIGATION FUNCTIONS
// ============================================

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function focusSearch() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.focus();
        searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Create mobile genre menu with buttons
function initMobileGenreMenu() {
    const genreList = document.getElementById('mobile-genre-list');
    
    if (!genreList) return;
    
    // Copy genre buttons from desktop
    const desktopButtons = document.querySelectorAll('.genre-container .genre-btn');
    genreList.innerHTML = '';
    
    desktopButtons.forEach(btn => {
        const clone = btn.cloneNode(true);
        clone.onclick = (e) => {
            e.stopPropagation();
            const onclickAttr = clone.getAttribute('onclick');
            const match = onclickAttr.match(/'([^']+)'/);
            if (match) {
                filterGenre(match[1]);
            }
            closeGenreMenu();
        };
        genreList.appendChild(clone);
    });
}

function toggleGenreMenu() {
    let menu = document.getElementById('mobile-genre-menu');
    if (!menu) return;
    
    if (menu.style.display === 'block') {
        menu.style.display = 'none';
    } else {
        initMobileGenreMenu();
        menu.style.display = 'block';
    }
}

function closeGenreMenu() {
    const menu = document.getElementById('mobile-genre-menu');
    if (menu) menu.style.display = 'none';
}

// Close menu when clicking outside
document.addEventListener('click', function(e) {
    const menu = document.getElementById('mobile-genre-menu');
    const menuToggle = document.getElementById('menu-toggle');
    if (menu && menu.style.display === 'block' && 
        !menu.contains(e.target) && 
        !menuToggle?.contains(e.target)) {
        menu.style.display = 'none';
    }
});

// Export for use in movie page
export { scrollToTop, focusSearch, toggleGenreMenu, closeGenreMenu, initMobileGenreMenu };

// Make available globally
window.scrollToTop = scrollToTop;
window.focusSearch = focusSearch;
window.toggleGenreMenu = toggleGenreMenu;
window.closeGenreMenu = closeGenreMenu;
window.initMobileGenreMenu = initMobileGenreMenu;

// Start the app
init();
