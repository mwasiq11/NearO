import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2, Clock, ListChecks, ArrowUpRight } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { getSocket } from '@/lib/socket';
import { ServiceDetailModal } from '@/components/admin/AdminResourceModals';

interface DashboardStats {
  services: { total: number; pending: number };
  reports: { total: number; pending: number };
}

interface QueueItem {
  id: string;
  title: string;
  age: string;
  severity: 'low' | 'medium' | 'high';
}

const ModeratorDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal state
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const refreshData = () => setRefreshKey(prev => prev + 1);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [analytics, pending] = await Promise.all([
          api.get<any>('/admin/analytics/dashboard', { auth: true }),
          api.get<{ services: any[] }>('/admin/services/pending', { auth: true })
        ]);

        setStats(analytics);
        
        const mappedQueue = (pending.services || []).slice(0, 5).map(s => ({
          id: s.id,
          title: `Approve: ${s.title}`,
          age: 'new',
          severity: 'medium' as const,
        }));
        setQueue(mappedQueue);
      } catch (err) {
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    load();

    const socket = getSocket();
    const handleUpdate = () => refreshData();

    const moderationEvents = [
      'service:new',
      'service:approved',
      'service:rejected',
      'report:new',
      'report:updated',
      'user:suspended',
      'user:unsuspended'
    ];

    moderationEvents.forEach((eventName) => {
      socket.on(eventName, handleUpdate);
    });

    return () => {
      moderationEvents.forEach((eventName) => {
        socket.off(eventName, handleUpdate);
      });
    };
  }, [refreshKey]);

  const approveService = async (id: string) => {
    try {
      await api.put(`/admin/services/${id}/approve`, undefined, { auth: true });
      toast.success('Service approved');
      refreshData();
    } catch (err) {
      toast.error('Failed to approve');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Moderator workspace</h2>
          <p className="text-muted-foreground">Focus on approvals, reports, and safety signals.</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1" onClick={refreshData}>
          <ListChecks className="h-4 w-4" /> Refresh queue
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm text-muted-foreground">Pending approvals</p>
            <CardTitle className="text-2xl font-bold">{stats?.services.pending ?? '—'}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-emerald-600 flex items-center gap-1">
            <ArrowUpRight className="h-4 w-4" /> Priority review
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm text-muted-foreground">Open reports</p>
            <CardTitle className="text-2xl font-bold">{stats?.reports.pending ?? '—'}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-amber-600 flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" /> Actions required
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm text-muted-foreground">Platform health</p>
            <CardTitle className="text-2xl font-bold">Stable</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">System operational</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Review queue</CardTitle>
            <p className="text-sm text-muted-foreground">Fast triage for today.</p>
          </div>
          <Badge variant="outline" className="animate-pulse">Live</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {queue.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 hover:bg-muted/30 transition-colors">
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.id}</p>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="capitalize">{item.severity}</Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="h-4 w-4" /> {item.age}</span>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="gap-1"
                    onClick={() => { setSelectedService(item.id); setIsModalOpen(true); }}
                  >
                    <AlertTriangle className="h-4 w-4" /> Review
                  </Button>
                  <Button size="sm" className="gap-1" onClick={() => approveService(item.id)}>
                    <CheckCircle2 className="h-4 w-4" /> Resolve
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {!isLoading && queue.length === 0 && (
            <div className="py-10 text-center text-muted-foreground italic">
              All caught up! The queue is empty.
            </div>
          )}
          {isLoading && (
            <div className="py-10 text-center text-muted-foreground">
              Syncing with platform...
            </div>
          )}
        </CardContent>
      </Card>

      <ServiceDetailModal 
        serviceId={selectedService}
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedService(null); }}
      />
    </div>
  );
};


export default ModeratorDashboard;
