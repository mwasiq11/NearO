import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface DashboardModeToggleProps {
  value: 'seeker' | 'provider';
  onChange: (mode: 'seeker' | 'provider') => void;
  className?: string;
}

export default function DashboardModeToggle({
  value,
  onChange,
  className,
}: DashboardModeToggleProps) {
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });
  const seekerRef = useRef<HTMLButtonElement>(null);
  const providerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const updateUnderline = () => {
      const activeRef = value === 'seeker' ? seekerRef : providerRef;
      if (activeRef.current) {
        const textSpan = activeRef.current.querySelector('span');
        const parent = activeRef.current.parentElement;
        if (textSpan && parent) {
          const parentRect = parent.getBoundingClientRect();
          const spanRect = textSpan.getBoundingClientRect();
          
          setUnderlineStyle({
            left: spanRect.left - parentRect.left,
            width: spanRect.width,
          });
        }
      }
    };

    updateUnderline();
    window.addEventListener('resize', updateUnderline);
    return () => window.removeEventListener('resize', updateUnderline);
  }, [value]);

  const tabs = [
    { id: 'seeker', label: 'Find Services', ref: seekerRef },
    { id: 'provider', label: 'Provide Services', ref: providerRef },
  ] as const;

  return (
    <div
      className={cn(
        'relative flex items-center justify-center gap-4 sm:gap-8 md:gap-10 pb-1',
        className
      )}
      role="tablist"
      aria-label="Dashboard mode"
    >
      {tabs.map((tab) => {
        const isActive = value === tab.id;
        
        return (
          <button
            key={tab.id}
            ref={tab.ref as any}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative flex flex-col items-center py-1 text-xs sm:text-sm transition-all duration-200 focus-visible:outline-none cursor-pointer group',
              isActive 
                ? 'text-foreground font-semibold' 
                : 'text-muted-foreground font-medium hover:text-foreground/90'
            )}
          >
            <span className="relative z-10 inline-block px-1 transition-colors duration-200">
              {tab.label}
            </span>
            
            {/* Hover preview - subtle and static */}
            {!isActive && (
              <div className="absolute bottom-[-6px] left-1 right-1 h-[2px] rounded-full bg-primary/0 transition-all duration-300 group-hover:bg-primary/10" />
            )}
          </button>
        );
      })}

      {/* SINGLE MOVING UNDERLINE */}
      <div
        className="absolute bottom-0 h-[2px] rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] transition-all duration-300"
        style={{
          left: 0,
          width: `${underlineStyle.width}px`,
          transform: `translateX(${underlineStyle.left}px)`,
          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
    </div>
  );
}
