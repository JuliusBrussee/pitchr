# Sidebar Redesign — Warm & Branded Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate the dashboard sidebar from generic to premium with warm brand colors, icon pill containers, gradient avatar, diamond credits bar, and enhanced CTA glow.

**Architecture:** Pure visual changes to `AppSidebar.tsx` (container, nav items, user section), one new data dependency (`useBilling`), and moving legal links to the settings page. No structural/routing changes.

**Tech Stack:** React, Tailwind CSS, CSS custom properties, Lucide icons, existing `useBilling` hook.

**Spec:** `docs/superpowers/specs/2026-03-10-sidebar-redesign-design.md`

---

## Chunk 1: Sidebar Visual Overhaul

### Task 1: Container Gradient Wash + Logo Glow

**Files:**
- Modify: `views/components/AppSidebar.tsx:58-66` (aside container styles)
- Modify: `views/components/AppSidebar.tsx:69-84` (logo section)

- [ ] **Step 1: Update the aside container background to include warm gradient wash**

In `views/components/AppSidebar.tsx`, change the `<aside>` style prop:

```tsx
style={{
  background: 'linear-gradient(180deg, rgba(255,89,65,0.04) 0%, transparent 40%), var(--bg-surface)',
  backdropFilter: `blur(var(--blur-strength))`,
  WebkitBackdropFilter: `blur(var(--blur-strength))`,
  borderColor: 'var(--border-color)',
}}
```

Note: `backgroundColor` becomes `background` to support the gradient + fallback.

- [ ] **Step 2: Add glow shadow to the PitchrLogo wrapper**

Wrap the `<PitchrLogo>` in a div with the glow, or apply directly to the existing flex container. Change the logo `<div>` at line 70:

```tsx
<div className="flex items-center gap-2">
  <div
    className="rounded-lg overflow-hidden"
    style={{ boxShadow: '0 0 20px rgba(255,89,65,0.3)' }}
  >
    <PitchrLogo size={14} />
  </div>
  <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
    Pitchr
  </span>
</div>
```

- [ ] **Step 3: Visually verify in browser**

Run: `yarn dev`
Check: Sidebar has subtle warm glow at top, logo has orange glow halo. Both light and dark mode.

- [ ] **Step 4: Commit**

```bash
git add views/components/AppSidebar.tsx
git commit -m "feat(sidebar): add warm gradient wash and logo glow"
```

---

### Task 2: Nav Items — Icon Pill Backgrounds

**Files:**
- Modify: `views/components/AppSidebar.tsx:118-143` (main nav)
- Modify: `views/components/AppSidebar.tsx:149-172` (tools nav)

- [ ] **Step 1: Extract a reusable NavItem renderer**

To avoid duplicating the icon pill logic between NAV_ITEMS and TOOL_ITEMS, create a local `NavLink` component inside `AppSidebar.tsx` (above the return statement). This is the **complete, final version** with light/dark mode handling built in — `isDark` and `closeSidebar` are accessible via closure:

```tsx
const NavLink = ({ item, isActive }: { item: { id: string; label: string; icon: React.ComponentType<{ size: number }>; href: string }; isActive: boolean }) => {
  const Icon = item.icon;
  return (
    <Link
      key={item.id}
      href={item.href}
      onClick={closeSidebar}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 no-underline"
      style={{
        backgroundColor: isActive
          ? isDark ? 'rgba(255,89,65,0.1)' : 'rgba(255,89,65,0.06)'
          : 'transparent',
        border: isActive
          ? isDark ? '1px solid rgba(255,89,65,0.12)' : '1px solid rgba(255,89,65,0.1)'
          : '1px solid transparent',
        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
      }}
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-200"
        style={{
          backgroundColor: isActive
            ? isDark ? 'rgba(255,89,65,0.15)' : 'rgba(255,89,65,0.1)'
            : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
          color: isActive ? '#ff5941' : undefined,
        }}
      >
        <Icon size={16} />
      </div>
      <span className="flex-1">{item.label}</span>
    </Link>
  );
};
```

- [ ] **Step 2: Replace the main nav rendering with NavLink**

```tsx
<nav className="flex flex-col gap-[3px]">
  {NAV_ITEMS.map(item => {
    const isActive = item.id === 'session'
      ? pathname.startsWith('/session')
      : item.id === 'arena'
        ? pathname.startsWith('/arena')
        : pathname === item.href;
    return <NavLink key={item.id} item={item} isActive={isActive} />;
  })}
</nav>
```

- [ ] **Step 3: Replace the tools nav rendering with NavLink**

```tsx
<nav className="flex flex-col gap-[3px]">
  <span className="px-3 text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
    Tools
  </span>
  {TOOL_ITEMS.map(item => {
    const isActive = pathname === item.href;
    return <NavLink key={item.id} item={item} isActive={isActive} />;
  })}
</nav>
```

- [ ] **Step 4: Visually verify in browser**

Check: Each nav icon is inside a rounded pill container. Active item has warm background + border. Icon turns coral on active. Both light and dark mode. Gap between items slightly larger than before.

- [ ] **Step 5: Commit**

```bash
git add views/components/AppSidebar.tsx
git commit -m "feat(sidebar): add icon pill backgrounds and branded active states"
```

---

### Task 3: User Section — Avatar + Plan + Diamond Credits Bar

**Files:**
- Modify: `views/components/AppSidebar.tsx:1-26` (imports)
- Modify: `views/components/AppSidebar.tsx:177-210` (user section + legal links)

- [ ] **Step 1: Add useBilling import and hook call**

Add to imports:
```tsx
import { useBilling } from '@/hooks/useBilling';
import { Diamond } from 'lucide-react';
```

Add inside the component body (after existing hooks):
```tsx
const { subscription, credits } = useBilling();
```

- [ ] **Step 2: Create helper for plan label and user initial**

Add above the return statement:
```tsx
const planLabel = subscription?.planId === 'pro'
  ? 'Pro Plan'
  : subscription?.planId === 'day_pass'
    ? 'Day Pass'
    : 'Free Plan';

const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : '?';
```

- [ ] **Step 3: Replace the user section AND remove legal links**

Delete lines 177–210 entirely (from `{/* User section */}` through the closing `</div>` of `{/* Legal links */}`). Replace with:

```tsx
{/* User section */}
{user && (
  <div className="mb-2">
    <div
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
      style={{ backgroundColor: 'var(--bg-surface-hover)' }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{
          background: 'linear-gradient(135deg, #ff5941, #ffaa33)',
          color: 'white',
          fontSize: '13px',
          fontWeight: 600,
        }}
      >
        {userInitial}
      </div>
      <div className="flex-1 min-w-0">
        <span
          className="block text-[11px] truncate font-medium"
          style={{ color: 'var(--text-primary)' }}
          title={user.email}
        >
          {user.email}
        </span>
        <span className="block text-[10px]" style={{ color: 'var(--text-muted)' }}>
          {planLabel}
        </span>
      </div>
      <button
        onClick={signOut}
        className="p-1 rounded transition-colors hover:opacity-80"
        style={{ color: 'var(--text-muted)' }}
        aria-label="Sign out"
      >
        <LogOut size={14} />
      </button>
    </div>

    {/* Credits bar — hidden for free users with 0 credits */}
    {credits && credits.totalAvailable > 0 && (
      <div
        className="flex items-center gap-1.5 mt-2 px-2 py-1.5 rounded-lg"
        style={{
          backgroundColor: 'rgba(255,170,51,0.06)',
          border: isDark ? '1px solid rgba(255,170,51,0.1)' : '1px solid rgba(255,170,51,0.12)',
        }}
      >
        <Diamond size={12} style={{ color: '#ffaa33', opacity: 0.7 }} />
        <span style={{ color: '#ffaa33', opacity: 0.8, fontSize: '10px', fontWeight: 500 }}>
          {credits.totalAvailable} remaining
        </span>
      </div>
    )}
  </div>
)}
```

- [ ] **Step 4: Visually verify in browser**

Check: Square gradient avatar with initial. Email + plan label. Diamond credits bar with warm tint below. No legal links in sidebar. Both light and dark mode.

- [ ] **Step 5: Commit**

```bash
git add views/components/AppSidebar.tsx
git commit -m "feat(sidebar): add avatar, plan label, and diamond credits bar"
```

---

### Task 4: Enhanced CTA Glow

**Files:**
- Modify: `app/globals.css` (session-start-btn shadow)

- [ ] **Step 1: Update `.session-start-btn` box-shadow and breathing keyframes in `app/globals.css`**

Find `.session-start-btn` (around line 381) and replace its box-shadow:

```css
/* BEFORE (lines 381-383): */
box-shadow:
  0 0 20px rgba(255, 89, 65, 0.12),
  0 0 40px rgba(255, 89, 65, 0.04);

/* AFTER: */
box-shadow:
  0 0 24px rgba(255, 89, 65, 0.25),
  0 0 48px rgba(255, 89, 65, 0.08);
```

Then update `@keyframes session-breathe` (around line 387):

```css
/* BEFORE (lines 387-398): */
@keyframes session-breathe {
  0%, 100% {
    box-shadow:
      0 0 20px rgba(255, 89, 65, 0.12),
      0 0 40px rgba(255, 89, 65, 0.04);
  }
  50% {
    box-shadow:
      0 0 28px rgba(255, 89, 65, 0.25),
      0 0 56px rgba(255, 89, 65, 0.08);
  }
}

/* AFTER: */
@keyframes session-breathe {
  0%, 100% {
    box-shadow:
      0 0 24px rgba(255, 89, 65, 0.25),
      0 0 48px rgba(255, 89, 65, 0.08);
  }
  50% {
    box-shadow:
      0 0 32px rgba(255, 89, 65, 0.35),
      0 0 64px rgba(255, 89, 65, 0.12);
  }
}
```

The hover state (`.session-start-btn:hover`, around line 400) already uses the stronger values — no change needed there.

- [ ] **Step 2: Visually verify in browser**

Check: Start Session button has a more prominent warm glow. Breathing animation still works.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat(sidebar): enhance start session CTA glow"
```

---

### Task 5: Move Legal Links to Settings Page

**Files:**
- Modify: `app/(app)/settings/page.tsx` (add legal links at bottom)

- [ ] **Step 1: Read the settings page to find the right insertion point**

Read `app/(app)/settings/page.tsx` and find the closing of the tab content area. The links should go after all tab panels but before the closing wrapper div — always visible regardless of active tab.

- [ ] **Step 2: Add legal links at the bottom of the settings page**

After the tab content section, add:

```tsx
{/* Legal links */}
<div className="flex items-center gap-3 mt-8 pt-4 text-xs" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)' }}>
  <Link href="/terms" className="no-underline hover:underline" style={{ color: 'var(--text-muted)' }}>
    Terms
  </Link>
  <span>·</span>
  <Link href="/privacy" className="no-underline hover:underline" style={{ color: 'var(--text-muted)' }}>
    Privacy
  </Link>
</div>
```

**Important:** The settings page does NOT currently import `Link`. Add this import at the top of the file:

```tsx
import Link from 'next/link';
```

- [ ] **Step 3: Visually verify in browser**

Check: `/settings` page shows Terms · Privacy links at the bottom. Sidebar no longer has them.

- [ ] **Step 4: Commit**

```bash
git add app/(app)/settings/page.tsx
git commit -m "feat(settings): move legal links from sidebar to settings page"
```

---

### Task 6: Final Verification

- [ ] **Step 1: Full visual review**

Run `yarn dev` and check all of the following:
- Dark mode: gradient wash, logo glow, icon pills, active states, avatar, credits bar, CTA glow
- Light mode: all the same elements with light-mode color values
- Mobile: hamburger menu opens sidebar, all new styles render correctly
- Settings page: legal links visible at bottom
- Different user states: free user (no credits bar), pro user (credits shown), day pass user

- [ ] **Step 2: Build check**

Run: `yarn build:claude`
Expected: Clean build with no errors or type issues.

- [ ] **Step 3: Final commit if any cleanup needed**

```bash
git add -A
git commit -m "chore(sidebar): polish and cleanup"
```
