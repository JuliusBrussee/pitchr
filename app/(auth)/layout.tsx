'use client';

import { useEffect, useRef } from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = glowRef.current;
    if (!el) return;

    function handleMove(e: MouseEvent) {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      el!.style.setProperty('--glow-x', `${x}%`);
      el!.style.setProperty('--glow-y', `${y}%`);
    }

    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 overflow-hidden">
      {/* Animated background glow */}
      <div
        ref={glowRef}
        className="auth-glow"
        style={{
          '--glow-x': '50%',
          '--glow-y': '40%',
        } as React.CSSProperties}
      />

      {/* Grain overlay */}
      <div className="auth-grain" />

      {/* Content */}
      <div className="relative z-10 w-full flex flex-col items-center auth-enter">
        {children}
      </div>

      <style>{`
        .auth-glow {
          position: absolute;
          inset: 0;
          z-index: 0;
          background:
            radial-gradient(
              600px ellipse at var(--glow-x) var(--glow-y),
              rgba(255, 89, 65, 0.08) 0%,
              transparent 60%
            ),
            radial-gradient(
              800px circle at 30% 80%,
              rgba(255, 170, 51, 0.04) 0%,
              transparent 50%
            );
          transition: background 0.4s ease;
        }

        .dark .auth-glow {
          background:
            radial-gradient(
              600px ellipse at var(--glow-x) var(--glow-y),
              rgba(255, 89, 65, 0.12) 0%,
              transparent 60%
            ),
            radial-gradient(
              800px circle at 30% 80%,
              rgba(255, 170, 51, 0.06) 0%,
              transparent 50%
            );
        }

        .auth-grain {
          position: absolute;
          inset: 0;
          z-index: 1;
          opacity: 0.3;
          pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E");
          background-repeat: repeat;
          background-size: 128px 128px;
        }

        .dark .auth-grain {
          opacity: 0.15;
        }

        .auth-enter {
          animation: authEnter 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes authEnter {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
