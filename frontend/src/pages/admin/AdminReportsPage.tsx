import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { toast } from 'sonner';

interface ReportItem {
  id: string;
  subject: string;
  reporter: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  age: string;
}

const severityTone: Record<ReportItem['severity'], string> = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

const statusTone: Record<ReportItem['status'], string> = {
  pending: 'text-red-700',
  reviewed: 'text-amber-700',
  resolved: 'text-emerald-700',
  dismissed: 'text-slate-600',
};

const AdminReportsPage = () => {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const formatAge = (dateStr: string) => {
    const created = new Date(dateStr);
    const diffMs = Date.now() - created.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  const mapSeverity = (status: ReportItem['status']) => {
    if (status === 'pending') return 'high';
    if (status === 'reviewed') return 'medium';
    return 'low';
  };

  useEffect(() => {
    const loadReports = async () => {
      setIsLoading(true);
      try {
        const data = await api.get<{ reports: any[] }>('/admin/reports', { auth: true });
        const mapped = (data.reports || []).map((r) => ({
          id: r.id,
          subject: r.reason || 'Report',
          reporter: r.reporter_name || r.reported_by || 'Unknown',
          severity: mapSeverity(r.status as ReportItem['status']),
          status: (r.status || 'pending') as ReportItem['status'],
          age: formatAge(r.created_at || new Date().toISOString()),
        }));
        setReports(mapped);
      } catch (err) {
        toast.error('Failed to load reports');
      } finally {
        setIsLoading(false);
      }
    };

    loadReports();
  }, []);

  useEffect(() => {
    const socket = getSocket();

    const handleRefresh = () => {
      // Reuse the initial loading effect by reloading via direct fetch path.
      (async () => {
        setIsLoading(true);
        try {
          const data = await api.get<{ reports: any[] }>('/admin/reports', { auth: true });
          const mapped = (data.reports || []).map((r) => ({
            id: r.id,
            subject: r.reason || 'Report',
            reporter: r.reporter_name || r.reported_by || 'Unknown',
            severity: mapSeverity(r.status as ReportItem['status']),
            status: (r.status || 'pending') as ReportItem['status'],
            age: formatAge(r.created_at || new Date().toISOString()),
          }));
          setReports(mapped);
        } catch (err) {
          toast.error('Failed to load reports');
        } finally {
          setIsLoading(false);
        }
      })();
    };

    const handleAuditLog = (log: any) => {
      if (log?.entity_type !== 'report') return;
      if (!['report_status_update'].includes(log?.action_type)) return;
      handleRefresh();
    };

    socket.on('report:updated', handleRefresh);
    socket.on('audit:new_log', handleAuditLog);

    return () => {
      socket.off('report:updated', handleRefresh);
      socket.off('audit:new_log', handleAuditLog);
    };
  }, []);

  const updateStatus = async (id: string, status: ReportItem['status']) => {
    try {
      await api.put(`/admin/reports/${id}`, { status }, { auth: true });
      setReports(prev => prev.map(r => (r.id === id ? { ...r, status, severity: mapSeverity(status) } : r)));
      toast.success('Report updated');
    } catch (err) {
      toast.error('Failed to update report');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reports</h2>
          <p className="text-muted-foreground">Triaging user and service reports.</p>
        </div>
        <Button variant="outline" size="sm" disabled>
          View policy
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reports.map((r) => (
          <Card key={r.id}>
            <CardHeader className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge className={`text-xs ${severityTone[r.severity]}`}>{r.severity}</Badge>
                <span className={`text-xs font-medium capitalize ${statusTone[r.status]}`}>{r.status.replace('_', ' ')}</span>
              </div>
              <CardTitle className="text-base">{r.subject}</CardTitle>
              <p className="text-sm text-muted-foreground">{r.id} • Reporter: {r.reporter}</p>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{r.age} ago</span>
              </div>
              <div className="space-x-2">
                <Button size="sm" variant="outline" className="gap-1" onClick={() => updateStatus(r.id, 'reviewed')}>
                  <AlertTriangle className="h-4 w-4" /> Review
                </Button>
                <Button size="sm" variant="secondary" className="gap-1" onClick={() => updateStatus(r.id, 'resolved')}>
                  <CheckCircle2 className="h-4 w-4" /> Resolve
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {isLoading && (
          <div className="text-sm text-muted-foreground">Loading reports...</div>
        )}
        {!isLoading && reports.length === 0 && (
          <div className="text-sm text-muted-foreground">No reports found.</div>
        )}
      </div>
    </div>
  );
};

export default AdminReportsPage;
