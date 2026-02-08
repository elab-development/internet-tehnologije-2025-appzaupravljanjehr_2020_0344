import * as React from 'react';
import './Button.css';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'save' | 'cancel' | 'danger' | 'outline' | 'icon';
  disabled?: boolean;
  className?: string;
  title?: string;
  style?: React.CSSProperties;
}

export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  className = '',
  title,
  style,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant} ${className}`}
      title={title}
      style={style}
    >
      {children}
    </button>
  );
}