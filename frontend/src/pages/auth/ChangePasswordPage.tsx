import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, ShieldCheck, CornerUpLeft, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import Iridescence from '@/components/animations/Iridescence';
import BorderGlow from '@/components/animations/BorderGlow';

const ChangePasswordPage = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { changePassword, isLoading, user } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.currentPassword) newErrors.currentPassword = 'Current password is required';
    if (!formData.newPassword) newErrors.newPassword = 'New password is required';
    if (formData.newPassword.length < 8) newErrors.newPassword = 'Password must be at least 8 characters';
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await changePassword(formData.currentPassword, formData.newPassword);
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

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[480px] relative z-10"
      >
        <BorderGlow
          edgeSensitivity={30}
          glowColor="200 80% 60%"
          backgroundColor="rgba(255, 255, 255, 0.03)"
          borderRadius={40}
          glowRadius={60}
          glowIntensity={1.5}
          colors={['#3b82f6', '#60a5fa', '#2563eb']}
        >
          <div className="p-8 md:p-10 shadow-2xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-6">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Update Password</h1>
              <p className="text-white/50">
                Hi {user?.name.split(' ')[0]}, for security purposes you must update your password before continuing.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="currentPassword text-white/70 ml-1">Temporary / Current Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30 group-focus-within:text-emerald-400 transition-colors" />
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    placeholder="••••••••"
                    className={cn(
                      "h-12 pl-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all",
                      errors.currentPassword && "border-rose-500/50 focus:ring-rose-500/20"
                    )}
                    value={formData.currentPassword}
                    onChange={handleChange}
                  />
                </div>
                {errors.currentPassword && <p className="text-xs font-medium text-rose-400 ml-1">{errors.currentPassword}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword text-white/70 ml-1">New Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30 group-focus-within:text-emerald-400 transition-colors" />
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    placeholder="••••••••"
                    className={cn(
                      "h-12 pl-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all",
                      errors.newPassword && "border-rose-500/50 focus:ring-rose-500/20"
                    )}
                    value={formData.newPassword}
                    onChange={handleChange}
                  />
                </div>
                {errors.newPassword && <p className="text-xs font-medium text-rose-400 ml-1">{errors.newPassword}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword text-white/70 ml-1">Confirm New Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30 group-focus-within:text-emerald-400 transition-colors" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className={cn(
                      "h-12 pl-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all",
                      errors.confirmPassword && "border-rose-500/50 focus:ring-rose-500/20"
                    )}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
                {errors.confirmPassword && <p className="text-xs font-medium text-rose-400 ml-1">{errors.confirmPassword}</p>}
              </div>

              <div className="space-y-6 pt-2">
                <Button 
                  type="submit" 
                  size="xl"
                  className="w-full h-14 text-lg font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-xl shadow-xl transition-all active:scale-[0.98]"
                  disabled={isLoading}
                >
                  {isLoading ? 'Updating...' : 'Update Password'}
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
                
                <Link 
                  to="/" 
                  className="flex items-center justify-center gap-2 text-sm text-white/30 hover:text-white transition-colors"
                >
                  <CornerUpLeft className="h-4 w-4" />
                  Back to landing page
                </Link>
              </div>
            </form>

            <div className="mt-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex gap-3">
              <Info className="h-5 w-5 text-emerald-400 flex-shrink-0" />
              <p className="text-xs text-emerald-400/80 leading-relaxed">
                <strong>Security Note:</strong> Your temporary session is restricted. You will be able to access the full application once your password is successfully updated.
              </p>
            </div>
          </div>
        </BorderGlow>
      </motion.div>
    </div>
  );
};

export default ChangePasswordPage;

