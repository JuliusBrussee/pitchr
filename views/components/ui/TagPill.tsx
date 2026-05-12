'use client';

interface TagPillProps {
  label: string;
  color: string;
  bgColor?: string;
}

export function TagPill({ label, color, bgColor }: TagPillProps) {
  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-lg whitespace-nowrap"
      style={{
        color,
        backgroundColor: bgColor ?? `${color}1a`,
      }}
    >
      {label}
    </span>
  );
}
