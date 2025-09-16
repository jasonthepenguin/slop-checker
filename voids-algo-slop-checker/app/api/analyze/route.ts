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

    const { post, displayName } = await request.json();

    if (!post || typeof post !== 'string') {
      return NextResponse.json({ error: 'Invalid post content' }, { status: 400 });
    }

    if (post.length > 280) {
      return NextResponse.json({ error: 'Post exceeds 280 character limit' }, { status: 400 });
    }

    if (!displayName || typeof displayName !== 'string') {
      return NextResponse.json({ error: 'Invalid display name' }, { status: 400 });
    }

    if (!displayName.trim()) {
      return NextResponse.json({ error: 'Display name is required' }, { status: 400 });
    }

    if (displayName.length > 50) {
      return NextResponse.json({ error: 'Display name exceeds 50 character limit' }, { status: 400 });
    }

    const systemPrompt = `You are an X (Twitter) algorithm expert. Analyze the provided JSON payload and rate the content based on these criteria. The payload has this shape:
{
  "post": "<body of the post>",
  "displayName": "<author's display name>"
}

Apply the rules below considering BOTH the post body and the supplied display name:

TEXT FORMATTING & READABILITY (negative if present):
- All caps "shouting" text (except clear acronyms)
- Length extremes where the copy is far too short or saturates the sigmoid length curve
- Poor readability (rambling, incoherent, or unusually long words without structure)
- Low token entropy (repeating the same words or emoji with little variation)
- Excessive whitespace, odd spacing, or formatting spam
- Any external link (penalize all URLs rather than rewarding them)

OFFENSIVE OR SENSITIVE LANGUAGE (negative if present):
- Offensive, toxic, or aggressive language within the post
- Author display name that appears offensive (if no display name information is provided, default this to false)

SPAM OR LOW-QUALITY SIGNALS (negative if present):
- Spam or low-quality copy that would trip Grok spam filters
- High Grok "slop" characteristics (engagement bait, scraped text, obvious farming)
- Overly promotional or sales-focused content
- Very short, low-effort filler posts

SAFETY FILTERS (negative if present):
- NSFW or soft NSFW references
- Graphic gore or violence
- Private information exposure (phone numbers, emails, addresses, sensitive IDs)

STRUCTURAL METADATA (negative if excessive):
- Too many hashtags or trending tags
- Too many @mentions of other users
- Heavy media/card footprint suggested by the text (multiple image/video references or link previews)

POSITIVE FACTORS (decrease the slop score):
- Niche, informative, or educational content
- Thoughtful discussion or insights
- Original ideas or perspectives
- Encourages meaningful engagement (asks good questions, invites discussion)

Provide your analysis in JSON format with EXACTLY this structure:
{
  "slopScore": number from 0-100 (0 = excellent, 100 = terrible algo slop),
  "factors": {
    "allCaps": boolean,
    "spam": boolean,
    "tooManyHashtags": boolean,
    "tooManyMentions": boolean,
    "offensive": boolean,
    "offensiveDisplayName": boolean,
    "hasLinks": boolean,
    "nsfw": boolean,
    "graphicViolence": boolean,
    "promotional": boolean,
    "privateInfo": boolean,
    "excessiveWhitespace": boolean,
    "veryShortLowEffort": boolean,
    "lengthExtremes": boolean,
    "readabilityIssues": boolean,
    "lowTokenEntropy": boolean,
    "slopAnnotation": boolean,
    "mediaOrCardHeavy": boolean,
    "informative": boolean,
    "encouragesEngagement": boolean
  },
  "summary": "Brief explanation of the score",
  "recommendations": ["Array of specific improvements tailored to this post"]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-5-chat-latest',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify({ post, displayName }) }
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
