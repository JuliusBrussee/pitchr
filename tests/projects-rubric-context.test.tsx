import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ProjectsPage from '@/app/(app)/projects/page';
import { RUBRIC_CONTEXT_MAX_CHARS } from '@/supabase/functions/_shared/rubric-context';
import type { Project } from '@/types/project';

const mockUseProject = vi.fn();

vi.mock('@/views/components/ProjectProvider', () => ({
  useProject: () => mockUseProject(),
}));

function createProject(id: string, name: string, rubricContext = ''): Project {
  return {
    id,
    name,
    type: 'two_min_pitch',
    workflowMode: 'vc_pitch',
    isArchived: false,
    isSeeded: false,
    promptOverrides: {
      analysis_system_prompt: rubricContext,
      analysis_system_prompt_meta: {
        updated_at: '2026-03-06T10:00:00.000Z',
        updated_by: 'user-123',
      },
    },
    createdAt: '2026-03-06T10:00:00.000Z',
    updatedAt: '2026-03-06T10:00:00.000Z',
  };
}

function renderProjectsPage(projects: Project[]) {
  const updateProject = vi.fn();
  mockUseProject.mockReturnValue({
    projects,
    activeProjectId: projects[0]?.id ?? null,
    isLoading: false,
    error: null,
    setActiveProject: vi.fn(),
    createProject: vi.fn(),
    updateProject,
  });
  render(<ProjectsPage />);
  return { updateProject };
}

describe('ProjectsPage rubric context', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders a dedicated Rubric & Context section', () => {
    renderProjectsPage([
      createProject('project-alpha', 'Alpha'),
      createProject('project-beta', 'Beta'),
    ]);

    const alphaCard = screen.getByRole('heading', { name: 'Alpha' }).closest('article');
    const betaCard = screen.getByRole('heading', { name: 'Beta' }).closest('article');

    if (!alphaCard || !betaCard) {
      throw new Error('Could not find expected project cards.');
    }

    expect(within(alphaCard).getByText('Rubric & Context')).toBeInTheDocument();
    expect(within(alphaCard).getByRole('button', { name: 'Edit Rubric & Context' })).toBeInTheDocument();

    expect(within(betaCard).getByText('Rubric & Context')).toBeInTheDocument();
    expect(within(betaCard).getByRole('button', { name: 'Edit Rubric & Context' })).toBeInTheDocument();
  });

  it('explains that saved context is automatically applied to all project runs', () => {
    renderProjectsPage([createProject('project-alpha', 'Alpha')]);

    expect(
      screen.getByText(/Saved context is automatically applied to all runs in this project\./i),
    ).toBeInTheDocument();
  });

  it('allows only one project editor to be open at a time', () => {
    renderProjectsPage([
      createProject('project-alpha', 'Alpha'),
      createProject('project-beta', 'Beta'),
    ]);

    const alphaCard = screen.getByRole('heading', { name: 'Alpha' }).closest('article');
    const betaCard = screen.getByRole('heading', { name: 'Beta' }).closest('article');

    if (!alphaCard || !betaCard) {
      throw new Error('Could not find expected project cards.');
    }

    fireEvent.click(within(alphaCard).getByRole('button', { name: 'Edit Rubric & Context' }));
    expect(screen.getByLabelText('Rubric & Context editor for Alpha')).toBeInTheDocument();

    fireEvent.click(within(betaCard).getByRole('button', { name: 'Edit Rubric & Context' }));
    expect(screen.getByLabelText('Rubric & Context editor for Beta')).toBeInTheDocument();
    expect(screen.queryByLabelText('Rubric & Context editor for Alpha')).not.toBeInTheDocument();
  });

  it('renders a mobile-focused full-screen editor shell when opened', () => {
    renderProjectsPage([
      createProject('project-alpha', 'Alpha'),
    ]);

    const alphaCard = screen.getByRole('heading', { name: 'Alpha' }).closest('article');
    if (!alphaCard) {
      throw new Error('Could not find expected project card.');
    }

    fireEvent.click(within(alphaCard).getByRole('button', { name: 'Edit Rubric & Context' }));

    const shell = screen.getByTestId('rubric-context-editor-shell-project-alpha');
    expect(shell.className).toContain('fixed');
    expect(shell.className).toContain('inset-0');
  });

  it('shows live character counter and inline validation errors for empty and oversized values', () => {
    renderProjectsPage([
      createProject('project-alpha', 'Alpha', 'seed'),
    ]);

    const alphaCard = screen.getByRole('heading', { name: 'Alpha' }).closest('article');
    if (!alphaCard) {
      throw new Error('Could not find expected project card.');
    }

    fireEvent.click(within(alphaCard).getByRole('button', { name: 'Edit Rubric & Context' }));

    const editor = screen.getByLabelText('Rubric & Context editor for Alpha');
    const max = RUBRIC_CONTEXT_MAX_CHARS.toLocaleString('en-US');

    fireEvent.change(editor, { target: { value: 'abc' } });
    expect(screen.getByText(`3/${max}`)).toBeInTheDocument();

    fireEvent.change(editor, { target: { value: '   ' } });
    expect(screen.getByText('analysis_system_prompt is required.')).toBeInTheDocument();

    renderProjectsPage([
      createProject('project-gamma', 'Gamma', 'x'.repeat(RUBRIC_CONTEXT_MAX_CHARS + 1)),
    ]);

    const gammaCard = screen.getByRole('heading', { name: 'Gamma' }).closest('article');
    if (!gammaCard) {
      throw new Error('Could not find expected project card.');
    }

    fireEvent.click(within(gammaCard).getByRole('button', { name: 'Edit Rubric & Context' }));

    expect(
      screen.getByText(`analysis_system_prompt must be ${max} characters or fewer.`),
    ).toBeInTheDocument();
  });
});

describe('ProjectsPage rubric context manual save workflow', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('keeps Save disabled until the trimmed draft is valid', () => {
    renderProjectsPage([
      createProject('project-alpha', 'Alpha'),
    ]);

    const alphaCard = screen.getByRole('heading', { name: 'Alpha' }).closest('article');
    if (!alphaCard) {
      throw new Error('Could not find expected project card.');
    }

    fireEvent.click(within(alphaCard).getByRole('button', { name: 'Edit Rubric & Context' }));

    const editor = screen.getByLabelText('Rubric & Context editor for Alpha');
    const saveButton = screen.getByRole('button', { name: 'Save' });

    expect(saveButton).toBeDisabled();

    fireEvent.change(editor, { target: { value: '   ' } });
    expect(saveButton).toBeDisabled();

    fireEvent.change(editor, { target: { value: 'valid rubric context' } });
    expect(saveButton).not.toBeDisabled();
  });

  it('shows Unsaved changes whenever the draft differs from saved value', () => {
    renderProjectsPage([
      createProject('project-alpha', 'Alpha', 'initial rubric'),
    ]);

    const alphaCard = screen.getByRole('heading', { name: 'Alpha' }).closest('article');
    if (!alphaCard) {
      throw new Error('Could not find expected project card.');
    }

    fireEvent.click(within(alphaCard).getByRole('button', { name: 'Edit Rubric & Context' }));
    expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();

    const editor = screen.getByLabelText('Rubric & Context editor for Alpha');
    fireEvent.change(editor, { target: { value: 'updated rubric context' } });
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
  });

  it('shows success feedback after a successful save and clears dirty state', async () => {
    const { updateProject } = renderProjectsPage([
      createProject('project-alpha', 'Alpha', 'initial rubric'),
    ]);

    const alphaCard = screen.getByRole('heading', { name: 'Alpha' }).closest('article');
    if (!alphaCard) {
      throw new Error('Could not find expected project card.');
    }

    fireEvent.click(within(alphaCard).getByRole('button', { name: 'Edit Rubric & Context' }));
    const editor = screen.getByLabelText('Rubric & Context editor for Alpha');
    fireEvent.change(editor, { target: { value: 'updated rubric context' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(updateProject).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText('Saved just now')).toBeInTheDocument();
    expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
  });

  it('keeps draft text on save failure and exposes Retry', async () => {
    const { updateProject } = renderProjectsPage([
      createProject('project-alpha', 'Alpha', 'initial rubric'),
    ]);
    updateProject.mockRejectedValueOnce(new Error('Network request failed'));

    const alphaCard = screen.getByRole('heading', { name: 'Alpha' }).closest('article');
    if (!alphaCard) {
      throw new Error('Could not find expected project card.');
    }

    fireEvent.click(within(alphaCard).getByRole('button', { name: 'Edit Rubric & Context' }));
    const editor = screen.getByLabelText('Rubric & Context editor for Alpha');

    fireEvent.change(editor, { target: { value: 'updated rubric context' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(updateProject).toHaveBeenCalledTimes(1);
    });

    expect((editor as HTMLTextAreaElement).value).toBe('updated rubric context');
    expect(screen.getByText('Failed to save rubric/context.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('merges existing promptOverrides and updates only analysis_system_prompt in save payload', async () => {
    const project = createProject('project-alpha', 'Alpha', 'initial rubric');
    project.promptOverrides = {
      ...project.promptOverrides,
      custom_setting: 'keep-me',
      nested: { strictness: 'high' },
    };
    const { updateProject } = renderProjectsPage([project]);

    const alphaCard = screen.getByRole('heading', { name: 'Alpha' }).closest('article');
    if (!alphaCard) {
      throw new Error('Could not find expected project card.');
    }

    fireEvent.click(within(alphaCard).getByRole('button', { name: 'Edit Rubric & Context' }));
    const editor = screen.getByLabelText('Rubric & Context editor for Alpha');
    fireEvent.change(editor, { target: { value: '  updated rubric context  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(updateProject).toHaveBeenCalledTimes(1);
    });

    expect(updateProject).toHaveBeenCalledWith({
      projectId: 'project-alpha',
      promptOverrides: {
        analysis_system_prompt: 'updated rubric context',
        analysis_system_prompt_meta: {
          updated_at: '2026-03-06T10:00:00.000Z',
          updated_by: 'user-123',
        },
        custom_setting: 'keep-me',
        nested: { strictness: 'high' },
      },
    });
  });
});
