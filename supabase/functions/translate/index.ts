import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid request body. Expected JSON.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { text, targetLang, sourceLang = 'en', context } = body;

    if (!text || !targetLang) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: text and targetLang' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Translation request:', { text, sourceLang, targetLang, context });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if translation already exists in cache
    const { data: cachedTranslation } = await supabase
      .from('translations')
      .select('translated_text')
      .eq('source_text', text)
      .eq('source_lang', sourceLang)
      .eq('target_lang', targetLang)
      .eq('context', context || '')
      .maybeSingle();

    if (cachedTranslation) {
      console.log('Returning cached translation');
      return new Response(
        JSON.stringify({ translatedText: cachedTranslation.translated_text, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get LOVABLE_API_KEY
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Prepare context-aware prompt
    const systemPrompt = `You are a professional translator specializing in business and commerce content. 
Translate the following text from ${sourceLang === 'en' ? 'English' : 'Arabic'} to ${targetLang === 'ar' ? 'Arabic' : 'English'}.
${context ? `Context: This text is ${context}. Ensure the translation is appropriate for this context.` : ''}
Provide ONLY the translation without any explanations or additional text.
Maintain the tone, style, and any technical terms appropriately.`;

    // Call Lovable AI for translation
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Translation service rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Translation service requires payment. Please contact support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error('AI translation failed');
    }

    const aiData = await aiResponse.json();
    const translatedText = aiData.choices[0].message.content.trim();

    console.log('AI translation successful');

    // Cache the translation
    await supabase
      .from('translations')
      .insert({
        source_text: text,
        source_lang: sourceLang,
        target_lang: targetLang,
        translated_text: translatedText,
        context: context || null,
      });

    return new Response(
      JSON.stringify({ translatedText, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Translation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
