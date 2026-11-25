import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-[#E7E5E4] shadow-card ${
        onClick ? 'cursor-pointer hover:border-[#943D24]/45 transition-colors' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, action, className = '' }) => {
  return (
    <div
      className={`px-5 py-4 border-b border-[#E7E5E4] flex flex-wrap items-center justify-between gap-3 ${className}`}
    >
      <div>
        {title && <h3 className="font-semibold text-[#943D24] text-base">{title}</h3>}
        {subtitle && <p className="text-xs text-[#78716C] mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
};

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <div className={`p-5 ${className}`}>{children}</div>;
};

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <div
      className={`px-5 py-4 bg-[#F8F7F5] border-t border-[#E7E5E4] rounded-b-xl flex items-center justify-between gap-3 ${className}`}
    >
      {children}
    </div>
  );
};
