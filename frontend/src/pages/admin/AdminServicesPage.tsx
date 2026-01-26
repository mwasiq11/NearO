import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Check, XCircle, Eye } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

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
          price: `$${Number(service.price || 0).toFixed(2)}`,
        }));
        setServices(mapped);
      } catch (err) {
        toast.error('Failed to load pending services');
      } finally {
        setIsLoading(false);
      }
    };

    loadServices();
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
      setServices(prev => prev.filter(s => s.id !== id));
      toast.success('Service approved');
    } catch (err) {
      toast.error('Failed to approve service');
    }
  };

  const rejectService = async (id: string) => {
    try {
      await api.put(`/admin/services/${id}/reject`, { reason: 'Rejected by admin' }, { auth: true });
      setServices(prev => prev.filter(s => s.id !== id));
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
        <CardContent className="overflow-x-auto">
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
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.title}</TableCell>
                  <TableCell>{s.provider}</TableCell>
                  <TableCell>{s.category}</TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusTone[s.status]}`}>
                      {s.status}
                    </span>
                  </TableCell>
                  <TableCell>{s.price}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="ghost" className="gap-1" disabled>
                      <Eye className="h-4 w-4" /> View
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => approveService(s.id)}>
                      <Check className="h-4 w-4" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" className="gap-1" onClick={() => rejectService(s.id)}>
                      <XCircle className="h-4 w-4" /> Reject
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {isLoading && (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading services...</div>
          )}
          {!isLoading && filtered.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">No services match your filters.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminServicesPage;
