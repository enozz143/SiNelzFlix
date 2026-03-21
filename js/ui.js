import { IMG_URL, fetchMovies } from './api.js';
import { playTrailer } from './modal.js';

let currentPage = 1;
let currentGenre = 'all';
let debounceTimer;

export function createMovieCard(item) {
    const card = document.createElement("div");
    card.className = "movie-card";
    
    const img = document.createElement("img");
    img.src = item.poster_path ? `${IMG_URL}${item.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image';
    img.loading = "lazy";
    
    const overlay = document.createElement("div");
    overlay.className = "trailer-overlay";
    
    // Button 1: Play Trailer
    const trailerBtn = document.createElement("button");
    trailerBtn.className = "hover-btn trailer-btn";
    trailerBtn.innerHTML = "Play Trailer";
    trailerBtn.onclick = (e) => { 
        e.stopPropagation(); 
        playTrailer(item.id, item.title ? "movie" : "tv"); 
    };

    // Button 2: Full Movie (Redirect logic fixed for Cloudflare)
    const fullMovieBtn = document.createElement("button");
    fullMovieBtn.className = "hover-btn movie-btn";
    fullMovieBtn.innerHTML = "Full Movie";
    fullMovieBtn.onclick = (e) => { 
        e.stopPropagation(); 
        const type = item.title ? "movie" : "tv";
        // Force absolute path para hindi mawala ang .html
        const targetUrl = `${window.location.origin}/movie.html?id=${item.id}&type=${type}`;
        window.location.href = targetUrl;
    };

    // Button 3: Share Link
    const shareBtn = document.createElement("button");
    shareBtn.className = "share-mini-btn";
    shareBtn.innerHTML = "🔗 Share";
    shareBtn.onclick = (e) => {
        e.stopPropagation();
        const type = item.title ? "movie" : "tv";
        const shareUrl = `${window.location.origin}/movie.html?id=${item.id}&type=${type}`;
        
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

    // FIX: Pag click sa card, dapat may .html din
    card.onclick = () => {
        const type = item.title ? "movie" : "tv";
        const targetUrl = `${window.location.origin}/movie.html?id=${item.id}&type=${type}`;
        window.location.href = targetUrl;
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
