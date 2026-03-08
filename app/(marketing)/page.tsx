import { getAllPosts } from '@/lib/blog';
import { LandingClient } from '@/views/components/landing/LandingClient';
import { HomeJsonLd } from '@/views/components/seo/HomeJsonLd';

export const dynamic = 'force-static';
export const revalidate = 3600;

export default function LandingPage() {
  const posts = getAllPosts().slice(0, 3);

  return (
    <>
      <HomeJsonLd />
      <LandingClient posts={posts} initialNowMs={Date.now()} />
    </>
  );
}
