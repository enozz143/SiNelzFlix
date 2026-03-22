import { IMG_URL, fetchMovies } from './api.js';

let currentPage = 1;
let currentGenre = 'all';
let debounceTimer;

/**
 * --- CREATE MOVIE CARD (CLEAN VERSION) ---
 * Clickable ang buong card, wala nang buttons na humaharang.
 */
export function createMovieCard(item) {
    const type = item.title ? "movie" : "tv";
    const card = document.createElement("div");
    
    // Nilagyan natin ng classes at data attributes para sa CSS at Script.js
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

    // Direct Click Navigation
    card.onclick = () => {
        window.location.href = `/movie/?id=${item.id}&type=${type}`;
    };

    return card;
}

export function displayList(items, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";
    if (!items) return;
    items.forEach(item => {
        if (item.poster_path) container.appendChild(createMovieCard(item));
    });
}

export function displaySimilar(items) {
    let container = document.getElementById("similar-movies-container");
    if (!container) return;

    container.innerHTML = `
        <h3 style="margin: 30px 0 15px 0; color: #fff; font-size: 1.5rem;">You Might Also Like</h3>
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

    const filteredMovies = await fetchMovies("movie", 1, genreId);
    displayList(filteredMovies, "movies-list");
}

export async function loadMore() {
    currentPage++; 
    const loadBtn = document.getElementById("load-more-btn");
    const trendingRow = document.getElementById("movies-list");
    
    loadBtn.textContent = "Loading Results...";
    loadBtn.disabled = true;

    const moreMovies = await fetchMovies("movie", currentPage, currentGenre);
    if (moreMovies && moreMovies.length > 0) {
        moreMovies.forEach(item => {
            if (item.poster_path) { 
                trendingRow.appendChild(createMovieCard(item)); 
            }
        });
        loadBtn.textContent = "Explore More Movies";
        loadBtn.disabled = false;
    } else { 
        loadBtn.style.display = "none"; 
    }
}
