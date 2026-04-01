//mangopya kag code noh hahhahaa

export function initCountdown() {
   
    const eventName = "The Next Big Blockbuster"; 
    const targetDate = new Date("April 1, 2026 00:00:00").getTime(); 
    // ----------------------------------------

    const banner = document.getElementById("countdown-banner");
    const title = document.getElementById("countdown-event-title");
    
    
    if (!banner || !title) return;
    
    title.innerText = eventName;
    banner.style.display = "block";

    const timerInterval = setInterval(() => {
        const now = new Date().getTime();
        const distance = targetDate - now;

        
        if (distance < 0) {
            clearInterval(timerInterval); 
            
           
            const timerContainer = document.getElementById("timer");
            if (timerContainer) {
                timerContainer.innerHTML = "<h2 style='color: #00d4ff; font-size: 2rem; margin: 20px 0;'>🚀 NOW STREAMING ON CINElzFlix!</h2>";
            }
            
           
            setTimeout(() => {
                banner.style.transition = "opacity 1s ease";
                banner.style.opacity = "0";
                setTimeout(() => banner.style.display = "none", 1000);
            }, 10000);
            
            return;
        }

        
        const d = Math.floor(distance / (1000 * 60 * 60 * 24));
        const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((distance % (1000 * 60)) / 1000);

        
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
