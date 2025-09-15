import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { post } = await request.json();

    if (!post || typeof post !== 'string') {
      return NextResponse.json({ error: 'Invalid post content' }, { status: 400 });
    }

    const systemPrompt = `You are an X (Twitter) algorithm expert. Analyze the following post and rate it based on these criteria:

NEGATIVE FACTORS (increase slop score):
- All caps "shouting" text (except acronyms)
- Spam, low-quality content, or excessive hashtags
- Offensive, toxic, or aggressive language
- Including external links
- NSFW or graphic content
- Overly promotional or sales-focused content

POSITIVE FACTORS (decrease slop score):
- Niche, informative, or educational content
- Thoughtful discussion or insights
- Original ideas or perspectives

Provide your analysis in JSON format with EXACTLY this structure:
{
  "slopScore": number from 0-100 (0 = excellent, 100 = terrible algo slop),
  "factors": {
    "allCaps": boolean (true if post contains all caps shouting),
    "spam": boolean (true if spam/low-quality/excessive hashtags),
    "offensive": boolean (true if offensive/toxic/aggressive),
    "hasLinks": boolean (true if contains external links),
    "nsfw": boolean (true if NSFW or graphic content),
    "promotional": boolean (true if overly promotional/sales-focused),
    "informative": boolean (true if niche/informative/educational)
  },
  "summary": "Brief explanation of the score",
  "recommendations": ["Array of specific improvements"]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-5-chat-latest',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyze this post: "${post}"` }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const analysis = JSON.parse(completion.choices[0].message.content || '{}');

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze post' },
      { status: 500 }
    );
  }
}