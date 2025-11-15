
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
            content: 'You are a friendly recipe assistant. Generate 3 recipe suggestions based on available ingredients. Keep descriptions casual, fun, and inviting - like chatting with a foodie friend!'
          },
          {
            role: 'user',
            content: `Generate 3 recipes using these ingredients: ${ingredients.join(', ')}. 
            
            Return a JSON object with a "recipes" array. Each recipe should have:
            - title: string
            - summary: string (1 short, friendly sentence - keep it casual and appetizing!)
            - details: object with ingredients (array), steps (array), time (string), tips (string)
            - imagePrompt: string (detailed description for generating an appetizing food photo of the finished dish)`
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

    // Array of personalized context notes
    const contextNotes = [
      "You usually cook quick meals on weekdays.",
      "You often eat high protein meals.",
      "You tend to prefer comfort food in the evenings.",
      "You've been making more vegetarian dishes lately.",
      "You like trying new cuisines on weekends.",
      "You typically cook for yourself or a small group.",
      "You enjoy meals that are easy to prep ahead.",
      "You prefer recipes with minimal cleanup.",
      "You've been focusing on healthier options recently.",
      "You like meals that work well as leftovers.",
      "You tend to cook lighter meals during the week.",
      "You often make batch cooking recipes.",
      "You prefer one-pot meals when short on time.",
      "You enjoy experimenting with new flavors.",
      "You typically stick to familiar ingredients."
    ];

    // Generate images for each recipe and add personalized context
    const recipesWithImages = await Promise.all(
      result.recipes.map(async (recipe: any, index: number) => {
        try {
          const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash-image-preview',
              messages: [
                {
                  role: 'user',
                  content: `Generate a beautiful, appetizing photo of: ${recipe.imagePrompt || recipe.title}. Professional food photography style, well-lit, high quality.`
                }
              ],
              modalities: ['image', 'text']
            }),
          });

          // Add random personalized context note
          const randomNote = contextNotes[Math.floor(Math.random() * contextNotes.length)];
          const contextNote = `*${randomNote}*`;

          if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
            return { 
              ...recipe, 
              imageUrl,
              summary: `${contextNote}\n\n${recipe.summary}`
            };
          }
          return { 
            ...recipe,
            summary: `${contextNote}\n\n${recipe.summary}`
          };
        } catch (error) {
          console.error('Error generating image for recipe:', error);
          return recipe;
        }
      })
    );

    return new Response(
      JSON.stringify({ recipes: recipesWithImages }),
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
