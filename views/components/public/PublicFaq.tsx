import type { PublicFaqItem } from '@/content/publicPages';

export function PublicFaq({ items }: { items: PublicFaqItem[] }) {
  return (
    <section
      aria-labelledby="public-page-faq-heading"
      className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-8"
    >
      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-[var(--accent)]">
          Trust block
        </p>
        <h2 id="public-page-faq-heading" className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
          Common questions
        </h2>
      </div>
      <div className="space-y-5">
        {items.map((item) => (
          <article key={item.question} className="space-y-2">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">{item.question}</h3>
            <p className="text-base leading-7 text-[var(--text-secondary)]">{item.answer}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
