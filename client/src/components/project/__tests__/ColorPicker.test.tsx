import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColorPicker, ColorPickerInline, ColorIndicator } from '../ColorPicker';
import { ProjectColor, PROJECT_COLORS } from '@/types/project';

describe('ColorPicker', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all color options', () => {
    render(
      <ColorPicker value="blue" onChange={mockOnChange} />
    );

    Object.entries(PROJECT_COLORS).forEach(([key, config]) => {
      const colorButton = screen.getByRole('radio', { 
        name: `색상 선택: ${config.name}` 
      });
      expect(colorButton).toBeInTheDocument();
    });
  });

  it('shows check mark for selected color', () => {
    render(
      <ColorPicker value="red" onChange={mockOnChange} />
    );

    const redButton = screen.getByRole('radio', { 
      name: `색상 선택: ${PROJECT_COLORS.red.name}` 
    });
    expect(redButton).toHaveAttribute('aria-checked', 'true');
    expect(redButton).toHaveClass('scale-110');
  });

  it('calls onChange when color is selected', async () => {
    const user = userEvent.setup();
    
    render(
      <ColorPicker value="blue" onChange={mockOnChange} />
    );

    const greenButton = screen.getByRole('radio', { 
      name: `색상 선택: ${PROJECT_COLORS.green.name}` 
    });
    
    await user.click(greenButton);
    expect(mockOnChange).toHaveBeenCalledWith('green');
  });

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    
    render(
      <ColorPicker value="blue" onChange={mockOnChange} />
    );

    const blueButton = screen.getByRole('radio', { 
      name: `색상 선택: ${PROJECT_COLORS.blue.name}` 
    });
    
    blueButton.focus();
    await user.keyboard(' ');
    expect(mockOnChange).toHaveBeenCalledWith('blue');
  });

  it('disables color selection when disabled prop is true', async () => {
    const user = userEvent.setup();
    
    render(
      <ColorPicker value="blue" onChange={mockOnChange} disabled={true} />
    );

    const redButton = screen.getByRole('radio', { 
      name: `색상 선택: ${PROJECT_COLORS.red.name}` 
    });
    
    expect(redButton).toBeDisabled();
    
    await user.click(redButton);
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('applies correct ARIA attributes', () => {
    render(
      <ColorPicker value="purple" onChange={mockOnChange} />
    );

    const colorPicker = screen.getByRole('radiogroup', { 
      name: '프로젝트 색상 선택' 
    });
    expect(colorPicker).toBeInTheDocument();

    Object.entries(PROJECT_COLORS).forEach(([key, config]) => {
      const colorButton = screen.getByRole('radio', { 
        name: `색상 선택: ${config.name}` 
      });
      expect(colorButton).toHaveAttribute('aria-pressed', 
        key === 'purple' ? 'true' : 'false'
      );
    });
  });
});

describe('ColorPickerInline', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders in compact layout', () => {
    render(
      <ColorPickerInline value="blue" onChange={mockOnChange} />
    );

    const container = screen.getByRole('radiogroup');
    expect(container).toHaveClass('flex', 'gap-1');

    // Check if buttons are smaller
    Object.entries(PROJECT_COLORS).forEach(([key, config]) => {
      const colorButton = screen.getByRole('radio', { 
        name: `색상 선택: ${config.name}` 
      });
      expect(colorButton).toHaveClass('w-6', 'h-6');
    });
  });

  it('maintains functionality in compact mode', async () => {
    const user = userEvent.setup();
    
    render(
      <ColorPickerInline value="blue" onChange={mockOnChange} />
    );

    const redButton = screen.getByRole('radio', { 
      name: `색상 선택: ${PROJECT_COLORS.red.name}` 
    });
    
    await user.click(redButton);
    expect(mockOnChange).toHaveBeenCalledWith('red');
  });
});

describe('ColorIndicator', () => {
  it('renders with correct color and size', () => {
    render(
      <ColorIndicator color="red" size="md" />
    );

    const indicator = screen.getByRole('img', { 
      name: `프로젝트 색상: ${PROJECT_COLORS.red.name}` 
    });
    
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveClass('w-4', 'h-4', 'rounded-full');
    expect(indicator).toHaveStyle({ 
      backgroundColor: PROJECT_COLORS.red.primary 
    });
  });

  it('applies correct size classes', () => {
    const { rerender } = render(
      <ColorIndicator color="blue" size="sm" />
    );

    let indicator = screen.getByRole('img');
    expect(indicator).toHaveClass('w-3', 'h-3');

    rerender(<ColorIndicator color="blue" size="md" />);
    indicator = screen.getByRole('img');
    expect(indicator).toHaveClass('w-4', 'h-4');

    rerender(<ColorIndicator color="blue" size="lg" />);
    indicator = screen.getByRole('img');
    expect(indicator).toHaveClass('w-6', 'h-6');
  });

  it('applies custom className', () => {
    render(
      <ColorIndicator color="green" className="custom-class" />
    );

    const indicator = screen.getByRole('img');
    expect(indicator).toHaveClass('custom-class');
  });

  it('renders with correct color for all project colors', () => {
    Object.entries(PROJECT_COLORS).forEach(([key, config]) => {
      const { unmount } = render(
        <ColorIndicator color={key as ProjectColor} />
      );

      const indicator = screen.getByRole('img', { 
        name: `프로젝트 색상: ${config.name}` 
      });
      
      expect(indicator).toHaveStyle({ 
        backgroundColor: config.primary 
      });

      unmount();
    });
  });
});