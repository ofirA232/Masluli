/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Placeholder image when no results or API fails
const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=400&fit=crop";

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const unsplashAccessKey = Deno.env.get("UNSPLASH_ACCESS_KEY");
    
    // If no API key, return placeholder
    if (!unsplashAccessKey) {
      console.warn("UNSPLASH_ACCESS_KEY is not set, using placeholder");
      return new Response(
        JSON.stringify({ imageUrl: PLACEHOLDER_IMAGE, placeholder: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get query from POST body or GET params
    let query: string | null = null;
    
    if (req.method === "POST") {
      try {
        const body = await req.json();
        query = body.query;
      } catch {
        // If body parsing fails, try URL params
      }
    }
    
    // Fallback to URL params
    if (!query) {
      const url = new URL(req.url);
      query = url.searchParams.get("query");
    }

    if (!query || query.trim() === "") {
      console.warn("No query provided, using placeholder");
      return new Response(
        JSON.stringify({ imageUrl: PLACEHOLDER_IMAGE, placeholder: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
      
      // Return placeholder on any error
      return new Response(
        JSON.stringify({ imageUrl: PLACEHOLDER_IMAGE, placeholder: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      console.log("No results found for query:", query);
      return new Response(
        JSON.stringify({ imageUrl: PLACEHOLDER_IMAGE, placeholder: true }),
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
        photographerUrl,
        placeholder: false
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in unsplash-image function:", error);
    return new Response(
      JSON.stringify({ imageUrl: PLACEHOLDER_IMAGE, placeholder: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
