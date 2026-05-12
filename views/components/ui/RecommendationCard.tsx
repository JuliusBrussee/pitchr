'use client';

import { Target } from 'lucide-react';
import { TagPill } from './TagPill';
import { getRubricColor } from './colors';
import { RECOMMENDATION_GRADIENTS, RECOMMENDATION_ICONS } from '@/lib/analytics';

interface RecommendationCardProps {
  title: string;
  description: string;
  tag: string;
  delay: number;
}

export function RecommendationCard({ title, description, tag, delay }: RecommendationCardProps) {
  const Icon = RECOMMENDATION_ICONS[tag] ?? Target;
  const gradient = RECOMMENDATION_GRADIENTS[tag] ?? 'linear-gradient(135deg, #6b7280, #4b5563)';
  const tagColor = getRubricColor(tag);

  return (
    <div
      className="rounded-xl border p-4 flex flex-col gap-3 transition-all duration-200 animate-fade-in-up hover:scale-[1.01]"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
        animationDelay: `${540 + delay * 60}ms`,
        animationFillMode: 'both',
      }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: gradient }}
        >
          <Icon size={16} className="text-white" />
        </div>
        <h3
          className="text-sm font-semibold leading-snug"
          style={{ color: 'var(--text-primary)' }}
        >
          {title}
        </h3>
      </div>
      <p
        className="text-xs leading-relaxed"
        style={{ color: 'var(--text-secondary)' }}
      >
        {description}
      </p>
      <div className="self-start">
        <TagPill
          label={tag.charAt(0).toUpperCase() + tag.slice(1)}
          color={tagColor}
        />
      </div>
    </div>
  );
}
