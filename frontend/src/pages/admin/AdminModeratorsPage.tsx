import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ShieldCheck, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
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
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', password: '' });
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshModerators = () => setRefreshKey(prev => prev + 1);

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
  }, [refreshKey]);

  useEffect(() => {
    const socket = getSocket();

    const handleRefresh = () => refreshModerators();
    const handleAuditLog = (log: any) => {
      if (log?.entity_type !== 'user') return;
      const relevantActions = ['moderator_create', 'moderator_promote', 'moderator_demote', 'user_role_update'];
      if (!relevantActions.includes(log?.action_type)) return;
      refreshModerators();
    };

    const events = ['user:suspended', 'user:unsuspended'];
    events.forEach((eventName) => socket.on(eventName, handleRefresh));
    socket.on('audit:new_log', handleAuditLog);

    return () => {
      events.forEach((eventName) => socket.off(eventName, handleRefresh));
      socket.off('audit:new_log', handleAuditLog);
    };
  }, []);

  const demote = async (id: string) => {
    try {
      await api.put(`/admin/moderators/${id}/demote`, undefined, { auth: true });
      refreshModerators();
      toast.success('Moderator demoted');
    } catch (err) {
      toast.error('Failed to demote moderator');
    }
  };

  const inviteModerator = async () => {
    if (!inviteForm.name || !inviteForm.email || !inviteForm.password) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      setIsLoading(true);
      await api.post<any>('/admin/moderators', inviteForm, { auth: true });
      refreshModerators();
      toast.success('Moderator invited successfully!');
      setShowInviteDialog(false);
      setInviteForm({ name: '', email: '', password: '' });
    } catch (err: any) {
      toast.error(err.message || 'Failed to invite moderator');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Moderators</h2>
          <p className="text-muted-foreground">Track workload and manage promotions.</p>
        </div>
        <Button onClick={() => setShowInviteDialog(true)}>Invite moderator</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
              <div className="text-sm text-muted-foreground space-y-2">
                <div><Badge variant="outline">{m.role}</Badge></div>
                <div className="flex items-center gap-1"><Clock className="h-4 w-4" /> Joined {m.createdAt}</div>
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

      {/* Invite Moderator Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite New Moderator</DialogTitle>
            <DialogDescription>
              Create a new moderator account. They will be able to manage users and services.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={inviteForm.name}
                onChange={(e) => setInviteForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="moderator@nearo.pk"
                value={inviteForm.email}
                onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={inviteForm.password}
                onChange={(e) => setInviteForm(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={inviteModerator} disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Moderator'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminModeratorsPage;
