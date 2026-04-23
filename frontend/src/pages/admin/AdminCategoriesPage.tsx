import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { toast } from 'sonner';

interface CategoryItem {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
}

interface CategoryApiItem {
  id: string;
  name: string;
  description?: string | null;
  is_active?: boolean;
}

interface CategoryAuditLog {
  entity_type?: string;
  action_type?: string;
}

const AdminCategoriesPage = () => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    const loadCategories = async () => {
      setIsLoading(true);
      try {
        const data = await api.get<{ categories: CategoryApiItem[] }>('/admin/categories', { auth: true });
        const mapped = (data.categories || []).map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          isActive: Boolean(c.is_active ?? true),
        }));
        setCategories(mapped);
      } catch (err) {
        toast.error('Failed to load categories');
      } finally {
        setIsLoading(false);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    const socket = getSocket();

    const refreshCategories = async () => {
      try {
        const data = await api.get<{ categories: CategoryApiItem[] }>('/admin/categories', { auth: true });
        const mapped = (data.categories || []).map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          isActive: Boolean(c.is_active ?? true),
        }));
        setCategories(mapped);
      } catch {
        // Keep current UI if refresh fails
      }
    };

    const handleAuditLog = (log: CategoryAuditLog) => {
      if (log?.entity_type !== 'category') return;
      const relevantActions = ['category_create', 'category_update', 'category_deactivate'];
      if (!relevantActions.includes(log?.action_type)) return;
      refreshCategories();
    };

    socket.on('audit:new_log', handleAuditLog);

    return () => {
      socket.off('audit:new_log', handleAuditLog);
    };
  }, []);

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }
    try {
      const created = await api.post<CategoryApiItem>('/admin/categories', {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
      }, { auth: true });
      setCategories(prev => [
        { id: created.id, name: created.name, description: created.description, isActive: true },
        ...prev,
      ]);
      setFormData({ name: '', description: '' });
      toast.success('Category created');
    } catch (err) {
      toast.error('Failed to create category');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/admin/categories/${id}`, undefined, { auth: true });
      setCategories(prev => prev.filter(c => c.id !== id));
      toast.success('Category deleted');
    } catch (err) {
      toast.error('Failed to delete category');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Categories</h2>
          <p className="text-muted-foreground">Organize service supply and discovery.</p>
        </div>
        <Button onClick={handleCreate}>Add category</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create category</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <Card key={c.id} className={c.isActive ? 'bg-muted/30' : 'bg-muted/10 opacity-70'}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="outline">{c.isActive ? 'Active' : 'Inactive'}</Badge>
              </div>
              <CardTitle className="text-lg">{c.name}</CardTitle>
              {c.description && <p className="text-sm text-muted-foreground">{c.description}</p>}
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <Button size="sm" variant="outline" disabled>
                Edit
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleDelete(c.id)}>
                Delete
              </Button>
            </CardContent>
          </Card>
        ))}
        {isLoading && (
          <div className="text-sm text-muted-foreground">Loading categories...</div>
        )}
        {!isLoading && categories.length === 0 && (
          <div className="text-sm text-muted-foreground">No categories found.</div>
        )}
      </div>
    </div>
  );
};

export default AdminCategoriesPage;
