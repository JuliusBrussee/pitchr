'use client';

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { SmartTooltip, type TooltipType } from '@/views/components/SmartTooltip';
import { TOURS, TOUR_STORAGE_PREFIX } from '@/config/tutorials';
import { useOnboarding } from '@/hooks/useOnboarding';
import type { Placement } from '@floating-ui/react';

/* ── Context types ────────────────────────────────────────────── */

interface TutorialContextValue {
  // Tour API
  startTour: (pageKey: string) => void;
  nextStep: () => void;
  skipTour: () => void;
  isTourActive: boolean;
  currentStep: number;
  currentPageKey: string | null;
  registerPage: (pageKey: string) => void;
  // Tooltip API
  showTooltip: (
    anchorEl: HTMLElement | null,
    type: TooltipType,
    message: string,
    placement?: Placement,
  ) => void;
  hideTooltip: () => void;
}

export const TutorialContext = createContext<TutorialContextValue>({
  startTour: () => {},
  nextStep: () => {},
  skipTour: () => {},
  isTourActive: false,
  currentStep: 0,
  currentPageKey: null,
  registerPage: () => {},
  showTooltip: () => {},
  hideTooltip: () => {},
});

/* ── Error / info tooltip state ───────────────────────────────── */

interface AdHocTooltip {
  id: number;
  anchorEl: HTMLElement;
  type: TooltipType;
  message: string;
  placement: Placement;
}

const AUTO_DISMISS_MS = 6000;
const TOUR_START_DELAY_MS = 800;

/* ── Provider ─────────────────────────────────────────────────── */

export function TutorialProvider({ children }: { children: ReactNode }) {
  const { state: onboardingState, loaded: onboardingLoaded } = useOnboarding();

  // Tour state
  const [activeTourKey, setActiveTourKey] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [tourAnchorEl, setTourAnchorEl] = useState<HTMLElement | null>(null);

  // Ad-hoc tooltip state (errors, info)
  const [adHocTooltip, setAdHocTooltip] = useState<AdHocTooltip | null>(null);
  const adHocCounter = useRef(0);
  const adHocTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track which pages have been registered to auto-start tours
  const registeredRef = useRef<Set<string>>(new Set());

  /* ── Helpers ─────────────────────────────────────────────────── */

  const isTourSeen = useCallback((pageKey: string): boolean => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(`${TOUR_STORAGE_PREFIX}${pageKey}`) === 'true';
  }, []);

  const markTourSeen = useCallback((pageKey: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${TOUR_STORAGE_PREFIX}${pageKey}`, 'true');
    }
  }, []);

  /* ── Resolve anchor element for a tour step ─────────────────── */

  const resolveAnchor = useCallback((anchorId: string): HTMLElement | null => {
    return document.querySelector(`[data-tour="${anchorId}"]`);
  }, []);

  /* ── Tour controls ──────────────────────────────────────────── */

  const startTour = useCallback((pageKey: string) => {
    const steps = TOURS[pageKey];
    if (!steps || steps.length === 0) return;
    setActiveTourKey(pageKey);
    setStepIndex(0);
    const el = resolveAnchor(steps[0].anchorId);
    setTourAnchorEl(el);
  }, [resolveAnchor]);

  const endTour = useCallback((markSeen = true) => {
    if (activeTourKey && markSeen) {
      markTourSeen(activeTourKey);
    }
    setActiveTourKey(null);
    setStepIndex(0);
    setTourAnchorEl(null);
  }, [activeTourKey, markTourSeen]);

  const nextStep = useCallback(() => {
    if (!activeTourKey) return;
    const steps = TOURS[activeTourKey];
    if (!steps) return;
    const next = stepIndex + 1;
    if (next >= steps.length) {
      endTour(true);
      return;
    }
    setStepIndex(next);
    const el = resolveAnchor(steps[next].anchorId);
    setTourAnchorEl(el);
  }, [activeTourKey, stepIndex, endTour, resolveAnchor]);

  const skipTour = useCallback(() => {
    endTour(true);
  }, [endTour]);

  /* ── Auto-start tour on page registration ───────────────────── */

  const registerPage = useCallback((pageKey: string) => {
    if (registeredRef.current.has(pageKey)) return;
    registeredRef.current.add(pageKey);

    // Only auto-start if onboarding is complete and tour not yet seen
    if (!onboardingLoaded || !onboardingState.isComplete) return;
    if (isTourSeen(pageKey)) return;
    if (!TOURS[pageKey]) return;

    const timer = setTimeout(() => {
      // Re-check — user might have navigated away
      if (isTourSeen(pageKey)) return;
      startTour(pageKey);
    }, TOUR_START_DELAY_MS);

    return () => clearTimeout(timer);
  }, [onboardingLoaded, onboardingState.isComplete, isTourSeen, startTour]);

  // Clear registrations when tour key changes so pages can re-register on navigation
  useEffect(() => {
    if (!activeTourKey) {
      registeredRef.current.clear();
    }
  }, [activeTourKey]);

  /* ── Ad-hoc tooltip API ─────────────────────────────────────── */

  const showTooltip = useCallback((
    anchorEl: HTMLElement | null,
    type: TooltipType,
    message: string,
    placement: Placement = 'top',
  ) => {
    if (!anchorEl) return;
    if (adHocTimerRef.current) clearTimeout(adHocTimerRef.current);
    const id = ++adHocCounter.current;
    setAdHocTooltip({ id, anchorEl, type, message, placement });
    adHocTimerRef.current = setTimeout(() => {
      setAdHocTooltip((prev) => (prev?.id === id ? null : prev));
    }, AUTO_DISMISS_MS);
  }, []);

  const hideTooltip = useCallback(() => {
    if (adHocTimerRef.current) clearTimeout(adHocTimerRef.current);
    setAdHocTooltip(null);
  }, []);

  /* ── Spotlight overlay dimensions ───────────────────────────── */

  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!activeTourKey || !tourAnchorEl) {
      setSpotlightRect(null);
      return;
    }
    const update = () => {
      const rect = tourAnchorEl.getBoundingClientRect();
      setSpotlightRect(rect);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(tourAnchorEl);
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [activeTourKey, tourAnchorEl]);

  /* ── Current tour step data ─────────────────────────────────── */

  const currentTourStep = useMemo(() => {
    if (!activeTourKey) return null;
    const steps = TOURS[activeTourKey];
    if (!steps || stepIndex >= steps.length) return null;
    return steps[stepIndex];
  }, [activeTourKey, stepIndex]);

  /* ── Context value ──────────────────────────────────────────── */

  const ctxValue = useMemo<TutorialContextValue>(() => ({
    startTour,
    nextStep,
    skipTour,
    isTourActive: Boolean(activeTourKey),
    currentStep: stepIndex,
    currentPageKey: activeTourKey,
    registerPage,
    showTooltip,
    hideTooltip,
  }), [startTour, nextStep, skipTour, activeTourKey, stepIndex, registerPage, showTooltip, hideTooltip]);

  /* ── Render ─────────────────────────────────────────────────── */

  const pad = 8;

  return (
    <TutorialContext.Provider value={ctxValue}>
      {children}

      {/* Spotlight overlay */}
      {typeof document !== 'undefined' && activeTourKey && spotlightRect && createPortal(
        <div
          className="fixed inset-0 transition-opacity duration-300"
          style={{
            zIndex: 10000,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            clipPath: `polygon(
              0% 0%, 0% 100%, 100% 100%, 100% 0%,
              0% 0%,
              ${spotlightRect.left - pad}px ${spotlightRect.top - pad}px,
              ${spotlightRect.left - pad}px ${spotlightRect.bottom + pad}px,
              ${spotlightRect.right + pad}px ${spotlightRect.bottom + pad}px,
              ${spotlightRect.right + pad}px ${spotlightRect.top - pad}px,
              ${spotlightRect.left - pad}px ${spotlightRect.top - pad}px,
              0% 0%
            )`,
            pointerEvents: 'auto',
          }}
          onClick={skipTour}
          aria-hidden
        />,
        document.body,
      )}

      {/* Tour tooltip */}
      {typeof document !== 'undefined' && currentTourStep && createPortal(
        <SmartTooltip
          anchorEl={tourAnchorEl}
          open={Boolean(activeTourKey)}
          type="tour"
          title={currentTourStep.title}
          message={currentTourStep.message}
          placement={currentTourStep.placement}
          onDismiss={skipTour}
          tourControls={{
            step: stepIndex + 1,
            total: TOURS[activeTourKey!]?.length ?? 0,
            onNext: nextStep,
            onSkip: skipTour,
          }}
        />,
        document.body,
      )}

      {/* Ad-hoc error / info tooltip */}
      {typeof document !== 'undefined' && adHocTooltip && createPortal(
        <SmartTooltip
          anchorEl={adHocTooltip.anchorEl}
          open
          type={adHocTooltip.type}
          message={adHocTooltip.message}
          placement={adHocTooltip.placement}
          onDismiss={hideTooltip}
        />,
        document.body,
      )}
    </TutorialContext.Provider>
  );
}
