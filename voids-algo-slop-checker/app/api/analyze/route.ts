import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { checkRateLimit } from '@/lib/rateLimit';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await checkRateLimit(request);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please wait 30 seconds between analyses.',
          retryAfter: rateLimitResult.retryAfter
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
            'Retry-After': rateLimitResult.retryAfter.toString(),
          }
        }
      );
    }

    const { post } = await request.json();

    if (!post || typeof post !== 'string') {
      return NextResponse.json({ error: 'Invalid post content' }, { status: 400 });
    }

    if (post.length > 280) {
      return NextResponse.json({ error: 'Post exceeds 280 character limit' }, { status: 400 });
    }

    const systemPrompt = `You are an X (Twitter) algorithm expert. Analyze the following post and rate it based on these criteria:

NEGATIVE FACTORS (increase slop score):
- All caps "shouting" text (except acronyms)
- Spam or low-quality content
- Too many hashtags
- Too many mentions of other users ("@...")
- Offensive, toxic, or aggressive language
- Including external links
- NSFW or graphic content
- Overly promotional or sales-focused content
- Private information exposure (e.g., phone, email, address, sensitive IDs)
- Excessive whitespace, odd spacing, or formatting spam
- Very short, low-effort post (e.g., single word/emoji/filler)

POSITIVE FACTORS (decrease slop score):
- Niche, informative, or educational content
- Thoughtful discussion or insights
- Original ideas or perspectives
- Encourages meaningful engagement (asks good questions, invites discussion)

Provide your analysis in JSON format with EXACTLY this structure:
{
  "slopScore": number from 0-100 (0 = excellent, 100 = terrible algo slop),
  "factors": {
    "allCaps": boolean (true if post contains all caps shouting),
    "spam": boolean (true if spam or low-quality),
    "tooManyHashtags": boolean (true if hashtag count is excessive),
    "tooManyMentions": boolean (true if excessive @mentions of others),
    "offensive": boolean (true if offensive/toxic/aggressive),
    "hasLinks": boolean (true if contains external links),
    "nsfw": boolean (true if NSFW or graphic content),
    "promotional": boolean (true if overly promotional/sales-focused),
    "privateInfo": boolean (true if private info is exposed),
    "excessiveWhitespace": boolean (true if spacing/formatting looks spammy),
    "veryShortLowEffort": boolean (true if extremely short/low-effort),
    "informative": boolean (true if niche/informative/educational),
    "encouragesEngagement": boolean (true if invites meaningful engagement)
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
