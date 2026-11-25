import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  onClick,
  className = '',
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-[#E5E9F0] p-5 shadow-card transition-colors ${
        onClick ? 'cursor-pointer hover:border-[#23438F]/50' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-[#718096]">{title}</span>
        {icon && (
          <div className="w-9 h-9 rounded-lg bg-[#EEF3FA] flex items-center justify-center text-[#23438F] shrink-0">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-2.5 text-2xl font-bold tracking-tight text-[#263247]">{value}</div>

      {subtitle && <p className="mt-1.5 text-xs text-[#718096] truncate">{subtitle}</p>}
    </div>
  );
};
