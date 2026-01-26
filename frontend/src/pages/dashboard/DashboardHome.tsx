import { useState } from 'react';
import { Button } from '@/components/ui/button';
import SeekerDashboard from './SeekerDashboard';
import ProviderDashboard from './ProviderDashboard';

const DashboardHome = () => {
  const [view, setView] = useState<'seeker' | 'provider'>('seeker');

  return (
    <div className="space-y-4">
      <div className="px-4 lg:px-6 pt-4">
        <div className="inline-flex rounded-full border bg-background p-1">
          <Button
            type="button"
            variant={view === 'seeker' ? 'hero' : 'ghost'}
            size="sm"
            onClick={() => setView('seeker')}
          >
            Find Services
          </Button>
          <Button
            type="button"
            variant={view === 'provider' ? 'hero' : 'ghost'}
            size="sm"
            onClick={() => setView('provider')}
          >
            Provide Services
          </Button>
        </div>
      </div>

      {view === 'seeker' ? <SeekerDashboard /> : <ProviderDashboard />}
    </div>
  );
};

export default DashboardHome;
