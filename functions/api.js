export async function onRequest(context) {
  const { searchParams } = new URL(context.request.url);
  const endpoint = searchParams.get('endpoint'); 
  
  
  const API_KEY = context.env.TMDB_API_KEY;
  const BASE_URL = "https://api.themoviedb.org/3";

 
  const params = new URLSearchParams(searchParams);
  
  
  params.delete('endpoint'); 
  
  
  const fetchUrl = `${BASE_URL}${endpoint}?api_key=${API_KEY}&${params.toString()}`;

  console.log("Final TMDB URL:", fetchUrl); 

  try {
    const response = await fetch(fetchUrl);
    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" 
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch data, bro" }), { status: 500 });
  }
}
