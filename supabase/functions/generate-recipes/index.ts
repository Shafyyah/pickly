
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
            content: 'You are a friendly recipe assistant. Generate 3 recipe suggestions based on available ingredients.'
          },
          {
            role: 'user',
            content: `Generate 3 recipes using these ingredients: ${ingredients.join(', ')}. For each recipe, create a personalized context note about cooking habits that matches the recipe type (e.g., for veggie dishes mention vegetarian cooking, for quick recipes mention weekday meals, for protein-rich mention high protein preferences).`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_recipes",
              description: "Generate recipe suggestions with personalized context",
              parameters: {
                type: "object",
                properties: {
                  recipes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Recipe name" },
                        summary: { type: "string", description: "Short, friendly sentence about the recipe" },
                        contextNote: { type: "string", description: "Personalized note about user cooking habits relevant to this recipe" },
                        details: {
                          type: "object",
                          properties: {
                            ingredients: { type: "array", items: { type: "string" } },
                            steps: { type: "array", items: { type: "string" } },
                            time: { type: "string" },
                            tips: { type: "string" }
                          },
                          required: ["ingredients", "steps", "time", "tips"]
                        },
                        imagePrompt: { type: "string", description: "Detailed description for food photo" }
                      },
                      required: ["title", "summary", "contextNote", "details", "imagePrompt"]
                    }
                  }
                },
                required: ["recipes"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_recipes" } }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('AI gateway error:', error);
      throw new Error('Failed to generate recipes');
    }

    const data = await response.json();
    
    // Extract structured data from tool call
    const toolCall = data.choices[0].message.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in response');
    }
    
    const result = JSON.parse(toolCall.function.arguments);
    console.log('Generated recipes:', result.recipes?.length);

    // Generate images for each recipe
    const recipesWithImages = await Promise.all(
      result.recipes.map(async (recipe: any) => {
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

          // Format the context note from the AI
          const contextNote = recipe.contextNote ? `*${recipe.contextNote}*` : "";

          if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
            return { 
              ...recipe, 
              imageUrl,
              summary: contextNote ? `${contextNote}\n\n${recipe.summary}` : recipe.summary
            };
          }
          return { 
            ...recipe,
            summary: contextNote ? `${contextNote}\n\n${recipe.summary}` : recipe.summary
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
