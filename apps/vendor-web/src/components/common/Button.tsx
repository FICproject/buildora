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
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:bg-[#E7E5E4] disabled:text-[#A8A29E] disabled:border-[#E7E5E4] disabled:cursor-not-allowed whitespace-nowrap cursor-pointer';

  const variantStyles = {
    primary:
      'bg-[#943D24] text-white hover:bg-[#7D331E] active:bg-[#662918] focus:ring-[#943D24] border border-transparent',
    secondary:
      'bg-[#F6C453] text-[#292524] hover:bg-[#E5B342] active:bg-[#D4A336] focus:ring-[#F6C453] border border-transparent font-semibold',
    accent:
      'bg-[#F6C453] text-[#292524] hover:bg-[#E5B342] active:bg-[#D4A336] focus:ring-[#F6C453] border border-transparent font-semibold',
    outline:
      'bg-white border border-[#943D24] text-[#943D24] hover:bg-[#FBF3F0] focus:ring-[#943D24]',
    ghost:
      'text-[#78716C] hover:text-[#943D24] hover:bg-[#F8F7F5] focus:ring-[#943D24]/30',
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
