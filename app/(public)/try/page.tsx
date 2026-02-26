'use client';

import { TryFlow } from '@/views/components/try/TryFlow';

export default function TryPage() {
  return (
    <div
      className="h-dvh w-full overflow-hidden"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <TryFlow />
    </div>
  );
}
