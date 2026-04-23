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
import { getSocket } from '@/lib/socket';
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

  useEffect(() => {
    const socket = getSocket();
    
    const handleNewLog = (newLog: AuditLog) => {
      setLogs((prev) => {
        if (pagination.page !== 1) return prev;
        
        if (filters.actionType && !newLog.action_type.includes(filters.actionType)) return prev;
        if (filters.entityType && !newLog.entity_type.includes(filters.entityType)) return prev;

        const updated = [newLog, ...prev];
        if (updated.length > pagination.limit) {
          updated.pop();
        }
        return updated;
      });
      // Optionally update total count
      setPagination(p => ({ ...p, total: p.total + 1, totalPages: Math.ceil((p.total + 1) / p.limit) }));
    };

    socket.on('audit:new_log', handleNewLog);

    return () => {
      socket.off('audit:new_log', handleNewLog);
    };
  }, [pagination.page, pagination.limit, filters.actionType, filters.entityType]);

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
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 pb-24 md:pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base font-medium">
            Track all sensitive system actions and administrative changes
          </p>
        </div>
        <div className="grid grid-cols-2 md:flex items-center gap-2 md:gap-3">
          <Button variant="outline" className="font-bold rounded-xl h-11" onClick={() => fetchLogs(pagination.page)} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="hero" className="font-bold rounded-xl h-11" onClick={() => toast.info('Export started...')}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border rounded-2xl p-4 md:p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Action Type</label>
            <div className="relative">
              <Activity className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                name="actionType"
                placeholder="e.g. user_ban" 
                className="pl-9 h-11 rounded-xl bg-muted/20 border-none focus-visible:ring-1 focus-visible:ring-primary/20" 
                value={filters.actionType}
                onChange={handleFilterChange}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Entity Type</label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                name="entityType"
                placeholder="e.g. user" 
                className="pl-9 h-11 rounded-xl bg-muted/20 border-none focus-visible:ring-1 focus-visible:ring-primary/20" 
                value={filters.entityType}
                onChange={handleFilterChange}
              />
            </div>
          </div>
          <div className="space-y-1.5 flex flex-col">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Start Date</label>
            <Input 
              name="startDate"
              type="date" 
              className="h-11 w-full rounded-xl bg-muted/20 border-none focus-visible:ring-1 focus-visible:ring-primary/20 text-sm font-medium px-3 flex-1 flex" 
              value={filters.startDate}
              onChange={handleFilterChange}
            />
          </div>
          <div className="space-y-1.5 flex flex-col">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">End Date</label>
            <Input 
              name="endDate"
              type="date" 
              className="h-11 w-full rounded-xl bg-muted/20 border-none focus-visible:ring-1 focus-visible:ring-primary/20 text-sm font-medium px-3 flex-1 flex" 
              value={filters.endDate}
              onChange={handleFilterChange}
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-2 flex items-end gap-2">
            <Button className="flex-1 h-11 rounded-xl font-bold shadow-lg shadow-primary/10" onClick={applyFilters}>
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" className="h-11 rounded-xl font-bold" onClick={resetFilters}>
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Logs View */}
      <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 text-xs font-black uppercase tracking-widest border-b">
                <th className="p-4">Timestamp</th>
                <th className="p-4">Actor</th>
                <th className="p-4">Action</th>
                <th className="p-4">Entity</th>
                <th className="p-4">Details</th>
                <th className="p-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="p-8 text-center text-muted-foreground font-medium italic">Updating logs...</td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-16 text-center text-muted-foreground italic font-medium">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="text-sm hover:bg-muted/20 transition-colors group">
                    <td className="p-4 whitespace-nowrap text-muted-foreground font-medium">
                      {format(new Date(log.created_at), 'MMM d, HH:mm:ss')}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                          <UserIcon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-bold text-foreground">{log.actor_name || 'System'}</div>
                          <div className="text-[10px] text-muted-foreground font-bold tracking-tight">{log.actor_email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                        log.action_type.includes('ban') || log.action_type.includes('delete') 
                          ? "bg-red-50 text-red-600 border-red-100"
                          : log.action_type.includes('update') || log.action_type.includes('change')
                          ? "bg-blue-50 text-blue-600 border-blue-100"
                          : "bg-emerald-50 text-emerald-600 border-emerald-100"
                      )}>
                        {log.action_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-black text-[10px] uppercase tracking-tighter text-muted-foreground opacity-80">{log.entity_type}</div>
                      <div className="text-[9px] text-muted-foreground font-mono opacity-50">{log.entity_id}</div>
                    </td>
                    <td className="p-4 max-w-xs">
                      <div className="truncate text-xs font-semibold text-muted-foreground bg-muted/30 px-2.5 py-1.5 rounded-lg border border-border/50">
                        {log.new_value ? (
                          typeof log.new_value === 'string' ? log.new_value : JSON.stringify(log.new_value)
                        ) : 'N/A'}
                      </div>
                    </td>
                    <td className="p-4 text-[11px] font-mono font-bold text-muted-foreground">
                      {log.ip_address || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View - Cards */}
        <div className="md:hidden divide-y divide-border/40">
          {loading ? (
             <div className="p-12 text-center text-muted-foreground font-medium italic animate-pulse">Syncing logs...</div>
          ) : logs.length === 0 ? (
            <div className="p-16 text-center text-muted-foreground italic font-medium">No logs found</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="p-5 space-y-4 active:bg-muted/30 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center shadow-inner">
                      <UserIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-foreground">{log.actor_name || 'System'}</h4>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tight">{format(new Date(log.created_at), 'MMM d, yyyy · HH:mm')}</p>
                    </div>
                  </div>
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tight border",
                    log.action_type.includes('ban') || log.action_type.includes('delete') 
                      ? "bg-red-50 text-red-600 border-red-100"
                      : "bg-blue-50 text-blue-600 border-blue-100"
                  )}>
                    {log.action_type.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-muted/30 p-4 rounded-2xl border border-border/40">
                  <div>
                    <p className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] mb-1">Entity</p>
                    <p className="text-xs font-bold truncate text-foreground">{log.entity_type}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] mb-1">IP Address</p>
                    <p className="text-xs font-mono font-black text-foreground">{log.ip_address || 'Unknown'}</p>
                  </div>
                </div>

                <div className="bg-card border border-border/60 rounded-xl p-4 shadow-inner">
                  <p className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.25em] mb-2.5">Audit Context</p>
                  <div className="text-[11px] font-bold text-muted-foreground/80 line-clamp-3 leading-relaxed">
                    {log.new_value ? (
                      typeof log.new_value === 'string' ? log.new_value : JSON.stringify(log.new_value)
                    ) : 'No extra data available'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Pagination */}
        <div className="p-4 md:p-5 border-t flex flex-col sm:flex-row items-center justify-between bg-muted/10 gap-4">
          <div className="text-xs md:text-sm font-bold text-muted-foreground uppercase tracking-widest">
            Showing <span className="text-foreground">{logs.length}</span> / <span className="text-foreground">{pagination.total}</span> records
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="font-black rounded-xl h-9 md:h-10 px-4 transition-transform active:scale-95"
              onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
              disabled={pagination.page === 1 || loading}
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Prev
            </Button>
            <div className="text-xs font-black px-4 py-2 bg-muted rounded-full">
              {pagination.page} / {pagination.totalPages || 1}
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="font-black rounded-xl h-9 md:h-10 px-4 transition-transform active:scale-95"
              onClick={() => setPagination(p => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))}
              disabled={pagination.page === pagination.totalPages || loading}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogsPage;
