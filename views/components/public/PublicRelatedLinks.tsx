import Link from 'next/link';
import type { PublicRelatedLink } from '@/content/publicPages';

function ArrowUpRight() {
  return (
    <svg
      className="pp-related-link-arrow"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 17 17 7" />
      <path d="M7 7h10v10" />
    </svg>
  );
}

export function PublicRelatedLinks({
  items,
  currentHref,
}: {
  items: PublicRelatedLink[];
  currentHref?: string;
}) {
  const filtered = items.filter((item) => item.href !== currentHref);

  return (
    <>
      <div className="pp-related-header">
        <p className="pp-related-eyebrow">Related pages</p>
        <h2 className="pp-related-title">Keep exploring</h2>
      </div>
      <div className="pp-related-grid">
        {filtered.map((item) => (
          <Link key={item.href} href={item.href} className="pp-related-link">
            <div>
              <p className="pp-related-link-label">{item.label}</p>
              <p className="pp-related-link-desc">{item.description}</p>
            </div>
            <ArrowUpRight />
          </Link>
        ))}
      </div>
    </>
  );
}
