// js/modal.js
import { BASE_URL, IMG_URL } from './api.js';

let currentItem = null; // Dito i-store yung movie na kasalukuyang pinapanood

/**
 * --- MODAL & PLAYER LOGIC ---
 */
export async function showDetails(item) {
    // 1. CLEAR OLD DATA (The Fix!)
    document.getElementById("modal-video").src = ""; 
    document.getElementById("modal-title").textContent = "Loading...";
    document.getElementById("modal-description").textContent = "";
    document.getElementById("modal-image").src = ""; 
    document.getElementById("modal-cast").innerHTML = "";
    
    // I-clear ang related movies container
    let similarContainer = document.getElementById("similar-movies");
    if (similarContainer) similarContainer.innerHTML = "<p style='color:gray; padding:20px;'>Finding related titles...</p>";

    // 2. SET CURRENT ITEM DATA
    currentItem = item; 
    const type = item.title ? "movie" : "tv";
    const titleSlug = (item.title || item.name).toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    const newUrl = window.location.origin + window.location.pathname + `?${type}=${item.id}-${titleSlug}`;
    window.history.pushState({ path: newUrl }, '', newUrl);

    // 3. FILL NEW INFO
    document.getElementById("modal-title").textContent = item.title || item.name;
    document.getElementById("modal-description").textContent = item.overview || "No description available.";
    document.getElementById("modal-image").src = `${IMG_URL}${item.poster_path}`;
    
    const rating = item.vote_average ? `⭐ ${item.vote_average.toFixed(1)}` : "No Rating";
    const releaseDate = item.release_date || item.first_air_date || "Unknown";
    document.getElementById("modal-rating").innerHTML = `<span>${rating}</span> | <span>${releaseDate}</span>`;

    // 4. OPEN MODAL & START PLAYER
    changeServer();
    document.getElementById("modal").style.display = "flex";

    // 5. LOAD CAST (Background)
    try {
        const creditsRes = await fetch(`${BASE_URL}?endpoint=/${type}/${item.id}/credits`);
        const creditsData = await creditsRes.json();
        const castList = creditsData.cast.slice(0, 5).map(actor => actor.name).join(", ");
        document.getElementById("modal-cast").innerHTML = `<strong>Cast:</strong> ${castList || "N/A"}`;
    } catch (err) { console.error("Cast error:", err); }

    // 6. LOAD RELATED MOVIES
    try {
        let res = await fetch(`${BASE_URL}?endpoint=/${type}/${item.id}/recommendations`);
        let data = await res.json();
        if (!data.results || data.results.length === 0) {
            res = await fetch(`${BASE_URL}?endpoint=/${type}/${item.id}/similar`);
            data = await res.json();
        }
        // Take note, bro: Kailangan nating i-import ang createMovieCard sa final script para gumana ang displaySimilar
        if (window.displaySimilar) window.displaySimilar(data.results.slice(0, 6)); 
    } catch (err) { 
        console.error("Suggestions error:", err); 
    }
}

export function closeModal() {
    document.getElementById("modal").style.display = "none";
    document.getElementById("modal-video").src = "";
    const originalUrl = window.location.origin + window.location.pathname;
    window.history.pushState({ path: originalUrl }, '', originalUrl);
}

export function changeServer() {
    if (!currentItem) return;
    const server = document.getElementById("server").value;
    const type = currentItem.title ? "movie" : "tv";
    let url = `https://vidsrc.cc/v2/embed/${type}/${currentItem.id}`;
    if (server === "vidsrc2") url = `https://vidsrc.net/embed/${type}/?tmdb=${currentItem.id}`;
    if (server === "videasy") url = `https://player.videasy.net/${type}/${currentItem.id}`;
    document.getElementById("modal-video").src = url;
}

export async function playTrailer(id, type) {
    const res = await fetch(`${BASE_URL}?endpoint=/${type}/${id}/videos`);
    const data = await res.json();
    const trailer = data.results.find(v => v.type === "Trailer" && v.site === "YouTube");
    if (trailer) {
        document.getElementById("modal-video").src = `https://www.youtube.com/embed/${trailer.key}?autoplay=1`;
        document.getElementById("modal").style.display = "flex";
    }
}
