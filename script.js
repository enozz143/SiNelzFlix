const BASE_URL = "/api"; 
const IMG_URL = "https://image.tmdb.org/t/p/original";
let currentItem;
let debounceTimer;
let currentPage = 1; 
let currentGenre = 'all'; 
let sliderIndex = 0;
let sliderItems = [];

// --- 1. FETCH MOVIES ---
async function fetchMovies(type, page = 1, genreId = 'all') {
    try {
        let url;
        if (genreId === 'all') {
            url = `${BASE_URL}?endpoint=/trending/${type}/week&page=${page}`;
        } else {
            url = `${BASE_URL}?endpoint=/discover/${type}&page=${page}&with_genres=${genreId}&sort_by=popularity.desc`;
        }
        const res = await fetch(url);
        const data = await res.json();
        return data.results || [];
    } catch (error) {
        console.error("Fetch error, bro:", error);
        return [];
    }
}

// --- 2. HERO SLIDER LOGIC (WITH RED BUTTONS & DOTS) ---
async function setupHeroSlider(movies) {
    sliderItems = movies.slice(0, 6);
    const sliderContainer = document.getElementById("hero-slider");
    const dotsContainer = document.getElementById("slider-dots");
    sliderContainer.innerHTML = "";
    dotsContainer.innerHTML = "";

    for (let index = 0; index < sliderItems.length; index++) {
        const movie = sliderItems[index];
        const slide = document.createElement("div");
        slide.className = `hero-slide ${index === 0 ? 'active' : ''}`;
        slide.style.backgroundImage = `url(${IMG_URL}${movie.backdrop_path})`;
        
        let trailerKey = "";
        try {
            const videoRes = await fetch(`${BASE_URL}?endpoint=/movie/${movie.id}/videos`);
            const videoData = await videoRes.json();
            const trailer = videoData.results.find(v => v.type === "Trailer" && v.site === "YouTube");
            if (trailer) trailerKey = trailer.key;
        } catch (err) { console.error("Slider video error:", err); }

        slide.innerHTML = `
            <div class="hero-video-container">
                ${trailerKey ? `<iframe src="https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailerKey}&rel=0&showinfo=0" frameborder="0"></iframe>` : ''}
            </div>
            <div class="hero-overlay"></div>
            <div class="hero-content">
                <div class="hero-meta">
                    <span>⭐ ${movie.vote_average.toFixed(1)}</span>
                    <span>•</span>
                    <span>${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</span>
                    <span style="border: 1px solid var(--primary-blue); padding: 2px 5px; border-radius: 3px; font-size: 0.7rem;">CINEMATIC PREVIEW</span>
                </div>
                <h1>${movie.title}</h1>
                <p>${movie.overview.substring(0, 180)}...</p>
                <div class="hero-btns">
                    <button class="btn-watch" onclick='showDetails(${JSON.stringify(movie).replace(/'/g, "&apos;")})'>▶ Watch Now</button>
                    <button class="btn-list" style="background:rgba(255,255,255,0.1); color:white; border:1px solid white; padding:12px 30px; border-radius:5px; cursor:pointer;">+ My List</button>
                </div>
            </div>
        `;
        sliderContainer.appendChild(slide);

        const dot = document.createElement("div");
        dot.className = `dot ${index === 0 ? 'active' : ''}`;
        dot.onclick = () => goToSlide(index);
        dotsContainer.appendChild(dot);
    }
    if (window.sliderInterval) clearInterval(window.sliderInterval);
    window.sliderInterval = setInterval(nextSlide, 10000);
}

function nextSlide() {
    sliderIndex = (sliderIndex + 1) % sliderItems.length;
    updateSliderUI();
}

function goToSlide(index) {
    sliderIndex = index;
    updateSliderUI();
}

function updateSliderUI() {
    const slides = document.querySelectorAll(".hero-slide");
    const dots = document.querySelectorAll(".dot");
    slides.forEach((s, i) => s.classList.toggle("active", i === sliderIndex));
    dots.forEach((d, i) => d.classList.toggle("active", i === sliderIndex));
}

// --- 3. MOVIE CARD LOGIC (TRIPLE BUTTONS) ---
function createMovieCard(item, containerId) {
    const card = document.createElement("div");
    card.className = "movie-card";
    
    const img = document.createElement("img");
    img.src = `${IMG_URL}${item.poster_path}`;
    
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

function displayList(items, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";
    items.forEach(item => {
        if (item.poster_path) container.appendChild(createMovieCard(item, containerId));
    });
}

// --- 4. MODAL & SEARCH LOGIC ---
async function showDetails(item) {
    currentItem = item;
    const type = item.title ? "movie" : "tv";
    const titleSlug = (item.title || item.name).toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    const newUrl = window.location.origin + window.location.pathname + `?${type}=${item.id}-${titleSlug}`;
    window.history.pushState({ path: newUrl }, '', newUrl);

    document.getElementById("modal-title").textContent = item.title || item.name;
    document.getElementById("modal-description").textContent = item.overview || "No description available.";
    document.getElementById("modal-image").src = `${IMG_URL}${item.poster_path}`;
    const rating = item.vote_average ? `⭐ ${item.vote_average.toFixed(1)}` : "No Rating";
    const releaseDate = item.release_date || item.first_air_date || "Unknown";
    document.getElementById("modal-rating").innerHTML = `<span>${rating}</span> | <span>${releaseDate}</span>`;

    changeServer();
    document.getElementById("modal").style.display = "flex";

    try {
        const creditsRes = await fetch(`${BASE_URL}?endpoint=/${type}/${item.id}/credits`);
        const creditsData = await creditsRes.json();
        const castList = creditsData.cast.slice(0, 5).map(actor => actor.name).join(", ");
        document.getElementById("modal-cast").innerHTML = `<strong>Cast:</strong> ${castList || "N/A"}`;
    } catch (err) { console.error("Cast error:", err); }

    try {
        let res = await fetch(`${BASE_URL}?endpoint=/${type}/${item.id}/recommendations`);
        let data = await res.json();
        if (!data.results || data.results.length === 0) {
            res = await fetch(`${BASE_URL}?endpoint=/${type}/${item.id}/similar`);
            data = await res.json();
        }
        displaySimilar(data.results.slice(0, 6)); 
    } catch (err) { console.error("Suggestions error:", err); }
}

function closeModal() {
    document.getElementById("modal").style.display = "none";
    document.getElementById("modal-video").src = "";
    const originalUrl = window.location.origin + window.location.pathname;
    window.history.pushState({ path: originalUrl }, '', originalUrl);
}

function displaySimilar(items) {
    let similarContainer = document.getElementById("similar-movies");
    if (!similarContainer) {
        const details = document.querySelector(".modal-details");
        const title = document.createElement("h3");
        title.textContent = "You Might Also Like";
        title.style.margin = "20px 0 10px 0";
        title.style.color = "#fff";
        similarContainer = document.createElement("div");
        similarContainer.id = "similar-movies";
        similarContainer.className = "movie-row";
        details.appendChild(title);
        details.appendChild(similarContainer);
    }
    similarContainer.innerHTML = "";
    items.forEach(item => {
        if (item.poster_path) similarContainer.appendChild(createMovieCard(item, "similar-movies"));
    });
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

async function filterGenre(genreId) {
    currentGenre = genreId;
    currentPage = 1; 
    document.querySelectorAll('.genre-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');
    const filteredMovies = await fetchMovies("movie", 1, genreId);
    displayList(filteredMovies, "movies-list");
}

async function loadMore() {
    currentPage++; 
    const loadBtn = document.getElementById("load-more-btn");
    loadBtn.textContent = "Loading...";
    loadBtn.disabled = true;
    const moreMovies = await fetchMovies("movie", currentPage, currentGenre);
    if (moreMovies && moreMovies.length > 0) {
        const container = document.getElementById("movies-list");
        moreMovies.forEach(item => {
            if (item.poster_path) container.appendChild(createMovieCard(item, "movies-list"));
        });
        loadBtn.textContent = "Load More Movies";
        loadBtn.disabled = false;
    } else {
        loadBtn.style.display = "none"; 
    }
}

document.addEventListener('keydown', function(event) {
    if (event.key === "Escape") {
        const modal = document.getElementById("modal");
        if (modal && modal.style.display === "flex") closeModal();
    }
});

// --- 5. INITIALIZATION ---
async function init() {
    console.log("CINElzFlix Engine Online!"); 
    try {
        const movies = await fetchMovies("movie", 1);
        if (movies && movies.length > 0) {
            setupHeroSlider(movies);
            displayList(movies, "movies-list");
        }
        
        // TV SHOWS
        const tvData = await fetch(`${BASE_URL}?endpoint=/trending/tv/week`);
        const tvJson = await tvData.json();
        displayList(tvJson.results, "tvshows-list");

        // ANIME
        const animeData = await fetch(`${BASE_URL}?endpoint=/discover/tv&with_genres=16`);
        const animeJson = await animeData.json();
        displayList(animeJson.results, "anime-list");

        // DEEP LINKING
        const params = new URLSearchParams(window.location.search);
        const movieId = params.get('movie');
        const tvId = params.get('tv');

        if (movieId || tvId) {
            const id = (movieId || tvId).split('-')[0];
            const type = movieId ? 'movie' : 'tv';
            const res = await fetch(`${BASE_URL}?endpoint=/${type}/${id}`);
            const data = await res.json();
            if (data) showDetails(data);
        }
    } catch (err) { console.error("Init Error:", err); }
}

init();
