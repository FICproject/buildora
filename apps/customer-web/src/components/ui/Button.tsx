import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5'
  }[size];

  const variantClasses = {
    primary:
      'bg-brand-blue-900 hover:bg-brand-blue-800 text-white shadow-sm hover:shadow focus:ring-brand-blue-500',
    secondary:
      'bg-brand-orange-500 hover:bg-brand-orange-600 text-white shadow-sm hover:shadow focus:ring-brand-orange-400',
    outline:
      'border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 hover:border-slate-400 focus:ring-brand-blue-500',
    ghost:
      'bg-transparent hover:bg-slate-100 text-slate-700 hover:text-slate-900 focus:ring-slate-300',
    danger:
      'bg-red-600 hover:bg-red-700 text-white shadow-sm focus:ring-red-500'
  }[variant];

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};
