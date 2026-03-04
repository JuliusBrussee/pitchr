export interface BlogAuthor {
  name: string;
  role: string;
  bio: string;
  sameAs?: string[];
}

const BLOG_AUTHORS: Record<string, BlogAuthor> = {
  'Julius Brussee': {
    name: 'Julius Brussee',
    role: 'Co-founder & Product Lead at Pitchr',
    bio: 'Julius is a co-founder at Pitchr and builds product systems for founder pitch scoring, feedback loops, and weekly shipping across the core coaching experience.',
    sameAs: ['https://pitchr.live/blog'],
  },
};

export function getBlogAuthor(name: string): BlogAuthor | null {
  return BLOG_AUTHORS[name] ?? null;
}
