import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Modal from '../../src/components/Modal';

describe('Modal', () => {
  it('adds the open class when visible', () => {
    const { container } = render(
      <Modal open onClose={vi.fn()}>
        <p>Modal content</p>
      </Modal>
    );

    expect(container.querySelector('.modal')?.classList.contains('open')).toBe(true);
    expect(screen.getByText('Modal content')).toBeTruthy();
  });

  it('calls onClose from the close button', () => {
    const onClose = vi.fn();

    render(
      <Modal open onClose={onClose}>
        <p>Modal content</p>
      </Modal>
    );

    fireEvent.click(screen.getByRole('button', { name: '×' }));

    expect(onClose).toHaveBeenCalledOnce();
  });
});
