// script.js (Root Directory)
import { fetchMovies } from './js/api.js';
import { setupHeroSlider, nextSlide, goToSlide } from './js/slider.js';
import { displayList, handleSearch, filterGenre, loadMore } from './js/ui.js';
import { showDetails, closeModal, changeServer, playTrailer } from './js/modal.js';
import { initCountdown } from './js/countdown.js';

// ============================================
// ✅ AUTO-DETECT ENVIRONMENT (DEV vs PRODUCTION)
// ============================================

const isDev = window.location.hostname === 'localhost' || 
              window.location.hostname.includes('127.0.0.1') ||
              window.location.hostname.includes('github.io') ||
              !window.location.hostname.includes('cinelzflix.com');

const BASE_URL = isDev 
    ? 'https://cinelzflix-worker.baquial-enozz.workers.dev/'
    : '/api';

console.log(`🔧 Running in ${isDev ? 'DEVELOPMENT' : 'PRODUCTION'} mode`);
console.log(`📡 Using API URL: ${BASE_URL}`);

window.BASE_URL = BASE_URL;

// ============================================
// ✅ GENRE MAPPING - IBA'T IBANG TAON PARA MAGKAIBA
// ============================================

const genreMapping = [
    { name: 'action', id: 28, year: '2024', sort: 'popularity.desc' },
    { name: 'adventure', id: 12, year: '2023', sort: 'vote_average.desc' },
    { name: 'comedy', id: 35, year: '2022', sort: 'popularity.desc' },
    { name: 'drama', id: 18, year: '2024', sort: 'vote_count.desc' },
    { name: 'horror', id: 27, year: '2023', sort: 'popularity.desc' },
    { name: 'thriller', id: 53, year: '2022', sort: 'vote_average.desc' },
    { name: 'romance', id: 10749, year: '2024', sort: 'popularity.desc' },
    { name: 'scifi', id: 878, year: '2023', sort: 'vote_count.desc' },
    { name: 'fantasy', id: 14, year: '2022', sort: 'popularity.desc' },
    { name: 'mystery', id: 9648, year: '2024', sort: 'vote_average.desc' },
    { name: 'crime', id: 80, year: '2023', sort: 'popularity.desc' },
    { name: 'animation', id: 16, year: '2024', sort: 'vote_count.desc' },
    { name: 'documentary', id: 99, year: '2023', sort: 'vote_average.desc' },
    { name: 'family', id: 10751, year: '2024', sort: 'popularity.desc' },
    { name: 'war', id: 10752, year: '2022', sort: 'vote_count.desc' },
    { name: 'western', id: 37, year: '2021', sort: 'popularity.desc' },
    { name: 'musical', id: 10402, year: '2023', sort: 'vote_average.desc' },
    { name: 'biography', id: 36, year: '2024', sort: 'popularity.desc', keyword: 'biography' },
    { name: 'history', id: 36, year: '2022', sort: 'vote_average.desc', keyword: 'history' },
    { name: 'sports', id: 10762, year: '2024', sort: 'popularity.desc' }
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

// --- LOAD GENRE MOVIES WITH YEAR FILTER ---
async function loadGenreMovies(genre) {
    const container = document.getElementById(`genre-${genre.name}-list`);
    if (!container) return;
    
    try {
        let url;
        let movies = [];
        
        if (genre.keyword) {
            // For biography and history - use search endpoint with year
            url = `${BASE_URL}?endpoint=/search/movie&query=${genre.keyword}&primary_release_year=${genre.year}&page=1`;
            console.log(`🎬 Fetching ${genre.name} with keyword: ${genre.keyword}, year: ${genre.year}`);
        } else {
            // For regular genres - use year filter para iba-iba ang movies
            url = `${BASE_URL}?endpoint=/discover/movie&with_genres=${genre.id}&primary_release_year=${genre.year}&sort_by=${genre.sort}&vote_count.gte=50&page=1`;
            console.log(`🎬 Fetching ${genre.name} from year ${genre.year} with ${genre.sort} sorting`);
        }
        
        const response = await fetch(url);
        const data = await response.json();
        movies = data.results || [];
        
        // If not enough movies, try previous year
        if (movies.length < 6 && !genre.keyword) {
            const prevYear = parseInt(genre.year) - 1;
            const fallbackUrl = `${BASE_URL}?endpoint=/discover/movie&with_genres=${genre.id}&primary_release_year=${prevYear}&sort_by=${genre.sort}&vote_count.gte=50&page=1`;
            const fallbackRes = await fetch(fallbackUrl);
            const fallbackData = await fallbackRes.json();
            movies = fallbackData.results || [];
            console.log(`🔄 ${genre.name} fallback to year ${prevYear}: ${movies.length} movies`);
        }
        
        // Remove duplicates by ID
        const uniqueMovies = [];
        const seenIds = new Set();
        for (const movie of movies) {
            if (!seenIds.has(movie.id)) {
                seenIds.add(movie.id);
                uniqueMovies.push(movie);
            }
        }
        movies = uniqueMovies;
        
        console.log(`✅ ${genre.name}: ${movies.length} unique movies loaded`);
        
        if (movies.length === 0) {
            container.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">No movies found for this genre.</p>';
            return;
        }
        
        container.innerHTML = movies.slice(0, 12).map(movie => {
            const posterPath = movie.poster_path 
                ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`
                : '';
            const posterHtml = posterPath 
                ? `<img src="${posterPath}" alt="${movie.title.replace(/"/g, '&quot;')}" loading="lazy" onerror="this.src='https://via.placeholder.com/200x300?text=No+Poster'">`
                : '<div style="width:200px; height:300px; background:#1a1a1a; display:flex; align-items:center; justify-content:center; border-radius:10px;">No Poster</div>';
            
            const movieYear = movie.release_date ? movie.release_date.split('-')[0] : genre.year;
            
            return `
                <div class="movie-card" onclick="window.location.href='/movie/?id=${movie.id}&type=movie'">
                    ${posterHtml}
                    <h3>${movie.title.length > 25 ? movie.title.substring(0, 22) + '...' : movie.title}</h3>
                    <p>⭐ ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'} | ${movieYear}</p>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error(`Error loading ${genre.name} movies:`, error);
        container.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">Failed to load movies. Please refresh the page.</p>';
    }
}

// Load all genre movies
async function loadAllGenreMovies() {
    console.log('🎬 Loading additional genre sections with YEAR filter...');
    
    // Load skeletons first
    for (const genre of genreMapping) {
        const container = document.getElementById(`genre-${genre.name}-list`);
        if (container) {
            showSkeletons(`genre-${genre.name}-list`, 8);
        }
    }
    
    // Load actual movies one by one (para hindi ma-block)
    for (const genre of genreMapping) {
        await loadGenreMovies(genre);
        // Small delay para hindi ma-rate limit
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
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

// --- INITIALIZATION ---
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
        
        await loadAllGenreMovies();

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

// --- MOBILE NAVIGATION ---
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

document.addEventListener('click', function(e) {
    const menu = document.getElementById('mobile-genre-menu');
    const menuToggle = document.getElementById('menu-toggle');
    if (menu && menu.style.display === 'block' && 
        !menu.contains(e.target) && 
        !menuToggle?.contains(e.target)) {
        menu.style.display = 'none';
    }
});

window.scrollToTop = scrollToTop;
window.focusSearch = focusSearch;
window.toggleGenreMenu = toggleGenreMenu;
window.closeGenreMenu = closeGenreMenu;

init();
