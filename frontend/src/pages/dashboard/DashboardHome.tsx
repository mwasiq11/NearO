import { useState } from 'react';
import { motion } from 'framer-motion';
import SeekerDashboard from './SeekerDashboard';
import ProviderDashboard from './ProviderDashboard';

const DashboardHome = () => {
  const [view, setView] = useState<'seeker' | 'provider'>('seeker');

  return (
    <div className="space-y-4">
      <div className="px-4 lg:px-6 pt-4 flex">
        <div className="relative inline-flex rounded-full bg-muted/40 p-1.5 shadow-sm border border-border/50">
          {['seeker', 'provider'].map((mode) => (
            <button
              key={mode}
              onClick={() => setView(mode as 'seeker' | 'provider')}
              className={`relative z-10 px-8 py-2.5 text-sm font-semibold rounded-full transition-colors duration-300 ${
                view === mode 
                  ? 'text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              {view === mode && (
                <motion.div
                  layoutId="active-dashboard-tab"
                  className="absolute inset-0 bg-primary rounded-full -z-10 shadow-md"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
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

