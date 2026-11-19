import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'blue' | 'orange' | 'green' | 'amber' | 'red' | 'slate';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'blue',
  size = 'sm',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold'
  }[size];

  const variantClasses = {
    blue: 'bg-blue-50 text-blue-700 border border-blue-200',
    orange: 'bg-orange-50 text-orange-700 border border-orange-200',
    green: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border border-amber-200',
    red: 'bg-red-50 text-red-700 border border-red-200',
    slate: 'bg-slate-100 text-slate-700 border border-slate-200'
  }[variant];

  return (
    <span className={`inline-flex items-center rounded-full ${sizeClasses} ${variantClasses} ${className}`}>
      {children}
    </span>
  );
};
