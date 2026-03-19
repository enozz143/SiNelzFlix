// js/slider.js
import { BASE_URL, IMG_URL } from './api.js';

let sliderIndex = 0;
let sliderItems = [];

/**
 * --- HERO SLIDER LOGIC ---
 */
export async function setupHeroSlider(movies) {
    const shuffledMovies = [...movies].sort(() => 0.5 - Math.random());
    sliderItems = shuffledMovies.slice(0, 6);
    
    const sliderContainer = document.getElementById("hero-slider");
    const dotsContainer = document.getElementById("slider-dots");
    
    if (!sliderContainer) return;
    
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
        // Gagamitin natin ang window reference para ma-access ng HTML onclick
        dot.onclick = () => window.goToSlide(index);
        dotsContainer.appendChild(dot);
    }
    
    if (window.sliderInterval) clearInterval(window.sliderInterval);
    window.sliderInterval = setInterval(() => window.nextSlide(), 10000);
}

export function nextSlide() {
    if (sliderItems.length === 0) return;
    sliderIndex = (sliderIndex + 1) % sliderItems.length;
    updateSliderUI();
}

export function goToSlide(index) {
    sliderIndex = index;
    updateSliderUI();
}

export function updateSliderUI() {
    const slides = document.querySelectorAll(".hero-slide");
    const dots = document.querySelectorAll(".dot");
    slides.forEach((s, i) => s.classList.toggle("active", i === sliderIndex));
    dots.forEach((d, i) => d.classList.toggle("active", i === sliderIndex));
}
