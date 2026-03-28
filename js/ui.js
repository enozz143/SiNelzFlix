// js/ui.js - SIMPLE CLICKABLE CARDS (no buttons, keep all connections)
import { IMG_URL, fetchMovies } from './api.js';
import { showDetails, playTrailer } from './modal.js';

let currentPage = 1;
let currentGenre = 'all';
let debounceTimer;

/**
 * --- CREATE MOVIE CARD (SIMPLE CLICKABLE VERSION) ---
 */
export function createMovieCard(item) {
    const type = item.title ? "movie" : "tv";
    const card = document.createElement("div");
    
    card.className = "movie-card";
    card.setAttribute('data-id', item.id);
    card.setAttribute('data-type', type);
    
    const posterPath = item.poster_path 
        ? `${IMG_URL}${item.poster_path}` 
        : 'https://via.placeholder.com/500x750?text=No+Image';

    card.innerHTML = `
        <div class="poster-wrapper">
            <img src="${posterPath}" alt="${item.title || item.name}" loading="lazy">
            <div class="card-overlay">
                <div class="card-info">
                    <span class="card-rating">⭐ ${item.vote_average ? item.vote_average.toFixed(1) : '0.0'}</span>
                    <h3 class="card-title">${item.title || item.name}</h3>
                </div>
            </div>
        </div>
    `;

    card.onclick = () => {
        window.location.href = `/movie/?id=${item.id}&type=${type}`;
    };

    return card;
}

export function displayList(items, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";
    if (!items || items.length === 0) return;
    
    items.forEach(item => {
        if (item.poster_path) {
            container.appendChild(createMovieCard(item));
        }
    });
}

/**
 * --- SPECIAL UI HANDLERS ---
 */
export function displaySimilar(items) {
    let container = document.getElementById("similar-movies-container");
    if (!container) return;

    container.innerHTML = `
        <h3 style="margin: 20px 0 10px 0; color: #fff;">You Might Also Like</h3>
        <div id="similar-movies" class="movie-row"></div>
    `;

    let similarList = document.getElementById("similar-movies");
    items.forEach(item => {
        if (item.poster_path) {
            similarList.appendChild(createMovieCard(item));
        }
    });
}

window.displaySimilar = displaySimilar;

/**
 * --- PINOY MOVIES FETCHER (EXCLUDING VIVAMAX) ---
 */
export async function fetchPinoyMovies(page = 1) {
    try {
        const url = `${window.BASE_URL}?endpoint=/discover/movie&with_original_language=tl&with_origin_country=PH&sort_by=popularity.desc&page=${page}`;
        console.log("📡 Fetching Pinoy movies:", url);
        const res = await fetch(url);
        const data = await res.json();
        
        // ✅ FILTER OUT VIVAMAX MOVIES (by title, overview, and production companies)
        const filteredMovies = (data.results || []).filter(movie => {
            const title = (movie.title || '').toLowerCase();
            const overview = (movie.overview || '').toLowerCase();
            
            // Skip if contains VivaMax keywords
            if (title.includes('vivamax') || overview.includes('vivamax')) {
                console.log(`❌ Filtered out VivaMax: ${movie.title}`);
                return false;
            }
            
            // Optional: Filter by production companies if available
            if (movie.production_companies) {
                const hasVivaMaxCompany = movie.production_companies.some(company => 
                    company.name?.toLowerCase().includes('vivamax')
                );
                if (hasVivaMaxCompany) return false;
            }
            
            return true;
        });
        
        console.log(`✅ Found ${filteredMovies.length} Pinoy movies (VivaMax filtered out)`);
        return filteredMovies;
    } catch (error) {
        console.error("Error fetching Pinoy movies:", error);
        return [];
    }
}

/**
 * --- SEARCH, FILTERS & LOAD MORE ---
 */
export async function handleSearch(q) {
    if (!q.trim()) {
        document.getElementById("search-results-section").style.display = "none";
        document.getElementById("trending-section").style.display = "block";
        return;
    }
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
        const res = await fetch(`${window.BASE_URL}?endpoint=/search/multi&query=${encodeURIComponent(q)}`);
        const data = await res.json();
        document.getElementById("search-results-section").style.display = "block";
        document.getElementById("trending-section").style.display = "none";
        displayList(data.results, "search-results-list");
    }, 500);
}

export async function filterGenre(genreId) {
    console.log("🎬 filterGenre called with:", genreId);
    
    currentGenre = genreId;
    currentPage = 1; 
    
    document.querySelectorAll('.genre-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');
    
    const trendingRow = document.getElementById("movies-list");
    const allSections = document.querySelectorAll('#trending-section section.category-section');
    
    allSections.forEach(sec => {
        if (!sec.contains(trendingRow)) {
            sec.style.display = genreId === 'all' ? "block" : "none";
        }
    });

    if (genreId !== 'all') {
        trendingRow.classList.remove("horizontal-scroll");
    } else {
        trendingRow.classList.add("horizontal-scroll");
    }

    // ✅ PINOY MOVIES (WITHOUT VIVAMAX)
    if (genreId === 'pinoy') {
        const pinoyMovies = await fetchPinoyMovies(1);
        displayList(pinoyMovies, "movies-list");
        return;
    }

    const filteredMovies = await fetchMovies("movie", 1, genreId);
    displayList(filteredMovies, "movies-list");
}

export async function loadMore() {
    currentPage++; 
    const loadBtn = document.getElementById("load-more-btn");
    const trendingRow = document.getElementById("movies-list");
    const trendingSection = trendingRow.parentElement; 
    
    loadBtn.textContent = "Loading Results...";
    loadBtn.disabled = true;

    const allSections = document.querySelectorAll('#trending-section section.category-section');
    allSections.forEach(sec => {
        if (!sec.contains(trendingRow)) {
            sec.style.display = "none";
        }
    });

    trendingRow.classList.remove("horizontal-scroll");
    trendingSection.scrollIntoView({ behavior: 'smooth' });

    let moreMovies;
    if (currentGenre === 'pinoy') {
        moreMovies = await fetchPinoyMovies(currentPage);
    } else {
        moreMovies = await fetchMovies("movie", currentPage, currentGenre);
    }
    
    if (moreMovies && moreMovies.length > 0) {
        moreMovies.forEach(item => {
            if (item.poster_path) {
                trendingRow.appendChild(createMovieCard(item));
            }
        });
        loadBtn.textContent = "Show Even More";
        loadBtn.disabled = false;
    } else {
        loadBtn.style.display = "none"; 
    }
}
