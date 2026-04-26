import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showOnline?: boolean;
  badge?: 'gold' | 'silver' | 'bronze';
}

const sizeClasses = {
  xs: 'h-6 w-6 text-2xs',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
  xl: 'h-20 w-20 text-xl',
};

export const Avatar = ({
  src,
  alt,
  fallback,
  size = 'md',
  className,
  showOnline,
  badge,
}: AvatarProps) => {
  const initials = fallback || alt?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  
  return (
    <div className={cn("relative inline-flex", className)}>
      <div
        className={cn(
          "rounded-full overflow-hidden bg-muted flex items-center justify-center font-medium text-muted-foreground",
          sizeClasses[size]
        )}
      >
        {src ? (
          <img
            src={src}
            alt={alt || 'Avatar'}
            className="h-full w-full object-cover"
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      
      {showOnline && (
        <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-success ring-2 ring-background" />
      )}
      
      {badge && (
        <span
          className={cn(
            "absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-2xs ring-2 ring-background",
            badge === 'gold' && 'bg-reputation-gold text-white',
            badge === 'silver' && 'bg-reputation-silver text-white',
            badge === 'bronze' && 'bg-reputation-bronze text-white'
          )}
        >
          {badge === 'gold' ? '★' : badge === 'silver' ? '✦' : '●'}
        </span>
      )}
    </div>
  );
};
