import React from 'react';

interface CardProps { children: React.ReactNode; className?: string; onClick?: () => void; style?: React.CSSProperties; }
export function Card({ children, className = '', onClick, style }: CardProps) {
  return (
    <div onClick={onClick} style={style} className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className}`}>
      {children}
    </div>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { variant?: ButtonVariant; size?: 'sm' | 'md' | 'lg'; }
export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-primary text-black font-bold hover:brightness-95',
    secondary: 'bg-black text-white hover:bg-gray-800',
    ghost: 'bg-transparent border border-gray-300 text-accent hover:bg-gray-50',
    danger: 'bg-critical text-white hover:brightness-90',
  };
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' };
  return (
    <button className={`rounded-sm transition-all focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide text-xs ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}

type BadgeVariant = 'success' | 'warning' | 'critical' | 'info' | 'default';
interface BadgeProps { variant?: BadgeVariant; children: React.ReactNode; className?: string; }
export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    default: 'bg-gray-100 text-gray-700',
  };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>{children}</span>;
}

interface SkeletonProps { className?: string; }
export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

interface ModalProps { open: boolean; onClose: () => void; title: string; children: React.ReactNode; }
export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 id="modal-title" className="text-lg font-semibold text-secondary">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary rounded" aria-label="Close modal">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
