import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Users, LineChart, Gauge, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface DashboardCounts {
  users: { total: number; users: number; moderators: number; admins: number; active_users: number };
  services: { total: number; active: number; pending: number };
  reports: { total: number; pending: number; reviewed: number; resolved: number; dismissed: number };
}

const AdminAnalyticsPage = () => {
  const [counts, setCounts] = useState<DashboardCounts | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.get<DashboardCounts>('/admin/analytics/dashboard', { auth: true });
        setCounts(data);
      } catch {
        toast.error('Failed to load analytics');
      }
    };
    load();
  }, []);

  const metrics = counts ? [
    { label: 'Total users', value: String(counts.users.total), change: `${counts.users.active_users} active` },
    { label: 'Total services', value: String(counts.services.total), change: `${counts.services.active} active` },
    { label: 'Pending services', value: String(counts.services.pending), change: 'Needs review' },
    { label: 'Open reports', value: String(counts.reports.pending), change: 'Pending' },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics</h2>
          <p className="text-muted-foreground">Snapshot of platform momentum and category performance.</p>
        </div>
        <Button variant="outline" size="sm">Export CSV</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardHeader className="pb-2">
              <p className="text-sm text-muted-foreground">{m.label}</p>
              <CardTitle className="text-2xl font-bold">{m.value}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-sm text-emerald-600">
              <TrendingUp className="h-4 w-4" />
              <span>{m.change}</span>
            </CardContent>
          </Card>
        ))}
        {!counts && (
          <Card>
            <CardHeader className="pb-2">
              <p className="text-sm text-muted-foreground">Loading</p>
              <CardTitle className="text-2xl font-bold">—</CardTitle>
            </CardHeader>
          </Card>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Role breakdown</CardTitle>
            <Badge variant="outline">Current</Badge>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div className="rounded-lg border bg-white p-4">
              <p className="text-xs uppercase tracking-wide">Users</p>
              <p className="text-2xl font-semibold text-foreground">{counts?.users.users ?? 0}</p>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <p className="text-xs uppercase tracking-wide">Moderators</p>
              <p className="text-2xl font-semibold text-foreground">{counts?.users.moderators ?? 0}</p>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <p className="text-xs uppercase tracking-wide">Admins</p>
              <p className="text-2xl font-semibold text-foreground">{counts?.users.admins ?? 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Reports</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-lg border bg-white px-3 py-2">
              <div>
                <p className="font-medium text-foreground">Pending</p>
                <p className="text-xs text-muted-foreground">Needs review</p>
              </div>
              <Badge variant="outline">{counts?.reports.pending ?? 0}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-white px-3 py-2">
              <div>
                <p className="font-medium text-foreground">Resolved</p>
                <p className="text-xs text-muted-foreground">Closed cases</p>
              </div>
              <Badge variant="outline">{counts?.reports.resolved ?? 0}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>System health</CardTitle>
            <p className="text-sm text-muted-foreground">Latency, errors, and SLA</p>
          </div>
          <Button size="sm" variant="outline" className="gap-1"><LineChart className="h-4 w-4" /> View logs</Button>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3 text-sm text-muted-foreground">
          <div className="rounded-lg border bg-white p-4 space-y-1">
            <div className="flex items-center gap-2 text-emerald-600"><Gauge className="h-4 w-4" /><span>API latency</span></div>
            <p className="text-lg font-semibold text-foreground">182 ms p95</p>
            <p className="text-xs text-emerald-600">SLA healthy</p>
          </div>
          <div className="rounded-lg border bg-white p-4 space-y-1">
            <div className="flex items-center gap-2 text-emerald-600"><CheckCircle2 className="h-4 w-4" /><span>Error rate</span></div>
            <p className="text-lg font-semibold text-foreground">0.11%</p>
            <p className="text-xs text-emerald-600">Within budget</p>
          </div>
          <div className="rounded-lg border bg-white p-4 space-y-1">
            <div className="flex items-center gap-2 text-emerald-600"><TrendingUp className="h-4 w-4" /><span>Incidents</span></div>
            <p className="text-lg font-semibold text-foreground">0 open</p>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalyticsPage;
