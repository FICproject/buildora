import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger';
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
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer';

  const variantStyles = {
    primary:
      'bg-[#23438F] text-white hover:bg-[#1B3573] focus:ring-[#23438F] border border-transparent',
    secondary:
      'bg-white text-[#263247] hover:bg-[#F7F8FA] focus:ring-[#23438F]/30 border border-[#E5E9F0]',
    accent:
      'bg-[#F58220] text-white hover:bg-[#D96D12] focus:ring-[#F58220] border border-transparent',
    outline:
      'bg-white border border-[#23438F] text-[#23438F] hover:bg-[#EEF3FA] focus:ring-[#23438F]',
    ghost:
      'text-[#718096] hover:text-[#263247] hover:bg-[#EEF3FA]/70 focus:ring-[#23438F]/30',
    danger:
      'bg-[#DC4545] text-white hover:bg-[#B83232] focus:ring-[#DC4545] border border-transparent',
  };

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-sm px-5 py-2.5 gap-2',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
