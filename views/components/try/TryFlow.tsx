'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { TRY_STEPS } from '@/config/try-flow';
import { ProgressBar } from '@/views/components/onboarding/ProgressBar';
import { StepTransition } from '@/views/components/onboarding/StepTransition';
import { HookStep } from '@/views/components/onboarding/steps/HookStep';
import { ProblemStep } from '@/views/components/onboarding/steps/ProblemStep';
import { FeatureFlashStep } from './steps/FeatureFlashStep';
import { UseCaseStep } from './steps/UseCaseStep';
import { TryRecordingStep } from './steps/TryRecordingStep';
import { GatedResultsStep } from './steps/GatedResultsStep';
import type { PitchMode } from '@/types/pitch';

export function TryFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedMode, setSelectedMode] = useState<PitchMode>('elevator');
  const touchStartX = useRef<number | null>(null);

  // Only show progress for educational steps (0-3), not recording/results
  const educationalSteps = 4;
  const isEducationalStep = currentStep < educationalSteps;

  const goNext = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, TRY_STEPS.length - 1));
  }, []);

  const goBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  // Keyboard navigation (only for educational steps)
  useEffect(() => {
    if (!isEducationalStep) return;
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
  }, [goNext, goBack, isEducationalStep]);

  // Touch swipe (only for educational steps)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isEducationalStep) return;
    touchStartX.current = e.touches[0].clientX;
  }, [isEducationalStep]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isEducationalStep || touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 50) {
      if (delta > 0) goNext();
      else goBack();
    }
    touchStartX.current = null;
  }, [goNext, goBack, isEducationalStep]);

  const handleModeSelect = useCallback((mode: PitchMode) => {
    setSelectedMode(mode);
    goNext();
  }, [goNext]);

  const renderStep = () => {
    switch (TRY_STEPS[currentStep]) {
      case 'hook': return <HookStep onNext={goNext} />;
      case 'problem': return <ProblemStep onNext={goNext} />;
      case 'feature-flash': return <FeatureFlashStep onNext={goNext} />;
      case 'use-case': return <UseCaseStep onSelect={handleModeSelect} />;
      case 'record': return <TryRecordingStep mode={selectedMode} onComplete={goNext} />;
      case 'analysis':
      case 'gated-results':
        return <GatedResultsStep mode={selectedMode} />;
      default: return null;
    }
  };

  return (
    <div
      className="flex flex-col h-full"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {isEducationalStep && (
        <ProgressBar
          currentStep={currentStep}
          totalSteps={educationalSteps}
        />
      )}
      <div className="flex-1 overflow-y-auto">
        <StepTransition stepKey={currentStep}>
          {renderStep()}
        </StepTransition>
      </div>
    </div>
  );
}
