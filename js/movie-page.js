/**
mangopya kag code noh hahhahaa
 */

const urlParams = new URLSearchParams(window.location.search);
const movieId = urlParams.get('id');
const mediaType = urlParams.get('type') || 'movie';

const BASE_URL = 'https://cinelzflix-worker.baquial-enozz.workers.dev/'; 
const TMDB_IMG = 'https://image.tmdb.org/t/p/original';
const TMDB_POSTER = 'https://image.tmdb.org/t/p/w500';

window.currentMovieData = null;
window.movieTitle = "";

async function initMoviePage() {
    console.log("🎬 Movie Page Engine Starting...");
    
    if (!movieId) {
        window.location.href = '../';
        return;
    }

    try {
        showLoadingState();
        
        
        const movieUrl = `${BASE_URL}?endpoint=/${mediaType}/${movieId}`;
        console.log("📡 Fetching movie:", movieUrl);
        const movieRes = await fetch(movieUrl);
        const movieData = await movieRes.json();
        
        if (!movieData || movieData.success === false) throw new Error("Invalid Movie Data");
        
        
        const creditsUrl = `${BASE_URL}?endpoint=/${mediaType}/${movieId}/credits`;
        console.log("📡 Fetching credits:", creditsUrl);
        const creditsRes = await fetch(creditsUrl);
        const creditsData = await creditsRes.json();
        
        
        const similarUrl = `${BASE_URL}?endpoint=/${mediaType}/${movieId}/similar`;
        console.log("📡 Fetching similar:", similarUrl);
        const similarRes = await fetch(similarUrl);
        const similarData = await similarRes.json();
        
       
        const videosUrl = `${BASE_URL}?endpoint=/${mediaType}/${movieId}/videos`;
        console.log("📡 Fetching videos:", videosUrl);
        const videosRes = await fetch(videosUrl);
        const videosData = await videosRes.json();
        
        
        const data = {
            ...movieData,
            credits: creditsData,
            similar: similarData,
            videos: videosData
        };
        
        console.log("✅ All data fetched!");
        console.log("📡 Cast count:", data.credits?.cast?.length || 0);
        console.log("📡 Similar count:", data.similar?.results?.length || 0);

        window.currentMovieData = data;
        window.movieTitle = data.title || data.name || "Unknown Title";
        
        document.title = `${window.movieTitle} - CINElzFlix Movies`;
        
        renderHero(data);
        renderDetails(data);
        renderCast(data);
        renderSimilar(data.similar);

       
        if (mediaType === 'tv') {
            await loadTVShowEpisodes();
        }

        
        updateVideoPlayer('embed2');
        
        console.log("✅ Movie Page Ready!");

    } catch (err) {
        console.error("🚨 Error:", err);
        document.title = "Error - CINElzFlix";
        showErrorMessage(`Failed to load: ${err.message}`);
    } finally {
        hideLoadingState();
    }
}


async function loadTVShowEpisodes() {
    try {
        
        const tvUrl = `${BASE_URL}?endpoint=/tv/${movieId}`;
        const tvRes = await fetch(tvUrl);
        const tvData = await tvRes.json();
        
        const seasons = tvData.seasons || [];
        const seasonSelect = document.getElementById('season-select');
        const episodeSelect = document.getElementById('episode-select');
        const seasonLabel = document.getElementById('season-label');
        const episodeLabel = document.getElementById('episode-label');
        
        if (seasonSelect && seasons.length > 0) {
            
            seasonSelect.style.display = 'inline-block';
            if (seasonLabel) seasonLabel.style.display = 'inline-block';
            seasonSelect.innerHTML = '';
            
            seasons.forEach(season => {
                if (season.season_number > 0) {
                    const option = document.createElement('option');
                    option.value = season.season_number;
                    option.textContent = `Season ${season.season_number}`;
                    seasonSelect.appendChild(option);
                }
            });
            
           
            if (seasonSelect.options.length > 0) {
                await loadEpisodes(parseInt(seasonSelect.value));
            }
            
            
            seasonSelect.onchange = async () => {
                await loadEpisodes(parseInt(seasonSelect.value));
                updateVideoPlayer(document.getElementById('server-select').value);
            };
        }
        
        
        if (episodeSelect) {
            episodeSelect.onchange = () => {
                updateVideoPlayer(document.getElementById('server-select').value);
            };
        }
        
    } catch (err) {
        console.error("Error loading TV show episodes:", err);
    }
}


async function loadEpisodes(seasonNumber) {
    try {
        const url = `${BASE_URL}?endpoint=/tv/${movieId}/season/${seasonNumber}`;
        const res = await fetch(url);
        const data = await res.json();
        
        const episodes = data.episodes || [];
        const episodeSelect = document.getElementById('episode-select');
        const episodeLabel = document.getElementById('episode-label');
        
        if (episodeSelect && episodes.length > 0) {
            episodeSelect.style.display = 'inline-block';
            if (episodeLabel) episodeLabel.style.display = 'inline-block';
            episodeSelect.innerHTML = '';
            
            episodes.forEach(episode => {
                const option = document.createElement('option');
                option.value = episode.episode_number;
                option.textContent = `Episode ${episode.episode_number}: ${episode.name || ''}`;
                episodeSelect.appendChild(option);
            });
        }
        
        console.log(`✅ Loaded ${episodes.length} episodes for season ${seasonNumber}`);
        
    } catch (err) {
        console.error("Error loading episodes:", err);
    }
}


async function playTrailer() {
    if (!window.currentMovieData) {
        showNotification("Movie data not ready yet.");
        return;
    }
    
    console.log("🎬 Opening trailer for:", window.movieTitle);
    
    try {
        showModalLoading();
        
        const videoUrl = `${BASE_URL}?endpoint=/${mediaType}/${movieId}/videos`;
        const response = await fetch(videoUrl);
        const videoData = await response.json();
        
        const trailer = videoData.results?.find(v => 
            v.type === "Trailer" && 
            v.site === "YouTube" &&
            v.key &&
            v.key.trim() !== ""
        );
        
        if (trailer) {
            console.log("✅ Trailer found:", trailer.key);
            showTrailerModal(trailer.key);
        } else {
            console.log("❌ No trailer found");
            showNoTrailerModal();
        }
        
    } catch (err) {
        console.error("Trailer fetch error:", err);
        showNotification("Failed to load trailer.");
        hideModalLoading();
    }
}


function showTrailerModal(trailerKey) {
    let modal = document.getElementById('trailer-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'trailer-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.95);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease;
        `;
        
        modal.innerHTML = `
            <div style="position: relative; width: 90%; max-width: 1000px; background: #000; border-radius: 15px; overflow: hidden;">
                <button id="close-modal-btn" style="
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: rgba(0,0,0,0.8);
                    color: #00d4ff;
                    border: none;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    font-size: 24px;
                    cursor: pointer;
                    z-index: 10;
                    font-weight: bold;
                ">✕</button>
                <div style="position: relative; padding-bottom: 56.25%; height: 0;">
                    <iframe 
                        id="trailer-iframe"
                        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"
                        allow="autoplay; encrypted-media"
                        allowfullscreen>
                    </iframe>
                </div>
                <div style="padding: 15px; background: #111;">
                    <h3 style="color: #00d4ff; margin: 0;">${window.movieTitle}</h3>
                    <p style="color: #ccc; margin: 5px 0 0; font-size: 0.85rem;">Official Trailer</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('close-modal-btn')?.addEventListener('click', () => {
            closeTrailerModal();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeTrailerModal();
        });
        
        if (!document.getElementById('modal-animation')) {
            const style = document.createElement('style');
            style.id = 'modal-animation';
            style.textContent = `@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`;
            document.head.appendChild(style);
        }
    }
    
    const trailerIframe = document.getElementById('trailer-iframe');
    if (trailerIframe) {
        trailerIframe.src = `https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1`;
    }
    
    modal.style.display = 'flex';
    hideModalLoading();
}

function closeTrailerModal() {
    const modal = document.getElementById('trailer-modal');
    if (modal) {
        const iframe = document.getElementById('trailer-iframe');
        if (iframe) iframe.src = '';
        modal.style.display = 'none';
    }
}

function showModalLoading() {
    let loadingDiv = document.getElementById('modal-loading');
    if (!loadingDiv) {
        loadingDiv = document.createElement('div');
        loadingDiv.id = 'modal-loading';
        loadingDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.9);
            color: #00d4ff;
            padding: 20px;
            border-radius: 10px;
            z-index: 10001;
            font-weight: bold;
        `;
        loadingDiv.innerHTML = `
            <div style="width: 40px; height: 40px; border: 3px solid #333; border-top-color: #00d4ff; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto;"></div>
            <p style="margin-top: 10px;">Loading trailer...</p>
        `;
        document.body.appendChild(loadingDiv);
        
        if (!document.getElementById('spin-keyframes')) {
            const style = document.createElement('style');
            style.id = 'spin-keyframes';
            style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
            document.head.appendChild(style);
        }
    }
    loadingDiv.style.display = 'block';
}

function hideModalLoading() {
    const loadingDiv = document.getElementById('modal-loading');
    if (loadingDiv) loadingDiv.style.display = 'none';
}

function showNoTrailerModal() {
    hideModalLoading();
    
    let modal = document.getElementById('no-trailer-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'no-trailer-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        modal.innerHTML = `
            <div style="background: #1a1a1a; border-radius: 15px; max-width: 400px; width: 90%; padding: 30px; text-align: center; border: 1px solid #00d4ff;">
                <div style="font-size: 64px; margin-bottom: 20px;">🎬</div>
                <h2 style="color: #fff;">No Trailer Available</h2>
                <p style="color: #ccc; margin: 15px 0;">No official trailer found for "${window.movieTitle}" in TMDB.</p>
                <button id="close-no-trailer" style="background: #00d4ff; color: #000; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold;">Close</button>
            </div>
        `;
        document.body.appendChild(modal);
        
        document.getElementById('close-no-trailer')?.addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }
    modal.style.display = 'flex';
}

// --- RENDER FUNCTIONS ---

function renderHero(data) {
    const heroBg = document.getElementById('movie-hero');
    const title = document.getElementById('movie-title');
    const desc = document.getElementById('movie-description-hero');
    const meta = document.getElementById('movie-meta-hero');

    if (title) title.innerText = data.title || data.name;
    if (desc) desc.innerText = data.overview ? data.overview.substring(0, 180) + "..." : "No description available.";
    
    if (meta) {
        const year = (data.release_date || data.first_air_date || "").split('-')[0];
        const rating = data.vote_average ? data.vote_average.toFixed(1) : "0.0";
        meta.innerHTML = `
            <span>📅 ${year || 'N/A'}</span>
            <span>⭐ ${rating}</span>
            <span>🎬 ${mediaType.toUpperCase()}</span>
        `;
    }
    
    if (heroBg && data.backdrop_path) {
        heroBg.style.backgroundImage = `linear-gradient(to top, #0a0a0a 15%, rgba(0,0,0,0.4)), url('${TMDB_IMG}${data.backdrop_path}')`;
        heroBg.style.backgroundSize = 'cover';
        heroBg.style.backgroundPosition = 'center top';
    }
}

function renderDetails(data) {
    const poster = document.getElementById('movie-poster');
    const overview = document.getElementById('movie-overview');
    const vote = document.getElementById('vote-avg');
    
    if (poster) poster.src = data.poster_path ? `${TMDB_POSTER}${data.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster';
    if (overview) overview.innerText = data.overview || "The plot for this title is currently unavailable.";
    if (vote) vote.innerText = data.vote_average ? data.vote_average.toFixed(1) : "0.0";
}

function renderCast(data) {
    const castList = document.getElementById('movie-cast');
    
    if (!castList) return;
    
    if (!data?.credits?.cast || data.credits.cast.length === 0) {
        castList.innerHTML = '<p style="color: #888; text-align: center; width: 100%; padding: 20px;">No cast information available for this title.</p>';
        return;
    }
    
    const topCast = data.credits.cast.slice(0, 8);
    
    castList.innerHTML = topCast.map(actor => {
        const profileUrl = actor.profile_path 
            ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` 
            : 'https://via.placeholder.com/185x278?text=No+Photo';
        
        return `
            <div class="cast-item">
                <div class="cast-img-wrapper">
                    <img 
                        src="${profileUrl}" 
                        alt="${actor.name}"
                        loading="lazy"
                        onerror="this.src='https://via.placeholder.com/185x278?text=No+Photo'"
                    >
                </div>
                <div class="cast-info">
                    <p class="cast-name"><strong>${actor.name}</strong></p>
                    <p class="cast-character">${actor.character || 'Unknown Role'}</p>
                </div>
            </div>
        `;
    }).join('');
    
    console.log(`✅ Cast rendered: ${topCast.length} actors`);
}

function renderSimilar(similar) {
    const container = document.getElementById('similar-movies-container');
    
    if (!container) return;
    
    if (!similar?.results || similar.results.length === 0) {
        container.innerHTML = '<p style="color: #888; text-align: center; padding: 40px;">No similar movies found.</p>';
        return;
    }
    
    container.innerHTML = `
        <h2 style="margin: 30px 0 15px;">You Might Also Like</h2>
        <div class="similar-grid" style="display: flex; gap: 15px; overflow-x: auto; padding-bottom: 20px;">
            ${similar.results.slice(0, 12).map(m => `
                <div class="similar-card" style="min-width: 160px; cursor: pointer;" onclick="window.location.href='?id=${m.id}&type=${mediaType}'">
                    <img src="https://image.tmdb.org/t/p/w300${m.poster_path}" style="width: 100%; border-radius: 10px;" loading="lazy" onerror="this.src='https://via.placeholder.com/300x450?text=No+Poster'">
                    <p style="font-size: 0.85rem; margin-top: 8px; font-weight: bold;">${m.title || m.name}</p>
                    <span style="font-size: 0.7rem; color: #00d4ff;">⭐ ${m.vote_average ? m.vote_average.toFixed(1) : 'N/A'}</span>
                </div>
            `).join('')}
        </div>
    `;
}


function updateVideoPlayer(server) {
    const iframe = document.getElementById('movie-iframe');
    const loadingIndicator = document.getElementById('player-loading');
    if (!iframe) return;
    if (loadingIndicator) loadingIndicator.style.display = 'flex';
    
    // Get selected season and episode for TV shows
    let season = 1;
    let episode = 1;
    
    if (mediaType === 'tv') {
        const seasonSelect = document.getElementById('season-select');
        const episodeSelect = document.getElementById('episode-select');
        season = seasonSelect ? parseInt(seasonSelect.value) : 1;
        episode = episodeSelect ? parseInt(episodeSelect.value) : 1;
    }
    
    // Priority: Fewer ads first, then backup servers
    const servers = {
        // Best experience - fewer ads
        'embed2': mediaType === 'movie' 
            ? `https://www.2embed.cc/embed/${movieId}` 
            : `https://www.2embed.cc/embedtv/${movieId}&s=${season}&e=${episode}`,
        'multiembed': `https://multiembed.mov/?video_id=${movieId}&tmdb=1&s=${season}&e=${episode}`,
        'autoembed': mediaType === 'movie' 
            ? `https://autoembed.to/movie/tmdb/${movieId}` 
            : `https://autoembed.to/tv/tmdb/${movieId}/${season}/${episode}`,
        'moviesapi': `https://moviesapi.club/movie/${movieId}`,
        // Backup - reliable but more ads
        'vidsrc': mediaType === 'movie' 
            ? `https://vidsrc.me/embed/movie?tmdb=${movieId}` 
            : `https://vidsrc.me/embed/tv?tmdb=${movieId}&sea=${season}&epi=${episode}`,
        'vidsrc2': mediaType === 'movie' 
            ? `https://vidsrc.to/embed/movie/${movieId}` 
            : `https://vidsrc.to/embed/tv/${movieId}/${season}/${episode}`,
        'vidsrc3': mediaType === 'movie' 
            ? `https://vidsrc.cc/v2/embed/movie/${movieId}` 
            : `https://vidsrc.cc/v2/embed/tv/${movieId}/${season}/${episode}`,
        'videasy': mediaType === 'movie' 
            ? `https://player.videasy.net/movie/${movieId}` 
            : `https://player.videasy.net/tv/${movieId}/${season}/${episode}`
    };
    
    iframe.style.display = 'block';
    iframe.src = servers[server] || servers['embed2'];
    
    iframe.onload = () => {
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    };
    
    iframe.onerror = () => {
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        showNotification(`Unable to load ${server}. Try another server.`);
    };
}

function showNotification(message) {
    let notif = document.getElementById('temp-notification');
    if (!notif) {
        notif = document.createElement('div');
        notif.id = 'temp-notification';
        notif.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: #00d4ff;
            color: #000;
            padding: 10px 20px;
            border-radius: 30px;
            font-weight: bold;
            z-index: 10000;
            font-size: 0.85rem;
            animation: fadeInOut 3s ease forwards;
            white-space: nowrap;
            box-shadow: 0 0 15px rgba(0,212,255,0.5);
        `;
        document.body.appendChild(notif);
        
        if (!document.getElementById('notif-styles')) {
            const style = document.createElement('style');
            style.id = 'notif-styles';
            style.textContent = `
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translateX(-50%) translateY(20px); }
                    15% { opacity: 1; transform: translateX(-50%) translateY(0); }
                    85% { opacity: 1; transform: translateX(-50%) translateY(0); }
                    100% { opacity: 0; transform: translateX(-50%) translateY(-20px); visibility: hidden; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    notif.textContent = message;
    notif.style.display = 'block';
    notif.style.visibility = 'visible';
    setTimeout(() => {
        notif.style.display = 'none';
    }, 3000);
}

function showLoadingState() {
    const spinner = document.getElementById('global-loading');
    if (spinner) spinner.style.display = 'flex';
}

function hideLoadingState() {
    const spinner = document.getElementById('global-loading');
    if (spinner) spinner.style.display = 'none';
}

function showErrorMessage(message) {
    console.error(message);
    showNotification(message);
}

document.addEventListener('DOMContentLoaded', () => {
    const watchBtn = document.getElementById('scroll-to-player');
    if (watchBtn) {
        watchBtn.addEventListener('click', () => {
            updateVideoPlayer('embed2');
            document.getElementById('player-section')?.scrollIntoView({ behavior: 'smooth' });
        });
    }
    
    const trailerBtn = document.getElementById('play-trailer-btn');
    if (trailerBtn) {
        trailerBtn.addEventListener('click', (e) => {
            e.preventDefault();
            playTrailer();
        });
    }
    
    const serverSelect = document.getElementById('server-select');
    if (serverSelect) {
        serverSelect.addEventListener('change', (e) => {
            updateVideoPlayer(e.target.value);
        });
    }
});

// ============================================
// MAKE FUNCTIONS GLOBALLY AVAILABLE
// ============================================
window.playTrailer = playTrailer;
window.updateVideoPlayer = updateVideoPlayer;
window.showNotification = showNotification;

// INITIALIZE
initMoviePage();
