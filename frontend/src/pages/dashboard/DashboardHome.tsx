import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import SeekerDashboard from './SeekerDashboard';
import ProviderDashboard from './ProviderDashboard';

const DashboardHome = () => {
  const [searchParams] = useSearchParams();
  const view = searchParams.get('view') === 'provider' ? 'provider' : 'seeker';

  return (
    <div className="flex flex-col min-h-full">
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

