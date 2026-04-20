import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ClipboardList, 
  Search, 
  Filter, 
  Calendar, 
  User as UserIcon, 
  ArrowLeft,
  ArrowRight,
  Shield,
  Activity,
  Download,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface AuditLog {
  id: string;
  actor_id: string;
  actor_name?: string;
  actor_email?: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  old_value: any;
  new_value: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

const AuditLogsPage = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    actionType: '',
    entityType: '',
    actorId: '',
    startDate: '',
    endDate: ''
  });

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      });
      
      const response = await api.get<{ logs: AuditLog[], pagination: any }>(`/admin/audit-logs?${queryParams.toString()}`, { auth: true });
      setLogs(response.logs);
      setPagination(response.pagination);
    } catch (error) {
      toast.error('Failed to fetch audit logs');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(pagination.page);
  }, [pagination.page]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchLogs(1);
  };

  const resetFilters = () => {
    setFilters({
      actionType: '',
      entityType: '',
      actorId: '',
      startDate: '',
      endDate: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground mt-1">
            Track all sensitive system actions and administrative changes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => fetchLogs(pagination.page)} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="hero" onClick={() => toast.info('Export started...')}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border rounded-xl p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action Type</label>
            <div className="relative">
              <Activity className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                name="actionType"
                placeholder="e.g. user_ban" 
                className="pl-9" 
                value={filters.actionType}
                onChange={handleFilterChange}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Entity Type</label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                name="entityType"
                placeholder="e.g. user" 
                className="pl-9" 
                value={filters.entityType}
                onChange={handleFilterChange}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Start Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                name="startDate"
                type="date" 
                className="pl-9" 
                value={filters.startDate}
                onChange={handleFilterChange}
              />
            </div>
          </div>
          <div className="space-y-2 lg:col-span-2 flex items-end gap-2">
            <Button className="flex-1" onClick={applyFilters}>
              <Filter className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
            <Button variant="outline" onClick={resetFilters}>
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 text-sm font-medium border-b">
                <th className="p-4">Timestamp</th>
                <th className="p-4">Actor</th>
                <th className="p-4">Action</th>
                <th className="p-4">Entity</th>
                <th className="p-4">Details</th>
                <th className="p-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">Loading logs...</td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-muted-foreground italic">
                    No audit logs found matching the criteria
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="text-sm hover:bg-muted/30 transition-colors">
                    <td className="p-4 whitespace-nowrap text-muted-foreground">
                      {format(new Date(log.created_at), 'MMM d, HH:mm:ss')}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                          <UserIcon className="h-4 w-4 text-slate-600" />
                        </div>
                        <div>
                          <div className="font-medium">{log.actor_name || 'System'}</div>
                          <div className="text-xs text-muted-foreground">{log.actor_email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        log.action_type.includes('ban') || log.action_type.includes('delete') 
                          ? "bg-red-50 text-red-600 border border-red-100"
                          : log.action_type.includes('update') || log.action_type.includes('change')
                          ? "bg-blue-50 text-blue-600 border border-blue-100"
                          : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      )}>
                        {log.action_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-xs uppercase">{log.entity_type}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{log.entity_id}</div>
                    </td>
                    <td className="p-4 max-w-xs overflow-hidden">
                      <div className="truncate text-xs text-muted-foreground">
                        {log.new_value ? (
                          typeof log.new_value === 'string' ? log.new_value : JSON.stringify(log.new_value)
                        ) : 'N/A'}
                      </div>
                    </td>
                    <td className="p-4 text-xs font-mono text-muted-foreground">
                      {log.ip_address || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t flex items-center justify-between bg-muted/20">
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-medium">{logs.length}</span> of <span className="font-medium">{pagination.total}</span> logs
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
              disabled={pagination.page === 1 || loading}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Prev
            </Button>
            <div className="text-sm font-medium px-4">
              {pagination.page} / {pagination.totalPages || 1}
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setPagination(p => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))}
              disabled={pagination.page === pagination.totalPages || loading}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogsPage;
