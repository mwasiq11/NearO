import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, RefreshCw, CheckCircle2, ShieldEllipsis } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Iridescence from '@/components/animations/Iridescence';
import BorderGlow from '@/components/animations/BorderGlow';
import { Loader2 } from 'lucide-react';

const OTPVerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { completeOtpLogin } = useAuth();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);
  
  const email = location.state?.email || '';
  
  useEffect(() => {
    if (!email) {
      navigate('/signup');
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [email, navigate]);

  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
    setOtp(newOtp);

    const lastIndex = Math.min(pastedData.length, 5);
    const lastInput = document.getElementById(`otp-${lastIndex}`);
    lastInput?.focus();
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) return;
    setIsLoading(true);

    try {
      const response = await api.post('/auth/verify-otp', { email, otp: otpCode }) as any;
      if (response.accessToken && response.refreshToken && response.user) {
        completeOtpLogin({
          user: response.user,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        });
      } else {
        navigate('/login');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Invalid or expired OTP');
      setOtp(['', '', '', '', '', '']);
      document.getElementById('otp-0')?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await api.post('/auth/resend-otp', { email });
      toast.success('A new verification code has been sent');
      setCanResend(false);
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      document.getElementById('otp-0')?.focus();
    } catch (error: any) {
      toast.error('Failed to resend code');
    } finally {
      setIsResending(false);
    }
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

      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 md:p-20 relative z-10 order-2 lg:order-1">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[480px] relative z-10"
        >
          <BorderGlow
            edgeSensitivity={30}
            glowColor="160 84% 65%"
            backgroundColor="rgba(255, 255, 255, 0.03)"
            borderRadius={40}
            glowRadius={60}
            glowIntensity={1.5}
            colors={['#10b981', '#34d399', '#059669']}
          >
            <div className="p-8 md:p-10 shadow-2xl">
              <div className="mb-8 text-center">
                <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-6">
                  <ShieldEllipsis className="h-6 w-6" />
                </div>
                <h1 className="text-2xl font-bold text-white">Verification Code</h1>
                <p className="text-white/50 mt-2">
                  We've sent a 6-digit code to <span className="text-white font-semibold">{email}</span>
                </p>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex gap-2 sm:gap-3 justify-center" onPaste={handlePaste}>
                    {otp.map((digit, index) => (
                      <Input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className={cn(
                          "w-10 h-14 sm:w-12 sm:h-16 text-center text-2xl font-bold bg-white/5 border-white/10 text-white rounded-xl focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all",
                          digit && "border-emerald-500/50 bg-emerald-500/5"
                        )}
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleVerify}
                  disabled={isLoading || otp.join('').length !== 6}
                  size="xl"
                  className="w-full h-14 text-lg font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-xl shadow-xl transition-all active:scale-[0.98]"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Verifying...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Verify Account <ArrowRight className="h-5 w-5" />
                    </span>
                  )}
                </Button>

                <div className="text-center space-y-4">
                  <div className="text-sm text-white/40">
                    Didn't receive the code?{' '}
                    <button
                      onClick={handleResend}
                      disabled={!canResend || isResending}
                      className="text-emerald-400 font-bold hover:text-emerald-300 disabled:opacity-50 disabled:no-underline hover:underline transition-all"
                    >
                      {isResending ? 'Sending...' : canResend ? 'Resend Code' : `Resend in ${countdown}s`}
                    </button>
                  </div>
                  <button
                    onClick={() => navigate('/signup')}
                    className="text-xs text-white/20 hover:text-white/40 transition-colors uppercase tracking-widest font-bold"
                  >
                    Use a different email
                  </button>
                </div>
              </div>
            </div>
          </BorderGlow>
        </motion.div>
      </div>

      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col items-center justify-center p-16 text-center z-10 order-1 lg:order-2">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 to-slate-950 z-0" />
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-md relative z-10"
        >
          <div className="mb-8 inline-flex p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>
          <h2 className="text-5xl font-bold mb-6 tracking-tight leading-tight">
            Secure Your Account
          </h2>
          <p className="text-white/60 text-xl leading-relaxed">
            Enter the verification code to complete your registration and join the NearO community.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default OTPVerificationPage;

