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
        <div className="w-11 h-11 rounded-xl bg-[#EEF3FA] text-[#23438F] flex items-center justify-center mb-3">
          {icon}
        </div>
      )}
      <h4 className="text-sm font-semibold text-[#263247]">{title}</h4>
      {description && <p className="text-xs text-[#718096] mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
