'use client';

import { Search } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
}: SearchInputProps) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors ${className}`}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
      }}
    >
      <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent border-none outline-none text-sm placeholder:opacity-50"
        style={{ color: 'var(--text-primary)' }}
      />
    </div>
  );
}
