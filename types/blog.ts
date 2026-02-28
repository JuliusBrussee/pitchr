export interface BlogPostMeta {
  title: string;
  date: string;
  author: string;
  category: string;
  tags?: string[];
  excerpt: string;
  coverImage?: string;
  readingTime: number;
  featured?: boolean;
  slug: string;
}

export interface BlogPost {
  meta: BlogPostMeta;
  content: string;
}
