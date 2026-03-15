# Mobile UI Gate Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a separate mobile UI layer that activates on phone detection, with bottom tab navigation, tabbed session recording, and performance tracking — while keeping desktop completely untouched.

**Architecture:** Server-side UA detection in middleware sets a cookie. Root layout reads cookie and provides device type via context. App layout conditionally renders desktop sidebar shell or mobile bottom-tab shell. All hooks, data layer, and backend remain shared.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS v4, TypeScript, Supabase, Lucide React, Vitest, Playwright

**Spec:** `docs/superpowers/specs/2026-03-15-mobile-ui-gate-design.md`

---

## File Structure

### New Files

```
lib/detectDevice.ts                          # UA parsing utility
lib/performance.ts                           # Performance marks + device-tagged reporting
contexts/DeviceTypeContext.tsx                # Device type context provider
contexts/SessionStateContext.tsx              # Extracted session state (shared)
hooks/useDeviceType.ts                       # Hook to read device type
hooks/useSessionControl.ts                   # Replaces useSidebarSession
views/components/mobile/MobileAppShell.tsx   # Mobile shell with header + tab bar
views/components/mobile/BottomTabBar.tsx      # Fixed bottom navigation
views/components/mobile/MobileHeader.tsx      # Slim top bar
views/components/mobile/MoreSheet.tsx         # Bottom sheet for secondary nav
views/components/mobile/MobileSessionPage.tsx # Tabbed session container
views/components/mobile/MobileMetricsTab.tsx  # Metrics grid + checklist + rubric
views/components/mobile/MobileRecordTab.tsx   # Camera view with floating overlays
views/components/mobile/MobileControlBar.tsx  # Session control bar (no mic toggle)
views/components/mobile/MobileScrollContext.tsx # Scroll position preservation
views/components/LazyFont.tsx                 # Client component for lazy font loading
tests/unit/detectDevice.test.ts              # UA parsing tests
tests/unit/useDeviceType.test.ts             # Device type hook tests
```

### Modified Files

```
middleware.ts                                # Expand matcher to all page routes
lib/supabase/middleware.ts                   # Integrate UA detection into updateSession()
app/layout.tsx                               # viewport-fit, DeviceTypeProvider, conditional fonts
app/(app)/layout.tsx                         # Refactor to Server Component + AppLayoutClient
views/components/SidebarContext.tsx           # Remove session state (moved to SessionStateContext)
views/components/AppSidebar.tsx               # Read session state from SessionStateContext
app/(app)/session/page.tsx                   # Switch from useSidebarSession to useSessionControl
app/globals.css                              # Add mobile-specific utility classes
```

---

## Chunk 1: Foundation (Detection + Context + Layout Refactor)

### Task 1: UA Detection Utility

**Files:**
- Create: `lib/detectDevice.ts`
- Create: `tests/unit/detectDevice.test.ts`

- [ ] **Step 1: Write the UA detection utility**

```ts
// lib/detectDevice.ts
export type DeviceType = 'mobile' | 'desktop';

const MOBILE_UA_REGEX = /Android.*Mobile|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile Safari/i;

export function detectDeviceType(userAgent: string | null): DeviceType {
  if (!userAgent) return 'desktop';
  return MOBILE_UA_REGEX.test(userAgent) ? 'mobile' : 'desktop';
}
```

- [ ] **Step 2: Write tests**

```ts
// tests/unit/detectDevice.test.ts
import { describe, it, expect } from 'vitest';
import { detectDeviceType } from '@/lib/detectDevice';

describe('detectDeviceType', () => {
  it('returns mobile for iPhone UA', () => {
    expect(detectDeviceType('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')).toBe('mobile');
  });
  it('returns mobile for Android phone UA', () => {
    expect(detectDeviceType('Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36')).toBe('mobile');
  });
  it('returns desktop for iPad UA', () => {
    expect(detectDeviceType('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15')).toBe('desktop');
  });
  it('returns desktop for Chrome desktop UA', () => {
    expect(detectDeviceType('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0')).toBe('desktop');
  });
  it('returns desktop for null UA', () => {
    expect(detectDeviceType(null)).toBe('desktop');
  });
  it('returns desktop for empty string', () => {
    expect(detectDeviceType('')).toBe('desktop');
  });
});
```

- [ ] **Step 3: Run tests**

Run: `cd C:\dev\pitchr && yarn vitest run tests/unit/detectDevice.test.ts`
Expected: All 6 tests PASS

- [ ] **Step 4: Commit**

```bash
git add lib/detectDevice.ts tests/unit/detectDevice.test.ts
git commit -m "feat: add UA detection utility for mobile gate"
```

---

### Task 2: Middleware Integration

**Files:**
- Modify: `middleware.ts`
- Modify: `lib/supabase/middleware.ts`

- [ ] **Step 1: Expand middleware matcher**

Replace the explicit route list in `middleware.ts` with the catch-all pattern that excludes static assets:

```ts
// middleware.ts
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
```

- [ ] **Step 2: Integrate device detection into updateSession**

In `lib/supabase/middleware.ts`:

1. Import `detectDeviceType` from `@/lib/detectDevice`
2. At the top of `updateSession()`, detect device type from UA header
3. Before every `return` statement that returns a response, set the device cookie on that response

Key changes:
- After line 56 (`const { pathname } = request.nextUrl;`), add device detection
- Before each `return NextResponse.redirect(url)` and `return NextResponse.next()` and `return supabaseResponse`, set the cookie

```ts
// At top of updateSession():
const deviceType = request.cookies.get('x-device-type')?.value
  || detectDeviceType(request.headers.get('user-agent'));

// Helper to stamp cookie on any response:
function stampDevice(response: NextResponse): NextResponse {
  if (!request.cookies.get('x-device-type')) {
    response.cookies.set('x-device-type', deviceType, {
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }
  return response;
}

// Then wrap every return: return stampDevice(NextResponse.next({ request }));
// and: return stampDevice(NextResponse.redirect(url));
// and: return stampDevice(supabaseResponse);
```

- [ ] **Step 3: Verify dev server starts without errors**

Run: `cd C:\dev\pitchr && yarn dev` (check for compilation errors, then kill)

- [ ] **Step 4: Commit**

```bash
git add middleware.ts lib/supabase/middleware.ts
git commit -m "feat: integrate device detection into middleware"
```

---

### Task 3: Device Type Context + Hook

**Files:**
- Create: `contexts/DeviceTypeContext.tsx`
- Create: `hooks/useDeviceType.ts`

- [ ] **Step 1: Create DeviceTypeContext**

```tsx
// contexts/DeviceTypeContext.tsx
'use client';

import { createContext, useContext } from 'react';
import type { DeviceType } from '@/lib/detectDevice';

const DeviceTypeContext = createContext<DeviceType>('desktop');

export function DeviceTypeProvider({
  deviceType,
  children,
}: {
  deviceType: DeviceType;
  children: React.ReactNode;
}) {
  return (
    <DeviceTypeContext.Provider value={deviceType}>
      {children}
    </DeviceTypeContext.Provider>
  );
}

export { DeviceTypeContext };
```

- [ ] **Step 2: Create useDeviceType hook**

```ts
// hooks/useDeviceType.ts
'use client';

import { useContext } from 'react';
import { DeviceTypeContext } from '@/contexts/DeviceTypeContext';
import type { DeviceType } from '@/lib/detectDevice';

export function useDeviceType(): DeviceType {
  return useContext(DeviceTypeContext);
}
```

- [ ] **Step 3: Commit**

```bash
git add contexts/DeviceTypeContext.tsx hooks/useDeviceType.ts
git commit -m "feat: add DeviceTypeContext and useDeviceType hook"
```

---

### Task 4: Root Layout Update

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Add viewport-fit and DeviceTypeProvider**

Changes to `app/layout.tsx`:
1. Import `cookies` from `next/headers`
2. Import `DeviceTypeProvider` from contexts
3. Add `viewportFit: 'cover'` to the viewport export
4. Read the `x-device-type` cookie in the server component body
5. Wrap `<body>` children with `<DeviceTypeProvider>`
6. Conditionally render font `<link>` tags based on device type

```tsx
// Add to imports:
import { cookies } from 'next/headers';
import { DeviceTypeProvider } from '@/contexts/DeviceTypeContext';
import type { DeviceType } from '@/lib/detectDevice';

// Update viewport export:
export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f0f0f3' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  viewportFit: 'cover' as const,
};

// In RootLayout function body, before return:
const cookieStore = await cookies();
const deviceType = (cookieStore.get('x-device-type')?.value || 'desktop') as DeviceType;

// Conditional font URL:
const fontUrl = deviceType === 'mobile'
  ? 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap'
  : 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@500;700&display=swap';

// Update the font script to use fontUrl variable
// Wrap children: <DeviceTypeProvider deviceType={deviceType}>{children}</DeviceTypeProvider>
```

- [ ] **Step 2: Verify dev server renders correctly on desktop**

Run: `cd C:\dev\pitchr && yarn dev`
Open browser, verify no changes to desktop experience.

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: root layout device-aware with viewport-fit and conditional fonts"
```

---

### Task 5: SessionStateContext Extraction

**Files:**
- Create: `contexts/SessionStateContext.tsx`
- Create: `hooks/useSessionControl.ts`
- Modify: `views/components/SidebarContext.tsx`
- Modify: `views/components/AppSidebar.tsx`
- Modify: `app/(app)/session/page.tsx`

- [ ] **Step 1: Create SessionStateContext**

```tsx
// contexts/SessionStateContext.tsx
'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';

interface SessionCallbacks {
  onStart: () => void;
}

interface SessionStateContextValue {
  isSessionActive: boolean;
  isProjectSwitchLocked: boolean;
  onStartSession: () => void;
  registerSession: (callbacks: SessionCallbacks) => void;
  unregisterSession: () => void;
}

const SessionStateCtx = createContext<SessionStateContextValue | null>(null);

export function SessionStateProvider({ children }: { children: React.ReactNode }) {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const callbacksRef = useRef<SessionCallbacks | null>(null);

  const registerSession = useCallback((callbacks: SessionCallbacks) => {
    callbacksRef.current = callbacks;
    setIsSessionActive(true);
  }, []);

  const unregisterSession = useCallback(() => {
    callbacksRef.current = null;
    setIsSessionActive(false);
  }, []);

  const onStartSession = useCallback(() => {
    callbacksRef.current?.onStart();
  }, []);

  return (
    <SessionStateCtx.Provider
      value={{
        isSessionActive,
        isProjectSwitchLocked: isSessionActive,
        onStartSession,
        registerSession,
        unregisterSession,
      }}
    >
      {children}
    </SessionStateCtx.Provider>
  );
}

export function useSessionState_Context() {
  const ctx = useContext(SessionStateCtx);
  if (!ctx) throw new Error('useSessionState_Context must be used within SessionStateProvider');
  return ctx;
}
```

- [ ] **Step 2: Create useSessionControl hook**

```ts
// hooks/useSessionControl.ts
'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSessionState_Context } from '@/contexts/SessionStateContext';

export function useSessionControl(onStart: (() => void) | null) {
  const { registerSession, unregisterSession } = useSessionState_Context();
  const onStartRef = useRef(onStart);
  onStartRef.current = onStart;

  const stableOnStart = useCallback(() => {
    onStartRef.current?.();
  }, []);

  useEffect(() => {
    if (onStart) {
      registerSession({ onStart: stableOnStart });
      return () => unregisterSession();
    }
  }, [onStart, registerSession, unregisterSession, stableOnStart]);
}
```

- [ ] **Step 3: Update SidebarContext to remove session state**

Modify `views/components/SidebarContext.tsx`:
- Remove `isSessionActive`, `registerSession`, `unregisterSession`, `onStartSession`, `isProjectSwitchLocked` from the context
- Keep only: `isSidebarOpen`, `toggleSidebar`, `closeSidebar`
- Remove `useSidebarSession` export
- Import and re-export session state from `SessionStateContext` for the `useSidebar()` hook (to maintain backward compat temporarily)

Actually, simpler approach: keep `useSidebar()` returning all the same fields, but have it read session fields from `SessionStateContext` internally. This way consuming components don't change.

```tsx
// In SidebarContext.tsx useSidebar():
export function useSidebar() {
  const sidebarCtx = useContext(SidebarCtx);
  const sessionCtx = useSessionState_Context();
  if (!sidebarCtx) throw new Error('useSidebar must be within SidebarProvider');
  return {
    ...sidebarCtx,
    ...sessionCtx,
  };
}
```

- [ ] **Step 4: Update session page to use useSessionControl**

In `app/(app)/session/page.tsx`, replace `useSidebarSession(...)` calls with `useSessionControl(...)`.

- [ ] **Step 5: Verify desktop session flow still works**

Run: `cd C:\dev\pitchr && yarn dev`
Test: Open dashboard, navigate to session, start/stop a session. Sidebar should still show session state correctly.

- [ ] **Step 6: Commit**

```bash
git add contexts/SessionStateContext.tsx hooks/useSessionControl.ts views/components/SidebarContext.tsx app/(app)/session/page.tsx
git commit -m "feat: extract SessionStateContext from SidebarProvider"
```

---

### Task 6: App Layout Refactor (Server Component + Client Split)

**Files:**
- Modify: `app/(app)/layout.tsx`

- [ ] **Step 1: Split into Server Component + AppLayoutClient**

Create the server component wrapper that reads the cookie:

```tsx
// app/(app)/layout.tsx
import { cookies } from 'next/headers';
import type { DeviceType } from '@/lib/detectDevice';
import { AppLayoutClient } from './AppLayoutClient';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const deviceType = (cookieStore.get('x-device-type')?.value || 'desktop') as DeviceType;
  return <AppLayoutClient deviceType={deviceType}>{children}</AppLayoutClient>;
}
```

- [ ] **Step 2: Create AppLayoutClient with conditional shell**

Move the current layout.tsx content into `app/(app)/AppLayoutClient.tsx` as a `'use client'` component. Add the `deviceType` prop and conditional rendering:

```tsx
// app/(app)/AppLayoutClient.tsx
'use client';
// ... all existing imports ...
import { SessionStateProvider } from '@/contexts/SessionStateContext';
import type { DeviceType } from '@/lib/detectDevice';
import dynamic from 'next/dynamic';

const MobileAppShell = dynamic(() =>
  import('@/views/components/mobile/MobileAppShell').then(m => ({ default: m.MobileAppShell }))
);

// ... EarlyAdopterClaimer stays here ...
// ... AppLayoutInner stays here (renamed to DesktopAppShell) ...

export function AppLayoutClient({
  deviceType,
  children,
}: {
  deviceType: DeviceType;
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <TutorialProvider>
        <ToastProvider>
          <SessionStateProvider>
            <ProjectProvider>
              <EarlyAdopterProvider>
                <AnalysisTrackerProvider>
                  <EarlyAdopterClaimer />
                  {deviceType === 'mobile' ? (
                    <MobileAppShell>{children}</MobileAppShell>
                  ) : (
                    <SidebarProvider>
                      <DesktopAppShell>{children}</DesktopAppShell>
                    </SidebarProvider>
                  )}
                </AnalysisTrackerProvider>
              </EarlyAdopterProvider>
            </ProjectProvider>
          </SessionStateProvider>
        </ToastProvider>
      </TutorialProvider>
    </AuthProvider>
  );
}
```

Note: `SidebarProvider` now wraps only `DesktopAppShell`, not the entire tree.

- [ ] **Step 3: Verify desktop layout renders correctly**

Run: `cd C:\dev\pitchr && yarn dev`
Desktop should look identical. Mobile will show a blank shell (MobileAppShell doesn't exist yet — that's fine, the dynamic import will just not render).

- [ ] **Step 4: Commit**

```bash
git add app/(app)/layout.tsx app/(app)/AppLayoutClient.tsx
git commit -m "feat: split app layout into server/client components with device gate"
```

---

## Chunk 2: Mobile Shell Components

### Task 7: BottomTabBar

**Files:**
- Create: `views/components/mobile/BottomTabBar.tsx`

- [ ] **Step 1: Implement BottomTabBar**

```tsx
// views/components/mobile/BottomTabBar.tsx
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Video, Clock, FolderOpen, MoreHorizontal } from 'lucide-react';
import { useSessionState_Context } from '@/contexts/SessionStateContext';

const PRIMARY_TABS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/session', label: 'Session', icon: Video, primary: true },
  { href: '/history', label: 'History', icon: Clock },
  { href: '/projects', label: 'Projects', icon: FolderOpen },
] as const;

const MORE_ROUTES = ['/settings', '/insights', '/progress', '/arena', '/qa', '/upload'];

interface BottomTabBarProps {
  onMoreTap: () => void;
}

export function BottomTabBar({ onMoreTap }: BottomTabBarProps) {
  const pathname = usePathname();
  const { isSessionActive } = useSessionState_Context();

  // Hide during active recording session
  if (isSessionActive) return null;

  const isMoreActive = MORE_ROUTES.some(r => pathname.startsWith(r));

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t"
      style={{
        height: 'calc(56px + env(safe-area-inset-bottom, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        backgroundColor: 'var(--bg-surface)',
        backdropFilter: 'blur(var(--blur-strength))',
        WebkitBackdropFilter: 'blur(var(--blur-strength))',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="flex items-center justify-around h-14 px-2">
        {PRIMARY_TABS.map(({ href, label, icon: Icon, primary }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1"
              style={{ minWidth: 0 }}
            >
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: primary ? 36 : 28,
                  height: primary ? 36 : 28,
                  backgroundColor: primary && isActive ? 'rgba(255, 89, 65, 0.12)' : 'transparent',
                  border: primary ? '1.5px solid' : 'none',
                  borderColor: primary
                    ? isActive ? 'rgba(255, 89, 65, 0.4)' : 'var(--border-color)'
                    : 'transparent',
                }}
              >
                <Icon
                  size={primary ? 18 : 20}
                  style={{
                    color: isActive ? 'var(--accent, #ff5941)' : 'var(--text-muted)',
                  }}
                />
              </div>
              <span
                className="text-[10px] font-medium leading-tight"
                style={{
                  color: isActive ? 'var(--accent, #ff5941)' : 'var(--text-muted)',
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
        {/* More tab */}
        <button
          onClick={onMoreTap}
          className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1"
          style={{ minWidth: 0 }}
        >
          <MoreHorizontal
            size={20}
            style={{
              color: isMoreActive ? 'var(--accent, #ff5941)' : 'var(--text-muted)',
            }}
          />
          <span
            className="text-[10px] font-medium leading-tight"
            style={{
              color: isMoreActive ? 'var(--accent, #ff5941)' : 'var(--text-muted)',
            }}
          >
            More
          </span>
        </button>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add views/components/mobile/BottomTabBar.tsx
git commit -m "feat: add BottomTabBar component"
```

---

### Task 8: MobileHeader

**Files:**
- Create: `views/components/mobile/MobileHeader.tsx`

- [ ] **Step 1: Implement MobileHeader**

```tsx
// views/components/mobile/MobileHeader.tsx
'use client';

import { usePathname } from 'next/navigation';
import { useProject } from '@/views/components/ProjectProvider';
import { ChevronDown } from 'lucide-react';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/session': 'Session',
  '/history': 'History',
  '/projects': 'Projects',
  '/settings': 'Settings',
  '/insights': 'Insights',
  '/progress': 'Progress',
  '/arena': 'Arena',
  '/qa': 'Q&A',
  '/upload': 'Upload',
};

interface MobileHeaderProps {
  onProjectTap?: () => void;
}

export function MobileHeader({ onProjectTap }: MobileHeaderProps) {
  const pathname = usePathname();
  const { activeProject } = useProject();

  // Find matching title (handle dynamic segments)
  const title = Object.entries(PAGE_TITLES).find(([route]) =>
    pathname.startsWith(route)
  )?.[1] || '';

  // Hide on results pages (they have their own header with back button)
  if (pathname.startsWith('/results/') || pathname.startsWith('/review/')) return null;

  return (
    <header
      className="flex items-center justify-between px-4 flex-shrink-0"
      style={{
        height: 48,
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-surface)',
        backdropFilter: 'blur(var(--blur-strength))',
        WebkitBackdropFilter: 'blur(var(--blur-strength))',
      }}
    >
      <h1
        className="text-base font-semibold truncate"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </h1>
      {activeProject && onProjectTap && (
        <button
          onClick={onProjectTap}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium truncate max-w-[140px]"
          style={{
            borderColor: 'var(--border-color)',
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <span className="truncate">{activeProject.name}</span>
          <ChevronDown size={12} className="flex-shrink-0" />
        </button>
      )}
    </header>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add views/components/mobile/MobileHeader.tsx
git commit -m "feat: add MobileHeader component"
```

---

### Task 9: MoreSheet

**Files:**
- Create: `views/components/mobile/MoreSheet.tsx`

- [ ] **Step 1: Implement MoreSheet**

```tsx
// views/components/mobile/MoreSheet.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings, TrendingUp, Target, Swords, MessageCircleQuestion, Upload, Sun, Moon, X
} from 'lucide-react';

const MORE_ITEMS = [
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/insights', label: 'Insights', icon: TrendingUp },
  { href: '/progress', label: 'Progress', icon: Target },
  { href: '/arena', label: 'Arena', icon: Swords },
  { href: '/qa', label: 'Q&A', icon: MessageCircleQuestion },
  { href: '/upload', label: 'Upload', icon: Upload },
] as const;

interface MoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MoreSheet({ isOpen, onClose }: MoreSheetProps) {
  const router = useRouter();

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function handleNav(href: string) {
    onClose();
    router.push(href);
  }

  function toggleTheme() {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('pitchr-theme', isDark ? 'dark' : 'light');
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border-t"
        style={{
          backgroundColor: 'var(--bg-primary)',
          borderColor: 'var(--border-color)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          maxHeight: '70vh',
          animation: 'mobileSheetSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div
            className="rounded-full"
            style={{
              width: 32,
              height: 4,
              backgroundColor: 'var(--text-muted)',
              opacity: 0.4,
            }}
          />
        </div>

        {/* Nav items */}
        <div className="px-4 pb-4 flex flex-col gap-1">
          {MORE_ITEMS.map(({ href, label, icon: Icon }) => (
            <button
              key={href}
              onClick={() => handleNav(href)}
              className="flex items-center gap-3 px-3 py-3 rounded-xl w-full text-left"
              style={{
                color: 'var(--text-primary)',
                backgroundColor: 'transparent',
              }}
            >
              <Icon size={20} style={{ color: 'var(--text-secondary)' }} />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 px-3 py-3 rounded-xl w-full text-left border-t mt-2 pt-4"
            style={{
              color: 'var(--text-primary)',
              borderColor: 'var(--border-color)',
            }}
          >
            <Sun size={20} className="dark:hidden" style={{ color: 'var(--text-secondary)' }} />
            <Moon size={20} className="hidden dark:block" style={{ color: 'var(--text-secondary)' }} />
            <span className="text-sm font-medium">Toggle Theme</span>
          </button>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add views/components/mobile/MoreSheet.tsx
git commit -m "feat: add MoreSheet bottom sheet component"
```

---

### Task 10: MobileScrollContext

**Files:**
- Create: `views/components/mobile/MobileScrollContext.tsx`

- [ ] **Step 1: Implement MobileScrollContext**

```tsx
// views/components/mobile/MobileScrollContext.tsx
'use client';

import { createContext, useCallback, useContext, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const MAX_ENTRIES = 15;

interface MobileScrollContextValue {
  restoreScroll: () => void;
}

const MobileScrollCtx = createContext<MobileScrollContextValue>({
  restoreScroll: () => {},
});

export function MobileScrollProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const scrollMapRef = useRef<Map<string, number>>(new Map());
  const prevPathnameRef = useRef(pathname);

  // Save scroll on scroll events (debounced)
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    function onScroll() {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const map = scrollMapRef.current;
        map.set(pathname, window.scrollY);
        // Evict if over limit
        if (map.size > MAX_ENTRIES) {
          const firstKey = map.keys().next().value;
          if (firstKey) map.delete(firstKey);
        }
      }, 100);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', onScroll);
    };
  }, [pathname]);

  const restoreScroll = useCallback(() => {
    const saved = scrollMapRef.current.get(pathname);
    if (saved !== undefined) {
      requestAnimationFrame(() => window.scrollTo(0, saved));
    }
  }, [pathname]);

  // Restore on pathname change
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      const saved = scrollMapRef.current.get(pathname);
      if (saved !== undefined) {
        requestAnimationFrame(() => window.scrollTo(0, saved));
      }
    }
  }, [pathname]);

  return (
    <MobileScrollCtx.Provider value={{ restoreScroll }}>
      {children}
    </MobileScrollCtx.Provider>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add views/components/mobile/MobileScrollContext.tsx
git commit -m "feat: add MobileScrollContext for scroll preservation"
```

---

### Task 11: MobileAppShell (Assembling the Shell)

**Files:**
- Create: `views/components/mobile/MobileAppShell.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Add mobile CSS animations to globals.css**

Append to `app/globals.css`:

```css
/* ——— Mobile Shell Animations ——— */

@keyframes mobileSheetSlideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
```

- [ ] **Step 2: Implement MobileAppShell**

```tsx
// views/components/mobile/MobileAppShell.tsx
'use client';

import { useState } from 'react';
import { BottomTabBar } from './BottomTabBar';
import { MobileHeader } from './MobileHeader';
import { MoreSheet } from './MoreSheet';
import { MobileScrollProvider } from './MobileScrollContext';

export function MobileAppShell({ children }: { children: React.ReactNode }) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  return (
    <MobileScrollProvider>
      <div className="flex flex-col h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <MobileHeader />
        <main
          className="flex-1 overflow-y-auto min-h-0"
          style={{
            paddingBottom: 'calc(56px + env(safe-area-inset-bottom, 0px))',
          }}
        >
          {children}
        </main>
        <BottomTabBar onMoreTap={() => setIsMoreOpen(true)} />
        <MoreSheet isOpen={isMoreOpen} onClose={() => setIsMoreOpen(false)} />
      </div>
    </MobileScrollProvider>
  );
}
```

- [ ] **Step 3: Verify mobile shell renders**

Run: `cd C:\dev\pitchr && yarn dev`
Open DevTools, set mobile viewport (iPhone 14). Should see the bottom tab bar and header. Pages should load inside the shell.

- [ ] **Step 4: Commit**

```bash
git add views/components/mobile/MobileAppShell.tsx app/globals.css
git commit -m "feat: add MobileAppShell with header, tabs, more sheet"
```

---

## Chunk 3: Mobile Session Page

### Task 12: MobileControlBar

**Files:**
- Create: `views/components/mobile/MobileControlBar.tsx`

- [ ] **Step 1: Implement MobileControlBar**

The persistent control bar for the session page. No mic toggle. Camera toggle, skip-back, play/pause, stop, skip-forward, timer.

```tsx
// views/components/mobile/MobileControlBar.tsx
'use client';

import { Video, VideoOff, SkipBack, SkipForward, Play, Pause, Square } from 'lucide-react';

interface MobileControlBarProps {
  isCameraOn: boolean;
  toggleCamera: () => void;
  isSessionActive: boolean;
  canStopSession: boolean;
  canStartSession?: boolean;
  onStartSession: () => void;
  onPauseSession: () => void;
  onStopSession: () => void;
  onNextSlide?: () => void;
  onPrevSlide?: () => void;
  elapsedSeconds?: number;
}

function formatTimer(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function MobileControlBar({
  isCameraOn,
  toggleCamera,
  isSessionActive,
  canStopSession,
  canStartSession = true,
  onStartSession,
  onPauseSession,
  onStopSession,
  onNextSlide,
  onPrevSlide,
  elapsedSeconds = 0,
}: MobileControlBarProps) {
  return (
    <div
      className="flex items-center justify-center gap-2 px-3 py-2.5 mx-3 mb-3 rounded-xl border flex-shrink-0"
      style={{
        backgroundColor: 'var(--bg-surface)',
        backdropFilter: 'blur(var(--blur-strength))',
        WebkitBackdropFilter: 'blur(var(--blur-strength))',
        borderColor: 'var(--border-color)',
      }}
    >
      {/* Camera toggle */}
      <ControlBtn
        icon={isCameraOn ? Video : VideoOff}
        onClick={toggleCamera}
        active={isCameraOn}
        label={isCameraOn ? 'Camera on' : 'Camera off'}
      />

      {/* Playback controls */}
      <div className="flex items-center gap-1">
        <ControlBtn icon={SkipBack} onClick={() => onPrevSlide?.()} label="Previous slide" />
        {isSessionActive ? (
          <ControlBtn icon={Pause} onClick={onPauseSession} label="Pause" primary />
        ) : (
          <ControlBtn
            icon={Play}
            onClick={onStartSession}
            label="Start"
            primary
            disabled={!canStartSession}
          />
        )}
        {canStopSession && (
          <ControlBtn icon={Square} onClick={onStopSession} label="Stop" danger />
        )}
        <ControlBtn icon={SkipForward} onClick={() => onNextSlide?.()} label="Next slide" />
      </div>

      {/* Timer */}
      <span
        className="text-xs font-medium tabular-nums min-w-[3rem] text-center"
        style={{ color: 'var(--text-secondary)' }}
      >
        {formatTimer(elapsedSeconds)}
      </span>
    </div>
  );
}

function ControlBtn({
  icon: Icon,
  onClick,
  label,
  primary,
  danger,
  active,
  disabled,
}: {
  icon: React.ComponentType<{ size?: number }>;
  onClick: () => void;
  label: string;
  primary?: boolean;
  danger?: boolean;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex items-center justify-center rounded-full border"
      style={{
        width: primary ? 40 : 34,
        height: primary ? 40 : 34,
        backgroundColor: primary
          ? 'var(--text-primary)'
          : 'transparent',
        borderColor: danger
          ? 'rgba(239,68,68,0.4)'
          : primary
            ? 'transparent'
            : 'var(--border-color)',
        color: danger
          ? '#ef4444'
          : primary
            ? 'var(--bg-primary)'
            : active
              ? 'var(--text-primary)'
              : 'var(--text-secondary)',
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <Icon size={primary ? 18 : 16} />
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add views/components/mobile/MobileControlBar.tsx
git commit -m "feat: add MobileControlBar for session recording"
```

---

### Task 13: MobileRecordTab

**Files:**
- Create: `views/components/mobile/MobileRecordTab.tsx`

- [ ] **Step 1: Implement MobileRecordTab**

Camera view with floating recording indicator and slide counter. Uses the same `CameraView` pattern from the desktop `SessionCanvas`.

```tsx
// views/components/mobile/MobileRecordTab.tsx
'use client';

import { useRef, useEffect } from 'react';

interface MobileRecordTabProps {
  stream: MediaStream | null;
  isCameraOn: boolean;
  isSessionActive: boolean;
  elapsedSeconds: number;
  currentSlide?: number;
  slideCount?: number;
}

function formatTimer(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function MobileRecordTab({
  stream,
  isCameraOn,
  isSessionActive,
  elapsedSeconds,
  currentSlide,
  slideCount,
}: MobileRecordTabProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div
      className="flex-1 rounded-2xl overflow-hidden border relative min-h-0"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
        background: isCameraOn
          ? undefined
          : 'linear-gradient(145deg, #0f1724, #111827)',
      }}
    >
      {/* Camera feed */}
      {isCameraOn && stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="rounded-full flex items-center justify-center"
            style={{
              width: 64,
              height: 64,
              background: 'rgba(255,255,255,0.03)',
              border: '1.5px solid rgba(255,255,255,0.08)',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </div>
        </div>
      )}

      {/* Floating overlays */}
      {isSessionActive && (
        <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
          {/* Recording indicator */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
            style={{
              color: '#ff5941',
              backgroundColor: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,89,65,0.2)',
            }}
          >
            <span
              className="rounded-full"
              style={{
                width: 6,
                height: 6,
                backgroundColor: '#ff5941',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
            {formatTimer(elapsedSeconds)}
          </div>

          {/* Slide counter */}
          {slideCount && slideCount > 0 && (
            <div
              className="px-2.5 py-1 rounded-lg text-xs font-medium"
              style={{
                color: 'rgba(255,255,255,0.7)',
                backgroundColor: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {currentSlide} / {slideCount}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add views/components/mobile/MobileRecordTab.tsx
git commit -m "feat: add MobileRecordTab with camera view and overlays"
```

---

### Task 14: MobileMetricsTab

**Files:**
- Create: `views/components/mobile/MobileMetricsTab.tsx`

- [ ] **Step 1: Implement MobileMetricsTab**

2x2 metric grid + pitch checklist + live rubric bars. Reuses `RollingChar` from the desktop `MetricsPanel` or uses static values.

```tsx
// views/components/mobile/MobileMetricsTab.tsx
'use client';

import { Check, Circle } from 'lucide-react';
import type { MetricValues } from '@/hooks/useSessionState';
import type { RealtimeChecklistItemState } from '@/types/checklist';
import type { LiveRubricCategoryScore } from '@/lib/liveFeedback';

interface MobileMetricsTabProps {
  metrics: MetricValues;
  checklist: RealtimeChecklistItemState[];
  liveRubric?: LiveRubricCategoryScore[];
}

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const RUBRIC_LABELS: Record<string, string> = {
  structure: 'Structure',
  clarity: 'Clarity',
  evidence: 'Evidence',
  market: 'Market',
  delivery: 'Delivery',
};

function scoreColor(score: number): string {
  if (score >= 7) return '#22c55e';
  if (score >= 5) return '#f59e0b';
  return '#ef4444';
}

export function MobileMetricsTab({ metrics, checklist, liveRubric }: MobileMetricsTabProps) {
  const stats = [
    { label: 'Words / min', value: String(metrics.wpm), color: '#22c55e' },
    { label: 'Fillers', value: String(metrics.fillerCount), color: '#f59e0b' },
    { label: 'Duration', value: formatDuration(metrics.durationSecs), color: '#60a5fa' },
    { label: 'Energy', value: metrics.fillerRate < 3 ? 'High' : metrics.fillerRate < 6 ? 'Mid' : 'Low', color: '#a78bfa' },
  ];

  return (
    <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-3 p-3">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-2">
        {stats.map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-xl border p-3 text-center"
            style={{
              backgroundColor: 'var(--bg-surface)',
              backdropFilter: 'blur(var(--blur-strength))',
              WebkitBackdropFilter: 'blur(var(--blur-strength))',
              borderColor: 'var(--border-color)',
            }}
          >
            <div
              className="text-xl font-bold tabular-nums"
              style={{ color, letterSpacing: '-0.02em' }}
            >
              {value}
            </div>
            <div
              className="text-[10px] font-semibold uppercase tracking-wide mt-1"
              style={{ color: 'var(--text-muted)' }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Pitch Checklist */}
      {checklist.length > 0 && (
        <>
          <div
            className="text-[10px] font-semibold uppercase tracking-wider px-1"
            style={{ color: 'var(--text-muted)' }}
          >
            Pitch Checklist
          </div>
          <div className="flex flex-col gap-1">
            {checklist.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg border"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-color)',
                  color: item.state === 'hit'
                    ? 'var(--text-secondary)'
                    : 'var(--text-muted)',
                }}
              >
                <div
                  className="flex items-center justify-center rounded-full flex-shrink-0"
                  style={{
                    width: 18,
                    height: 18,
                    backgroundColor: item.state === 'hit' ? 'rgba(34,197,94,0.15)' : 'transparent',
                    border: item.state === 'hit' ? 'none' : '1.5px solid var(--text-muted)',
                  }}
                >
                  {item.state === 'hit' && <Check size={11} color="#22c55e" />}
                </div>
                <span className="text-sm">{item.label}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Live Rubric */}
      {liveRubric && liveRubric.length > 0 && (
        <>
          <div
            className="text-[10px] font-semibold uppercase tracking-wider px-1"
            style={{ color: 'var(--text-muted)' }}
          >
            Live Rubric
          </div>
          <div className="flex flex-col gap-2 px-1">
            {liveRubric.map((cat) => (
              <div key={cat.category} className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-xs">
                  <span style={{ color: 'var(--text-secondary)' }} className="font-medium">
                    {RUBRIC_LABELS[cat.category] || cat.category}
                  </span>
                  <span
                    className="font-semibold tabular-nums"
                    style={{ color: cat.score > 0 ? scoreColor(cat.score) : 'var(--text-muted)' }}
                  >
                    {cat.score > 0 ? cat.score.toFixed(1) : '--'}
                  </span>
                </div>
                <div
                  className="rounded-full overflow-hidden"
                  style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.04)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(0, Math.min(100, cat.score * 10))}%`,
                      backgroundColor: cat.score > 0 ? scoreColor(cat.score) : 'transparent',
                      transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add views/components/mobile/MobileMetricsTab.tsx
git commit -m "feat: add MobileMetricsTab with stats, checklist, rubric"
```

---

### Task 15: MobileSessionPage (Tabbed Container)

**Files:**
- Create: `views/components/mobile/MobileSessionPage.tsx`

- [ ] **Step 1: Implement MobileSessionPage**

Tabbed container that switches between Record and Metrics views with persistent control bar.

```tsx
// views/components/mobile/MobileSessionPage.tsx
'use client';

import { useState } from 'react';
import { Video, BarChart3 } from 'lucide-react';
import { MobileRecordTab } from './MobileRecordTab';
import { MobileMetricsTab } from './MobileMetricsTab';
import { MobileControlBar } from './MobileControlBar';
import type { MetricValues } from '@/hooks/useSessionState';
import type { RealtimeChecklistItemState } from '@/types/checklist';
import type { LiveRubricCategoryScore } from '@/lib/liveFeedback';

interface MobileSessionPageProps {
  stream: MediaStream | null;
  isCameraOn: boolean;
  isMicOn: boolean;
  toggleCamera: () => void;
  isSessionActive: boolean;
  canStopSession: boolean;
  canStartSession?: boolean;
  onStartSession: () => void;
  onPauseSession: () => void;
  onStopSession: () => void;
  currentSlide?: number;
  slideCount?: number;
  onNextSlide?: () => void;
  onPrevSlide?: () => void;
  elapsedSeconds?: number;
  metrics: MetricValues;
  checklist: RealtimeChecklistItemState[];
  liveRubric?: LiveRubricCategoryScore[];
}

export function MobileSessionPage(props: MobileSessionPageProps) {
  const [activeTab, setActiveTab] = useState<'record' | 'metrics'>('record');

  return (
    <div className="flex flex-col h-full min-h-0 gap-2 p-3">
      {/* Tab bar */}
      <div className="flex gap-1 flex-shrink-0">
        <TabButton
          icon={Video}
          label="Record"
          active={activeTab === 'record'}
          onClick={() => setActiveTab('record')}
        />
        <TabButton
          icon={BarChart3}
          label="Metrics"
          active={activeTab === 'metrics'}
          onClick={() => setActiveTab('metrics')}
        />
      </div>

      {/* Tab content */}
      {activeTab === 'record' ? (
        <MobileRecordTab
          stream={props.stream}
          isCameraOn={props.isCameraOn}
          isSessionActive={props.isSessionActive}
          elapsedSeconds={props.elapsedSeconds || 0}
          currentSlide={props.currentSlide}
          slideCount={props.slideCount}
        />
      ) : (
        <MobileMetricsTab
          metrics={props.metrics}
          checklist={props.checklist}
          liveRubric={props.liveRubric}
        />
      )}

      {/* Control bar */}
      <MobileControlBar
        isCameraOn={props.isCameraOn}
        toggleCamera={props.toggleCamera}
        isSessionActive={props.isSessionActive}
        canStopSession={props.canStopSession}
        canStartSession={props.canStartSession}
        onStartSession={props.onStartSession}
        onPauseSession={props.onPauseSession}
        onStopSession={props.onStopSession}
        onNextSlide={props.onNextSlide}
        onPrevSlide={props.onPrevSlide}
        elapsedSeconds={props.elapsedSeconds}
      />
    </div>
  );
}

function TabButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium border"
      style={{
        backgroundColor: active ? 'var(--bg-surface-hover)' : 'var(--bg-surface)',
        borderColor: active ? 'var(--border-color)' : 'transparent',
        color: active ? 'var(--text-primary)' : 'var(--text-muted)',
      }}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add views/components/mobile/MobileSessionPage.tsx
git commit -m "feat: add MobileSessionPage with tabbed Record/Metrics layout"
```

---

## Chunk 4: Performance Tracking + Integration

### Task 16: Performance Instrumentation

**Files:**
- Create: `lib/performance.ts`

- [ ] **Step 1: Implement performance tracking module**

```ts
// lib/performance.ts

export function markMilestone(name: string) {
  if (typeof performance === 'undefined') return;
  performance.mark(`pitchr:${name}`);
}

export function measureMilestone(name: string, startMark: string) {
  if (typeof performance === 'undefined') return;
  try {
    performance.measure(`pitchr:${name}`, `pitchr:${startMark}`);
  } catch {
    // Start mark may not exist
  }
}

export function getDeviceType(): string {
  if (typeof document === 'undefined') return 'unknown';
  const match = document.cookie.match(/x-device-type=(\w+)/);
  return match?.[1] || 'unknown';
}

export function reportCustomMetric(name: string, value: number) {
  if (typeof window === 'undefined') return;
  // Vercel Analytics custom event
  const va = (window as Record<string, unknown>).va;
  if (typeof va === 'function') {
    va('event', {
      name: `perf:${name}`,
      data: { value, device: getDeviceType() },
    });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/performance.ts
git commit -m "feat: add performance instrumentation module"
```

---

### Task 17: LazyFont Component

**Files:**
- Create: `views/components/LazyFont.tsx`

- [ ] **Step 1: Implement LazyFont**

```tsx
// views/components/LazyFont.tsx
'use client';

import { useEffect } from 'react';

export function LazyFont({ href }: { href: string }) {
  useEffect(() => {
    const existing = document.querySelector(`link[href="${href}"]`);
    if (existing) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);

    return () => {
      // Don't remove — once loaded, keep it
    };
  }, [href]);

  return null;
}
```

- [ ] **Step 2: Commit**

```bash
git add views/components/LazyFont.tsx
git commit -m "feat: add LazyFont component for deferred font loading"
```

---

### Task 18: Mobile CSS Additions

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add the pulse keyframe (used by recording indicator)**

Check if pulse keyframe already exists in globals.css. If not, add:

```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/globals.css
git commit -m "feat: add mobile pulse animation keyframe"
```

---

### Task 19: Build Verification + TypeCheck

- [ ] **Step 1: Run TypeScript check**

Run: `cd C:\dev\pitchr && yarn typecheck`
Expected: No errors

- [ ] **Step 2: Run full build**

Run: `cd C:\dev\pitchr && yarn build`
Expected: Build succeeds

- [ ] **Step 3: Commit any fixes needed**

---

## Chunk 5: Visual Showcase (Figma-style page overview)

### Task 20: Build localhost showcase of all mobile pages

- [ ] **Step 1: Create a standalone HTML showcase page**

Build a Figma-style overview at the brainstorm server showing all mobile page mockups side by side in phone frames: Dashboard, Session (Record tab), Session (Metrics tab), History, Projects, Settings, Results, More Sheet.

- [ ] **Step 2: Push to brainstorm server and share URL with user**
