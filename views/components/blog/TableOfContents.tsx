'use client';

import { useEffect, useState } from 'react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents() {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const article = document.querySelector('.blog-content');
    if (!article) return;

    const elements = article.querySelectorAll('h2, h3');
    const items: TocItem[] = Array.from(elements).map((el) => ({
      id: el.id,
      text: el.textContent || '',
      level: el.tagName === 'H2' ? 2 : 3,
    }));
    setHeadings(items);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-80px 0px -70% 0px' }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  if (headings.length === 0) return null;

  return (
    <nav className="blog-toc">
      <h4 className="blog-toc-title">On this page</h4>
      <ul className="blog-toc-list">
        {headings.map((h) => (
          <li
            key={h.id}
            className={`blog-toc-item ${h.level === 3 ? 'blog-toc-indent' : ''} ${activeId === h.id ? 'blog-toc-active' : ''}`}
          >
            <a href={`#${h.id}`} className="blog-toc-link">
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
