import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

serve(async (req) => {
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

    const systemPrompt = `You are an expert travel assistant. Generate a detailed itinerary in JSON format. 
For each activity, provide a short 'image_search_term' (e.g., 'Colosseum Rome') so the frontend can fetch a real photo.

IMPORTANT: Your response must be ONLY valid JSON, no additional text or markdown. Follow this exact structure:
{
  "days": [
    {
      "day_number": 1,
      "activities": [
        {
          "id": "unique-id-1",
          "name": "Activity Name",
          "description": "Brief description of the activity",
          "price": "₪100-150 / Free / Included",
          "address": "Full address of the location",
          "time": "09:00-11:00",
          "category": "attraction|restaurant|transport|accommodation|shopping|entertainment",
          "image_search_term": "search term for photo"
        }
      ]
    }
  ]
}

Guidelines:
- Generate ${numberOfDays} days of activities
- Include 4-6 activities per day
- Mix different categories: attractions, restaurants, entertainment
- Consider travel time between locations
- Be specific with addresses and times
- Prices should be in Israeli Shekels (₪)
- image_search_term should be specific and descriptive for finding relevant photos`;

    const userPrompt = `Create a ${numberOfDays}-day travel itinerary for ${destination}.
Number of travelers: ${travelers}
${budget ? `Budget: ${budget}` : ''}
${interests && interests.length > 0 ? `Interests: ${interests.join(', ')}` : ''}

Please provide a detailed day-by-day itinerary with specific activities, times, and locations.`;

    console.log('Sending request to OpenRouter with model: google/gemini-2.0-flash-exp:free');

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://lovable.dev',
        'X-Title': 'Trip Planner App',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', errorText);
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenRouter response received');

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No content in response');
    }

    // Parse the JSON from the response
    let itinerary: { days: Day[] };
    try {
      // Try to extract JSON if it's wrapped in markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonString = jsonMatch ? jsonMatch[1].trim() : content.trim();
      itinerary = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse itinerary JSON:', content);
      throw new Error('Failed to parse itinerary response');
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
