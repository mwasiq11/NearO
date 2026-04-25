import { cn } from '@/lib/utils';

interface DashboardModeToggleProps {
  value: 'seeker' | 'provider';
  onChange: (mode: 'seeker' | 'provider') => void;
  className?: string;
  size?: 'sm' | 'md';
}

const buttonSize = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
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
        'relative inline-grid grid-cols-2 rounded-xl border border-border/60 bg-muted/40 p-1',
        className
      )}
      role="tablist"
      aria-label="Dashboard mode"
    >
      <span
        className={cn(
          'absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg border border-primary/20 bg-primary/15 transition-transform duration-200 ease-in-out',
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
          'relative z-10 rounded-lg font-semibold text-foreground transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
          buttonSize[size],
          value !== 'seeker' && 'text-muted-foreground hover:text-foreground'
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
          'relative z-10 rounded-lg font-semibold text-foreground transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
          buttonSize[size],
          value !== 'provider' && 'text-muted-foreground hover:text-foreground'
        )}
      >
        Provide Services
      </button>
    </div>
  );
}
