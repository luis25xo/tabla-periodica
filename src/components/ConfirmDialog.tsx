import { useRef } from 'react';
import { Dialog } from './Dialog';

interface Props {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ title, message, confirmLabel, cancelLabel = 'Cancelar', onConfirm, onCancel }: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  return (
    <Dialog title={title} titleId="confirm-title" onEscape={onCancel} initialFocus={cancelRef} testId="confirm-dialog">
      <p className="dialog-text">{message}</p>
      <div className="dialog-actions">
        <button ref={cancelRef} type="button" className="btn" onClick={onCancel}>
          {cancelLabel}
        </button>
        <button type="button" className="btn btn--danger" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
