import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GoogleLogin } from '@react-oauth/google';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: location.state?.email || '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState(location.state?.message || '');

  const { login, loginWithGoogle, isLoading, error } = useAuth();

  useEffect(() => {
    // 1. Check if the URL has tokens from the Google Redirect
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const refreshToken = params.get('refreshToken');

    if (token) {
      // 2. Save them exactly how your app expects them
      localStorage.setItem('accessToken', token);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);

      // 3. Clean the URL bar and push to dashboard
      window.history.replaceState({}, document.title, "/login");
      navigate('/dashboard', { replace: true });
      
      // Force a reload if needed or just let React state handle it
      // window.location.reload(); 
    }
  }, [location, navigate]);

  useEffect(() => {
    // Clear success message after 5 seconds
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await login(formData);
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel - Image with refined overlay */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 to-teal-900/60 z-10" />
        <div
          className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200')] bg-cover bg-center transition-transform duration-10000 hover:scale-110"
        />
        <div className="relative z-20 h-full flex flex-col items-center justify-center p-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-md"
          >
            <h2 className="text-5xl font-extrabold mb-6 text-white tracking-tight drop-shadow-lg">
              Welcome Back!
            </h2>
            <p className="text-white/90 text-xl font-medium leading-relaxed drop-shadow-md">
              Your community is waiting. Sign in to connect with your neighbors and get things done.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Form Container Refined */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 md:p-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[400px] flex flex-col"
        >
          {/* Logo Alignment */}
          <div className="mb-8 text-center sm:text-left">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="h-10 w-10 rounded-xl overflow-hidden bg-white shadow-sm flex items-center justify-center p-1.5 border border-emerald-100 transition-all group-hover:scale-110 group-hover:shadow-md">
                <img src="https://companieslogo.com/img/orig/NBLY.TO-63e791bf.png?t=1720244493" alt="NearO" className="h-full w-full object-contain" />
              </div>
              <span className="font-bold text-2xl bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent tracking-tighter">NearO</span>
            </Link>
          </div>

          {/* Messages */}
          {successMessage && (
            <Alert className="mb-6 bg-emerald-50 border-emerald-200 text-emerald-800 animate-in fade-in slide-in-from-top-1">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="font-medium">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <div className="mb-6 bg-destructive/5 border border-destructive/20 text-destructive text-sm font-medium rounded-lg p-3 animate-in shake">
              {error}
            </div>
          )}

          {/* Login Form with increased spacing and consistent height */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-foreground ml-1">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-emerald-500" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  className={cn(
                    "h-12 pl-12 bg-background border-input ring-offset-background transition-all focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500",
                    errors.email && "border-destructive focus:ring-destructive/20"
                  )}
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              {errors.email && <p className="text-xs font-medium text-destructive ml-1">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <Label htmlFor="password" className="text-sm font-semibold text-foreground">Password</Label>
                <Link to="/forgot-password" className="text-xs font-medium text-emerald-600 hover:text-emerald-50" style={{ color: '#10b981' }}>
                  Forgot password?
                </Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-emerald-500" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={cn(
                    "h-12 pl-12 pr-12 bg-background border-input transition-all focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500",
                    errors.password && "border-destructive focus:ring-destructive/20"
                  )}
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs font-medium text-destructive ml-1">{errors.password}</p>}
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-bold bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all active:scale-[0.98]"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign In <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          {/* Polished Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
              <span className="bg-background px-4 text-muted-foreground/60">OR CONTINUE WITH</span>
            </div>
          </div>

          {/* Google Button - Perfectly Aligned & Enhanced */}
          <div className="flex flex-col items-center w-full">
            <div className="w-full flex justify-center group">
              <div className="w-full max-w-[360px] overflow-hidden rounded-full border border-input shadow-sm transition-all duration-300 hover:shadow-md hover:border-emerald-200 active:scale-[0.98] flex items-center justify-center bg-white">
                <GoogleLogin
                  ux_mode="redirect"
                  login_uri="https://codedevchat.me/api/auth/google"
                  onSuccess={credentialResponse => {
                    if (credentialResponse.credential) {
                      loginWithGoogle(credentialResponse.credential);
                    }
                  }}
                  onError={() => {
                    console.error('Google Login Failed');
                  }}
                  theme="outline"
                  shape="pill"
                  width="360"
                  text="continue_with"
                />
              </div>
            </div>
            <p className="mt-6 text-xs text-muted-foreground/60 text-center px-4 leading-relaxed">
              By continuing, you agree to our <Link to="/terms" className="hover:text-emerald-500 underline underline-offset-4">Terms of Service</Link> and <Link to="/privacy" className="hover:text-emerald-500 underline underline-offset-4">Privacy Policy</Link>.
            </p>
          </div>

          {/* Footer Alignment */}
          <div className="mt-10 text-center">
            <p className="text-muted-foreground text-sm font-medium">
              Don't have an account?{' '}
              <Link to="/signup" className="text-emerald-600 font-bold hover:underline transition-all">
                Sign up
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
