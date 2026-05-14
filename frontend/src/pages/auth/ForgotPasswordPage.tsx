import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import Iridescence from '@/components/animations/Iridescence';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!email) nextErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = 'Invalid email format';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('If the email exists, a reset link has been sent.');
      setEmail('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to request reset';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden text-white p-6 md:p-12">
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

      <header className="absolute top-6 left-6 z-20">
        <Link to="/" className="inline-flex items-center justify-center" aria-label="Go to landing page">
          <img
            src="https://companieslogo.com/img/orig/NBLY.TO-63e791bf.png?t=1720244493"
            alt="NearO"
            className="h-10 w-10 object-contain brightness-0 invert transition-transform hover:scale-105"
          />
        </Link>
      </header>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[480px] bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative z-10"
      >
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Reset Password</h1>
          <p className="text-white/50">
            Enter your email and we'll send you a recovery link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-white/70 ml-1">Email Address</Label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30 group-focus-within:text-emerald-400 transition-colors" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                className={cn(
                  "h-12 pl-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all",
                  errors.email && "border-rose-500/50 focus:ring-rose-500/20"
                )}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {errors.email && <p className="text-xs font-medium text-rose-400 ml-1">{errors.email}</p>}
          </div>

          <Button 
            type="submit" 
            size="xl"
            className="w-full h-14 text-lg font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-xl shadow-xl transition-all active:scale-[0.98]" 
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Send Recovery Link <ArrowRight className="h-5 w-5" />
              </span>
            )}
          </Button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-white/50 text-sm font-medium">
            Remembered your password?{' '}
            <Link to="/login" className="text-emerald-400 font-bold hover:text-emerald-300 transition-all hover:underline underline-offset-4">
              Log In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;


