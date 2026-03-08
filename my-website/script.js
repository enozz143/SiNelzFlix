const BASE_URL = "/functions/api"; 
const IMG_URL = "https://image.tmdb.org/t/p/original";
let currentItem;
let debounceTimer;

// --- 1. FETCH TRENDING ---
async function fetchTrending(type) {
    // Imbes na TMDB URL, ang function na ang tatawagin natin
    const res = await fetch(`${BASE_URL}?endpoint=/trending/${type}/week`);
    const data = await res.json();
    return data.results;
}

// --- 2. FETCH ANIME ---
async function fetchTrendingAnime() {
    let allResults = [];
    for (let page = 1; page <= 2; page++) {
        // Pinalitan din dito ang URL structure
        const res = await fetch(`${BASE_URL}?endpoint=/trending/tv/week&page=${page}`);
        const data = await res.json();
        const filtered = data.results.filter(item => item.genre_ids.includes(16));
        allResults = allResults.concat(filtered);
    }
    return allResults;
}

function displayBanner(item) {
    document.getElementById("banner").style.backgroundImage = `linear-gradient(to right, rgba(2,11,26,1), rgba(2,11,26,0)), url(${IMG_URL}${item.backdrop_path})`;
    document.getElementById("banner-title").textContent = item.title || item.name;
    document.getElementById("banner-desc").textContent = item.overview.substring(0, 200) + "...";
}

function displayList(items, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";
    
    items.forEach(item => {
        if (!item.poster_path) return;

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
        container.appendChild(card);
    });
}

function showDetails(item) {
    currentItem = item;
    document.getElementById("modal-title").textContent = item.title || item.name;
    document.getElementById("modal-description").textContent = item.overview;
    document.getElementById("modal-image").src = `${IMG_URL}${item.poster_path}`;
    document.getElementById("modal-rating").innerHTML = "⭐".repeat(Math.round(item.vote_average / 2));
    changeServer();
    document.getElementById("modal").style.display = "flex";
}

// --- 3. PLAY TRAILER ---
async function playTrailer(id, type) {
    try {
        // Binago ang fetch dito para dumaan sa proxy function
        const res = await fetch(`${BASE_URL}?endpoint=/${type}/${id}/videos`);
        const data = await res.json();
        
        const trailer = data.results.find(vid => vid.type === "Trailer" && vid.site === "YouTube");
        
        if (trailer) {
            document.getElementById("modal-video").src = `https://www.youtube.com/embed/${trailer.key}?autoplay=1`;
            document.getElementById("modal").style.display = "flex";
            document.getElementById("modal-title").textContent = "Watching Trailer";
        } else {
            alert("Pasensya na bro, walang available na trailer para dito.");
        }
    } catch (error) {
        console.error("Error fetching trailer:", error);
    }
}

function changeServer() {
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

// --- 4. HANDLE SEARCH ---
async function handleSearch(query) {
    const searchSection = document.getElementById("search-results-section");
    const trendingSection = document.getElementById("trending-section");
    const resultsContainer = document.getElementById("search-results-list");
    const searchTitle = document.getElementById("search-title");

    if (!query.trim()) {
        searchSection.style.display = "none";
        trendingSection.style.display = "block";
        resultsContainer.innerHTML = ""; 
        return;
    }

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
        try {
            // Updated search URL
            const res = await fetch(`${BASE_URL}?endpoint=/search/multi&query=${encodeURIComponent(query)}`);
            const data = await res.json();
            
            if (data.results && data.results.length > 0) {
                searchSection.style.display = "block";
                trendingSection.style.display = "none";
                searchTitle.textContent = `Results for: "${query}"`;
                displayList(data.results, "search-results-list");
            } else {
                searchTitle.textContent = `No results found for "${query}"`;
                resultsContainer.innerHTML = ""; 
            }
        } catch (error) {
            console.error("Search Error:", error);
        }
    }, 300);
}

// Navbar scroll effect
window.onscroll = () => {
    const nav = document.getElementById("navbar");
    if (window.scrollY > 50) nav.style.background = "rgba(2, 11, 26, 0.95)";
    else nav.style.background = "transparent";
};

async function init() {
    const movies = await fetchTrending("movie");
    const tvshows = await fetchTrending("tv");
    const anime = await fetchTrendingAnime();
    displayBanner(movies[0]);
    displayList(movies, "movies-list");
    displayList(tvshows, "tvshows-list");
    displayList(anime, "anime-list");
}

init();
