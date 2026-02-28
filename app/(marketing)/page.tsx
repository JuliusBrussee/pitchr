import { getAllPosts } from '@/lib/blog';
import { LandingClient } from '@/views/components/landing/LandingClient';

export default function LandingPage() {
  const posts = getAllPosts().slice(0, 3);

  return <LandingClient posts={posts} />;
}
