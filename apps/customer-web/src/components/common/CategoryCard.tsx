import React from 'react';
import { Link } from 'react-router-dom';
import { Category } from '@buildora/types';
import { ChevronRight } from 'lucide-react';

export interface CategoryCardProps {
  category: Category;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  return (
    <Link
      to={`/categories/${category.slug}`}
      className="group relative flex flex-col bg-white rounded-2xl border border-slate-200/80 hover:border-brand-blue-300 shadow-card hover:shadow-card-hover transition-all duration-200 overflow-hidden"
    >
      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
        <img
          src={category.image}
          alt={category.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
        <div className="absolute bottom-2 left-2.5 right-2.5 text-white">
          <h4 className="font-bold text-xs sm:text-sm drop-shadow-sm group-hover:text-brand-orange-300 transition-colors line-clamp-1">
            {category.name}
          </h4>
          <span className="text-[10px] sm:text-[11px] text-slate-200">
            {category.subcategories.length} subcategories
          </span>
        </div>
      </div>
      <div className="p-2 sm:p-2.5 bg-white flex items-center justify-between text-[11px] sm:text-xs text-brand-blue-900 font-bold group-hover:bg-brand-blue-50/50 transition-colors">
        <span>Explore Materials</span>
        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-brand-orange-500" />
      </div>
    </Link>
  );
};
