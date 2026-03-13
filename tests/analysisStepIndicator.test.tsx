import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { AnalysisStepIndicator } from '@/views/components/results/AnalysisStepIndicator';

describe('AnalysisStepIndicator', () => {
  it('renders without crashing', () => {
    const { container } = render(<AnalysisStepIndicator />);
    expect(container.firstChild).not.toBeNull();
  });

  it('shows a step label', () => {
    const { getByText } = render(<AnalysisStepIndicator />);
    expect(getByText(/processing transcript/i)).toBeTruthy();
  });
});
