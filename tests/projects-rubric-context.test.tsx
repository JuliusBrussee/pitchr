import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ProjectsPage from '@/app/(app)/projects/page';
import type { Project } from '@/types/project';

const mockUseProject = vi.fn();
const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/views/components/ProjectProvider', () => ({
  useProject: () => mockUseProject(),
}));

vi.mock('@/views/components/CreateProjectModal', () => ({
  CreateProjectModal: (props: {
    isOpen: boolean;
    onClose: () => void;
    onCreated: (projectId: string) => void;
  }) => {
    if (!props.isOpen) return null;
    return (
      <div data-testid="create-project-modal">
        <button type="button" onClick={() => props.onCreated('project-new')}>Finish Create</button>
        <button type="button" onClick={props.onClose}>Close</button>
      </div>
    );
  },
}));

function createProject(id: string, name: string, description: string | null = null): Project {
  return {
    id,
    name,
    description,
    targetMarket: null,
    keyMetrics: null,
    extraNotes: null,
    isArchived: false,
    promptOverrides: {},
    createdAt: '2026-03-06T10:00:00.000Z',
    updatedAt: '2026-03-06T10:00:00.000Z',
  };
}

function renderProjectsPage(projects: Project[]) {
  mockUseProject.mockReturnValue({
    projects,
    activeProjectId: projects[0]?.id ?? null,
    isLoading: false,
    error: null,
  });
  render(<ProjectsPage />);
}

describe('ProjectsPage', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders project list and count for non-archived projects', () => {
    renderProjectsPage([
      createProject('project-alpha', 'Alpha', 'Alpha desc'),
      createProject('project-beta', 'Beta', 'Beta desc'),
    ]);

    expect(screen.getByRole('heading', { name: 'Projects' })).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('Alpha')).toBeTruthy();
    expect(screen.getByText('Beta')).toBeTruthy();
  });

  it('navigates to project detail when a project card is clicked', () => {
    renderProjectsPage([createProject('project-alpha', 'Alpha')]);

    const cardButton = screen.getByText('Alpha').closest('button');
    if (!cardButton) {
      throw new Error('Expected project card button.');
    }

    fireEvent.click(cardButton);
    expect(mockPush).toHaveBeenCalledWith('/projects/project-alpha');
  });

  it('opens create modal and navigates when creation completes', () => {
    renderProjectsPage([createProject('project-alpha', 'Alpha')]);

    fireEvent.click(screen.getAllByRole('button', { name: /new project/i })[0]);
    expect(screen.getByTestId('create-project-modal')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Finish Create' }));
    expect(mockPush).toHaveBeenCalledWith('/projects/project-new');
  });

  it('shows empty state when no projects exist', () => {
    renderProjectsPage([]);

    expect(screen.getByText('No projects yet')).toBeTruthy();
    expect(screen.getByText(/create your first project/i)).toBeTruthy();
  });
});
