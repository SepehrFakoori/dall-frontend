import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Field, Modal, Button } from './ui';
describe('accessible interaction primitives', () => {
  it('associates field labels and inline validation', () => {
    render(
      <Field label="Email" error="Invalid email">
        {(props) => <input {...props} />}
      </Field>,
    );
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Invalid email');
  });
  it('opens a modal with the keyboard, closes with Escape and restores focus', async () => {
    const user = userEvent.setup();
    render(<Modal trigger={<Button>Open</Button>} title="Review" description="Review details" />);
    await user.tab();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Review');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus();
  });
  it('prevents duplicate interaction while loading', async () => {
    const action = vi.fn();
    render(
      <Button loading onClick={action}>
        Save
      </Button>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(action).not.toHaveBeenCalled();
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });
});
