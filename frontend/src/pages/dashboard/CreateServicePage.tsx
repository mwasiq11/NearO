import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useListings } from '@/hooks/useListings';
import { toast } from 'sonner';

const CreateServicePage = () => {
  const navigate = useNavigate();
  const { categories, createListing, isLoading } = useListings();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    priceType: 'fixed' as 'fixed' | 'hourly' | 'negotiable',
    tags: '',
    neighborhood: '',
    city: '',
    latitude: '',
    longitude: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.category || !formData.price) {
      toast.error('Please fill all required fields');
      return;
    }

    const tags = formData.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const created = await createListing({
      title: formData.title,
      description: formData.description,
      category: formData.category,
      price: Number(formData.price),
      priceType: formData.priceType,
      images: [],
      tags,
      radius: 10,
      neighborhood: formData.neighborhood || undefined,
      city: formData.city || undefined,
      latitude: formData.latitude ? Number(formData.latitude) : undefined,
      longitude: formData.longitude ? Number(formData.longitude) : undefined,
    });

    if (created) {
      navigate('/dashboard/my-services');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Create service</h2>
        <p className="text-muted-foreground">Share your skills with the community.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Service details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" value={formData.title} onChange={handleChange} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" value={formData.description} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input id="price" name="price" type="number" value={formData.price} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priceType">Price type</Label>
              <select
                id="priceType"
                name="priceType"
                value={formData.priceType}
                onChange={(e) => setFormData(prev => ({ ...prev, priceType: e.target.value as 'fixed' | 'hourly' | 'negotiable' }))}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="fixed">Fixed</option>
                <option value="hourly">Hourly</option>
                <option value="negotiable">Negotiable</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input id="tags" name="tags" value={formData.tags} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="neighborhood">Neighborhood</Label>
              <Input id="neighborhood" name="neighborhood" value={formData.neighborhood} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" value={formData.city} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude (optional)</Label>
              <Input id="latitude" name="latitude" value={formData.latitude} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude (optional)</Label>
              <Input id="longitude" name="longitude" value={formData.longitude} onChange={handleChange} />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button type="submit" variant="hero" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create service'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateServicePage;

