import { Star, StarHalf } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  reviewCount?: number;
  className?: string;
}

const sizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export const Rating = ({
  value,
  max = 5,
  size = 'md',
  showValue = true,
  reviewCount,
  className,
}: RatingProps) => {
  const fullStars = Math.floor(value);
  const hasHalfStar = value - fullStars >= 0.5;
  const emptyStars = max - fullStars - (hasHalfStar ? 1 : 0);
  
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center">
        {Array(fullStars).fill(null).map((_, i) => (
          <Star
            key={`full-${i}`}
            className={cn(sizeClasses[size], "fill-accent text-accent")}
          />
        ))}
        {hasHalfStar && (
          <div className="relative">
            <Star className={cn(sizeClasses[size], "text-muted")} />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star className={cn(sizeClasses[size], "fill-accent text-accent")} />
            </div>
          </div>
        )}
        {Array(emptyStars).fill(null).map((_, i) => (
          <Star
            key={`empty-${i}`}
            className={cn(sizeClasses[size], "text-muted")}
          />
        ))}
      </div>
      
      {showValue && (
        <span className="text-sm font-medium text-foreground">
          {value.toFixed(1)}
        </span>
      )}
      
      {reviewCount !== undefined && (
        <span className="text-sm text-muted-foreground">
          ({reviewCount})
        </span>
      )}
    </div>
  );
};
