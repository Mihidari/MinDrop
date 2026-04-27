import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Device from '../../src/components/Device';
import usePeerTransfer from '../../src/hooks/usePeerTransfer';

vi.mock('../../src/components/AnimalSilhouette', () => ({
  default: ({ name }) => <span data-testid="animal">{name}</span>,
}));

vi.mock('../../src/components/Progress', () => ({
  default: ({ percent }) => <span data-testid="progress">{percent}</span>,
}));

vi.mock('../../src/hooks/usePeerTransfer', () => ({
  default: vi.fn(),
}));

const transferState = {
  canSend: true,
  peerReady: true,
  peerReadyVersion: 1,
  progress: 0,
  receiving: false,
  transferring: false,
  sendFiles: vi.fn(),
  sendMessage: vi.fn(),
};

const renderDevice = (state = {}) => {
  vi.mocked(usePeerTransfer).mockReturnValue({
    ...transferState,
    ...state,
  });

  return render(<Device name="Blue Fox" os="Windows" nav="Chrome" peer={{}} reconnectPeer={vi.fn()} lang="en" />);
};

describe('Device', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders peer identity and ready status', () => {
    const { container } = renderDevice();

    expect(container.querySelector('.peer-name')).toHaveTextContent('Blue Fox');
    expect(screen.getByText('Windows Chrome')).toBeInTheDocument();
    expect(screen.getByTestId('animal')).toHaveTextContent('Blue Fox');
  });

  it('disables file sending while the peer cannot send', () => {
    const { container } = renderDevice({ canSend: false, peerReady: false });

    expect(container.querySelector('.display-device')).toBeDisabled();
    expect(screen.getByText('Connecting...')).toBeInTheDocument();
  });

  it('shows transfer progress status while transferring', () => {
    renderDevice({ transferring: true, progress: 42 });

    expect(screen.getByText('Tranferring...')).toBeInTheDocument();
    expect(screen.getByTestId('progress')).toHaveTextContent('42');
  });

  it('opens the message modal from the context menu and sends a message', () => {
    const sendMessage = vi.fn();
    const { container } = renderDevice({ sendMessage });

    fireEvent.contextMenu(container.querySelector('.display-device'));
    fireEvent.change(screen.getByPlaceholderText('message'), { target: { value: 'hello peer' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send to Blue Fox' }));

    expect(sendMessage).toHaveBeenCalledWith('hello peer');
    expect(screen.getByPlaceholderText('message')).toHaveValue('');
  });
});
