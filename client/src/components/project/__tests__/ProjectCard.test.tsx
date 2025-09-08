import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectCard } from '../ProjectCard';
import { Project } from '@/types/project';

// Mock the sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn()
  }
}));

const mockProject: Project = {
  id: 'test-project-1',
  name: 'Test Project',
  description: 'A test project description',
  color: 'blue',
  isActive: true,
  members: [
    {
      userId: 'user-1',
      role: 'owner',
      permissions: ['project:read', 'project:write', 'project:delete'],
      joinedAt: '2024-01-01T00:00:00Z'
    }
  ],
  permissions: {
    canRead: true,
    canWrite: true,
    canDelete: true,
    canManageMembers: true
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  order: 0
};

describe('ProjectCard', () => {
  const mockOnSelect = jest.fn();
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnToggleActive = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders project information correctly', () => {
    render(
      <ProjectCard
        project={mockProject}
        onSelect={mockOnSelect}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleActive={mockOnToggleActive}
      />
    );

    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('A test project description')).toBeInTheDocument();
    expect(screen.getByText('1명')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /프로젝트 색상: 파랑/ })).toBeInTheDocument();
  });

  it('shows inactive badge for inactive projects', () => {
    const inactiveProject = { ...mockProject, isActive: false };
    
    render(
      <ProjectCard
        project={inactiveProject}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('비활성')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <ProjectCard
        project={mockProject}
        onSelect={mockOnSelect}
      />
    );

    const card = screen.getByRole('button', { name: /프로젝트 Test Project/ });
    await user.click(card);

    expect(mockOnSelect).toHaveBeenCalledWith(mockProject);
  });

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    
    render(
      <ProjectCard
        project={mockProject}
        onSelect={mockOnSelect}
      />
    );

    const card = screen.getByRole('button', { name: /프로젝트 Test Project/ });
    card.focus();
    
    await user.keyboard('{Enter}');
    expect(mockOnSelect).toHaveBeenCalledWith(mockProject);

    jest.clearAllMocks();
    
    await user.keyboard(' ');
    expect(mockOnSelect).toHaveBeenCalledWith(mockProject);
  });

  it('shows dropdown menu on hover and click', async () => {
    const user = userEvent.setup();
    
    render(
      <ProjectCard
        project={mockProject}
        onSelect={mockOnSelect}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleActive={mockOnToggleActive}
      />
    );

    // Initially, the menu button should be hidden
    const menuButton = screen.getByRole('button', { name: '프로젝트 옵션' });
    expect(menuButton).toHaveClass('opacity-0');

    // Hover over the card to show the menu button
    const card = screen.getByRole('button', { name: /프로젝트 Test Project/ });
    await user.hover(card);
    
    // Click the menu button
    await user.click(menuButton);

    // Check if menu items are visible
    expect(screen.getByText('프로젝트 편집')).toBeInTheDocument();
    expect(screen.getByText('비활성화')).toBeInTheDocument();
    expect(screen.getByText('삭제')).toBeInTheDocument();
  });

  it('calls onEdit when edit menu item is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <ProjectCard
        project={mockProject}
        onSelect={mockOnSelect}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleActive={mockOnToggleActive}
      />
    );

    // Open the menu
    const menuButton = screen.getByRole('button', { name: '프로젝트 옵션' });
    await user.click(menuButton);

    // Click edit option
    const editButton = screen.getByText('프로젝트 편집');
    await user.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockProject);
  });

  it('calls onToggleActive when toggle active menu item is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <ProjectCard
        project={mockProject}
        onSelect={mockOnSelect}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleActive={mockOnToggleActive}
      />
    );

    // Open the menu
    const menuButton = screen.getByRole('button', { name: '프로젝트 옵션' });
    await user.click(menuButton);

    // Click toggle active option
    const toggleButton = screen.getByText('비활성화');
    await user.click(toggleButton);

    expect(mockOnToggleActive).toHaveBeenCalledWith(mockProject);
  });

  it('calls onDelete when delete menu item is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <ProjectCard
        project={mockProject}
        onSelect={mockOnSelect}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleActive={mockOnToggleActive}
      />
    );

    // Open the menu
    const menuButton = screen.getByRole('button', { name: '프로젝트 옵션' });
    await user.click(menuButton);

    // Click delete option
    const deleteButton = screen.getByText('삭제');
    await user.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith(mockProject);
  });

  it('disables delete button when user lacks permission', async () => {
    const projectWithoutDeletePermission = {
      ...mockProject,
      permissions: {
        ...mockProject.permissions,
        canDelete: false
      }
    };

    const user = userEvent.setup();
    
    render(
      <ProjectCard
        project={projectWithoutDeletePermission}
        onSelect={mockOnSelect}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleActive={mockOnToggleActive}
      />
    );

    // Open the menu
    const menuButton = screen.getByRole('button', { name: '프로젝트 옵션' });
    await user.click(menuButton);

    // Check if delete button is disabled
    const deleteButton = screen.getByText('삭제');
    expect(deleteButton).toHaveAttribute('aria-disabled', 'true');
  });

  it('applies selected styling when isSelected is true', () => {
    render(
      <ProjectCard
        project={mockProject}
        isSelected={true}
        onSelect={mockOnSelect}
      />
    );

    const card = screen.getByRole('button', { name: /프로젝트 Test Project/ });
    expect(card).toHaveClass('ring-2', 'ring-blue-500');
  });

  it('applies reduced opacity for inactive projects', () => {
    const inactiveProject = { ...mockProject, isActive: false };
    
    render(
      <ProjectCard
        project={inactiveProject}
        onSelect={mockOnSelect}
      />
    );

    const card = screen.getByRole('button', { name: /프로젝트 Test Project/ });
    expect(card).toHaveClass('opacity-60');
  });

  it('stops event propagation when dropdown menu is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <ProjectCard
        project={mockProject}
        onSelect={mockOnSelect}
        onEdit={mockOnEdit}
      />
    );

    const menuButton = screen.getByRole('button', { name: '프로젝트 옵션' });
    await user.click(menuButton);

    // onSelect should not have been called because event propagation was stopped
    expect(mockOnSelect).not.toHaveBeenCalled();
  });

  it('renders without description when not provided', () => {
    const projectWithoutDescription = { ...mockProject, description: undefined };
    
    render(
      <ProjectCard
        project={projectWithoutDescription}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.queryByText('A test project description')).not.toBeInTheDocument();
  });

  it('formats creation date correctly', () => {
    render(
      <ProjectCard
        project={mockProject}
        onSelect={mockOnSelect}
      />
    );

    // Should show formatted date (Korean locale)
    expect(screen.getByText(/1월 1일/)).toBeInTheDocument();
  });
});