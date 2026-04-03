import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LogoutModal from '../components/LogoutModal'

describe('LogoutModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    loading: false,
  }

  it('renders nothing when closed', () => {
    const { container } = render(<LogoutModal {...defaultProps} isOpen={false} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders modal content when open', () => {
    render(<LogoutModal {...defaultProps} />)

    expect(screen.getByText('Log Out?')).toBeInTheDocument()
    expect(screen.getByText('Are you sure you want to log out?')).toBeInTheDocument()
  })

  it('renders Cancel and Log Out buttons', () => {
    render(<LogoutModal {...defaultProps} />)

    expect(screen.getByText('Cancel')).toBeInTheDocument()
    expect(screen.getByText('Log Out')).toBeInTheDocument()
  })

  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn()
    render(<LogoutModal {...defaultProps} onClose={onClose} />)

    fireEvent.click(screen.getByText('Cancel'))
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onConfirm when Log Out is clicked', () => {
    const onConfirm = vi.fn()
    render(<LogoutModal {...defaultProps} onConfirm={onConfirm} />)

    fireEvent.click(screen.getByText('Log Out'))
    expect(onConfirm).toHaveBeenCalled()
  })

  it('shows loading text when logging out', () => {
    render(<LogoutModal {...defaultProps} loading={true} />)
    expect(screen.getByText('Logging out...')).toBeInTheDocument()
  })

  it('disables buttons when loading', () => {
    render(<LogoutModal {...defaultProps} loading={true} />)

    expect(screen.getByText('Cancel')).toBeDisabled()
    expect(screen.getByText('Logging out...')).toBeDisabled()
  })

  it('calls onClose when overlay is clicked', () => {
    const onClose = vi.fn()
    render(<LogoutModal {...defaultProps} onClose={onClose} />)

    fireEvent.click(screen.getByText('Log Out?').closest('.modal-overlay'))
    expect(onClose).toHaveBeenCalled()
  })

  it('does not call onClose when modal body is clicked', () => {
    const onClose = vi.fn()
    render(<LogoutModal {...defaultProps} onClose={onClose} />)

    fireEvent.click(screen.getByText('Log Out?').closest('.modal'))
    expect(onClose).not.toHaveBeenCalled()
  })
})
