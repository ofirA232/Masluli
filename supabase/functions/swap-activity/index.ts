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

interface SwapActivityRequest {
  destination: string;
  interests?: string[];
  day_number: number;
  time_slot: string;
  rejected_activity_name: string;
}

// Validation constants
const MAX_DESTINATION_LENGTH = 100;
const MAX_INTEREST_LENGTH = 50;
const MAX_INTERESTS_COUNT = 10;
const MAX_TIME_SLOT_LENGTH = 50;
const MAX_ACTIVITY_NAME_LENGTH = 200;
const MAX_DAY_NUMBER = 30;
const MIN_DAY_NUMBER = 1;

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

// Sanitize strings for AI prompt injection
function sanitize(str: string): string {
  return str.replace(/[<>{}]/g, '').trim();
}

// Input validation helper
function validateRequest(data: unknown): { valid: true; data: SwapActivityRequest } | { valid: false; error: string } {
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

  // Validate day_number
  if (typeof req.day_number !== 'number' || !Number.isInteger(req.day_number)) {
    return { valid: false, error: 'Day number must be a whole number' };
  }
  if (req.day_number < MIN_DAY_NUMBER || req.day_number > MAX_DAY_NUMBER) {
    return { valid: false, error: `Day number must be between ${MIN_DAY_NUMBER} and ${MAX_DAY_NUMBER}` };
  }

  // Validate time_slot
  if (typeof req.time_slot !== 'string' || req.time_slot.trim().length === 0) {
    return { valid: false, error: 'Time slot is required' };
  }
  if (req.time_slot.length > MAX_TIME_SLOT_LENGTH) {
    return { valid: false, error: `Time slot must be ${MAX_TIME_SLOT_LENGTH} characters or less` };
  }

  // Validate rejected_activity_name
  if (typeof req.rejected_activity_name !== 'string' || req.rejected_activity_name.trim().length === 0) {
    return { valid: false, error: 'Rejected activity name is required' };
  }
  if (req.rejected_activity_name.length > MAX_ACTIVITY_NAME_LENGTH) {
    return { valid: false, error: `Activity name must be ${MAX_ACTIVITY_NAME_LENGTH} characters or less` };
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

  return {
    valid: true,
    data: {
      destination: sanitize(req.destination as string),
      day_number: req.day_number as number,
      time_slot: sanitize(req.time_slot as string),
      rejected_activity_name: sanitize(req.rejected_activity_name as string),
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

    const { destination, interests, day_number, time_slot, rejected_activity_name } = validation.data;

    const systemPrompt = `You are a JSON generator. You must return ONLY valid JSON with no markdown formatting or backticks. Do not include any explanations, text before, or text after the JSON.

You are an expert travel assistant suggesting alternative activities.

Return this exact JSON structure for a SINGLE activity:
{"id":"unique-id","name":"Activity Name","description":"Brief description","price":"₪100-150","address":"Full address","time":"09:00-11:00","category":"attraction","image_search_term":"search term for photo"}

Rules:
- Generate exactly ONE activity as a replacement
- category must be one of: attraction, restaurant, transport, accommodation, shopping, entertainment
- Prices in Israeli Shekels (₪)
- image_search_term should be specific (e.g., "Colosseum Rome sunset")
- The time should be appropriate for the ${time_slot} time slot
- The activity must be different from: ${rejected_activity_name}`;

    const userPrompt = `Suggest ONE alternative activity for ${destination} during ${time_slot} (Day ${day_number}).
${interests && interests.length > 0 ? `Interests: ${interests.join(', ')}` : ''}

Do NOT suggest: "${rejected_activity_name}"

Provide a single activity that fits the time slot and interests.`;

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
        temperature: 0.8,
        max_tokens: 1000,
      }),
    });

    // Handle specific error codes with user-friendly messages
    if (!response.ok) {
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
      
      throw new Error('AI service error');
    }

    const data = await response.json();

    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('No content in AI response');
      throw new Error('No content in response');
    }

    // Parse the JSON from the response - sanitize markdown code blocks
    let activity: Activity;
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
      
      activity = JSON.parse(jsonString);
      
      // Ensure the activity has a unique ID
      if (!activity.id) {
        activity.id = `swap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
    } catch (parseError) {
      console.error('Failed to parse activity JSON');
      throw new Error('שגיאה בעיבוד תשובת ה-AI, נסה שוב');
    }

    return new Response(JSON.stringify(activity), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error swapping activity:', error instanceof Error ? error.message : 'Unknown error');
    const errorMessage = error instanceof Error ? error.message : 'Failed to swap activity';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
