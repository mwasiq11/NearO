import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setTheme, Theme } from '@/store/slices/uiSlice';

export function useTheme() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.ui.theme);
  
  // Resolve system theme to either 'light' or 'dark'
  const resolvedTheme = theme === 'system' 
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
      
      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        root.classList.remove('light', 'dark');
        root.classList.add(e.matches ? 'dark' : 'light');
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      root.classList.add(theme);
    }
    
    // Save to localStorage
    try {
      localStorage.setItem('nearo-theme', theme);
    } catch (e) {
      console.error('Failed to save theme to localStorage:', e);
    }
  }, [theme]);

  return {
    theme,
    resolvedTheme,
    setTheme: (newTheme: Theme) => dispatch(setTheme(newTheme)),
  };
}
