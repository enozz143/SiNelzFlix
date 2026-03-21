const API_KEY = '826502283a005086b4a3a30eb6a7c362'; // TMDB Key mo bro
const params = new URLSearchParams(window.location.search);
const movieId = params.get('id');
const mediaType = params.get('type') || 'movie';

async function loadMovieDetails() {
    if (!movieId) { window.location.href = '/'; return; }

    try {
        const response = await fetch(`https://api.themoviedb.org/3/${mediaType}/${movieId}?api_key=${API_KEY}&append_to_response=credits`);
        const data = await response.json();

        // Fill up details
        document.title = `${data.title || data.name} - Watch on CINElzFlix`;
        document.getElementById('movie-title').innerText = data.title || data.name;
        document.getElementById('movie-poster').src = `https://image.tmdb.org/t/p/w500${data.poster_path}`;
        document.getElementById('movie-overview').innerText = data.overview;
        document.getElementById('movie-meta').innerText = `${data.release_date || data.first_air_date} • ⭐ ${data.vote_average.toFixed(1)}`;

        // Set Video Player
        setPlayer('vidsrc');

        // Cast
        const cast = data.credits.cast.slice(0, 5).map(c => c.name).join(', ');
        document.getElementById('movie-cast').innerText = `Cast: ${cast}`;

    } catch (error) {
        console.error("Error loading movie:", error);
    }
}

function setPlayer(server) {
    const iframe = document.getElementById('movie-iframe');
    if (server === 'vidsrc') {
        iframe.src = mediaType === 'movie' 
            ? `https://vidsrc.me/embed/movie?tmdb=${movieId}` 
            : `https://vidsrc.me/embed/tv?tmdb=${movieId}&sea=1&epi=1`;
    } else {
        iframe.src = `https://vidsrc.to/embed/${mediaType}/${movieId}`;
    }
}

// Event listener para sa server change
document.getElementById('server-select').addEventListener('change', (e) => setPlayer(e.target.value));

loadMovieDetails();
