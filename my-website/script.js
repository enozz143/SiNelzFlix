const API_KEY = "7bdb3c0098a5464a8673d725ffe70da5"

const BASE_URL = "https://api.themoviedb.org/3"

const IMG_URL = "https://image.tmdb.org/t/p/original"

let currentItem



async function fetchTrending(type){

const res = await fetch(`${BASE_URL}/trending/${type}/week?api_key=${API_KEY}`)

const data = await res.json()

return data.results

}



async function fetchTrendingAnime(){

let allResults=[]

for(let page=1;page<=3;page++){

const res = await fetch(`${BASE_URL}/trending/tv/week?api_key=${API_KEY}&page=${page}`)

const data = await res.json()

const filtered = data.results.filter(item=>item.genre_ids.includes(16))

allResults=allResults.concat(filtered)

}

return allResults

}



function displayBanner(item){

document.getElementById("banner").style.backgroundImage=`url(${IMG_URL}${item.backdrop_path})`

document.getElementById("banner-title").textContent=item.title||item.name

document.getElementById("banner-desc").textContent=item.overview

}



function displayList(items,containerId){

const container=document.getElementById(containerId)

container.innerHTML=""

items.forEach(item=>{

if(!item.poster_path)return

const img=document.createElement("img")

img.src=`${IMG_URL}${item.poster_path}`

img.onclick=()=>showDetails(item)

container.appendChild(img)

})

}



function showDetails(item){

currentItem=item

document.getElementById("modal-title").textContent=item.title||item.name

document.getElementById("modal-description").textContent=item.overview

document.getElementById("modal-image").src=`${IMG_URL}${item.poster_path}`

document.getElementById("modal-rating").innerHTML="★".repeat(Math.round(item.vote_average/2))

changeServer()

document.getElementById("modal").style.display="flex"

}



function changeServer(){

const server=document.getElementById("server").value

const type=currentItem.media_type || (currentItem.title ? "movie" : "tv")

let embedURL=""

if(server==="vidsrc"){

embedURL=`https://vidsrc.cc/v2/embed/${type}/${currentItem.id}`

}

if(server==="vidsrc2"){

embedURL=`https://vidsrc.net/embed/${type}/?tmdb=${currentItem.id}`

}

if(server==="videasy"){

embedURL=`https://player.videasy.net/${type}/${currentItem.id}`

}

document.getElementById("modal-video").src=embedURL

}



function closeModal(){

document.getElementById("modal").style.display="none"

document.getElementById("modal-video").src=""

}



async function searchTMDB(){

const query=document.getElementById("search-input").value

if(!query.trim())return

const res=await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${query}`)

const data=await res.json()

displayList(data.results,"movies-list")

}



async function init(){

const movies=await fetchTrending("movie")

const tvshows=await fetchTrending("tv")

const anime=await fetchTrendingAnime()

displayBanner(movies[0])

displayList(movies,"movies-list")

displayList(tvshows,"tvshows-list")

displayList(anime,"anime-list")

}


init()

let debounceTimer;

async function handleSearch(query) {
    const box = document.getElementById("suggestions-box");
    
    // Clear suggestions kung walang tinype
    if (!query.trim()) {
        box.innerHTML = "";
        return;
    }

    // Debounce: Antayin matapos mag-type si user (300ms)
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
        const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${query}`);
        const data = await res.json();
        displaySuggestions(data.results.slice(0, 8)); // Limit to top 8 results
    }, 300);
}

function displaySuggestions(results) {
    const box = document.getElementById("suggestions-box");
    box.innerHTML = "";

    results.forEach(item => {
        // Skip results na walang poster or name
        if (!item.poster_path || (!item.title && !item.name)) return;

        const div = document.createElement("div");
        div.className = "suggestion-item";
        div.onclick = () => {
            showDetails(item); // Bubukas yung modal na ginawa mo kanina
            box.innerHTML = ""; // Close suggestions after click
            document.getElementById("search-input").value = ""; // Clear input
        };

        div.innerHTML = `
            <img src="${IMG_URL}${item.poster_path}" alt="poster">
            <div class="suggestion-info">
                <h4>${item.title || item.name}</h4>
                <p>${item.release_date ? item.release_date.split('-')[0] : (item.first_air_date ? item.first_air_date.split('-')[0] : 'N/A')}</p>
            </div>
        `;
        box.appendChild(div);
    });
}

// Close suggestions box pag nag-click sa labas
document.addEventListener("click", (e) => {
    if (e.target.id !== "search-input") {
        document.getElementById("suggestions-box").innerHTML = "";
    }
});
