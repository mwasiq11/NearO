import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Ban, CheckCircle, Shield, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { UserDetailModal } from '@/components/admin/AdminResourceModals';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'moderator' | 'admin';
  status: 'active' | 'suspended' | 'pending';
  createdAt: string;
}

const statusTone: Record<AdminUser['status'], string> = {
  active: 'bg-emerald-100 text-emerald-700',
  suspended: 'bg-red-100 text-red-700',
  pending: 'bg-amber-100 text-amber-700',
};

const AdminUsersPage = () => {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | AdminUser['status']>('all');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const refreshUsers = () => setRefreshKey(prev => prev + 1);

  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      try {
        const data = await api.get<{ users: any[] }>('/admin/users', { auth: true });
        const mapped = (data.users || []).map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          status: u.is_active ? 'active' : 'suspended',
          createdAt: u.created_at ? new Date(u.created_at).toLocaleDateString() : '—',
        }));
        setUsers(mapped);
      } catch (err) {
        toast.error('Failed to load users');
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, [refreshKey]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchesQuery = `${u.name} ${u.email}`.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = status === 'all' ? true : u.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [query, status, users]);

  const promoteToModerator = async (id: string) => {
    try {
      await api.put(`/admin/moderators/${id}/promote`, undefined, { auth: true });
      refreshUsers();
      toast.success('User promoted to moderator');
    } catch (err) {
      toast.error('Failed to promote user');
    }
  };

  const suspendUser = async (id: string) => {
    try {
      await api.put(`/admin/users/${id}/suspend`, { duration_hours: 24 }, { auth: true });
      refreshUsers();
      toast.success('User suspended');
    } catch (err) {
      toast.error('Failed to suspend user');
    }
  };

  const reinstateUser = async (id: string) => {
    try {
      await api.put(`/admin/users/${id}/unsuspend`, undefined, { auth: true });
      refreshUsers();
      toast.success('User reinstated');
    } catch (err) {
      toast.error('Failed to reinstate user');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User management</h2>
          <p className="text-muted-foreground">Search, filter, and moderate users.</p>
        </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refreshUsers}>
              Refresh
            </Button>
            <Button variant="outline" size="sm" disabled>
              Export
            </Button>
          </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg">Directory</CardTitle>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search name or email"
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'all' | AdminUser['status'])}
              className="h-10 rounded-md border bg-background px-3 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell className="capitalize flex items-center gap-2">
                       <Badge variant="outline" className="font-bold border-muted-foreground/30">{u.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${statusTone[u.status]}`}>
                        {u.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-medium">{u.createdAt}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="font-bold"
                        onClick={() => {
                          setSelectedUserId(u.id);
                          setIsModalOpen(true);
                        }}
                      >
                        View
                      </Button>
                      {u.status !== 'suspended' ? (
                        <Button size="sm" variant="destructive" className="gap-1 font-bold" onClick={() => suspendUser(u.id)}>
                          <Ban className="h-4 w-4" /> Suspend
                        </Button>
                      ) : (
                        <Button size="sm" variant="secondary" className="gap-1 font-bold" onClick={() => reinstateUser(u.id)}>
                          <CheckCircle className="h-4 w-4" /> Reinstate
                        </Button>
                      )}
                      {u.role === 'user' && (
                        <Button size="sm" variant="outline" className="gap-1 font-bold" onClick={() => promoteToModerator(u.id)}>
                          <Shield className="h-4 w-4" /> Promote
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y">
            {filtered.map((u) => (
              <div key={u.id} className="p-4 space-y-4 active:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-black text-base">{u.name}</h4>
                    <p className="text-sm text-muted-foreground">{u.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="font-black text-[10px] uppercase tracking-tight">{u.role}</Badge>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-tight ${statusTone[u.status]}`}>
                        {u.status}
                      </span>
                    </div>
                  </div>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => {
                      setSelectedUserId(u.id);
                      setIsModalOpen(true);
                    }}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-2 pt-2">
                  {u.status !== 'suspended' ? (
                    <Button size="sm" variant="destructive" className="flex-1 gap-1 text-xs font-bold rounded-xl h-10" onClick={() => suspendUser(u.id)}>
                      <Ban className="h-3.5 w-3.5" /> Suspend
                    </Button>
                  ) : (
                    <Button size="sm" variant="secondary" className="flex-1 gap-1 text-xs font-bold rounded-xl h-10" onClick={() => reinstateUser(u.id)}>
                      <CheckCircle className="h-3.5 w-3.5" /> Reinstate
                    </Button>
                  )}
                  {u.role === 'user' && (
                    <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs font-bold rounded-xl h-10" onClick={() => promoteToModerator(u.id)}>
                      <Shield className="h-3.5 w-3.5" /> Promote
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {isLoading && (
            <div className="py-12 text-center">
              <div className="h-6 w-6 border-2 border-primary border-t-transparent animate-spin rounded-full mx-auto mb-2" />
              <p className="text-sm text-muted-foreground font-medium">Updating directory...</p>
            </div>
          )}
          {!isLoading && filtered.length === 0 && (
            <div className="py-12 text-center space-y-2">
              <div className="text-4xl">👥</div>
              <p className="text-sm text-muted-foreground font-medium">No users found match your search.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <UserDetailModal 
        userId={selectedUserId}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedUserId(null);
        }}
      />
    </div>
  );
};

export default AdminUsersPage;
