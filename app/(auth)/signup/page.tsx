'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/#waitlist');
  }, [router]);

  return (
    <div
      className="w-full max-w-sm rounded-2xl border p-8 text-center"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
        backdropFilter: 'blur(var(--blur-strength))',
      }}
    >
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        Redirecting to waitlist...
      </p>
    </div>
  );
}
