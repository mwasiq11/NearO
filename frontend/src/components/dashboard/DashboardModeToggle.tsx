import { cn } from '@/lib/utils';

interface DashboardModeToggleProps {
  value: 'seeker' | 'provider';
  onChange: (mode: 'seeker' | 'provider') => void;
  className?: string;
  size?: 'sm' | 'md';
}

const buttonSize = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-4 text-sm',
};

export default function DashboardModeToggle({
  value,
  onChange,
  className,
  size = 'sm',
}: DashboardModeToggleProps) {
  return (
    <div
      className={cn(
        'relative inline-grid min-w-[240px] grid-cols-2 rounded-full bg-muted/35 p-1 shadow-inner',
        className
      )}
      role="tablist"
      aria-label="Dashboard mode"
    >
      <span
        className={cn(
          'absolute inset-y-1 w-[calc(50%-0.25rem)] rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 shadow-sm transition-transform duration-200 ease-out',
          value === 'provider' ? 'translate-x-full' : 'translate-x-0'
        )}
        aria-hidden="true"
      />
      <button
        type="button"
        role="tab"
        aria-selected={value === 'seeker'}
        onClick={() => onChange('seeker')}
        className={cn(
          'relative z-10 flex items-center justify-center rounded-full font-medium transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
          buttonSize[size],
          value === 'seeker' ? 'text-white' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Find Services
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === 'provider'}
        onClick={() => onChange('provider')}
        className={cn(
          'relative z-10 flex items-center justify-center rounded-full font-medium transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
          buttonSize[size],
          value === 'provider' ? 'text-white' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Provide Services
      </button>
    </div>
  );
}
