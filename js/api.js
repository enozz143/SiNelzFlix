// js/api.js

// Ang mga constants na gagamitin sa lahat ng files
export const BASE_URL = "/api"; 
export const IMG_URL = "https://image.tmdb.org/t/p/original";

/**
 * --- DATA FETCHING ---
 * Kukunin ang movies o tv shows base sa type at genre.
 * Ginagamitan ng 'export' para magamit sa script.js at ui.js.
 */
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
        
        // Ibabalik lang ang results array para malinis ang data
        return data.results || [];
    } catch (error) {
        console.error("Fetch error, bro:", error);
        return [];
    }
}
