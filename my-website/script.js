const BASE_URL = "/api"; 
const IMG_URL = "https://image.tmdb.org/t/p/original";
let currentItem;
let debounceTimer;

// --- 1. FETCH TRENDING ---
async function fetchTrending(type) {
    try {
        const res = await fetch(`${BASE_URL}?endpoint=/trending/${type}/week`);
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
            // Genre 16 is Animation
            const filtered = data.results.filter(item => item.genre_ids && item.genre_ids.includes(16));
            allResults = allResults.concat(filtered);
        }
    } catch (error) {
        console.error("Error fetching anime:", error);
    }
    return allResults;
}

// --- 3. DISPLAY FUNCTIONS ---
function displayBanner(item) {
    if (!item) return;
    const banner = document.getElementById("banner");
    const title = document.getElementById("banner-title");
    const desc = document.getElementById("banner-desc");
    
    banner.style.backgroundImage = `linear-gradient(to right, rgba(2,11,26,1), rgba(2,11,26,0)), url(${IMG_URL}${item.backdrop_path})`;
    title.textContent = item.title || item.name;
    desc.textContent = item.overview ? item.overview.substring(0, 200) + "..." : "";
}

function displayList(items, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
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

// --- 4. MODAL LOGIC ---
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

// --- 5. INITIALIZATION ---
async function init() {
    console.log("Sinelzflix is starting..."); // Lalabas to sa F12 Console
    try {
        const movies = await fetchTrending("movie");
        console.log("Movies fetched:", movies ? movies.length : 0);

        const tvshows = await fetchTrending("tv");
        console.log("TV Shows fetched:", tvshows ? tvshows.length : 0);

        const anime = await fetchTrendingAnime();
        console.log("Anime fetched:", anime ? anime.length : 0);

        if (movies && movies.length > 0) {
            displayBanner(movies[0]);
            displayList(movies, "movies-list");
        }
        
        if (tvshows) displayList(tvshows, "tvshows-list");
        if (anime) displayList(anime, "anime-list");

        console.log("All lists displayed!");
    } catch (err) {
        console.error("ALARM! May error sa init:", err);
    }
}

init();

