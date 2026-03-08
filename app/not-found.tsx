'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Home } from 'lucide-react';
import { CompassIllustration } from '@/views/components/ui/empty-state-illustrations';

export default function NotFound() {
  const router = useRouter();

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: 'var(--bg-secondary)' }}
    >
      {/* Background glow */}
      <div
        className="fixed top-1/2 left-1/2 w-[500px] h-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(255, 89, 65, 0.06) 0%, transparent 70%)',
        }}
      />

      {/* Card */}
      <div
        className="relative rounded-2xl border p-10 max-w-md w-full flex flex-col items-center text-center"
        style={{
          backgroundColor: 'var(--bg-surface)',
          backdropFilter: 'blur(var(--blur-strength))',
          WebkitBackdropFilter: 'blur(var(--blur-strength))',
          borderColor: 'var(--border-color)',
        }}
      >
        {/* Illustration */}
        <div className="empty-stagger-in" style={{ animationDelay: '0s' }}>
          <CompassIllustration />
        </div>

        {/* 404 */}
        <p
          className="text-5xl font-extrabold tabular-nums empty-stagger-in"
          style={{ color: '#ff5941', animationDelay: '0.1s' }}
        >
          404
        </p>

        {/* Heading */}
        <h1
          className="text-lg font-bold mt-2 empty-stagger-in"
          style={{ color: 'var(--text-primary)', animationDelay: '0.15s' }}
        >
          Off Script
        </h1>

        {/* Description */}
        <p
          className="text-sm mt-2 max-w-[300px] empty-stagger-in"
          style={{ color: 'var(--text-muted)', animationDelay: '0.2s' }}
        >
          This page went off-script. Let&apos;s get you back to perfecting your pitch.
        </p>

        {/* Buttons */}
        <div className="flex items-center gap-3 mt-6 empty-stagger-in" style={{ animationDelay: '0.25s' }}>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-colors border"
            style={{
              borderColor: 'var(--border-color)',
              color: 'var(--text-secondary)',
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <ArrowLeft size={14} />
            Go Back
          </button>

          <Link href="/" className="no-underline">
            <button
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-300 hover:brightness-110 active:scale-[0.97]"
              style={{
                background: 'linear-gradient(135deg, #ff5941 0%, #e63b26 100%)',
                color: '#ffffff',
                boxShadow: '0 2px 12px rgba(255, 89, 65, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              }}
            >
              <Home size={14} />
              Home
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
