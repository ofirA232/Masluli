/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterApiKey) {
      throw new Error('OPENROUTER_API_KEY is not configured');
    }

    const requestData: ItineraryRequest = await req.json();
    const { destination, startDate, endDate, travelers, budget, interests } = requestData;

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

    console.log('Sending request to OpenRouter with model: google/gemini-2.5-flash-lite');

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
      console.error('OpenRouter API error:', response.status, errorText);
      
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
      
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenRouter response received');

    const content = data.choices?.[0]?.message?.content;
    console.log('Raw AI response content:', content?.substring(0, 500));
    
    if (!content) {
      console.error('No content in response. Full data:', JSON.stringify(data));
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
      
      console.log('Sanitized JSON (first 300 chars):', jsonString.substring(0, 300));
      itinerary = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse itinerary JSON. Raw content:', content);
      throw new Error('שגיאה בעיבוד תשובת ה-AI, נסה שוב');
    }

    return new Response(JSON.stringify(itinerary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating itinerary:', error);
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
