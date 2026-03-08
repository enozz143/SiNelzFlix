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

const type=currentItem.title?"movie":"tv"

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