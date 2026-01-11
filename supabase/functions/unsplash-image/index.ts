/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Travel-related placeholder when no results found
const TRAVEL_PLACEHOLDER = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=400&fit=crop";

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const unsplashAccessKey = Deno.env.get("UNSPLASH_ACCESS_KEY");
    
    if (!unsplashAccessKey) {
      console.error("UNSPLASH_ACCESS_KEY is not configured");
      return new Response(
        JSON.stringify({ 
          imageUrl: TRAVEL_PLACEHOLDER, 
          placeholder: true,
          error: "API key not configured" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Universal input handling: Try URL params first, then request body
    const url = new URL(req.url);
    let query = url.searchParams.get("query");
    
    // If not in URL params, try request body
    if (!query) {
      try {
        const body = await req.json();
        query = body?.query;
      } catch {
        // Body parsing failed, query stays null
      }
    }

    // Trim and validate
    query = query?.trim() || "";

    console.log("=== Unsplash Image Request ===");
    console.log("Method:", req.method);
    console.log("Query from params:", url.searchParams.get("query"));
    console.log("Final query:", query);

    if (!query) {
      console.error("No query provided - returning placeholder");
      return new Response(
        JSON.stringify({ 
          imageUrl: TRAVEL_PLACEHOLDER, 
          placeholder: true,
          error: "No search query provided" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Searching Unsplash for:", query);

    const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;

    const response = await fetch(unsplashUrl, {
      headers: {
        Authorization: `Client-ID ${unsplashAccessKey}`,
      },
    });

    console.log("Unsplash API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Unsplash API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ 
          imageUrl: TRAVEL_PLACEHOLDER, 
          placeholder: true,
          error: `Unsplash API error: ${response.status}` 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("Unsplash results count:", data.results?.length || 0);
    
    if (!data.results || data.results.length === 0) {
      console.log("No results found for query:", query);
      return new Response(
        JSON.stringify({ 
          imageUrl: TRAVEL_PLACEHOLDER, 
          placeholder: true,
          error: "No images found for query" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use urls.regular as per Unsplash API docs
    const imageUrl = data.results[0].urls.regular;
    const photographer = data.results[0].user?.name || "Unknown";
    const photographerUrl = data.results[0].user?.links?.html || "https://unsplash.com";

    console.log("Success! Found image:", imageUrl);

    return new Response(
      JSON.stringify({ 
        imageUrl, 
        photographer, 
        photographerUrl,
        placeholder: false,
        query: query
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error in unsplash-image function:", error);
    return new Response(
      JSON.stringify({ 
        imageUrl: TRAVEL_PLACEHOLDER, 
        placeholder: true,
        error: String(error) 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
