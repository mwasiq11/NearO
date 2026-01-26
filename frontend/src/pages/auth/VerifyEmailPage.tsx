import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Mail, XCircle } from 'lucide-react';
import { api } from '@/lib/api';

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
    <div className="min-h-screen flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6 text-center"
      >
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            {status === 'success' ? (
              <CheckCircle className="h-6 w-6 text-emerald-500" />
            ) : status === 'error' ? (
              <XCircle className="h-6 w-6 text-destructive" />
            ) : (
              <Mail className="h-6 w-6 text-primary" />
            )}
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold">Email verification</h1>
          <p className="text-muted-foreground">{message}</p>
        </div>

        <Link to="/login" className="text-primary font-medium hover:underline">
          Go to login
        </Link>
      </motion.div>
    </div>
  );
};

export default VerifyEmailPage;

