import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, actions }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#943D24] break-words">{title}</h1>
        {description && <p className="text-sm text-[#78716C] mt-1">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto">{actions}</div>}
    </div>
  );
};
