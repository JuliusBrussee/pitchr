import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProjectSelect, type ProjectSelectOption } from '@/views/components/ProjectSelect';

const OPTIONS: ProjectSelectOption[] = [
  {
    value: 'two_min_pitch',
    label: '2-Minute Pitch',
    description: 'Full investor pitch workflow',
  },
  {
    value: 'elevator_pitch',
    label: 'Elevator Pitch',
    description: 'Fast 30-second workflow',
  },
];

describe('ProjectSelect', () => {
  it('opens and closes listbox options', () => {
    render(
      <ProjectSelect
        ariaLabel="Project type"
        value="two_min_pitch"
        options={OPTIONS}
        onChange={() => {}}
      />,
    );

    const combobox = screen.getByRole('combobox', { name: 'Project type' });
    fireEvent.click(combobox);
    expect(screen.getByRole('listbox', { name: 'Project type' })).toBeTruthy();

    fireEvent.keyDown(combobox, { key: 'Escape' });
    expect(screen.queryByRole('listbox', { name: 'Project type' })).toBeNull();
  });

  it('calls onChange when selecting an option by click', () => {
    const onChange = vi.fn();
    render(
      <ProjectSelect
        ariaLabel="Project type"
        value="two_min_pitch"
        options={OPTIONS}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole('combobox', { name: 'Project type' }));
    fireEvent.click(screen.getByRole('option', { name: /Elevator Pitch/i }));

    expect(onChange).toHaveBeenCalledWith('elevator_pitch');
  });

  it('supports keyboard navigation and selection', () => {
    const onChange = vi.fn();
    render(
      <ProjectSelect
        ariaLabel="Project type"
        value="two_min_pitch"
        options={OPTIONS}
        onChange={onChange}
      />,
    );

    const combobox = screen.getByRole('combobox', { name: 'Project type' });
    combobox.focus();

    fireEvent.keyDown(combobox, { key: 'ArrowDown' });
    fireEvent.keyDown(combobox, { key: 'ArrowDown' });
    fireEvent.keyDown(combobox, { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith('elevator_pitch');
  });

  it('applies project select theme classes', () => {
    render(
      <ProjectSelect
        ariaLabel="Project type"
        value="two_min_pitch"
        options={OPTIONS}
        onChange={() => {}}
      />,
    );

    const combobox = screen.getByRole('combobox', { name: 'Project type' });
    expect(combobox.classList.contains('project-select-trigger')).toBe(true);

    fireEvent.click(combobox);
    const panel = screen.getByRole('listbox', { name: 'Project type' });
    expect(panel.classList.contains('project-select-panel')).toBe(true);
  });
});
