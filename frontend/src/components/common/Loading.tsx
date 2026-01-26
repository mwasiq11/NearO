import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
};

export const LoadingSpinner = ({ size = 'md', className }: LoadingSpinnerProps) => {
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-primary border-t-transparent",
        sizeClasses[size],
        className
      )}
    />
  );
};

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export const LoadingSkeleton = ({
  className,
  variant = 'rectangular',
  width,
  height,
}: LoadingSkeletonProps) => {
  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };
  
  return (
    <div
      className={cn(
        "animate-pulse bg-muted",
        variantClasses[variant],
        className
      )}
      style={{ width, height }}
    />
  );
};

// Full page loading state
export const PageLoader = () => {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground animate-pulse">Loading...</p>
      </div>
    </div>
  );
};

// Card skeleton for listings
export const ListingCardSkeleton = () => {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <LoadingSkeleton className="w-full h-48" />
      <div className="space-y-2">
        <LoadingSkeleton className="w-3/4 h-5" />
        <LoadingSkeleton className="w-1/2 h-4" />
      </div>
      <div className="flex items-center gap-2">
        <LoadingSkeleton variant="circular" className="h-8 w-8" />
        <LoadingSkeleton className="w-24 h-4" />
      </div>
      <div className="flex justify-between items-center">
        <LoadingSkeleton className="w-20 h-6" />
        <LoadingSkeleton className="w-24 h-9" />
      </div>
    </div>
  );
};
