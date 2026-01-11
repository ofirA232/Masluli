/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Travel-related placeholder when no results found
const TRAVEL_PLACEHOLDER = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=400&fit=crop";

// Validation constants
const MAX_QUERY_LENGTH = 100;
const MIN_QUERY_LENGTH = 1;

// Helper to verify JWT authentication
async function verifyAuth(req: Request): Promise<{ authenticated: true; userId: string } | { authenticated: false; response: Response }> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      authenticated: false,
      response: new Response(
        JSON.stringify({ 
          imageUrl: TRAVEL_PLACEHOLDER, 
          placeholder: true,
          error: 'Authentication required' 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      ),
    };
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await supabase.auth.getUser(token);
  
  if (error || !data?.user) {
    return {
      authenticated: false,
      response: new Response(
        JSON.stringify({ 
          imageUrl: TRAVEL_PLACEHOLDER, 
          placeholder: true,
          error: 'Invalid session' 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      ),
    };
  }

  return { authenticated: true, userId: data.user.id };
}

// Sanitize query for safe API usage
function sanitizeQuery(query: string): string {
  return query
    .replace(/[<>{}]/g, '') // Remove potentially harmful characters
    .trim()
    .substring(0, MAX_QUERY_LENGTH); // Enforce max length
}

// Validate query parameter
function validateQuery(query: unknown): { valid: true; query: string } | { valid: false; error: string } {
  if (typeof query !== 'string') {
    return { valid: false, error: 'Query must be a string' };
  }
  
  const trimmed = query.trim();
  if (trimmed.length < MIN_QUERY_LENGTH) {
    return { valid: false, error: 'Query cannot be empty' };
  }
  
  if (trimmed.length > MAX_QUERY_LENGTH) {
    return { valid: false, error: `Query must be ${MAX_QUERY_LENGTH} characters or less` };
  }
  
  return { valid: true, query: sanitizeQuery(trimmed) };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify authentication
  const authResult = await verifyAuth(req);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const unsplashAccessKey = Deno.env.get("UNSPLASH_ACCESS_KEY");
    
    if (!unsplashAccessKey) {
      console.error("UNSPLASH_ACCESS_KEY is not configured");
      return new Response(
        JSON.stringify({ 
          imageUrl: TRAVEL_PLACEHOLDER, 
          placeholder: true,
          error: "Service temporarily unavailable" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Universal input handling: Try URL params first, then request body
    const url = new URL(req.url);
    let rawQuery: unknown = url.searchParams.get("query");
    
    // If not in URL params, try request body
    if (!rawQuery) {
      try {
        const body = await req.json();
        rawQuery = body?.query;
      } catch {
        // Body parsing failed, query stays null
      }
    }

    // Validate the query
    const validation = validateQuery(rawQuery);
    
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ 
          imageUrl: TRAVEL_PLACEHOLDER, 
          placeholder: true,
          error: validation.error 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const query = validation.query;

    const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;

    const response = await fetch(unsplashUrl, {
      headers: {
        Authorization: `Client-ID ${unsplashAccessKey}`,
      },
    });

    if (!response.ok) {
      console.error("Unsplash API error:", response.status);
      return new Response(
        JSON.stringify({ 
          imageUrl: TRAVEL_PLACEHOLDER, 
          placeholder: true,
          error: "Image service temporarily unavailable" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
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
    console.error("Unexpected error in unsplash-image function:", error instanceof Error ? error.message : 'Unknown error');
    return new Response(
      JSON.stringify({ 
        imageUrl: TRAVEL_PLACEHOLDER, 
        placeholder: true,
        error: "Service temporarily unavailable" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
