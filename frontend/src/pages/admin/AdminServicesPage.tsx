import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Check, XCircle, Eye } from 'lucide-react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { toast } from 'sonner';
import { ServiceDetailModal } from '@/components/admin/AdminResourceModals';

interface ServiceRow {
  id: string;
  title: string;
  provider: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  price: string;
}

const statusTone: Record<ServiceRow['status'], string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  flagged: 'bg-rose-100 text-rose-700',
};

const AdminServicesPage = () => {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | ServiceRow['status']>('all');
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const refreshServices = () => setRefreshKey(prev => prev + 1);

  useEffect(() => {
    const loadServices = async () => {
      setIsLoading(true);
      try {
        const data = await api.get<{ services: any[] }>('/admin/services/pending', { auth: true });
        const mapped = (data.services || []).map((service) => ({
          id: service.id,
          title: service.title,
          provider: service.provider_name || service.provider_email || service.provider_id,
          category: service.category,
          status: 'pending' as const,
          price: `${service.currency || 'PKR'} ${Number(service.price || 0).toFixed(2)}`,
        }));
        setServices(mapped);
      } catch (err) {
        toast.error('Failed to load pending services');
      } finally {
        setIsLoading(false);
      }
    };

    loadServices();
  }, [refreshKey]);

  useEffect(() => {
    const socket = getSocket();

    const handleRefresh = () => refreshServices();
    const handleAuditLog = (log: any) => {
      if (log?.entity_type !== 'service') return;
      const relevantActions = ['service_update_any', 'service_delete_any', 'service_approve', 'service_reject'];
      if (!relevantActions.includes(log?.action_type)) return;
      refreshServices();
    };

    const events = ['service:new', 'service:approved', 'service:rejected'];
    events.forEach((eventName) => socket.on(eventName, handleRefresh));
    socket.on('audit:new_log', handleAuditLog);

    return () => {
      events.forEach((eventName) => socket.off(eventName, handleRefresh));
      socket.off('audit:new_log', handleAuditLog);
    };
  }, []);

  const filtered = useMemo(() => {
    return services.filter((s) => {
      const matchesQuery = `${s.title} ${s.provider} ${s.category}`.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = status === 'all' ? true : s.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [query, status, services]);

  const approveService = async (id: string) => {
    try {
      await api.put(`/admin/services/${id}/approve`, undefined, { auth: true });
      refreshServices();
      toast.success('Service approved');
    } catch (err) {
      toast.error('Failed to approve service');
    }
  };

  const rejectService = async (id: string) => {
    try {
      await api.put(`/admin/services/${id}/reject`, { reason: 'Rejected by admin' }, { auth: true });
      refreshServices();
      toast.success('Service rejected');
    } catch (err) {
      toast.error('Failed to reject service');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Service moderation</h2>
          <p className="text-muted-foreground">Approve, reject, and review flagged services.</p>
        </div>
        <Button variant="outline" size="sm" disabled>
          Bulk actions
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg">Services</CardTitle>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search services"
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'all' | ServiceRow['status'])}
              className="h-10 rounded-md border bg-background px-3 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="flagged">Flagged</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id} className="hover:bg-muted/30">
                    <TableCell className="font-bold">{s.title}</TableCell>
                    <TableCell className="text-muted-foreground font-medium">{s.provider}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-bold border-muted-foreground/20">{s.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-tight ${statusTone[s.status]}`}>
                        {s.status}
                      </span>
                    </TableCell>
                    <TableCell className="font-black text-primary">{s.price}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="gap-1 h-9 rounded-xl font-bold"
                        onClick={() => {
                          setSelectedServiceId(s.id);
                          setIsModalOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" /> View
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1 h-9 rounded-xl font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-100" onClick={() => approveService(s.id)}>
                        <Check className="h-4 w-4" /> Approve
                      </Button>
                      <Button size="sm" variant="ghost" className="gap-1 h-9 rounded-xl font-bold text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => rejectService(s.id)}>
                        <XCircle className="h-4 w-4" /> Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-border/40">
            {filtered.map((s) => (
              <div key={s.id} className="p-4 space-y-4 active:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="font-semibold text-base leading-tight">{s.title}</h4>
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-tight">by {s.provider}</p>
                    <div className="flex items-center gap-2 mt-2">
                       <Badge variant="outline" className="font-semibold text-[9px] uppercase">{s.category}</Badge>
                       <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-tight ${statusTone[s.status]}`}>
                        {s.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-primary tracking-tighter">{s.price}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 pt-1">
                    <Button 
                      size="sm" 
                      variant="hero" 
                      className="flex-1 h-11 rounded-2xl font-semibold text-xs shadow-lg shadow-primary/10"
                      onClick={() => approveService(s.id)}
                    >
                      <Check className="h-4 w-4 mr-1.5" /> Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 h-11 rounded-2xl font-black text-xs"
                      onClick={() => rejectService(s.id)}
                    >
                      <XCircle className="h-4 w-4 mr-1.5" /> Reject
                    </Button>
                    <Button 
                      size="icon" 
                      variant="secondary" 
                      className="h-11 w-11 rounded-2xl"
                      onClick={() => {
                        setSelectedServiceId(s.id);
                        setIsModalOpen(true);
                      }}
                    >
                      <Eye className="h-5 w-5" />
                    </Button>
                </div>
              </div>
            ))}
          </div>

          {isLoading && (
            <div className="py-12 text-center">
              <div className="h-6 w-6 border-2 border-primary border-t-transparent animate-spin rounded-full mx-auto mb-2" />
              <p className="text-sm text-muted-foreground font-medium">Scanning directory...</p>
            </div>
          )}
          {!isLoading && filtered.length === 0 && (
            <div className="py-12 text-center text-muted-foreground font-medium italic">
              No services require moderation at this time.
            </div>
          )}
        </CardContent>
      </Card>

      <ServiceDetailModal 
        serviceId={selectedServiceId}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedServiceId(null);
        }}
      />
    </div>
  );
};

export default AdminServicesPage;
