import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import Iridescence from '@/components/animations/Iridescence';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!token) nextErrors.token = 'Missing or invalid reset token';
    if (!formData.password) nextErrors.password = 'Password is required';
    else if (formData.password.length < 8) nextErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) nextErrors.confirmPassword = 'Passwords do not match';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword: formData.password });
      setIsSuccess(true);
      toast.success('Password reset successfully.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reset password';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden text-white p-6">
        <div className="fixed inset-0 z-0 pointer-events-none">
          <Iridescence color={[0.0, 0.68, 0.4]} amplitude={0.1} speed={0.5} className="opacity-40" />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[480px] bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 text-center relative z-10"
        >
          <div className="inline-flex p-4 rounded-full bg-emerald-500/20 text-emerald-400 mb-6">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Password Updated</h1>
          <p className="text-white/60 mb-10">Your password has been successfully changed. You can now sign in with your new credentials.</p>
          <Button asChild size="xl" className="w-full bg-white/10 hover:bg-white/20 border-white/20">
            <Link to="/login">Proceed to Login</Link>
          </Button>
        </motion.div>
      </div>
    );
  }

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

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[480px] bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative z-10"
      >
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-3 group mb-6">
            <div className="h-10 w-10 flex items-center justify-center brightness-0 invert transform-gpu drop-shadow-sm group-hover:scale-110 transition-transform">
              <img src="https://companieslogo.com/img/orig/NBLY.TO-63e791bf.png?t=1720244493" alt="NearO" className="h-full w-full object-contain" />
            </div>
            <span className="font-bold text-2xl text-white tracking-tight">NearO</span>
          </Link>
          <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-6">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">New Password</h1>
          <p className="text-white/50">Choose a strong password to secure your account.</p>
        </div>

        {errors.token && (
          <div className="mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium rounded-xl p-4 backdrop-blur-md">
            {errors.token}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="password text-white/70 ml-1">New Password</Label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30 group-focus-within:text-emerald-400 transition-colors" />
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className={cn(
                  "h-12 pl-12 pr-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all",
                  errors.password && "border-rose-500/50 focus:ring-rose-500/20"
                )}
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs font-medium text-rose-400 ml-1">{errors.password}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword text-white/70 ml-1">Confirm Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              className={cn(
                "h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all",
                errors.confirmPassword && "border-rose-500/50 focus:ring-rose-500/20"
              )}
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
            />
            {errors.confirmPassword && <p className="text-xs font-medium text-rose-400 ml-1">{errors.confirmPassword}</p>}
          </div>

          <Button type="submit" size="xl" className="w-full h-14 text-lg font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-xl shadow-xl transition-all active:scale-[0.98]" disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Update Password'}
          </Button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-white/50 text-sm font-medium">
            Back to{' '}
            <Link to="/login" className="text-emerald-400 font-bold hover:text-emerald-300 transition-all hover:underline underline-offset-4">
              Log In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;


