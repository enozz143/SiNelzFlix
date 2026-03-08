const BASE_URL = "/api"; 
const IMG_URL = "https://image.tmdb.org/t/p/original";
let currentItem;
let debounceTimer;
let currentPage = 1; 

// --- 1. FETCH TRENDING ---
async function fetchTrending(type, page = 1) {
    try {
        const res = await fetch(`${BASE_URL}?endpoint=/trending/${type}/week&page=${page}`);
        const data = await res.json();
        return data.results;
    } catch (error) {
        console.error("Error fetching trending:", error);
        return [];
    }
}

// --- 2. FETCH ANIME ---
async function fetchTrendingAnime() {
    let allResults = [];
    try {
        for (let page = 1; page <= 2; page++) {
            const res = await fetch(`${BASE_URL}?endpoint=/trending/tv/week&page=${page}`);
            const data = await res.json();
            const filtered = data.results.filter(item => item.genre_ids && item.genre_ids.includes(16));
            allResults = allResults.concat(filtered);
        }
    } catch (error) {
        console.error("Error fetching anime:", error);
    }
    return allResults;
}

// --- 3. LOAD MORE LOGIC ---
async function loadMore() {
    currentPage++; 
    const loadBtn = document.getElementById("load-more-btn");
    loadBtn.textContent = "Loading...";
    loadBtn.disabled = true;

    const moreMovies = await fetchTrending("movie", currentPage);
    
    if (moreMovies && moreMovies.length > 0) {
        const container = document.getElementById("movies-list");
        moreMovies.forEach(item => {
            if (!item.poster_path) return;
            const card = createMovieCard(item, "movies-list");
            container.appendChild(card);
        });
        loadBtn.textContent = "Load More Movies";
        loadBtn.disabled = false;
    } else {
        loadBtn.style.display = "none"; 
    }
}

// --- 4. CARD CREATION ---
function createMovieCard(item, containerId) {
    const card = document.createElement("div");
    card.className = "movie-card";

    const img = document.createElement("img");
    img.src = `${IMG_URL}${item.poster_path}`;
    img.onclick = () => showDetails(item); 

    const overlay = document.createElement("div");
    overlay.className = "trailer-overlay";
    
    const trailerBtn = document.createElement("button");
    trailerBtn.innerHTML = "▶ Play Trailer";
    trailerBtn.onclick = (e) => {
        e.stopPropagation(); 
        playTrailer(item.id, item.media_type || (containerId === "movies-list" ? "movie" : "tv"));
    };

    overlay.appendChild(trailerBtn);
    card.appendChild(img);
    card.appendChild(overlay);
    return card;
}

// --- 5. DISPLAY LIST (TAMA NA TO BRO) ---
function displayList(items, containerId) {
    const container = document.getElementById(containerId);
    if (!container || !items) return;
    container.innerHTML = ""; // Clear muna bago mag-load ng bago
    items.forEach(item => {
        if (!item.poster_path) return;
        const card = createMovieCard(item, containerId);
        container.appendChild(card);
    });
}

// --- 6. HANDLE SEARCH ---
async function handleSearch(query) {
    const searchSection = document.getElementById("search-results-section");
    const trendingSection = document.getElementById("trending-section");
    const resultsContainer = document.getElementById("search-results-list");
    const searchTitle = document.getElementById("search-title");
    const loadMoreContainer = document.querySelector(".load-more-container");

    if (!query.trim()) {
        if (searchSection) searchSection.style.display = "none";
        if (trendingSection) trendingSection.style.display = "block";
        if (loadMoreContainer) loadMoreContainer.style.display = "block";
        return;
    }

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
        try {
            const res = await fetch(`${BASE_URL}?endpoint=/search/multi&query=${encodeURIComponent(query)}`);
            const data = await res.json();
            
            if (data.results && data.results.length > 0) {
                if (searchSection) searchSection.style.display = "block";
                if (trendingSection) trendingSection.style.display = "none";
                if (loadMoreContainer) loadMoreContainer.style.display = "none";
                if (searchTitle) searchTitle.textContent = `Results for: "${query}"`;
                displayList(data.results, "search-results-list");
            }
        } catch (error) {
            console.error("Search Error:", error);
        }
    }, 400);
}

// --- 7. MODAL LOGIC ---
function showDetails(item) {
    currentItem = item;
    document.getElementById("modal-title").textContent = item.title || item.name;
    document.getElementById("modal-description").textContent = item.overview || "No description available.";
    document.getElementById("modal-image").src = `${IMG_URL}${item.poster_path}`;
    document.getElementById("modal-rating").innerHTML = "⭐".repeat(Math.round((item.vote_average || 0) / 2));
    changeServer();
    document.getElementById("modal").style.display = "flex";
}

async function playTrailer(id, type) {
    try {
        const res = await fetch(`${BASE_URL}?endpoint=/${type}/${id}/videos`);
        const data = await res.json();
        const trailer = data.results.find(vid => vid.type === "Trailer" && vid.site === "YouTube");
        
        if (trailer) {
            document.getElementById("modal-video").src = `https://www.youtube.com/embed/${trailer.key}?autoplay=1`;
            document.getElementById("modal-title").textContent = "Watching Trailer";
            document.getElementById("modal").style.display = "flex";
        } else {
            alert("No trailer available, bro.");
        }
    } catch (error) {
        console.error("Trailer error:", error);
    }
}

function changeServer() {
    if (!currentItem) return;
    const server = document.getElementById("server").value;
    const type = currentItem.media_type || (currentItem.title ? "movie" : "tv");
    let embedURL = "";
    if (server === "vidsrc") embedURL = `https://vidsrc.cc/v2/embed/${type}/${currentItem.id}`;
    if (server === "vidsrc2") embedURL = `https://vidsrc.net/embed/${type}/?tmdb=${currentItem.id}`;
    if (server === "videasy") embedURL = `https://player.videasy.net/${type}/${currentItem.id}`;
    document.getElementById("modal-video").src = embedURL;
}

function closeModal() {
    document.getElementById("modal").style.display = "none";
    document.getElementById("modal-video").src = "";
}

// --- 8. INITIALIZATION (BALIK SA DATI NA MAY MOVIES AGAD) ---
async function init() {
    console.log("Sinelzflix is starting..."); 
    try {
        const movies = await fetchTrending("movie", 1);
        const tvshows = await fetchTrending("tv", 1);
        const anime = await fetchTrendingAnime();

        // Banner and Lists
        if (movies && movies.length > 0) {
            document.getElementById("banner-title").textContent = movies[0].title || movies[0].name; // Fix loading text
            displayBanner(movies[0]);
            displayList(movies, "movies-list");
        }
        
        if (tvshows) displayList(tvshows, "tvshows-list");
        if (anime) displayList(anime, "anime-list");

        console.log("All initial lists displayed!");
    } catch (err) {
        console.error("Init failed:", err);
    }
}

// Helper for banner
function displayBanner(item) {
    if (!item) return;
    const banner = document.getElementById("banner");
    const title = document.getElementById("banner-title");
    const desc = document.getElementById("banner-desc");
    banner.style.backgroundImage = `linear-gradient(to right, rgba(2,11,26,1), rgba(2,11,26,0)), url(${IMG_URL}${item.backdrop_path})`;
    title.textContent = item.title || item.name;
    desc.textContent = item.overview ? item.overview.substring(0, 200) + "..." : "";
}

init();
