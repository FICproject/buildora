import React from 'react';
import { Link } from 'react-router-dom';
import { Brand } from '@buildora/types';

export interface BrandCardProps {
  brand: Brand;
}

export const BrandCard: React.FC<BrandCardProps> = ({ brand }) => {
  return (
    <Link
      to={`/brands/${brand.slug}`}
      className="group flex flex-col items-center bg-white rounded-2xl border border-slate-200/80 hover:border-brand-blue-300 p-3 sm:p-4 shadow-card hover:shadow-card-hover transition-all duration-200 text-center"
    >
      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center p-2 mb-2 sm:mb-3 group-hover:scale-105 transition-transform">
        <img
          src={brand.logo}
          alt={brand.name}
          className="w-full h-full object-contain"
          loading="lazy"
        />
      </div>
      <h4 className="text-xs font-bold text-slate-800 group-hover:text-brand-blue-800 transition-colors line-clamp-1">
        {brand.name}
      </h4>
      <p className="mt-0.5 text-[10px] sm:text-[11px] text-slate-400 line-clamp-1">
        {brand.description}
      </p>
    </Link>
  );
};
