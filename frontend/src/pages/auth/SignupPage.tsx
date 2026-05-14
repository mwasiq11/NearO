import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { GoogleLogin } from '@react-oauth/google';
import Iridescence from '@/components/animations/Iridescence';

const SignupPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const googleButtonWidth = Math.min(
    360,
    Math.max(240, (typeof window !== 'undefined' ? window.innerWidth : 360) - 96)
  ).toString();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signup, loginWithGoogle, isLoading } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await signup(formData);
  };

  return (
    <div className="min-h-screen flex bg-slate-950 relative overflow-hidden text-white">
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

      {/* Centered Form Container */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-12 md:p-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[480px] bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-5 sm:p-8 md:p-10 shadow-2xl"
        >
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white tracking-tight">Create Account</h1>
            <p className="text-white/50 mt-2">Join your local community today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-white/70 ml-1">Full Name</Label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30 group-focus-within:text-emerald-400 transition-colors" />
                <Input
                  id="name"
                  name="name"
                  placeholder="John Doe"
                  className={cn(
                    "h-12 pl-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all",
                    errors.name && "border-rose-500/50 focus:ring-rose-500/20"
                  )}
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              {errors.name && <p className="text-xs font-medium text-rose-400 ml-1">{errors.name}</p>}
            </div>

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
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              {errors.email && <p className="text-xs font-medium text-rose-400 ml-1">{errors.email}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-white/70 ml-1">Password</Label>
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
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-white/70 ml-1">Confirm</Label>
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
                  onChange={handleChange}
                />
              </div>
            </div>
            {(errors.password || errors.confirmPassword) && (
              <p className="text-xs font-medium text-rose-400 ml-1">
                {errors.password || errors.confirmPassword}
              </p>
            )}

            <Button
              type="submit"
              size="xl"
              className="w-full h-14 text-lg font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-xl shadow-xl transition-all active:scale-[0.98] mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Account...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Create Account <ArrowRight className="h-5 w-5" />
                </span>
              )}
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
              <span className="bg-[#0f172a] px-4 text-white/30">OR CONTINUE WITH</span>
            </div>
          </div>

          <div className="flex flex-col items-center w-full">
            <div className="w-full flex justify-center">
              <div className="w-full max-w-[360px] overflow-hidden rounded-full border border-white/10 shadow-lg transition-all duration-300 hover:border-emerald-500/50 active:scale-[0.98] flex items-center justify-center bg-white">
                <GoogleLogin
                  ux_mode="redirect"
                  login_uri="https://codedevchat.me/api/auth/google"
                  onSuccess={credentialResponse => {
                    if (credentialResponse.credential) {
                      loginWithGoogle(credentialResponse.credential);
                    }
                  }}
                  onError={() => console.error('Google Login Failed')}
                  theme="outline"
                  shape="pill"
                  width={googleButtonWidth}
                  text="continue_with"
                />
              </div>
            </div>
          </div>

          <div className="mt-10 text-center">
            <p className="text-white/50 text-sm font-medium">
              Already have an account?{' '}
              <Link to="/login" className="text-emerald-400 font-bold hover:text-emerald-300 transition-all hover:underline underline-offset-4">
                Log In
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SignupPage;

