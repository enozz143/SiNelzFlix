// js/ui.js
import { IMG_URL, fetchMovies } from './api.js';
import { showDetails, playTrailer } from './modal.js';

/**
 * --- MOVIE CARDS & LISTS ---
 */
export function createMovieCard(item) {
    const card = document.createElement("div");
    card.className = "movie-card";
    
    const img = document.createElement("img");
    img.src = item.poster_path ? `${IMG_URL}${item.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image';
    img.loading = "lazy";
    
    const overlay = document.createElement("div");
    overlay.className = "trailer-overlay";
    
    const trailerBtn = document.createElement("button");
    trailerBtn.className = "hover-btn trailer-btn";
    trailerBtn.innerHTML = "Play Trailer";
    trailerBtn.onclick = (e) => { 
        e.stopPropagation(); 
        playTrailer(item.id, item.title ? "movie" : "tv"); 
    };

    const fullMovieBtn = document.createElement("button");
    fullMovieBtn.className = "hover-btn movie-btn";
    fullMovieBtn.innerHTML = "Full Movie";
    fullMovieBtn.onclick = (e) => { 
        e.stopPropagation(); 
        showDetails(item); 
    };

    const shareBtn = document.createElement("button");
    shareBtn.className = "share-mini-btn";
    shareBtn.innerHTML = "🔗 Share";
    shareBtn.onclick = (e) => {
        e.stopPropagation();
        const type = item.title ? "movie" : "tv";
        const titleSlug = (item.title || item.name).toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        const shareUrl = `${window.location.origin}${window.location.pathname}?${type}=${item.id}-${titleSlug}`;
        
        if (navigator.share) {
            navigator.share({ title: item.title || item.name, text: `Panoorin natin 'to sa CINElzFlix!`, url: shareUrl });
        } else {
            navigator.clipboard.writeText(shareUrl);
            alert("Movie link copied to clipboard, bro!");
        }
    };
    
    overlay.appendChild(trailerBtn);
    overlay.appendChild(fullMovieBtn);
    overlay.appendChild(shareBtn);
    card.appendChild(img);
    card.appendChild(overlay);
    return card;
}

export function displayList(items, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";
    items.forEach(item => {
        if (item.poster_path) container.appendChild(createMovieCard(item));
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

// Global reference para sa modal.js
window.displaySimilar = displaySimilar;

/**
 * --- SEARCH & FILTERS ---
 */
let debounceTimer;
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
