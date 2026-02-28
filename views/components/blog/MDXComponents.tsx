import Image from 'next/image';
import type { MDXComponents } from 'mdx/types';

function Callout({ type = 'info', children }: { type?: 'tip' | 'warning' | 'info'; children: React.ReactNode }) {
  const labels: Record<string, string> = { tip: 'Tip', warning: 'Warning', info: 'Note' };
  return (
    <div className={`blog-callout blog-callout-${type}`}>
      <span className="blog-callout-label">{labels[type]}</span>
      <div>{children}</div>
    </div>
  );
}

function BlogImage({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  return (
    <figure className="blog-figure">
      <Image src={src} alt={alt} width={800} height={450} className="blog-image" />
      {caption && <figcaption className="blog-caption">{caption}</figcaption>}
    </figure>
  );
}

function YouTube({ id }: { id: string }) {
  return (
    <div className="blog-video">
      <iframe
        src={`https://www.youtube.com/embed/${id}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="YouTube video"
      />
    </div>
  );
}

function Quote({ children, author }: { children: React.ReactNode; author?: string }) {
  return (
    <blockquote className="blog-quote">
      {children}
      {author && <cite className="blog-quote-author">{author}</cite>}
    </blockquote>
  );
}

function FAQSection({ children }: { children: React.ReactNode }) {
  return (
    <section className="blog-faq" aria-label="Frequently asked questions">
      <div className="blog-faq-kicker">Founder FAQ</div>
      <div className="blog-faq-grid">{children}</div>
    </section>
  );
}

function FAQItem({
  question,
  children,
}: {
  question: string;
  children: React.ReactNode;
}) {
  return (
    <details className="blog-faq-item">
      <summary className="blog-faq-question">{question}</summary>
      <div className="blog-faq-answer">{children}</div>
    </details>
  );
}

export const mdxComponents: MDXComponents = {
  Callout,
  BlogImage,
  YouTube,
  Quote,
  FAQSection,
  FAQItem,
  h1: (props) => <h1 className="blog-h1" {...props} />,
  h2: (props) => <h2 className="blog-h2" {...props} />,
  h3: (props) => <h3 className="blog-h3" {...props} />,
  p: (props) => <p className="blog-p" {...props} />,
  ul: (props) => <ul className="blog-ul" {...props} />,
  ol: (props) => <ol className="blog-ol" {...props} />,
  li: (props) => <li className="blog-li" {...props} />,
  a: (props) => (
    <a
      className="blog-link"
      target={props.href?.startsWith('http') ? '_blank' : undefined}
      rel={props.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      {...props}
    />
  ),
  code: (props) => <code className="blog-inline-code" {...props} />,
  pre: (props) => <pre className="blog-pre" {...props} />,
  hr: () => <hr className="blog-hr" />,
  img: (props) => (
    <Image
      src={props.src || ''}
      alt={props.alt || ''}
      width={800}
      height={450}
      className="blog-image"
    />
  ),
};
