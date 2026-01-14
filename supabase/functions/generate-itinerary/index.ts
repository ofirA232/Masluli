/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Allowed origins - restrict to your domains
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:3000',
];

// Add production domains from environment
const productionOrigins = Deno.env.get('ALLOWED_ORIGINS')?.split(',').filter(Boolean) || [];
allowedOrigins.push(...productionOrigins);

// Helper to get CORS headers based on request origin
function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  
  // Check if origin is allowed or if it's a Lovable preview domain
  const isAllowed = allowedOrigins.includes(origin) || 
    origin.endsWith('.lovable.app') || 
    origin.endsWith('.lovableproject.com');
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : '',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// Helper to verify JWT authentication
async function verifyAuth(req: Request, corsHeaders: Record<string, string>): Promise<{ authenticated: true; userId: string } | { authenticated: false; response: Response }> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      authenticated: false,
      response: new Response(
        JSON.stringify({ error: 'יש להתחבר כדי להשתמש בשירות זה' }),
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
        JSON.stringify({ error: 'יש להתחבר מחדש כדי להמשיך' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      ),
    };
  }

  return { authenticated: true, userId: data.user.id };
}

interface Activity {
  id: string;
  name: string;
  description: string;
  price: string;
  address: string;
  time: string;
  category: string;
  image_search_term: string;
}

interface Day {
  day_number: number;
  activities: Activity[];
}

interface ItineraryRequest {
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budget?: string;
  interests?: string[];
}

// Validation constants
const MAX_DESTINATION_LENGTH = 100;
const MAX_BUDGET_LENGTH = 50;
const MAX_INTEREST_LENGTH = 50;
const MAX_INTERESTS_COUNT = 10;
const MAX_TRAVELERS = 20;
const MIN_TRAVELERS = 1;
const MAX_TRIP_DAYS = 30;

// Input validation helper
function validateRequest(data: unknown): { valid: true; data: ItineraryRequest } | { valid: false; error: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const req = data as Record<string, unknown>;

  // Validate destination
  if (typeof req.destination !== 'string' || req.destination.trim().length === 0) {
    return { valid: false, error: 'Destination is required' };
  }
  if (req.destination.length > MAX_DESTINATION_LENGTH) {
    return { valid: false, error: `Destination must be ${MAX_DESTINATION_LENGTH} characters or less` };
  }

  // Validate startDate
  if (typeof req.startDate !== 'string' || !req.startDate) {
    return { valid: false, error: 'Start date is required' };
  }
  const startDate = new Date(req.startDate);
  if (isNaN(startDate.getTime())) {
    return { valid: false, error: 'Invalid start date format' };
  }

  // Validate endDate
  if (typeof req.endDate !== 'string' || !req.endDate) {
    return { valid: false, error: 'End date is required' };
  }
  const endDate = new Date(req.endDate);
  if (isNaN(endDate.getTime())) {
    return { valid: false, error: 'Invalid end date format' };
  }

  // Validate date range
  if (endDate < startDate) {
    return { valid: false, error: 'End date must be after start date' };
  }
  
  const tripDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  if (tripDays > MAX_TRIP_DAYS) {
    return { valid: false, error: `Trip cannot exceed ${MAX_TRIP_DAYS} days` };
  }

  // Validate travelers
  if (typeof req.travelers !== 'number' || !Number.isInteger(req.travelers)) {
    return { valid: false, error: 'Travelers must be a whole number' };
  }
  if (req.travelers < MIN_TRAVELERS || req.travelers > MAX_TRAVELERS) {
    return { valid: false, error: `Travelers must be between ${MIN_TRAVELERS} and ${MAX_TRAVELERS}` };
  }

  // Validate budget (optional)
  if (req.budget !== undefined && req.budget !== null) {
    if (typeof req.budget !== 'string') {
      return { valid: false, error: 'Budget must be a string' };
    }
    if (req.budget.length > MAX_BUDGET_LENGTH) {
      return { valid: false, error: `Budget must be ${MAX_BUDGET_LENGTH} characters or less` };
    }
  }

  // Validate interests (optional)
  if (req.interests !== undefined && req.interests !== null) {
    if (!Array.isArray(req.interests)) {
      return { valid: false, error: 'Interests must be an array' };
    }
    if (req.interests.length > MAX_INTERESTS_COUNT) {
      return { valid: false, error: `Maximum ${MAX_INTERESTS_COUNT} interests allowed` };
    }
    for (const interest of req.interests) {
      if (typeof interest !== 'string') {
        return { valid: false, error: 'Each interest must be a string' };
      }
      if (interest.length > MAX_INTEREST_LENGTH) {
        return { valid: false, error: `Each interest must be ${MAX_INTEREST_LENGTH} characters or less` };
      }
    }
  }

  // Sanitize strings for AI prompt injection
  const sanitize = (str: string) => str.replace(/[<>{}]/g, '').trim();

  return {
    valid: true,
    data: {
      destination: sanitize(req.destination as string),
      startDate: req.startDate as string,
      endDate: req.endDate as string,
      travelers: req.travelers as number,
      budget: req.budget ? sanitize(req.budget as string) : undefined,
      interests: req.interests ? (req.interests as string[]).map(sanitize) : undefined,
    },
  };
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify authentication
  const authResult = await verifyAuth(req, corsHeaders);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterApiKey) {
      throw new Error('OPENROUTER_API_KEY is not configured');
    }

    // Parse and validate request data
    let rawData: unknown;
    try {
      rawData = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validation = validateRequest(rawData);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { destination, startDate, endDate, travelers, budget, interests } = validation.data;

    // Calculate number of days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const numberOfDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const systemPrompt = `You are a JSON generator. You must return ONLY valid JSON with no markdown formatting or backticks. Do not include any explanations, text before, or text after the JSON.

You are an expert travel assistant creating detailed itineraries.

Return this exact JSON structure:
{"days":[{"day_number":1,"activities":[{"id":"unique-id","name":"Activity Name","description":"Brief description","price":"₪100-150","address":"Full address","time":"09:00-11:00","category":"attraction","image_search_term":"search term for photo"}]}]}

Rules:
- Generate exactly ${numberOfDays} days
- Include 4-6 activities per day
- category must be one of: attraction, restaurant, transport, accommodation, shopping, entertainment
- Prices in Israeli Shekels (₪)
- image_search_term should be specific (e.g., "Colosseum Rome sunset")
- Mix different categories throughout each day
- Consider realistic travel times between locations`;

    const userPrompt = `Create a ${numberOfDays}-day travel itinerary for ${destination}.
Number of travelers: ${travelers}
${budget ? `Budget: ${budget}` : ''}
${interests && interests.length > 0 ? `Interests: ${interests.join(', ')}` : ''}

Please provide a detailed day-by-day itinerary with specific activities, times, and locations.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://lovable.dev',
        'X-Title': 'Trip Planner App',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { role: 'user', content: `${systemPrompt}\n\n${userPrompt}` }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    // Handle specific error codes with user-friendly messages
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'שרתי ה-AI עמוסים כרגע, נסה שוב בעוד מספר שניות' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status >= 500) {
        return new Response(
          JSON.stringify({ error: 'שגיאה בשרת ה-AI, נסה שוב מאוחר יותר' }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI service error`);
    }

    const data = await response.json();

    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('No content in AI response');
      throw new Error('No content in response');
    }

    // Parse the JSON from the response - sanitize markdown code blocks
    let itinerary: { days: Day[] };
    try {
      // Strip markdown code blocks if present
      let jsonString = content.trim();
      
      // Remove ```json or ``` wrappers
      const jsonMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonString = jsonMatch[1].trim();
      }
      
      // Remove any leading/trailing non-JSON characters
      const jsonStart = jsonString.indexOf('{');
      const jsonEnd = jsonString.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        jsonString = jsonString.substring(jsonStart, jsonEnd + 1);
      }
      
      itinerary = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse itinerary JSON');
      throw new Error('שגיאה בעיבוד תשובת ה-AI, נסה שוב');
    }

    return new Response(JSON.stringify(itinerary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating itinerary:', error instanceof Error ? error.message : 'Unknown error');
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate itinerary';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
