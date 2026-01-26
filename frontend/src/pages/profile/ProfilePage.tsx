import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateUser } from '@/store/slices/authSlice';
import { api, authStorage } from '@/lib/api';
import { toast } from 'sonner';

const ProfilePage = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    neighborhood: user?.neighborhood || '',
    city: user?.city || '',
  });

  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      try {
        const data = await api.get<any>('/users/me', { auth: true });
        const updated = {
          name: data.name ?? user.name,
          email: data.email ?? user.email,
          phone: data.phone ?? user.phone ?? '',
          neighborhood: data.neighborhood ?? user.neighborhood ?? '',
          city: data.city ?? user.city ?? '',
          isVerified: Boolean(data.is_verified ?? user.isVerified),
        };
        dispatch(updateUser(updated));
        authStorage.setUser({ ...user, ...updated });
        setFormData(prev => ({ ...prev, ...updated }));
      } catch {
        // Keep existing profile if API fails
      }
    };

    loadProfile();
  }, [dispatch, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.put('/users/me', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        neighborhood: formData.neighborhood || null,
        city: formData.city || null,
      }, { auth: true });

      dispatch(updateUser(formData));
      authStorage.setUser({ ...user, ...formData });
      toast.success('Profile updated');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Profile</h2>
        <p className="text-muted-foreground">Manage your account details and contact info.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="neighborhood">Neighborhood</Label>
              <Input id="neighborhood" name="neighborhood" value={formData.neighborhood} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" value={formData.city} onChange={handleChange} />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" variant="hero" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;

