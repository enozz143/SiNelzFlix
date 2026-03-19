// js/countdown.js

export function initCountdown() {
    // --- DITO MO PALITAN ANG SETTINGS ---
    const eventName = "The Next Big Blockbuster";
    const targetDate = new Date("April 1, 2026 00:00:00").getTime(); 
    // ------------------------------------

    const banner = document.getElementById("countdown-banner");
    const title = document.getElementById("countdown-event-title");
    
    if (!banner) return;
    title.innerText = eventName;
    banner.style.display = "block";

    const updateTimer = () => {
        const now = new Date().getTime();
        const distance = targetDate - now;

        if (distance < 0) {
            banner.style.display = "none";
            return;
        }

        const d = Math.floor(distance / (1000 * 60 * 60 * 24));
        const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((distance % (1000 * 60)) / 1000);

        document.getElementById("days").innerText = d.toString().padStart(2, '0');
        document.getElementById("hours").innerText = h.toString().padStart(2, '0');
        document.getElementById("minutes").innerText = m.toString().padStart(2, '0');
        document.getElementById("seconds").innerText = s.toString().padStart(2, '0');
    };

    setInterval(updateTimer, 1000);
    updateTimer();
}
