import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface Moderator {
  id: string;
  name: string;
  email: string;
  role: 'moderator' | 'admin';
  createdAt: string;
}

const AdminModeratorsPage = () => {
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadModerators = async () => {
      setIsLoading(true);
      try {
        const data = await api.get<{ moderators: any[] }>('/admin/moderators', { auth: true });
        const mapped = (data.moderators || []).map((m) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          role: m.role,
          createdAt: m.created_at ? new Date(m.created_at).toLocaleDateString() : '—',
        }));
        setModerators(mapped);
      } catch (err) {
        toast.error('Failed to load moderators');
      } finally {
        setIsLoading(false);
      }
    };

    loadModerators();
  }, []);

  const demote = async (id: string) => {
    try {
      await api.put(`/admin/moderators/${id}/demote`, undefined, { auth: true });
      setModerators(prev => prev.filter(m => m.id !== id));
      toast.success('Moderator demoted');
    } catch (err) {
      toast.error('Failed to demote moderator');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Moderators</h2>
          <p className="text-muted-foreground">Track workload and manage promotions.</p>
        </div>
        <Button disabled>Invite moderator</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {moderators.map((m) => (
          <Card key={m.email}>
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{m.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{m.email}</p>
              </div>
              <ShieldCheck className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground space-y-1">
                <p><Badge variant="outline">{m.role}</Badge></p>
                <p className="flex items-center gap-1"><Clock className="h-4 w-4" /> Joined {m.createdAt}</p>
              </div>
              <div className="space-x-2">
                {m.role !== 'admin' && (
                  <Button size="sm" variant="destructive" onClick={() => demote(m.id)}>Demote</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {isLoading && (
          <div className="text-sm text-muted-foreground">Loading moderators...</div>
        )}
      </div>
    </div>
  );
};

export default AdminModeratorsPage;
