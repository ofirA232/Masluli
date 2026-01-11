import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const unsplashAccessKey = Deno.env.get("UNSPLASH_ACCESS_KEY");
    if (!unsplashAccessKey) {
      console.error("UNSPLASH_ACCESS_KEY is not set");
      return new Response(
        JSON.stringify({ error: "Unsplash API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    const query = url.searchParams.get("query");

    if (!query) {
      return new Response(
        JSON.stringify({ error: "Query parameter is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Fetching Unsplash image for query:", query);

    const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=squarish`;

    const response = await fetch(unsplashUrl, {
      headers: {
        Authorization: `Client-ID ${unsplashAccessKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Unsplash API error:", response.status, errorText);
      
      if (response.status === 403) {
        return new Response(
          JSON.stringify({ error: "Unsplash API rate limit exceeded" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to fetch image from Unsplash" }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      console.log("No results found for query:", query);
      return new Response(
        JSON.stringify({ imageUrl: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const imageUrl = data.results[0].urls.small;
    const photographer = data.results[0].user.name;
    const photographerUrl = data.results[0].user.links.html;

    console.log("Found image:", imageUrl);

    return new Response(
      JSON.stringify({ 
        imageUrl, 
        photographer, 
        photographerUrl 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in unsplash-image function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
