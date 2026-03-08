import Link from 'next/link';
import type { PublicBreadcrumb } from '@/content/publicPages';

export function PublicBreadcrumbs({ items }: { items: PublicBreadcrumb[] }) {
  return (
    <nav aria-label="Breadcrumbs">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-muted)]">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={item.href} className="flex items-center gap-2">
              {isLast ? (
                <span aria-current="page" className="font-medium text-[var(--text-primary)]">
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className="transition hover:text-[var(--text-primary)]">
                  {item.label}
                </Link>
              )}
              {!isLast ? <span aria-hidden="true">/</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
