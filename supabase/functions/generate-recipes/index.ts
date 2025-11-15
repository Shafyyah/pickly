
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ingredients, userId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Generating recipes for ingredients:', ingredients);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful recipe assistant. Generate 3 recipe suggestions based on available ingredients. Each recipe should include title, summary, ingredients list, cooking steps, prep time, and tips.'
          },
          {
            role: 'user',
            content: `Generate 3 recipes using these ingredients: ${ingredients.join(', ')}. 
            
            Return a JSON object with a "recipes" array. Each recipe should have:
            - title: string
            - summary: string (1-2 sentences)
            - details: object with ingredients (array), steps (array), time (string), tips (string)
            - mindMapNodes: array of objects with label and type (input/context/analysis/final)
            
            For mindMapNodes, include nodes like: detected ingredients, time of day, user preferences, cooking complexity, etc.`
          }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('AI gateway error:', error);
      throw new Error('Failed to generate recipes');
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    console.log('Generated recipes:', result.recipes?.length);

    return new Response(
      JSON.stringify({ recipes: result.recipes }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-recipes:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
