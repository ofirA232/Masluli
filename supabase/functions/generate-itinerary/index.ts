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

interface Coordinates {
  lat: number;
  lng: number;
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
  coordinates?: Coordinates;
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

function escapeControlCharsInStrings(input: string): string {
  let out = '';
  let inString = false;
  let escaped = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (escaped) {
      out += ch;
      escaped = false;
      continue;
    }

    if (ch === '\\') {
      out += ch;
      escaped = true;
      continue;
    }

    if (ch === '"') {
      out += ch;
      inString = !inString;
      continue;
    }

    if (inString) {
      // Raw newlines/tabs inside JSON strings are invalid. Convert them.
      if (ch === '\n') {
        out += '\\n';
        continue;
      }
      if (ch === '\r') {
        // Normalize CRLF -> \n (skip CR)
        continue;
      }
      if (ch === '\t') {
        out += '\\t';
        continue;
      }

      const code = ch.charCodeAt(0);
      if (code < 0x20) {
        out += ' ';
        continue;
      }
    }

    out += ch;
  }

  return out;
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

    const buildSystemPrompt = (daysInChunk: number, startDayNumber: number) => {
      const endDayNumber = startDayNumber + daysInChunk - 1;
      return `You are a JSON generator. You must return ONLY valid JSON with no markdown formatting or backticks. Do not include any explanations, text before, or text after the JSON.

You are an expert travel assistant creating detailed itineraries.

Return this exact JSON structure:
{"days":[{"day_number":${startDayNumber},"activities":[{"id":"unique-id","name":"Activity Name","description":"A meaningful 2-3 sentence summary","price":"₪100-150","address":"Full address","time":"09:00-11:00","category":"attraction","image_search_term":"search term for photo","coordinates":{"lat":32.0853,"lng":34.7818},"is_paid":true,"booking_url":"https://official-booking-site.com or null"}]}]}

Rules:
- LANGUAGE: ALL text content (name, description, address) MUST be written in Hebrew (עברית). Only the id, image_search_term, and booking_url should be in English.
- Generate exactly ${daysInChunk} days
- day_number MUST start at ${startDayNumber} and end at ${endDayNumber}
- Include 4-6 activities per day
- category must be one of: attraction, restaurant, transport, accommodation, shopping, entertainment
- Prices in Israeli Shekels (₪)
- image_search_term should be specific and in English (e.g., "Colosseum Rome sunset")
- Mix different categories throughout each day
- Consider realistic travel times between locations
- IMPORTANT: For each activity, provide accurate GPS coordinates (lat/lng) for the location. Use real coordinates for the actual addresses.
- CRITICAL JSON RULES: All string values MUST be a single line (no raw newlines). Do NOT include double quotes (") inside any string value.
- id must be a short lowercase kebab-case slug in English (no spaces), e.g., "eiffel-tower-visit".
- DESCRIPTION QUALITY: For the description field, provide a meaningful 2-3 sentence summary in Hebrew explaining what the attraction is and why it is famous or worth visiting. Do NOT use generic phrases. Example for London Eye: "גלגל התצפית הגבוה באירופה, המציע נוף פנורמי מרהיב של 360 מעלות על קו הרקיע של לונדון. אטרקציה חובה המספקת הזדמנויות צילום מדהימות ביום ובלילה."
- TICKETING: Set is_paid to true if the activity requires purchasing tickets or paying an entry fee. Set to false for free activities. For paid activities, provide the official booking_url if known (e.g., museum websites, attraction ticket pages), otherwise set to null.`;
    };

    const buildUserPrompt = (daysInChunk: number, startDayNumber: number) => {
      const endDayNumber = startDayNumber + daysInChunk - 1;
      return `Create days ${startDayNumber}-${endDayNumber} of a ${numberOfDays}-day travel itinerary for ${destination}.
Number of travelers: ${travelers}
${budget ? `Budget: ${budget}` : ''}
${interests && interests.length > 0 ? `Interests: ${interests.join(', ')}` : ''}

Please provide a detailed day-by-day itinerary with specific activities, times, and locations.`;
    };

    const callAi = async (systemPromptText: string, userPromptText: string) => {
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
          messages: [{ role: 'user', content: `${systemPromptText}\n\n${userPromptText}` }],
          temperature: 0.2,
          max_tokens: 8000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter API error:', response.status, errorText);

        if (response.status === 429) {
          return { ok: false as const, status: 429 as const, error: 'שרתי ה-AI עמוסים כרגע, נסה שוב בעוד מספר שניות' };
        }

        if (response.status >= 500) {
          return { ok: false as const, status: 502 as const, error: 'שגיאה בשרת ה-AI, נסה שוב מאוחר יותר' };
        }

        return { ok: false as const, status: 502 as const, error: 'שגיאה בשירות ה-AI, נסה שוב' };
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        console.error('No content in AI response');
        return { ok: false as const, status: 502 as const, error: 'שגיאה בשירות ה-AI, נסה שוב' };
      }

      return { ok: true as const, content };
    };

    const parseItineraryFromContent = (content: string, chunkLabel: string): { days: Day[] } => {
      try {
        let jsonString = content.trim();

        // Remove ```json or ``` wrappers
        const jsonMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) jsonString = jsonMatch[1].trim();

        // Remove any leading/trailing non-JSON characters
        const jsonStart = jsonString.indexOf('{');
        const jsonEnd = jsonString.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
          jsonString = jsonString.substring(jsonStart, jsonEnd + 1);
        }

        // Repair common JSON issues from LLMs (e.g., raw newlines inside strings, trailing commas)
        jsonString = escapeControlCharsInStrings(jsonString);

        jsonString = jsonString
          .replace(/,\s*([}\]])/g, '$1')
          .replace(/\u0000/g, '');

        const itinerary = JSON.parse(jsonString) as { days: Day[] };

        if (!itinerary.days || !Array.isArray(itinerary.days)) {
          console.error('Invalid itinerary structure - missing days array', chunkLabel);
          throw new Error('Invalid structure');
        }

        itinerary.days = itinerary.days.map((day) => ({
          ...day,
          activities: (day.activities || []).map((activity, idx) => ({
            ...activity,
            id: activity.id || `day${day.day_number}-activity${idx}-${Date.now()}`,
            coordinates:
              activity.coordinates &&
              typeof activity.coordinates.lat === 'number' &&
              typeof activity.coordinates.lng === 'number'
                ? activity.coordinates
                : undefined,
          })),
        }));

        return itinerary;
      } catch (parseError) {
        console.error('Failed to parse itinerary JSON:', chunkLabel, parseError);
        console.error('Content preview:', chunkLabel, content.substring(0, 800));
        throw new Error('שגיאה בעיבוד תשובת ה-AI, נסה שוב');
      }
    };

    // For long trips, generate in chunks to avoid AI truncation (which breaks JSON)
    const CHUNK_DAYS = 5;
    const mergedDays: Day[] = [];

    for (let startDay = 1; startDay <= numberOfDays; startDay += CHUNK_DAYS) {
      const daysInChunk = Math.min(CHUNK_DAYS, numberOfDays - startDay + 1);
      const chunkLabel = `chunk ${startDay}-${startDay + daysInChunk - 1}`;

      const systemPrompt = buildSystemPrompt(daysInChunk, startDay);
      const baseUserPrompt = buildUserPrompt(daysInChunk, startDay);

      // Retry once if the model returns invalid JSON
      let parsed = false;
      for (let attempt = 1; attempt <= 2; attempt++) {
        const userPrompt =
          attempt === 1
            ? baseUserPrompt
            : `${baseUserPrompt}\n\nCRITICAL: Your previous response was invalid JSON. Return corrected JSON ONLY. Ensure there are no raw newlines inside any string values and no quotes inside strings.`;

        const aiResult = await callAi(systemPrompt, userPrompt);
        if (!aiResult.ok) {
          return new Response(JSON.stringify({ error: aiResult.error }), {
            status: aiResult.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        try {
          const chunkItinerary = parseItineraryFromContent(aiResult.content, chunkLabel);
          mergedDays.push(...chunkItinerary.days);
          parsed = true;
          break;
        } catch (e) {
          console.warn('Chunk JSON parse failed, retrying:', chunkLabel, 'attempt', attempt);
          if (attempt === 2) throw e;
        }
      }

      if (!parsed) {
        throw new Error('שגיאה בעיבוד תשובת ה-AI, נסה שוב');
      }
    }

    mergedDays.sort((a, b) => a.day_number - b.day_number);

    return new Response(JSON.stringify({ days: mergedDays }), {
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
