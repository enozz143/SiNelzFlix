// js/countdown.js

export function initCountdown() {
    // --- DITO MO PALITAN ANG SETTINGS, BRO ---
    const eventName = "The Next Big Blockbuster"; // Pangalan ng movie o update
    const targetDate = new Date("April 1, 2026 00:00:00").getTime(); 
    // ----------------------------------------

    const banner = document.getElementById("countdown-banner");
    const title = document.getElementById("countdown-event-title");
    
    // Check muna kung exist ang elements para iwas error sa console
    if (!banner || !title) return;
    
    title.innerText = eventName;
    banner.style.display = "block";

    const timerInterval = setInterval(() => {
        const now = new Date().getTime();
        const distance = targetDate - now;

        // logic pag tapos na ang countdown
        if (distance < 0) {
            clearInterval(timerInterval); // Stop the clock
            
            // Update UI to show it's live!
            const timerContainer = document.getElementById("timer");
            if (timerContainer) {
                timerContainer.innerHTML = "<h2 style='color: #00d4ff; font-size: 2rem; margin: 20px 0;'>🚀 NOW STREAMING ON CINElzFlix!</h2>";
            }
            
            // Optional: Itago ang banner after 10 seconds para hindi sagabal
            setTimeout(() => {
                banner.style.transition = "opacity 1s ease";
                banner.style.opacity = "0";
                setTimeout(() => banner.style.display = "none", 1000);
            }, 10000);
            
            return;
        }

        // Time calculations
        const d = Math.floor(distance / (1000 * 60 * 60 * 24));
        const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((distance % (1000 * 60)) / 1000);

        // Update HTML with 00 format
        const daysEl = document.getElementById("days");
        const hoursEl = document.getElementById("hours");
        const minsEl = document.getElementById("minutes");
        const secsEl = document.getElementById("seconds");

        if (daysEl) daysEl.innerText = d.toString().padStart(2, '0');
        if (hoursEl) hoursEl.innerText = h.toString().padStart(2, '0');
        if (minsEl) minsEl.innerText = m.toString().padStart(2, '0');
        if (secsEl) secsEl.innerText = s.toString().padStart(2, '0');
        
    }, 1000);
}
