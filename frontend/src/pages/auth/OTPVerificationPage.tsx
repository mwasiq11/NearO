import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const OTPVerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { completeOtpLogin } = useAuth();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);
  
  // Get email from navigation state
  const email = location.state?.email || '';
  

  useEffect(() => {
    if (!email) {
      navigate('/signup');
      return;
    }

    // Start countdown for resend button
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
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
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
    
    if (!/^\d+$/.test(pastedData)) {
      toast({
        variant: 'destructive',
        title: 'Invalid OTP',
        description: 'Please paste only numbers',
      });
      return;
    }

    const newOtp = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
    setOtp(newOtp);

    // Focus last filled input
    const lastIndex = Math.min(pastedData.length, 5);
    const lastInput = document.getElementById(`otp-${lastIndex}`);
    lastInput?.focus();
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      toast({
        variant: 'destructive',
        title: 'Incomplete OTP',
        description: 'Please enter all 6 digits',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/auth/verify-otp', {
        email,
        otp: otpCode,
      });

      toast({
        title: 'Success!',
        description: response.message || 'Email verified successfully',
      });

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
      toast({
        variant: 'destructive',
        title: 'Verification failed',
        description: error.response?.data?.error || 'Invalid or expired OTP',
      });
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      const firstInput = document.getElementById('otp-0');
      firstInput?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);

    try {
      const response = await api.post('/auth/resend-otp', { email });

      toast({
        title: 'OTP Sent',
        description: response.data.message || 'A new verification code has been sent',
      });

      // Reset countdown
      setCanResend(false);
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      const firstInput = document.getElementById('otp-0');
      firstInput?.focus();
    } catch (error: any) {
      const retryAfter = error.response?.data?.retryAfter;
      
      toast({
        variant: 'destructive',
        title: 'Failed to resend',
        description: retryAfter 
          ? `Please wait ${retryAfter} seconds before requesting again`
          : error.response?.data?.error || 'Failed to send verification code',
      });

      if (retryAfter) {
        setCountdown(retryAfter);
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md space-y-8"
        >
          <div>
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <Mail className="h-8 w-8 text-emerald-600" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold mb-2 text-center">Verify Your Email</h1>
            <p className="text-muted-foreground text-center">
              We've sent a 6-digit verification code to<br />
              <span className="font-semibold text-foreground">{email}</span>
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-center block">Enter Verification Code</Label>
              <div className="flex gap-2 justify-center" onPaste={handlePaste}>
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
                      "w-12 h-14 text-center text-2xl font-semibold",
                      digit && "border-emerald-500"
                    )}
                    autoFocus={index === 0}
                  />
                ))}
              </div>
            </div>

            <Button
              onClick={handleVerify}
              disabled={isLoading || otp.join('').length !== 6}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Verify Email
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Didn't receive the code?
              </p>
              <Button
                variant="link"
                onClick={handleResend}
                disabled={!canResend || isResending}
                className="text-emerald-600 hover:text-emerald-700"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                    Sending...
                  </>
                ) : canResend ? (
                  'Resend Code'
                ) : (
                  `Resend in ${countdown}s`
                )}
              </Button>
            </div>

            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => navigate('/signup')}
                className="text-sm"
              >
                Wrong email? Go back to signup
              </Button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Panel - Illustration */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-emerald-500 to-teal-600 items-center justify-center p-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="text-white space-y-6 max-w-md"
        >
          <div className="space-y-4">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Mail className="h-6 w-6" />
            </div>
            <h2 className="text-4xl font-bold">Check Your Email</h2>
            <p className="text-emerald-50 text-lg">
              We've sent a verification code to secure your account. Enter the code to complete your registration.
            </p>
          </div>
          
          <div className="space-y-3 pt-6">
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-sm font-bold">1</span>
              </div>
              <div>
                <h3 className="font-semibold">Check your inbox</h3>
                <p className="text-sm text-emerald-50">Look for an email from NearO</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-sm font-bold">2</span>
              </div>
              <div>
                <h3 className="font-semibold">Enter the 6-digit code</h3>
                <p className="text-sm text-emerald-50">Code expires in 10 minutes</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-sm font-bold">3</span>
              </div>
              <div>
                <h3 className="font-semibold">Start using NearO</h3>
                <p className="text-sm text-emerald-50">Connect with your community</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OTPVerificationPage;
