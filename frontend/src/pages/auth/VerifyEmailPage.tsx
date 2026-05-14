import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Mail, XCircle, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import Iridescence from '@/components/animations/Iridescence';
import BorderGlow from '@/components/animations/BorderGlow';
import { cn } from '@/lib/utils';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Missing verification token.');
      return;
    }

    const verify = async () => {
      try {
        await api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`);
        setStatus('success');
        setMessage('Email verified! You can log in now.');
      } catch (err) {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Verification failed.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden text-white p-6">
      {/* Global Background Animation */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Iridescence
          color={[0.0, 0.68, 0.4]}
          mouseReact={true}
          amplitude={0.1}
          speed={0.5}
          className="opacity-40"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[480px] relative z-10"
      >
        <BorderGlow
          edgeSensitivity={30}
          glowColor={status === 'success' ? "160 84% 65%" : status === 'error' ? "0 84% 60%" : "200 80% 60%"}
          backgroundColor="rgba(255, 255, 255, 0.03)"
          borderRadius={40}
          glowRadius={60}
          glowIntensity={1.5}
          colors={status === 'success' ? ['#10b981', '#34d399', '#059669'] : status === 'error' ? ['#ef4444', '#f87171', '#dc2626'] : ['#3b82f6', '#60a5fa', '#2563eb']}
        >
          <div className="p-8 md:p-12 text-center">
            <div className="mb-10 text-center">
              <Link to="/" className="inline-flex items-center gap-3 group mb-8">
                <div className="h-10 w-10 flex items-center justify-center brightness-0 invert transform-gpu drop-shadow-sm group-hover:scale-110 transition-transform">
                  <img src="https://companieslogo.com/img/orig/NBLY.TO-63e791bf.png?t=1720244493" alt="NearO" className="h-full w-full object-contain" />
                </div>
                <span className="font-bold text-2xl text-white tracking-tight">NearO</span>
              </Link>
              
              <div className="flex justify-center mb-6">
                <div className={cn(
                  "h-20 w-20 rounded-3xl flex items-center justify-center backdrop-blur-xl border transition-all duration-500",
                  status === 'success' ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : 
                  status === 'error' ? "bg-rose-500/20 border-rose-500/30 text-rose-400" : 
                  "bg-white/10 border-white/20 text-white/40"
                )}>
                  {status === 'success' ? (
                    <CheckCircle className="h-10 w-10" />
                  ) : status === 'error' ? (
                    <XCircle className="h-10 w-10" />
                  ) : (
                    <Loader2 className="h-10 w-10 animate-spin" />
                  )}
                </div>
              </div>

              <h1 className="text-3xl font-bold mb-4">Email Verification</h1>
              <p className="text-white/50 text-lg leading-relaxed">
                {message}
              </p>
            </div>

            <Button asChild size="xl" className="w-full h-14 bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-xl transition-all">
              <Link to="/login" className="flex items-center gap-2">
                Proceed to Login <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </BorderGlow>
      </motion.div>
    </div>
  );
};

export default VerifyEmailPage;


