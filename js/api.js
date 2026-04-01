// js/api.js

// mangopya kag code noh hahhahaa
export const BASE_URL = "/api"; 
export const IMG_URL = "https://image.tmdb.org/t/p/original";


export async function fetchMovies(type, page = 1, genreId = 'all') {
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
