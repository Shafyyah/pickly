
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, preferences } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Check for hardcoded path: moderate, small group, outdoors, creative, under $20
    if (
      preferences?.energy === 'moderate' &&
      preferences?.social === 'small' &&
      preferences?.location === 'outdoors' &&
      preferences?.type === 'creative' &&
      preferences?.budget === 'under20'
    ) {
      console.log('Using hardcoded activities for specific preference combination');
      
      const hardcodedActivities = [
        {
          title: "Nature Walk",
          summary: "Take a peaceful walk through nature, breathing fresh air and enjoying the scenery.",
          details: {
            description: "A relaxing outdoor experience perfect for moderate energy levels. Walk through local parks or trails with a small group of friends.",
            duration: "1-2 hours",
            instructions: [
              "Choose a nearby park or nature trail",
              "Invite 2-3 friends to join",
              "Wear comfortable walking shoes",
              "Bring water and enjoy the journey"
            ]
          },
          imageUrl: "/activities/nature-walk.png",
          mindMapNodes: [
            { label: "moderate energy", type: "input" },
            { label: "small group", type: "context" },
            { label: "outdoors", type: "context" },
            { label: "creative", type: "analysis" },
            { label: "under $20", type: "context" },
            { label: "Nature Walk", type: "final" }
          ]
        },
        {
          title: "Outdoor Photography",
          summary: "Capture beautiful moments in nature with your camera or smartphone.",
          details: {
            description: "Express your creativity through photography while exploring the outdoors with friends. Perfect for those who want to combine art with nature.",
            duration: "2-3 hours",
            instructions: [
              "Grab your camera or smartphone",
              "Meet with friends at a scenic location",
              "Experiment with different angles and lighting",
              "Share and discuss your favorite shots"
            ]
          },
          imageUrl: "/activities/outdoor-photography.png",
          mindMapNodes: [
            { label: "moderate energy", type: "input" },
            { label: "small group", type: "context" },
            { label: "outdoors", type: "context" },
            { label: "creative", type: "analysis" },
            { label: "under $20", type: "context" },
            { label: "Outdoor Photography", type: "final" }
          ]
        },
        {
          title: "Sketch Local Landmarks",
          summary: "Bring your sketchbook outside and draw the architecture and landmarks around you.",
          details: {
            description: "A creative outdoor activity that combines art and exploration. Perfect for a small group looking to express themselves artistically.",
            duration: "1.5-2.5 hours",
            instructions: [
              "Bring sketchbooks and drawing materials",
              "Choose a landmark or interesting location",
              "Sit comfortably and start sketching",
              "Share your artwork with the group"
            ]
          },
          imageUrl: "/activities/sketch-landmarks.png",
          mindMapNodes: [
            { label: "moderate energy", type: "input" },
            { label: "small group", type: "context" },
            { label: "outdoors", type: "context" },
            { label: "creative", type: "analysis" },
            { label: "under $20", type: "context" },
            { label: "Sketch Local Landmarks", type: "final" }
          ]
        }
      ];

      return new Response(
        JSON.stringify({ activities: hardcodedActivities }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const currentHour = new Date().getHours();
    const timeOfDay = currentHour < 12 ? 'morning' : currentHour < 17 ? 'afternoon' : 'evening';

    console.log('Generating activities for', timeOfDay);

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
            content: 'You are a lifestyle activity suggestion assistant. Generate spontaneous, practical activity ideas based on time of day and context.'
          },
          {
            role: 'user',
            content: `It's ${timeOfDay}. Generate 3 spontaneous activity suggestions based on these preferences:
            - Energy level: ${preferences?.energy || 'moderate'}
            - Social preference: ${preferences?.social || 'flexible'}
            - Location: ${preferences?.location || 'anywhere'}
            - Activity type: ${preferences?.type || 'any'}
            - Budget: ${preferences?.budget || 'flexible'}
            
            Return a JSON object with an "activities" array. Each activity should have:
            - title: string
            - summary: string (1-2 sentences)
            - details: object with description (string), duration (string), instructions (array of strings)
            - mindMapNodes: array of objects with label and type (input/context/analysis/final)
            
            For mindMapNodes, include nodes like: time of day (${timeOfDay}), energy (${preferences?.energy}), social (${preferences?.social}), location (${preferences?.location}), type (${preferences?.type}), budget (${preferences?.budget})
            
            Tailor activities to match their preferences exactly.`
          }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('AI gateway error:', error);
      throw new Error('Failed to generate activities');
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    console.log('Generated activities:', result.activities?.length);

    // Generate images for each activity
    const activitiesWithImages = await Promise.all(
      result.activities.map(async (activity: any) => {
        try {
          const imagePrompt = `${activity.title}: ${activity.summary}. Create a vibrant, engaging image that represents this activity.`;
          
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
                  content: imagePrompt
                }
              ],
              modalities: ['image', 'text']
            }),
          });

          if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
            return { ...activity, imageUrl };
          } else {
            console.error('Image generation failed for activity:', activity.title);
            return activity;
          }
        } catch (error) {
          console.error('Error generating image:', error);
          return activity;
        }
      })
    );

    return new Response(
      JSON.stringify({ activities: activitiesWithImages }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-activities:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
