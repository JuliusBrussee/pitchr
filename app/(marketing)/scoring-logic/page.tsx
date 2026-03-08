import { PUBLIC_PAGES } from '@/content/publicPages';
import { PublicPageShell } from '@/views/components/public/PublicPageShell';

export const dynamic = 'force-static';
export const revalidate = 3600;

export default function ScoringLogicPage() {
  return <PublicPageShell page={PUBLIC_PAGES.scoringLogic} />;
}
