const BASE_URL = "/api"; 
const IMG_URL = "https://image.tmdb.org/t/p/original";
let currentItem;
let debounceTimer;
let currentPage = 1; 
let currentGenre = 'all'; // Tracking para sa genre

// --- 1. FETCH TRENDING & GENRES ---
async function fetchMovies(type, page = 1, genreId = 'all') {
    try {
        let endpoint = `/trending/${type}/week`;
        if (genreId !== 'all') {
            endpoint = `/discover/${type}`;
        }
        
        let url = `${BASE_URL}?endpoint=${endpoint}&page=${page}`;
        if (genreId !== 'all') {
            url += `&with_genres=${genreId}`;
        }

        const res = await fetch(url);
        const data = await res.json();
        return data.results;
    } catch (error) {
        console.error("Fetch error:", error);
        return [];
    }
}

// --- 2. GENRE FILTER LOGIC ---
async function filterGenre(genreId) {
    currentGenre = genreId;
    currentPage = 1; // Reset page to 1
    
    // UI Update: Active button effect
    document.querySelectorAll('.genre-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    const moviesList = document.getElementById("movies-list");
    moviesList.innerHTML = "<p style='color:white; padding:20px;'>Filtering movies...</p>";

    const filteredMovies = await fetchMovies("movie", 1, genreId);
    displayList(filteredMovies, "movies-list");
    
    // Ipakita ulit ang Load More button
    document.getElementById("load-more-btn").style.display = "inline-block";
}

// --- 3. LOAD MORE LOGIC ---
async function loadMore() {
    currentPage++; 
    const loadBtn = document.getElementById("load-more-btn");
    loadBtn.textContent = "Loading...";

    const moreMovies = await fetchMovies("movie", currentPage, currentGenre);
    
    if (moreMovies && moreMovies.length > 0) {
        const container = document.getElementById("movies-list");
        moreMovies.forEach(item => {
            if (!item.poster_path) return;
            container.appendChild(createMovieCard(item, "movies-list"));
        });
        loadBtn.textContent = "Load More Movies";
    } else {
        loadBtn.style.display = "none"; 
    }
}

// --- 4. CORE FUNCTIONS (Display & Cards) ---
function createMovieCard(item, containerId) {
    const card = document.createElement("div");
    card.className = "movie-card";
    const img = document.createElement("img");
    img.src = `${IMG_URL}${item.poster_path}`;
    img.onclick = () => showDetails(item); 
    
    const overlay = document.createElement("div");
    overlay.className = "trailer-overlay";
    const btn = document.createElement("button");
    btn.innerHTML = "▶ Play Trailer";
    btn.onclick = (e) => { e.stopPropagation(); playTrailer(item.id, item.media_type || "movie"); };
    
    overlay.appendChild(btn);
    card.appendChild(img);
    card.appendChild(overlay);
    return card;
}

function displayList(items, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";
    items.forEach(item => {
        if (!item.poster_path) return;
        container.appendChild(createMovieCard(item, containerId));
    });
}

// --- 5. INITIALIZATION (SPEED FIX / LAZY LOAD) ---
async function init() {
    console.log("CINElzFlix Starting..."); 
    try {
        // 1. Load agad ang Page 1 Movies para mabilis
        const movies = await fetchMovies("movie", 1);
        if (movies && movies.length > 0) {
            displayBanner(movies[0]);
            displayList(movies, "movies-list");
        }

        // 2. Load TV Shows at Anime sa background (Lazy Load)
        const tvData = await fetch(`${BASE_URL}?endpoint=/trending/tv/week`);
        const tvItems = await tvData.json();
        displayList(tvItems.results, "tvshows-list");

        // Simple Anime Load
        const animeData = await fetch(`${BASE_URL}?endpoint=/discover/tv&with_genres=16`);
        const animeItems = await animeData.json();
        displayList(animeItems.results, "anime-list");

    } catch (err) {
        console.error("Init Error:", err);
    }
}

// Iba pang functions (Banner, Modal, Search) mananatili sa baba...
function displayBanner(item) {
    const banner = document.getElementById("banner");
    banner.style.backgroundImage = `linear-gradient(to right, rgba(2,11,26,1), rgba(2,11,26,0)), url(${IMG_URL}${item.backdrop_path})`;
    document.getElementById("banner-title").textContent = item.title || item.name;
    document.getElementById("banner-desc").textContent = item.overview ? item.overview.substring(0, 150) + "..." : "";
}

function showDetails(item) {
    currentItem = item;
    document.getElementById("modal-title").textContent = item.title || item.name;
    document.getElementById("modal-description").textContent = item.overview;
    document.getElementById("modal-image").src = `${IMG_URL}${item.poster_path}`;
    changeServer();
    document.getElementById("modal").style.display = "flex";
}

function changeServer() {
    if (!currentItem) return;
    const server = document.getElementById("server").value;
    const type = currentItem.title ? "movie" : "tv";
    let url = `https://vidsrc.cc/v2/embed/${type}/${currentItem.id}`;
    if (server === "vidsrc2") url = `https://vidsrc.net/embed/${type}/?tmdb=${currentItem.id}`;
    if (server === "videasy") url = `https://player.videasy.net/${type}/${currentItem.id}`;
    document.getElementById("modal-video").src = url;
}

function closeModal() {
    document.getElementById("modal").style.display = "none";
    document.getElementById("modal-video").src = "";
}

async function playTrailer(id, type) {
    const res = await fetch(`${BASE_URL}?endpoint=/${type}/${id}/videos`);
    const data = await res.json();
    const trailer = data.results.find(v => v.type === "Trailer" && v.site === "YouTube");
    if (trailer) {
        document.getElementById("modal-video").src = `https://www.youtube.com/embed/${trailer.key}?autoplay=1`;
        document.getElementById("modal").style.display = "flex";
    }
}

async function handleSearch(q) {
    if (!q.trim()) {
        document.getElementById("search-results-section").style.display = "none";
        document.getElementById("trending-section").style.display = "block";
        return;
    }
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
        const res = await fetch(`${BASE_URL}?endpoint=/search/multi&query=${encodeURIComponent(q)}`);
        const data = await res.json();
        document.getElementById("search-results-section").style.display = "block";
        document.getElementById("trending-section").style.display = "none";
        displayList(data.results, "search-results-list");
    }, 500);
}

init();
