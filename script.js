// script.js (Root Directory)
import { BASE_URL, fetchMovies } from './js/api.js';
import { setupHeroSlider, nextSlide, goToSlide } from './js/slider.js';
import { displayList, handleSearch, loadMore } from './js/ui.js';
import { showDetails, closeModal, changeServer, playTrailer } from './js/modal.js';
import { initCountdown } from './js/countdown.js';

// ============================================
// ✅ GLOBAL VARIABLES
// ============================================

// Store original content para maibalik pag nag-click ng "All"
let originalTrendingMovies = [];
let originalSectionTitle = '';
let originalMoviesHTML = '';

// ============================================
// HELPER: SKELETON LOADER
// ============================================

function showSkeletons(containerId, count = 10) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let skeletonHTML = '';
    for (let i = 0; i < count; i++) {
        skeletonHTML += `<div class="skeleton skeleton-card"></div>`;
    }
    container.innerHTML = skeletonHTML;
}

// ============================================
// ✅ IMPROVED GENRE FILTER - NAG-IIBA ANG DISPLAY
// ============================================

// Genre names para sa title
const genreNames = {
    'all': '📺 Trending Movies',
    '28': '🔥 Action Movies',
    '12': '🗺️ Adventure Movies',
    '35': '😂 Comedy Movies',
    '27': '😱 Horror Movies',
    '10749': '💖 Romance Movies',
    '878': '🚀 Sci-Fi Movies',
    '14': '🧙 Fantasy Movies',
    '9648': '🕵️ Mystery Movies',
    '53': '🔪 Thriller Movies',
    '16': '🎨 Animation Movies',
    '18': '🎭 Drama Movies',
    '36': '📜 History Movies',
    '10402': '🎵 Musical Movies',
    '10751': '👨‍👩‍👧 Family Movies',
    '10752': '⚔️ War Movies',
    '37': '🤠 Western Movies',
    '99': '📽️ Documentary Movies'
};

// Save original trending movies content
function saveOriginalContent() {
    const moviesContainer = document.getElementById('movies-list');
    const sectionTitle = document.querySelector('#movies-section h2, .category-section h2');
    
    if (moviesContainer && originalTrendingMovies.length === 0) {
        // Save the HTML of movie cards
        const movieCards = moviesContainer.querySelectorAll('.movie-card');
        movieCards.forEach(card => {
            originalTrendingMovies.push(card.outerHTML);
        });
        originalMoviesHTML = moviesContainer.innerHTML;
    }
    
    if (sectionTitle && originalSectionTitle === '') {
        originalSectionTitle = sectionTitle.innerHTML;
    }
}

// Restore original trending movies
function restoreOriginalContent() {
    const moviesContainer = document.getElementById('movies-list');
    const sectionTitle = document.querySelector('#movies-section h2, .category-section h2');
    
    if (moviesContainer && originalMoviesHTML) {
        moviesContainer.innerHTML = originalMoviesHTML;
    }
    
    if (sectionTitle && originalSectionTitle) {
        sectionTitle.innerHTML = originalSectionTitle;
    }
}

// Override ang existing filterGenre function
window.filterGenre = async function(genreId) {
    console.log(`🎬 Filtering genre: ${genreId}`);
    
    const moviesContainer = document.getElementById('movies-list');
    const sectionTitle = document.querySelector('#movies-section h2, .category-section h2');
    
    // Save original content on first filter
    saveOriginalContent();
    
    if (genreId === 'all') {
        restoreOriginalContent();
        return;
    }
    
    // Update section title
    const genreName = genreNames[genreId] || 'Movies';
    if (sectionTitle) sectionTitle.innerHTML = genreName;
    
    // Show skeletons while loading
    if (moviesContainer) {
        let skeletons = '';
        for (let i = 0; i < 12; i++) {
            skeletons += `<div class="skeleton skeleton-card"></div>`;
        }
        moviesContainer.innerHTML = skeletons;
    }
    
    try {
        // Fetch movies by genre
        const url = `${BASE_URL}?endpoint=/discover/movie&with_genres=${genreId}&sort_by=popularity.desc&vote_count.gte=100&page=1`;
        const response = await fetch(url);
        const data = await response.json();
        const movies = data.results || [];
        
        if (movies.length === 0) {
            moviesContainer.innerHTML = '<p style="color: #888; text-align: center; padding: 40px;">No movies found for this genre.</p>';
            return;
        }
        
        // Display genre movies
        moviesContainer.innerHTML = movies.slice(0, 12).map(movie => {
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
        console.error('Error loading genre movies:', error);
        moviesContainer.innerHTML = '<p style="color: #888; text-align: center; padding: 40px;">Failed to load movies. Please try again.</p>';
    }
};

// --- BRIDGE TO HTML ---
window.showDetails = showDetails;
window.closeModal = closeModal;
window.changeServer = changeServer;
window.playTrailer = playTrailer;
window.nextSlide = nextSlide;
window.goToSlide = goToSlide;
window.handleSearch = handleSearch;
window.loadMore = loadMore;        
window.BASE_URL = BASE_URL; 

// ============================================
// LIVE SEARCH DROPDOWN
// ============================================

let searchDebounceTimer;

window.handleSearchWithDropdown = async function(query) {
    const dropdown = document.getElementById('search-dropdown');
    
    if (!dropdown) return;
    
    if (!query || !query.trim()) {
        dropdown.style.display = 'none';
        return;
    }
    
    dropdown.innerHTML = '<div class="search-dropdown-loading">🔍 Searching...</div>';
    dropdown.style.display = 'block';
    
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
            
            dropdown.innerHTML = results.slice(0, 8).map(item => {
                const title = item.title || item.name || 'Unknown';
                const year = (item.release_date || item.first_air_date || '').split('-')[0];
                const type = item.title ? 'Movie' : (item.name ? 'TV' : 'Person');
                const rating = item.vote_average ? `⭐ ${item.vote_average.toFixed(1)}` : '';
                const poster = item.poster_path 
                    ? `https://image.tmdb.org/t/p/w92${item.poster_path}` 
                    : '';
                
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
            
            if (dropdown.innerHTML === '') {
                dropdown.innerHTML = '<div class="search-dropdown-empty">😢 No valid results found</div>';
            }
            
        } catch (err) {
            console.error('Search error:', err);
            dropdown.innerHTML = '<div class="search-dropdown-empty">⚠️ Search failed. Please try again.</div>';
        }
    }, 300);
};

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

document.addEventListener('click', function(e) {
    const searchBox = document.querySelector('.search-box');
    const dropdown = document.getElementById('search-dropdown');
    if (searchBox && dropdown && !searchBox.contains(e.target)) {
        dropdown.style.display = 'none';
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const dropdown = document.getElementById('search-dropdown');
        if (dropdown) dropdown.style.display = 'none';
    }
});

// ============================================
// INITIALIZATION ENGINE
// ============================================

async function init() {
    console.log("🚀 CINElzFlix Engine is now LIVE, bro!"); 
    try {
        initCountdown();

        const containers = ["movies-list", "upcoming-list", "tvshows-list", "anime-list", "top-rated-list"];
        containers.forEach(id => {
            const container = document.getElementById(id);
            if (container) container.innerHTML = "";
        });

        showSkeletons("movies-list", 8);
        showSkeletons("upcoming-list", 6);
        showSkeletons("tvshows-list", 6);
        showSkeletons("anime-list", 6);
        showSkeletons("top-rated-list", 6);

        const movies = await fetchMovies("movie", 1);
        if (movies && movies.length > 0) {
            setupHeroSlider(movies);
            displayList(movies, "movies-list");
        }
        
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
                console.error(`Error loading ${cat.container}:`, catErr);
            }
        }

        // Save original content after loading
        setTimeout(() => {
            saveOriginalContent();
        }, 1000);

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

function initMobileGenreMenu() {
    const genreList = document.getElementById('mobile-genre-list');
    
    if (!genreList) return;
    
    const desktopButtons = document.querySelectorAll('.genre-container .genre-btn');
    genreList.innerHTML = '';
    
    desktopButtons.forEach(btn => {
        const clone = btn.cloneNode(true);
        clone.onclick = (e) => {
            e.stopPropagation();
            const onclickAttr = clone.getAttribute('onclick');
            const match = onclickAttr.match(/'([^']+)'/);
            if (match) {
                window.filterGenre(match[1]);
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

document.addEventListener('click', function(e) {
    const menu = document.getElementById('mobile-genre-menu');
    const menuToggle = document.getElementById('menu-toggle');
    if (menu && menu.style.display === 'block' && 
        !menu.contains(e.target) && 
        !menuToggle?.contains(e.target)) {
        menu.style.display = 'none';
    }
});

// Make available globally
window.scrollToTop = scrollToTop;
window.focusSearch = focusSearch;
window.toggleGenreMenu = toggleGenreMenu;
window.closeGenreMenu = closeGenreMenu;
window.initMobileGenreMenu = initMobileGenreMenu;

// Start the app
init();
