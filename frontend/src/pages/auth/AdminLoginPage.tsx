import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Shield } from 'lucide-react';
import { apiCall } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(form.email, form.password, 'admin');
      
      if (success) {
        // Navigation is handled by useAuth hook
      } else {
        setError('Invalid credentials or unauthorized');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-red-200">
        <CardHeader className="space-y-1 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-t-lg">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => navigate('/login')}
              className="p-1 hover:bg-red-700 rounded"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6" />
              <CardTitle className="text-2xl font-bold">Admin Portal</CardTitle>
            </div>
          </div>
          <CardDescription className="text-red-100">
            System administration and full platform control
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-6">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                name="email"
                placeholder="Enter your admin email"
                value={form.email}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                name="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-red-600 hover:bg-red-700" 
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-900 font-semibold mb-2">🔒 Restricted Access</p>
            <p className="text-xs text-amber-800">
              Admin access is restricted to authorized personnel only. Unauthorized access attempts are logged and monitored.
            </p>
          </div>

          <div className="mt-4 text-center text-sm text-gray-600">
            <button
              onClick={() => navigate('/login')}
              className="text-blue-600 hover:underline font-medium"
            >
              Back to user login
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
