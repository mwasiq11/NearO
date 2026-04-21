import { useState } from 'react';
import { motion } from 'framer-motion';
import SeekerDashboard from './SeekerDashboard';
import ProviderDashboard from './ProviderDashboard';

const DashboardHome = () => {
  const [view, setView] = useState<'seeker' | 'provider'>('seeker');

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-4 md:px-6 lg:px-8 py-4 flex items-center justify-center">
        <div className="relative inline-flex rounded-2xl bg-muted/40 p-1 shadow-inner border border-border/50 backdrop-blur-sm">
          {['seeker', 'provider'].map((mode) => (
            <button
              key={mode}
              onClick={() => setView(mode as 'seeker' | 'provider')}
              className={`relative z-10 px-6 sm:px-8 py-2.5 text-xs md:text-sm font-semibold rounded-xl transition-all duration-300 ${
                view === mode 
                  ? 'text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {view === mode && (
                <motion.div
                  layoutId="active-dashboard-tab"
                  className="absolute inset-0 bg-primary rounded-xl -z-10 shadow-lg shadow-primary/20"
                  transition={{ type: 'spring', bounce: 0.1, duration: 0.5 }}
                />
              )}
              {mode === 'seeker' ? 'Find Services' : 'Provide Services'}
            </button>
          ))}
        </div>
      </div>

      <motion.div
        key={view}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {view === 'seeker' ? <SeekerDashboard /> : <ProviderDashboard />}
      </motion.div>
    </div>
  );
};

export default DashboardHome;

