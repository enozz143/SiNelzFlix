const params = new URLSearchParams(window.location.search);
const movieId = params.get('id');
const mediaType = params.get('type') || 'movie';

// Kunin ang BASE_URL mula sa global window (yung worker link mo)
const BASE_URL = window.BASE_URL || 'https://iyong-worker-link.workers.dev/'; 

async function loadMovieDetails() {
    if (!movieId) { window.location.href = '/'; return; }

    try {
        // Gagamit tayo ng endpoint na format para sa worker mo
        const response = await fetch(`${BASE_URL}?endpoint=/${mediaType}/${movieId}&append_to_response=credits`);
        const data = await response.json();

        if (data.success === false) throw new Error("Movie not found");

        // Fill up details
        document.title = `${data.title || data.name} - Watch on CINElzFlix`;
        document.getElementById('movie-title').innerText = data.title || data.name;
        document.getElementById('movie-poster').src = `https://image.tmdb.org/t/p/w500${data.poster_path}`;
        document.getElementById('movie-overview').innerText = data.overview;
        document.getElementById('movie-meta').innerText = `${data.release_date || data.first_air_date} • ⭐ ${data.vote_average.toFixed(1)}`;

        // Set Video Player
        setPlayer('vidsrc');

        // Cast logic
        if (data.credits && data.credits.cast) {
            const cast = data.credits.cast.slice(0, 5).map(c => c.name).join(', ');
            document.getElementById('movie-cast').innerText = `Cast: ${cast}`;
        }

    } catch (error) {
        console.error("Error loading movie:", error);
        document.getElementById('movie-title').innerText = "Movie Not Found, Bro!";
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

document.getElementById('server-select').addEventListener('change', (e) => setPlayer(e.target.value));

loadMovieDetails();
