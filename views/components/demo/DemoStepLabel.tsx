'use client';

interface DemoStepLabelProps {
  label: string;
  subtitle?: string;
  visible: boolean;
}

export function DemoStepLabel({ label, subtitle, visible }: DemoStepLabelProps) {
  return (
    <div className={`demo-step-label${visible ? ' demo-step-label--visible' : ''}`}>
      <h2 className="demo-step-label__title">{label}</h2>
      {subtitle && <p className="demo-step-label__subtitle">{subtitle}</p>}
    </div>
  );
}
