import { useState, useEffect, useRef, useCallback } from 'react';
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
import { SearchAutocomplete } from '@/components/common/SearchAutocomplete';
import { useMemo } from 'react';

interface AuditLog {
  id: string;
  actor_id: string;
  actor_name?: string;
  actor_email?: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  old_value: unknown;
  new_value: unknown;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

interface SearchOption {
  group: string;
  value: string;
  label: string;
}

interface AuditFilters {
  actionType: string;
  entityType: string;
  actorId: string;
  startDate: string;
  endDate: string;
}

interface AuditPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const DEFAULT_FILTERS: AuditFilters = {
  actionType: '',
  entityType: '',
  actorId: '',
  startDate: '',
  endDate: ''
};

const normalizeValue = (value?: string | null) => (value || '').trim().toLowerCase();

const buildDateBoundary = (rawDate: string, boundary: 'start' | 'end') => {
  if (!rawDate) return null;
  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) return null;
  if (boundary === 'start') {
    parsed.setHours(0, 0, 0, 0);
  } else {
    parsed.setHours(23, 59, 59, 999);
  }
  return parsed.getTime();
};

const matchesRealtimeFilters = (log: AuditLog, activeFilters: AuditFilters) => {
  const actionNeedle = normalizeValue(activeFilters.actionType);
  const entityNeedle = normalizeValue(activeFilters.entityType);
  const actorNeedle = normalizeValue(activeFilters.actorId);

  if (actionNeedle && !normalizeValue(log.action_type).includes(actionNeedle)) {
    return false;
  }

  if (entityNeedle && !normalizeValue(log.entity_type).includes(entityNeedle)) {
    return false;
  }

  if (actorNeedle) {
    const matchesActorId = normalizeValue(log.actor_id).includes(actorNeedle);
    const matchesActorName = normalizeValue(log.actor_name).includes(actorNeedle);
    const matchesActorEmail = normalizeValue(log.actor_email).includes(actorNeedle);
    if (!matchesActorId && !matchesActorName && !matchesActorEmail) {
      return false;
    }
  }

  const startBoundary = buildDateBoundary(activeFilters.startDate, 'start');
  const endBoundary = buildDateBoundary(activeFilters.endDate, 'end');
  if (startBoundary || endBoundary) {
    const createdAt = new Date(log.created_at).getTime();
    if (Number.isNaN(createdAt)) {
      return false;
    }
    if (startBoundary && createdAt < startBoundary) {
      return false;
    }
    if (endBoundary && createdAt > endBoundary) {
      return false;
    }
  }

  return true;
};

const AuditLogsPage = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<AuditPagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState<AuditFilters>(DEFAULT_FILTERS);
  const filtersRef = useRef<AuditFilters>(DEFAULT_FILTERS);

  const actionSuggestions = useMemo<SearchOption[]>(() => {
    const seen = new Set<string>();
    return logs.flatMap((log) => {
      const value = log.action_type?.trim();
      if (!value || seen.has(value.toLowerCase())) return [];
      seen.add(value.toLowerCase());
      return [{ group: 'actions', value, label: value.replace(/_/g, ' ') }];
    });
  }, [logs]);

  const entitySuggestions = useMemo<SearchOption[]>(() => {
    const seen = new Set<string>();
    return logs.flatMap((log) => {
      const value = log.entity_type?.trim();
      if (!value || seen.has(value.toLowerCase())) return [];
      seen.add(value.toLowerCase());
      return [{ group: 'entities', value, label: value }];
    });
  }, [logs]);

  const actorSuggestions = useMemo<SearchOption[]>(() => {
    const seen = new Set<string>();
    const options: SearchOption[] = [];

    logs.forEach((log) => {
      const candidates = [log.actor_id, log.actor_name, log.actor_email].filter(Boolean) as string[];
      candidates.forEach((candidate) => {
        const normalized = candidate.trim().toLowerCase();
        if (!normalized || seen.has(normalized)) return;
        seen.add(normalized);
        options.push({ group: 'actors', value: candidate.trim(), label: candidate.trim() });
      });
    });

    return options;
  }, [logs]);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const fetchLogs = useCallback(async (page = 1, activeFilters?: AuditFilters) => {
    setLoading(true);
    try {
      const effectiveFilters = activeFilters || filtersRef.current;
      const activeFilterEntries = Object.entries(effectiveFilters).filter(([, value]) => Boolean(value));
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(activeFilterEntries)
      });
      
      const response = await api.get<{ logs: AuditLog[]; pagination: AuditPagination }>(`/admin/audit-logs?${queryParams.toString()}`, { auth: true });
      setLogs(response.logs);
      setPagination(response.pagination);
    } catch (error) {
      toast.error('Failed to fetch audit logs');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [pagination.limit]);

  useEffect(() => {
    fetchLogs(pagination.page);
  }, [pagination.page, fetchLogs]);

  useEffect(() => {
    const socket = getSocket();
    
    const handleNewLog = (newLog: AuditLog) => {
      if (pagination.page !== 1) {
        return;
      }

      if (!matchesRealtimeFilters(newLog, filters)) {
        return;
      }

      setLogs((prev) => {
        if (prev.some((item) => item.id === newLog.id)) {
          return prev;
        }

        const updated = [newLog, ...prev].slice(0, pagination.limit);
        setPagination((current) => ({
          ...current,
          total: current.total + 1,
          totalPages: Math.max(1, Math.ceil((current.total + 1) / current.limit))
        }));
        return updated;
      });
    };

    socket.on('audit:new_log', handleNewLog);

    return () => {
      socket.off('audit:new_log', handleNewLog);
    };
  }, [pagination.page, pagination.limit, filters]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchLogs(1, filters);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchLogs(1, DEFAULT_FILTERS);
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
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-7 gap-4">
          <div className="space-y-1.5 xl:col-span-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Action Type</label>
            <div className="rounded-2xl border border-border/70 bg-muted/20 px-3 py-2.5 shadow-sm focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
              <SearchAutocomplete
                value={filters.actionType}
                onValueChange={(value) => setFilters(prev => ({ ...prev, actionType: value }))}
                suggestions={actionSuggestions}
                placeholder="e.g. user_ban"
                className="w-full"
                inputClassName="h-10 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
                leadingPaddingClassName="pl-11"
                groupLabels={{ actions: 'Actions' }}
              />
            </div>
            <p className="ml-1 text-[10px] text-muted-foreground">Type to filter actions from live logs.</p>
          </div>
          <div className="space-y-1.5 xl:col-span-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Entity Type</label>
            <div className="rounded-2xl border border-border/70 bg-muted/20 px-3 py-2.5 shadow-sm focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
              <SearchAutocomplete
                value={filters.entityType}
                onValueChange={(value) => setFilters(prev => ({ ...prev, entityType: value }))}
                suggestions={entitySuggestions}
                placeholder="e.g. user"
                className="w-full"
                inputClassName="h-10 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
                leadingPaddingClassName="pl-11"
                groupLabels={{ entities: 'Entities' }}
              />
            </div>
            <p className="ml-1 text-[10px] text-muted-foreground">Search entities like user, service, report, or category.</p>
          </div>
          <div className="space-y-1.5 xl:col-span-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Actor</label>
            <div className="rounded-2xl border border-border/70 bg-muted/20 px-3 py-2.5 shadow-sm focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
              <SearchAutocomplete
                value={filters.actorId}
                onValueChange={(value) => setFilters(prev => ({ ...prev, actorId: value }))}
                suggestions={actorSuggestions}
                placeholder="ID, name, or email"
                className="w-full"
                inputClassName="h-10 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
                leadingPaddingClassName="pl-11"
                groupLabels={{ actors: 'Actors' }}
              />
            </div>
            <p className="ml-1 text-[10px] text-muted-foreground">Search by actor ID, name, or email.</p>
          </div>
          <div className="space-y-1.5 flex flex-col xl:col-span-1">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Start Date</label>
            <div className="rounded-2xl border border-border/70 bg-muted/20 px-3 py-2.5 shadow-sm focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
              <Input 
                name="startDate"
                type="date" 
                className="h-10 w-full rounded-none bg-transparent border-0 px-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm font-medium" 
                value={filters.startDate}
                onChange={handleFilterChange}
              />
            </div>
            <p className="ml-1 text-[10px] text-muted-foreground">Show logs from this date onward.</p>
          </div>
          <div className="space-y-1.5 flex flex-col xl:col-span-1">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">End Date</label>
            <div className="rounded-2xl border border-border/70 bg-muted/20 px-3 py-2.5 shadow-sm focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
              <Input 
                name="endDate"
                type="date" 
                className="h-10 w-full rounded-none bg-transparent border-0 px-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm font-medium" 
                value={filters.endDate}
                onChange={handleFilterChange}
              />
            </div>
            <p className="ml-1 text-[10px] text-muted-foreground">Show logs up to this date.</p>
          </div>
          <div className="sm:col-span-2 xl:col-span-7 flex items-end gap-2">
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
        <div className="hidden xl:block overflow-x-auto">
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
        <div className="xl:hidden divide-y divide-border/40">
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
