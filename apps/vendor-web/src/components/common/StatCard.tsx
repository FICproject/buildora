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
      className={`bg-white rounded-xl border border-[#E7E5E4] border-t-2 border-t-[#F6C453] p-5 shadow-card transition-colors ${
        onClick ? 'cursor-pointer hover:border-[#943D24]/60' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-[#78716C]">{title}</span>
        {icon && (
          <div className="w-9 h-9 rounded-lg bg-[#FBF3F0] flex items-center justify-center text-[#943D24] shrink-0">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-2.5 text-2xl font-bold tracking-tight text-[#292524]">{value}</div>

      {subtitle && <p className="mt-1.5 text-xs text-[#78716C] truncate">{subtitle}</p>}
    </div>
  );
};
