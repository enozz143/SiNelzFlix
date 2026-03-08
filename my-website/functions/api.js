export async function onRequest(context) {
  const { searchParams } = new URL(context.request.url);
  const endpoint = searchParams.get('endpoint'); // Halimbawa: /trending/movie/week
  const query = searchParams.get('query') || ''; // Para sa search
  
  // Kunin ang Secret key mula sa Cloudflare environment
  const API_KEY = context.env.TMDB_API_KEY;
  const BASE_URL = "https://api.themoviedb.org/3";

  // Buuin ang tamang URL para sa TMDB
  let fetchUrl = `${BASE_URL}${endpoint}?api_key=${API_KEY}`;
  if (query) {
    fetchUrl += `&query=${encodeURIComponent(query)}`;
  }

  try {
    const response = await fetch(fetchUrl);
    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch data" }), { status: 500 });
  }
}
