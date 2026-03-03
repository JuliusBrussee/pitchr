import { getAllPosts } from '@/lib/blog';
import { LandingClient } from '@/views/components/landing/LandingClient';

export const dynamic = 'force-static';
export const revalidate = 3600;

export default function LandingPage() {
  const posts = getAllPosts().slice(0, 3);

  return <LandingClient posts={posts} />;
}
