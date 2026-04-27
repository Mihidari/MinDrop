import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AnimalSilhouette from '../../src/components/AnimalSilhouette';

describe('AnimalSilhouette', () => {
  it('uses the animal name from the display name as the image label', () => {
    render(<AnimalSilhouette name="Blue Fox" />);

    expect(screen.getByRole('img', { name: 'fox icon' })).toBeInTheDocument();
  });

  it('marks wolf icons as shiny', () => {
    render(<AnimalSilhouette name="Silver Wolf" />);

    expect(screen.getByRole('img', { name: 'shiny wolf icon' })).toHaveClass('shiny');
  });

  it('falls back to a generic animal label when the name is empty', () => {
    render(<AnimalSilhouette name="" />);

    expect(screen.getByRole('img', { name: 'animal icon' })).toBeInTheDocument();
  });
});
