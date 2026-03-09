const BASE_URL = "/api"; 
const IMG_URL = "https://image.tmdb.org/t/p/original";
let currentItem;
let debounceTimer;
let currentPage = 1; 
let currentGenre = 'all'; 

// --- 1. FETCH MOVIES (PINALAKAS NA LOGIC) ---
async function fetchMovies(type, page = 1, genreId = 'all') {
    try {
        let url;
        // Kapag 'all', Trending ang default display
        if (genreId === 'all') {
            url = `${BASE_URL}?endpoint=/trending/${type}/week&page=${page}`;
        } else {
            // Kapag may Genre, Discover ang gagamitin natin (Popularity Sort)
            url = `${BASE_URL}?endpoint=/discover/${type}&page=${page}&with_genres=${genreId}&sort_by=popularity.desc`;
        }

        console.log("Fetching from URL:", url); // Makikita natin to sa F12
        const res = await fetch(url);
        const data = await res.json();
        
        return data.results || [];
    } catch (error) {
        console.error("Fetch error, bro:", error);
        return [];
    }
}

// --- 2. GENRE FILTER (WITH REFRESH LOGIC) ---
async function filterGenre(genreId) {
    console.log("Genre Selected:", genreId);
    currentGenre = genreId;
    currentPage = 1; 

    // UI: Active button effect
    document.querySelectorAll('.genre-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) {
        event.target.classList.add('active');
    }

    const moviesList = document.getElementById("movies-list");
    moviesList.innerHTML = "<div style='color:white; text-align:center; width:100%; padding:50px;'>Searching for Cinema Gems...</div>";

    // Kunin ang bagong batch ng movies
    const filteredMovies = await fetchMovies("movie", 1, genreId);
    
    if (filteredMovies && filteredMovies.length > 0) {
        displayList(filteredMovies, "movies-list");
    } else {
        moviesList.innerHTML = "<p style='color:white; text-align:center; width:100%;'>No movies found for this genre, bro.</p>";
    }
    
    // Siguraduhin na labas ang Load More
    document.getElementById("load-more-btn").style.display = "inline-block";
}

// --- 3. LOAD MORE ---
async function loadMore() {
    currentPage++; 
    const loadBtn = document.getElementById("load-more-btn");
    loadBtn.textContent = "Loading...";
    loadBtn.disabled = true;

    const moreMovies = await fetchMovies("movie", currentPage, currentGenre);
    
    if (moreMovies && moreMovies.length > 0) {
        const container = document.getElementById("movies-list");
        moreMovies.forEach(item => {
            if (item.poster_path) {
                container.appendChild(createMovieCard(item, "movies-list"));
            }
        });
        loadBtn.textContent = "Load More Movies";
        loadBtn.disabled = false;
    } else {
        loadBtn.style.display = "none"; 
    }
}

// --- 4. DISPLAY HELPERS ---
function createMovieCard(item, containerId) {
    const card = document.createElement("div");
    card.className = "movie-card";
    const img = document.createElement("img");
    img.src = `${IMG_URL}${item.poster_path}`;
    img.onclick = () => showDetails(item); 
    
    const overlay = document.createElement("div");
    overlay.className = "trailer-overlay";
    const btn = document.createElement("button");
    btn.innerHTML = "▶ Play";
    btn.onclick = (e) => { 
        e.stopPropagation(); 
        playTrailer(item.id, item.title ? "movie" : "tv"); 
    };
    
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
        if (item.poster_path) {
            container.appendChild(createMovieCard(item, containerId));
        }
    });
}

// --- 5. INITIALIZATION ---
async function init() {
    console.log("CINElzFlix Engine Online!"); 
    try {
        const movies = await fetchMovies("movie", 1);
        if (movies && movies.length > 0) {
            displayBanner(movies[0]);
            displayList(movies, "movies-list");
        }

        // Lazy load others
        const tvData = await fetch(`${BASE_URL}?endpoint=/trending/tv/week`);
        const tvJson = await tvData.json();
        displayList(tvJson.results, "tvshows-list");

        const animeData = await fetch(`${BASE_URL}?endpoint=/discover/tv&with_genres=16`);
        const animeJson = await animeData.json();
        displayList(animeJson.results, "anime-list");

    } catch (err) {
        console.error("Init Error:", err);
    }
}

// --- BANNER, MODAL, SEARCH (Standard) ---
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
