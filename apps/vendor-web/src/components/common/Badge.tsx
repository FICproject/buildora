import React from 'react';

export type BadgeVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'brand'
  | 'accent';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    success: 'bg-[#15966B]/10 text-[#15966B] border-[#15966B]/20',
    warning: 'bg-[#F6C453]/30 text-[#292524] border-[#F6C453]/70',
    danger: 'bg-[#DC4545]/10 text-[#DC4545] border-[#DC4545]/20',
    info: 'bg-[#FBF3F0] text-[#943D24] border-[#943D24]/20',
    brand: 'bg-[#943D24] text-white border-[#943D24]',
    accent: 'bg-[#F6C453] text-[#292524] border-[#E5B342] font-semibold',
    neutral: 'bg-[#F8F7F5] text-[#78716C] border-[#E7E5E4]',
  };

  const dotColors: Record<BadgeVariant, string> = {
    success: 'bg-[#15966B]',
    warning: 'bg-[#D99B16]',
    danger: 'bg-[#DC4545]',
    info: 'bg-[#943D24]',
    brand: 'bg-[#F6C453]',
    accent: 'bg-[#943D24]',
    neutral: 'bg-[#78716C]',
  };

  const sizeStyles = {
    sm: 'text-[11px] font-medium px-2 py-0.5',
    md: 'text-xs font-medium px-2.5 py-0.5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border whitespace-nowrap ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};
