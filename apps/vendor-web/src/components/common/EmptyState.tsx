import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => {
  return (
    <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
      {icon && (
        <div className="w-11 h-11 rounded-xl bg-[#FBF3F0] text-[#943D24] flex items-center justify-center mb-3">
          {icon}
        </div>
      )}
      <h4 className="text-sm font-semibold text-[#292524]">{title}</h4>
      {description && <p className="text-xs text-[#78716C] mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
