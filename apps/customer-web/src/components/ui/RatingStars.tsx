import React from 'react';
import { Star } from 'lucide-react';

export interface RatingStarsProps {
  rating: number;
  count?: number;
  size?: 'sm' | 'md';
  showCount?: boolean;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  count,
  size = 'sm',
  showCount = true
}) => {
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <div className="inline-flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${iconSize} ${
              star <= Math.round(rating)
                ? 'fill-amber-400 text-amber-400'
                : 'fill-slate-100 text-slate-300'
            }`}
          />
        ))}
      </div>
      <span className="text-xs font-semibold text-slate-800">{rating.toFixed(1)}</span>
      {showCount && count !== undefined && (
        <span className="text-xs text-slate-400">({count})</span>
      )}
    </div>
  );
};
