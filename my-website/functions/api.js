export async function onRequest(context) {
  const { searchParams } = new URL(context.request.url);
  const endpoint = searchParams.get('endpoint'); // Halimbawa: /discover/movie
  
  // Kunin ang Secret key mula sa Cloudflare environment
  const API_KEY = context.env.TMDB_API_KEY;
  const BASE_URL = "https://api.themoviedb.org/3";

  // --- ETO ANG MAGIC FIX BRO ---
  // Gagawa tayo ng kopya ng lahat ng parameters (page, with_genres, etc.)
  const params = new URLSearchParams(searchParams);
  
  // Tatanggalin lang natin yung 'endpoint' parameter dahil hindi naman ito kailangan ng TMDB
  params.delete('endpoint'); 
  
  // Dito natin idudugtong lahat ng parameters sa dulo ng URL
  // Ang Resulta: ...?api_key=XXX&page=1&with_genres=27&sort_by=popularity.desc
  const fetchUrl = `${BASE_URL}${endpoint}?api_key=${API_KEY}&${params.toString()}`;

  console.log("Final TMDB URL:", fetchUrl); // Makikita mo to sa Cloudflare logs

  try {
    const response = await fetch(fetchUrl);
    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" // Para iwas CORS error
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch data, bro" }), { status: 500 });
  }
}
