import type { PublicPageDefinition } from '@/content/publicPages';
import { PublicBreadcrumbs } from '@/views/components/public/PublicBreadcrumbs';
import { PublicFaq } from '@/views/components/public/PublicFaq';
import { PublicRelatedLinks } from '@/views/components/public/PublicRelatedLinks';

export function PublicPageShell({ page }: { page: PublicPageDefinition }) {
  return (
    <main className="bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 py-16 md:px-10 md:py-20">
        <PublicBreadcrumbs items={page.breadcrumbs} />

        <section className="space-y-5">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-[var(--accent)]">
            {page.hero.eyebrow}
          </p>
          <div className="max-w-4xl space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
              {page.hero.question}
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-[var(--text-secondary)]">
              {page.hero.answer}
            </p>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          {page.sections.map((section) => (
            <article
              key={section.title}
              className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-8"
            >
              <h2 className="text-2xl font-semibold text-[var(--text-primary)]">{section.title}</h2>
              <p className="mt-4 text-base leading-7 text-[var(--text-secondary)]">
                {section.body}
              </p>
            </article>
          ))}
        </section>

        <PublicFaq items={page.faqs} />
        <PublicRelatedLinks items={page.relatedLinks} />
      </div>
    </main>
  );
}
