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
    if (!container) {
        console.warn(`Container not found: ${containerId}`);
        return;
    }
    container.innerHTML = "";
    if (!items || items.length === 0) {
        console.log(`No items to display in ${containerId}`);
        return;
    }
    
    let addedCount = 0;
    items.forEach(item => {
        if (item.poster_path) {
            container.appendChild(createMovieCard(item));
            addedCount++;
        }
    });
    console.log(`✅ Displayed ${addedCount} items in ${containerId}`);
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

/**
 * ✅ FIXED: filterGenre - no need for event parameter
 * Awtomatikong nagha-highlight ng active button base sa genreId
 */
export async function filterGenre(genreId) {
    console.log("🎬 filterGenre called with:", genreId);
    
    currentGenre = genreId;
    currentPage = 1; 
    
  // ✅ FIXED: Better matching for active button
    document.querySelectorAll('.genre-btn').forEach(btn => {
        btn.classList.remove('active');
        const onclickAttr = btn.getAttribute('onclick') || "";
        
        // Mas safe na match: icheck lang kung nandun yung ID mismo
        if (onclickAttr.includes(genreId)) {
            btn.classList.add('active');
        }
    });
    
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

    console.log("📡 Fetching movies for genre:", genreId);
    const filteredMovies = await fetchMovies("movie", 1, genreId);
    console.log("📡 Received movies count:", filteredMovies.length);
    
    if (filteredMovies.length === 0) {
        console.warn("⚠️ No movies found for this genre");
        const container = document.getElementById("movies-list");
        if (container) {
            container.innerHTML = '<p style="color: #888; text-align: center; padding: 40px;">No movies found for this genre.</p>';
        }
        return;
    }
    
    displayList(filteredMovies, "movies-list");
    console.log("✅ filterGenre completed");
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
