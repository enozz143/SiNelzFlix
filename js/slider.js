// js/slider.js - WITH SWIPE SUPPORT FOR MOBILE
import { BASE_URL, IMG_URL } from './api.js';

let sliderIndex = 0;
let sliderItems = [];

// Swipe variables
let touchStartX = 0;
let touchEndX = 0;

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
        
        let trailerKey = "";
        try {
            const videoRes = await fetch(`${BASE_URL}?endpoint=/movie/${movie.id}/videos`);
            const videoData = await videoRes.json();
            const trailer = videoData.results.find(v => v.type === "Trailer" && v.site === "YouTube");
            if (trailer) trailerKey = trailer.key;
        } catch (err) { console.error("Slider video error:", err); }

        // ✅ FIXED: Watch Now button diretso sa movie page
        slide.innerHTML = `
            <div class="hero-video-container">
                ${trailerKey ? `<iframe src="https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailerKey}&rel=0&showinfo=0&modestbranding=1&iv_load_policy=3" frameborder="0" allow="autoplay; encrypted-media"></iframe>` : ''}
            </div>
            <div class="hero-overlay"></div>
            <div class="hero-content">
                <div class="hero-meta">
                    <span>⭐ ${movie.vote_average.toFixed(1)}</span>
                    <span>•</span>
                    <span>${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</span>
                    <span style="border: 1px solid var(--primary-blue, #00d4ff); padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: bold;">CINEMATIC PREVIEW</span>
                </div>
                <h1>${movie.title}</h1>
                <p>${movie.overview ? movie.overview.substring(0, 180) : ''}...</p>
                <div class="hero-btns">
                    <button class="btn-watch" onclick="window.location.href='/movie/?id=${movie.id}&type=movie'">▶ Watch Now</button>
                    <button class="btn-list" style="background:rgba(255,255,255,0.1); color:white; border:1px solid white; padding:12px 30px; border-radius:5px; cursor:pointer; font-weight: bold; transition: 0.3s;">+ My List</button>
                </div>
            </div>
        `;
        sliderContainer.appendChild(slide);

        const dot = document.createElement("div");
        dot.className = `dot ${index === 0 ? 'active' : ''}`;
        dot.onclick = () => window.goToSlide(index);
        dotsContainer.appendChild(dot);
    }
    
    if (window.sliderInterval) clearInterval(window.sliderInterval);
    window.sliderInterval = setInterval(() => window.nextSlide(), 10000);
    
    // ✅ ADD SWIPE SUPPORT FOR MOBILE
    addSwipeListeners();
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
    if(slides.length > 0) {
        slides.forEach((s, i) => s.classList.toggle("active", i === sliderIndex));
        dots.forEach((d, i) => d.classList.toggle("active", i === sliderIndex));
    }
}

/**
 * ✅ NEW: Add swipe listeners for mobile
 */
function addSwipeListeners() {
    const sliderContainer = document.getElementById("hero-slider-container");
    if (!sliderContainer) return;
    
    // Touch start - record starting position
    sliderContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    // Touch end - detect swipe direction
    sliderContainer.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
}

/**
 * Handle swipe gesture
 */
function handleSwipe() {
    const swipeThreshold = 50; // minimum distance to trigger swipe (in pixels)
    
    // Swipe LEFT → next slide
    if (touchEndX < touchStartX - swipeThreshold) {
        window.nextSlide();
    }
    
    // Swipe RIGHT → previous slide
    if (touchEndX > touchStartX + swipeThreshold) {
        const prevIndex = sliderIndex - 1;
        if (prevIndex >= 0) {
            window.goToSlide(prevIndex);
        } else {
            window.goToSlide(sliderItems.length - 1);
        }
    }
}
