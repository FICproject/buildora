import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand' | 'accent';

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
    warning: 'bg-[#E6A23C]/12 text-[#B47818] border-[#E6A23C]/25',
    danger: 'bg-[#DC4545]/10 text-[#DC4545] border-[#DC4545]/20',
    info: 'bg-[#EEF3FA] text-[#23438F] border-[#23438F]/15',
    brand: 'bg-[#EEF3FA] text-[#23438F] border-[#23438F]/20',
    accent: 'bg-[#F58220]/10 text-[#D96D12] border-[#F58220]/25',
    neutral: 'bg-[#F7F8FA] text-[#718096] border-[#E5E9F0]',
  };

  const dotColors: Record<BadgeVariant, string> = {
    success: 'bg-[#15966B]',
    warning: 'bg-[#E6A23C]',
    danger: 'bg-[#DC4545]',
    info: 'bg-[#23438F]',
    brand: 'bg-[#23438F]',
    accent: 'bg-[#F58220]',
    neutral: 'bg-[#718096]',
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
