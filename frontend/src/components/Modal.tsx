import * as React from 'react';
import './Modal.css';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function Modal({ open, onClose, title, icon, children, actions }: ModalProps) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        {icon && <div className="modal-icon">{icon}</div>}
        <h3 className="modal-title">{title}</h3>
        <div className="modal-body">{children}</div>
        {actions && <div className="modal-buttons">{actions}</div>}
      </div>
    </div>
  );
}