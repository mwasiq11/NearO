import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Users, ShieldCheck, AlertTriangle, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { getSocket } from '@/lib/socket';
import { UserDetailModal, ServiceDetailModal } from '@/components/admin/AdminResourceModals';

interface DashboardCounts {
  users: { total: number; active_users: number };
  services: { total: number; pending: number };
  reports: { total: number; pending: number };
}

interface PendingItem {
  age: string;
  severity: 'low' | 'medium' | 'high';
  type: 'service' | 'report';
  originalId: string; // The ID of the service or report
}

interface ActivityLog {
  id: string;
  action: string;
  actor_id: string;
  target_type: string;
  created_at: string;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Array<{
    label: string;
    value: string;
    change: string;
    icon: typeof Users;
    tone: string;
    badge: string;
  }>>([]);
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal state
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);

  const refreshData = () => setRefreshKey(prev => prev + 1);

  useEffect(() => {
    const load = async () => {
      try {
        const counts = await api.get<DashboardCounts>('/admin/analytics/dashboard', { auth: true });
        setStats([
          { label: 'Active Users', value: String(counts.users.active_users), change: `${counts.users.total} total`, icon: Users, tone: 'text-blue-600', badge: 'Healthy' },
          { label: 'Pending Approvals', value: String(counts.services.pending), change: 'Needs review', icon: ShieldCheck, tone: 'text-amber-600', badge: 'Action' },
          { label: 'Open Reports', value: String(counts.reports.pending), change: `${counts.reports.total} total`, icon: AlertTriangle, tone: 'text-red-600', badge: 'Critical' },
          { label: 'Uptime', value: '99.98%', change: '7d rolling', icon: CheckCircle, tone: 'text-emerald-600', badge: 'Operational' },
        ]);

        const [services, reports] = await Promise.all([
          api.get<{ services: any[] }>('/admin/services/pending', { auth: true }).catch(() => ({ services: [] })),
          api.get<{ reports: any[] }>('/admin/reports', { auth: true }).catch(() => ({ reports: [] })),
        ]);

        const pending = [
          ...(services.services || []).slice(0, 3).map((s: any) => ({
            id: `service-${s.id}`,
            originalId: s.id,
            title: `Service approval: ${s.title}`,
            owner: s.provider_name || s.provider_email || 'Provider',
            age: 'new',
            severity: 'medium' as const,
            type: 'service' as const,
          })),
          ...(reports.reports || []).slice(0, 3).map((r: any) => ({
            id: `report-${r.id}`,
            originalId: r.id,
            title: `Report: ${r.reason || 'User report'}`,
            owner: r.reporter_name || 'Reporter',
            age: 'new',
            severity: 'high' as const,
            type: 'report' as const,
          })),
        ];
        setPendingItems(pending.slice(0, 5));
        const logData = await api.get<{ logs: ActivityLog[] }>('/admin/system/logs?limit=10', { auth: true }).catch(() => ({ logs: [] }));
        setLogs(logData.logs || []);

      } catch (err) {
        toast.error('Failed to load dashboard data');
      }
    };

    load();

    // Socket listeners for real-time updates
    const socket = getSocket();
    const handleModeration = () => {
      refreshData();
      toast('Moderation update', { description: 'New items pending review' });
    };

    socket.on('service:new', handleModeration);
    socket.on('report:new', handleModeration);

    return () => {
      socket.off('service:new', handleModeration);
      socket.off('report:new', handleModeration);
    };
  }, [refreshKey]);

  const openItem = (item: PendingItem) => {
    if (item.type === 'service') {
      setSelectedService(item.originalId);
      setIsServiceModalOpen(true);
    } else {
      // In a real app we might open the report detail, but for now we'll show the service it relates to if available
      // Or just toast. Let's assume most reports are about services for now.
      toast.info('Report details');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold">Platform overview</h2>
          <p className="text-muted-foreground">Quick glance at health, workload, and moderation signals.</p>
        </div>
        <Button variant="outline" onClick={refreshData}>
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <CardTitle className="text-2xl font-bold">{item.value}</CardTitle>
                </div>
                <Icon className={`h-5 w-5 ${item.tone}`} />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  <span>{item.change}</span>
                  <Badge variant="outline" className="ml-auto text-xs">{item.badge}</Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle>Pending actions</CardTitle>
              <p className="text-sm text-muted-foreground">Approve services, verify users, and triage reports.</p>
            </div>
            <Button variant="outline" size="sm">View queue</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.id} • {item.owner}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="capitalize">{item.severity}</Badge>
                  <span className="text-sm text-muted-foreground">{item.age}</span>
                  <Button size="sm" onClick={() => openItem(item)}>Open</Button>
                </div>
              </div>
            ))}
            {pendingItems.length === 0 && (
              <div className="text-sm text-muted-foreground">No pending actions.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <p className="text-sm text-muted-foreground">Last 24 hours</p>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {logs.length > 0 ? (
              <div className="space-y-4">
                {logs.map((log) => (
                  <div key={log.id} className="flex flex-col gap-1 border-b pb-2 last:border-0 last:pb-0">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-foreground capitalize">
                        {log.action.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] uppercase text-muted-foreground">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground truncate">
                      Target: {log.target_type} • {log.id.slice(0, 8)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No recent activity found.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <UserDetailModal 
        userId={selectedUser}
        isOpen={isUserModalOpen}
        onClose={() => { setIsUserModalOpen(false); setSelectedUser(null); }}
      />

      <ServiceDetailModal 
        serviceId={selectedService}
        isOpen={isServiceModalOpen}
        onClose={() => { setIsServiceModalOpen(false); setSelectedService(null); }}
      />
    </div>
  );
};

export default AdminDashboard;
