// movie-page.js
const params = new URLSearchParams(window.location.search);
const movieId = params.get('id');
const mediaType = params.get('type') || 'movie';

// PAALALA: Siguraduhin na ang BASE_URL ay naka-set sa index.html o ilagay mo dito yung Worker link mo
const BASE_URL = 'https://nopopup.sinelzflix2.pages.dev/'; // Palitan mo kung iba ang URL ng worker mo

async function loadMovieDetails() {
    if (!movieId) { window.location.href = 'index.html'; return; }

    try {
        const response = await fetch(`${BASE_URL}?endpoint=/${mediaType}/${movieId}&append_to_response=credits`);
        const data = await response.json();

        // I-fill up ang content
        document.title = `${data.title || data.name} - Watch on CINElzFlix`;
        document.getElementById('movie-title').innerText = data.title || data.name;
        document.getElementById('movie-poster').src = `https://image.tmdb.org/t/p/w500${data.poster_path}`;
        document.getElementById('movie-overview').innerText = data.overview;
        document.getElementById('movie-meta').innerText = `${data.release_date || data.first_air_date} • ⭐ ${data.vote_average.toFixed(1)}`;

        // I-set ang Player
        setPlayer('vidsrc');

        if (data.credits && data.credits.cast) {
            const cast = data.credits.cast.slice(0, 5).map(c => c.name).join(', ');
            document.getElementById('movie-cast').innerText = `Cast: ${cast}`;
        }

    } catch (error) {
        console.error("Error:", error);
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
