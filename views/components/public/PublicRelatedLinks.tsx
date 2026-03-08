import Link from 'next/link';
import type { PublicRelatedLink } from '@/content/publicPages';

export function PublicRelatedLinks({ items }: { items: PublicRelatedLink[] }) {
  return (
    <nav
      aria-label="Keep exploring"
      className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-8"
    >
      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-[var(--accent)]">
          Related pages
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">Keep exploring</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-5 transition hover:-translate-y-0.5 hover:border-[var(--accent)]"
          >
            <p className="text-lg font-semibold text-[var(--text-primary)]">{item.label}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{item.description}</p>
          </Link>
        ))}
      </div>
    </nav>
  );
}
