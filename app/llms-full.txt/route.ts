import { getAllPosts, getPostBySlug } from '@/lib/blog';

export const dynamic = 'force-static';
export const revalidate = 3600;

function stripMdxComponents(content: string): string {
  return content
    // Remove JSX component tags but keep inner text
    .replace(/<Callout[^>]*>\n?/g, '')
    .replace(/<\/Callout>/g, '')
    .replace(/<FAQItem[^>]*question="([^"]+)"[^>]*>/g, '**Q: $1**\n')
    .replace(/<\/FAQItem>/g, '')
    .replace(/<[A-Z][a-zA-Z]*[^>]*\/>/g, '') // self-closing components
    .replace(/<[A-Z][a-zA-Z]*[^>]*>([\s\S]*?)<\/[A-Z][a-zA-Z]*>/g, '$1') // remaining components
    // Clean up excessive blank lines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function GET() {
  const posts = getAllPosts();

  const sections: string[] = [
    '# Pitchr — Full Content',
    '',
    '> AI pitch coach for startup founders. Record or paste your pitch, get an investor-grade score out of 100, ranked fixes, a rewritten script, and delivery metrics.',
    '',
    'Pitchr helps founders practice and improve their startup pitches before investor meetings. It analyzes spoken delivery across five dimensions: structure, clarity, evidence, market positioning, and delivery.',
    '',
    '## How It Works',
    '',
    '1. Record or paste your pitch (audio or text)',
    '2. Pitchr scores your delivery out of 100 across 5 rubric categories',
    '3. Get ranked, prioritized fixes with specific rewrite suggestions',
    '4. Receive a fully rewritten script incorporating all improvements',
    '5. Track progress over time with pitch history and analytics',
    '',
    '## Pitch Modes',
    '',
    '- **Elevator Pitch**: 30-60 second quick pitch for networking, chance encounters, and initial intros',
    '- **VC Pitch**: Full investor pitch covering problem, solution, market, traction, team, and ask',
    '',
    '## Scoring Rubric',
    '',
    'Each pitch is scored across 5 categories:',
    '- **Structure** (20 pts): Logical flow, transitions, opening hook, clear ask',
    '- **Clarity** (20 pts): Plain language, no jargon, concise delivery',
    '- **Evidence** (20 pts): Data-backed claims, specific metrics, credible proof points',
    '- **Market** (20 pts): TAM/SAM/SOM awareness, competitive positioning, timing',
    '- **Delivery** (20 pts): Pace, filler words, confidence, vocal variety',
    '',
    '---',
    '',
  ];

  // Add each blog post
  for (const postMeta of posts) {
    const post = getPostBySlug(postMeta.slug);
    if (!post) continue;

    const cleanContent = stripMdxComponents(post.content);

    sections.push(`## ${post.meta.title}`);
    sections.push('');
    sections.push(`*Published: ${post.meta.date}${post.meta.lastModified ? ` | Updated: ${post.meta.lastModified}` : ''} | By: ${post.meta.author} | Category: ${post.meta.category}*`);
    sections.push('');
    sections.push(`> ${post.meta.excerpt}`);
    sections.push('');
    sections.push(`URL: https://pitchr.live/blog/${postMeta.slug}`);
    sections.push('');
    sections.push(cleanContent);
    sections.push('');
    sections.push('---');
    sections.push('');
  }

  const body = sections.join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
