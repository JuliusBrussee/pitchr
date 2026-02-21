'use client';

import React from 'react';
import { Search } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  message: string;
}

export function EmptyState({ icon, message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 opacity-60 py-12">
      {icon ?? <Search size={32} style={{ color: 'var(--text-muted)' }} />}
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        {message}
      </p>
    </div>
  );
}
