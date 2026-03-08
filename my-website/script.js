const API_KEY = "7bdb3c0098a5464a8673d725ffe70da5";
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_URL = "https://image.tmdb.org/t/p/original";
let currentItem;
let debounceTimer;

async function fetchTrending(type) {
    const res = await fetch(`${BASE_URL}/trending/${type}/week?api_key=${API_KEY}`);
    const data = await res.json();
    return data.results;
}

async function fetchTrendingAnime() {
    let allResults = [];
    for (let page = 1; page <= 2; page++) {
        const res = await fetch(`${BASE_URL}/trending/tv/week?api_key=${API_KEY}&page=${page}`);
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

        // Image - Pag ni-click ang mismong poster, MOVIE ang mag-play
        const img = document.createElement("img");
        img.src = `${IMG_URL}${item.poster_path}`;
        img.onclick = () => showDetails(item); 

        // Overlay - Lalabas lang pag na-hover
        const overlay = document.createElement("div");
        overlay.className = "trailer-overlay";
        
        // Button sa loob ng overlay para sa TRAILER lang
        const trailerBtn = document.createElement("button");
        trailerBtn.innerHTML = "▶ Play Trailer";
        trailerBtn.onclick = (e) => {
            e.stopPropagation(); // Para hindi mag-trigger yung movie click
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

async function playTrailer(id, type) {
    try {
        const res = await fetch(`${BASE_URL}/${type}/${id}/videos?api_key=${API_KEY}`);
        const data = await res.json();
        
        // Hanapin ang Official Trailer sa YouTube
        const trailer = data.results.find(vid => vid.type === "Trailer" && vid.site === "YouTube");
        
        if (trailer) {
            // Gamitin ang modal mo para i-play ang YouTube trailer
            document.getElementById("modal-video").src = `https://www.youtube.com/embed/${trailer.key}?autoplay=1`;
            document.getElementById("modal").style.display = "flex";
            
            // I-set ang title para alam ng user na trailer ito
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

async function handleSearch(query) {
    const searchSection = document.getElementById("search-results-section");
    const trendingSection = document.getElementById("trending-section"); // I-wrap mo lahat ng trending lists mo sa isang div na may ganitong ID
    const resultsContainer = document.getElementById("search-results-list");
    const searchTitle = document.getElementById("search-title");

    if (!query.trim()) {
        searchSection.style.display = "none";
        trendingSection.style.display = "block";
        return;
    }

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
        const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${query}`);
        const data = await res.json();
        
        if (data.results.length > 0) {
            searchSection.style.display = "block";
            trendingSection.style.display = "none"; // Itatago muna ang trending para focus sa search
            searchTitle.textContent = `Results for: "${query}"`;
            displayList(data.results, "search-results-list");
        }
    }, 300);
}

function displaySuggestions(results) {
    const box = document.getElementById("suggestions-box");
    box.innerHTML = "";
    results.forEach(item => {
        if (!item.poster_path) return;
        const div = document.createElement("div");
        div.className = "suggestion-item";
        div.onclick = () => { showDetails(item); box.innerHTML = ""; };
        div.innerHTML = `<img src="${IMG_URL}${item.poster_path}"><div><h4>${item.title || item.name}</h4></div>`;
        box.appendChild(div);
    });
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



