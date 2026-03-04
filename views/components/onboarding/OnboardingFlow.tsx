'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { ONBOARDING_STEPS } from '@/config/onboarding';
import { ProgressBar } from './ProgressBar';
import { StepTransition } from './StepTransition';
import { HookStep } from './steps/HookStep';
import { ProblemStep } from './steps/ProblemStep';
import { SessionDemoStep } from './steps/SessionDemoStep';
import { RealtimeIntelStep } from './steps/RealtimeIntelStep';
import { RubricStep } from './steps/RubricStep';
import { ScoringDemoStep } from './steps/ScoringDemoStep';
import { RewriteDemoStep } from './steps/RewriteDemoStep';
import { PersonalizationStep } from './steps/PersonalizationStep';

interface OnboardingFlowProps {
  onComplete: (name: string, projectName: string, projectDescription: string) => void;
  onSkip: () => void;
}

export function OnboardingFlow({ onComplete, onSkip }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const totalSteps = ONBOARDING_STEPS.length;

  const goNext = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
  }, [totalSteps]);

  const goBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goBack]);

  // Touch swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 50) {
      if (delta > 0) goNext();
      else goBack();
    }
    touchStartX.current = null;
  }, [goNext, goBack]);

  const renderStep = () => {
    switch (ONBOARDING_STEPS[currentStep]) {
      case 'hook': return <HookStep onNext={goNext} />;
      case 'problem': return <ProblemStep onNext={goNext} />;
      case 'session-demo': return <SessionDemoStep onNext={goNext} />;
      case 'realtime-intel': return <RealtimeIntelStep onNext={goNext} />;
      case 'rubric': return <RubricStep onNext={goNext} />;
      case 'scoring-demo': return <ScoringDemoStep onNext={goNext} />;
      case 'rewrite-demo': return <RewriteDemoStep onNext={goNext} />;
      case 'personalization': return <PersonalizationStep onComplete={onComplete} />;
      default: return null;
    }
  };

  return (
    <div
      className="flex flex-col h-full"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <ProgressBar
        currentStep={currentStep}
        totalSteps={totalSteps}
        onSkip={onSkip}
      />
      <div className="flex-1 overflow-y-auto">
        <StepTransition stepKey={currentStep}>
          {renderStep()}
        </StepTransition>
      </div>
    </div>
  );
}
