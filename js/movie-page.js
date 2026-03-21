// js/movie-page.js - Version base sa Slider.js logic
const params = new URLSearchParams(window.location.search);
const movieId = params.get('id');
const mediaType = params.get('type') || 'movie';

const BASE_URL = 'https://cinelzflix-worker.baquial-enozz.workers.dev/'; 

async function loadMovieDetails() {
    if (!movieId) { 
        window.location.href = '/'; 
        return; 
    }

    try {
        console.log(`🚀 Loading details for ${mediaType} ID: ${movieId}...`);
        
        // Gamitin natin ang append_to_response pero mag-fallback sa direct fetch kung kailangan
        const response = await fetch(`${BASE_URL}?endpoint=/${mediaType}/${movieId}&append_to_response=videos,credits,similar`);
        const data = await response.json();

        if (!data || data.success === false) throw new Error("Content not found");

        updateHeroSection(data);
        updateDetailsSection(data);
        setPlayer('vidsrc');

    } catch (error) {
        console.error("Error loading movie page:", error);
    }
}

async function updateHeroSection(data) {
    const titleEl = document.getElementById('movie-title');
    const descHero = document.getElementById('movie-description-hero');
    const trailerContainer = document.getElementById('trailer-container');
    const heroSection = document.getElementById('movie-hero');
    const metaHero = document.getElementById('movie-meta-hero');

    if (titleEl) titleEl.innerText = data.title || data.name;
    if (descHero) descHero.innerText = data.overview ? data.overview.substring(0, 180) + "..." : "";

    // BACKDROP (Safety Net para hindi black screen)
    if (heroSection && data.backdrop_path) {
        heroSection.style.backgroundImage = `linear-gradient(to top, #0a0a0a 15%, transparent), url(https://image.tmdb.org/t/p/original${data.backdrop_path})`;
        heroSection.style.backgroundSize = 'cover';
        heroSection.style.backgroundPosition = 'center';
    }

    const year = (data.release_date || data.first_air_date || "N/A").split('-')[0];
    const rating = data.vote_average ? data.vote_average.toFixed(1) : "N/A";
    if (metaHero) metaHero.innerHTML = `<span>📅 ${year}</span> | <span style="color: #00d4ff;">⭐ ${rating}</span> | <span>🎬 ${mediaType.toUpperCase()}</span>`;

    // --- TRAILER LOGIC (Kinuha sa slider.js mo) ---
    if (trailerContainer) {
        let trailerKey = "";
        
        // Hanapin ang trailer sa data.videos (append_to_response)
        if (data.videos && data.videos.results) {
            const trailer = data.videos.results.find(v => v.type === "Trailer" && v.site === "YouTube") || 
                            data.videos.results.find(v => v.site === "YouTube");
            if (trailer) trailerKey = trailer.key;
        }

        if (trailerKey) {
            console.log("🎬 Trailer found! Injecting iframe...");
            // Gamit ang eksaktong params ng slider.js mo:
            trailerContainer.innerHTML = `
                <iframe 
                    src="https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailerKey}&rel=0&showinfo=0&modestbranding=1&iv_load_policy=3" 
                    frameborder="0" 
                    allow="autoplay; encrypted-media" 
                    style="width:100%; height:100%; position:absolute; top:0; left:0; border:none; z-index:0;">
                </iframe>
            `;
            
            // Para mawala yung black background once mag-load ang iframe
            setTimeout(() => {
                if (heroSection) heroSection.style.background = "none";
                if (heroSection) heroSection.style.backgroundColor = "#000";
            }, 3000);
        } else {
            console.log("❌ No trailer available for this movie.");
        }
    }
}

// Binalik ko ang normal details logic mo
function updateDetailsSection(data) {
    const posterImg = document.getElementById('movie-poster');
    const overviewFull = document.getElementById('movie-overview');
    const castEl = document.getElementById('movie-cast');

    if (posterImg) {
        posterImg.src = data.poster_path 
            ? `https://image.tmdb.org/t/p/w500${data.poster_path}` 
            : 'https://via.placeholder.com/500x750?text=No+Poster';
    }
    if (overviewFull) overviewFull.innerText = data.overview || "No description available.";

    if (castEl && data.credits && data.credits.cast) {
        castEl.innerHTML = data.credits.cast.slice(0, 6).map(person => `
            <div class="cast-item">
                <img src="${person.profile_path ? 'https://image.tmdb.org/t/p/w185' + person.profile_path : 'https://via.placeholder.com/100x100?text=No+Photo'}" alt="${person.name}">
                <p><strong>${person.name}</strong></p>
                <p style="font-size: 0.65rem; color: #777;">${person.character}</p>
            </div>
        `).join('');
    }
}

function setPlayer(server) {
    const iframe = document.getElementById('movie-iframe');
    if (!iframe) return;

    let src = "";
    if (server === 'vidsrc') {
        src = mediaType === 'movie' 
            ? `https://vidsrc.me/embed/movie?tmdb=${movieId}` 
            : `https://vidsrc.me/embed/tv?tmdb=${movieId}&sea=1&epi=1`;
    } else if (server === 'vidsrc2') {
        src = `https://vidsrc.to/embed/${mediaType}/${movieId}`;
    } else {
        src = `https://player.videasy.net/${mediaType}/${movieId}`;
    }
    
    iframe.src = src;
}

// --- BUTTONS ---
document.getElementById('scroll-to-player')?.addEventListener('click', () => {
    document.getElementById('player-section')?.scrollIntoView({ behavior: 'smooth' });
});

// Server change listener
document.getElementById('server-select')?.addEventListener('change', (e) => setPlayer(e.target.value));

loadMovieDetails();
