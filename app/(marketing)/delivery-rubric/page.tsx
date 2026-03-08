import type { Metadata } from 'next';
import { PUBLIC_PAGES } from '@/content/publicPages';
import { buildPublicPageMetadata } from '@/lib/metadata/publicPageMetadata';
import { PublicPageShell } from '@/views/components/public/PublicPageShell';

export const dynamic = 'force-static';
export const revalidate = 3600;

const PAGE = PUBLIC_PAGES.deliveryRubric;

export function generateMetadata(): Metadata {
  return buildPublicPageMetadata(PAGE);
}

export default function DeliveryRubricPage() {
  return <PublicPageShell page={PAGE} />;
}
