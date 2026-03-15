import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CategoryCombobox } from '@/components/common/CategoryCombobox';
import { useListings } from '@/hooks/useListings';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Upload, X } from 'lucide-react';

const CreateServicePage = () => {
  const navigate = useNavigate();
  const { categories, createListing } = useListings();
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    image_url: '',
  });
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setIsUploadingImage(true);

    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('upload_context', 'service_image');

    try {
      const response = await api.post<{ imageUrl: string }>('/services/upload-image', uploadData, { auth: true });
      if (response.imageUrl) {
        setFormData(prev => ({ ...prev, image_url: response.imageUrl }));
        toast.success('Image uploaded successfully');
      }
    } catch (err) {
      toast.error('Failed to upload image');
      setPreviewUrl(null);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image_url: '' }));
    setPreviewUrl(null);
  };

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

    setIsSubmitting(true);

    try {
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
        image_url: formData.image_url || undefined,
      });

      if (created) {
        navigate('/dashboard/my-services');
      }
    } finally {
      setIsSubmitting(false);
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
            <div className="space-y-4 md:col-span-2">
              <Label className="text-lg font-semibold">Service Image (Optional)</Label>
              <div className="mt-2">
                {(previewUrl || formData.image_url) ? (
                  <div className="relative group w-full max-w-3xl aspect-video sm:h-80 rounded-xl overflow-hidden border shadow-sm transition-all hover:shadow-md">
                    <img 
                      src={previewUrl || formData.image_url} 
                      alt="Service preview" 
                      className={`h-full w-full object-cover transition-opacity duration-300 ${isUploadingImage ? 'opacity-50 blur-[2px]' : 'opacity-100'}`}
                    />
                    {isUploadingImage && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/30 backdrop-blur-sm">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-sm"></div>
                        <span className="mt-4 font-semibold text-lg drop-shadow-md">Uploading to server...</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                       <Button 
                         type="button" 
                         variant="destructive" 
                         size="lg"
                         onClick={removeImage}
                         className="flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"
                       >
                         <X className="h-5 w-5" /> Remove Image
                       </Button>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="image-upload"
                    className="relative flex flex-col items-center justify-center w-full max-w-3xl aspect-video sm:h-80 rounded-xl border-2 border-dashed border-input bg-muted/30 hover:bg-muted/60 hover:border-primary/50 transition-all cursor-pointer group"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                      <div className="p-5 bg-background rounded-full shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all duration-300 mb-5">
                        <Upload className="h-10 w-10 text-primary" />
                      </div>
                      <p className="mb-2 text-xl font-semibold text-foreground">
                        Click to upload an image
                      </p>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Showcase your service with a high-quality cover photo. Drag & drop or click. PNG, JPG, or GIF up to 10MB.
                      </p>
                    </div>
                    <input 
                      id="image-upload" 
                      name="image-upload" 
                      type="file" 
                      className="sr-only" 
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploadingImage || isSubmitting}
                    />
                  </label>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2">If no image is uploaded, we'll provide a beautiful default image based on the category.</p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">Title *</Label>
              <Input 
                id="title" 
                name="title" 
                value={formData.title} 
                onChange={handleChange}
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea 
                id="description" 
                name="description" 
                value={formData.description} 
                onChange={handleChange}
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <CategoryCombobox
                value={formData.category}
                onChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                categories={categories}
                placeholder="Select or type custom category"
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Choose from predefined categories or create your own
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price *</Label>
              <Input 
                id="price" 
                name="price" 
                type="number" 
                value={formData.price} 
                onChange={handleChange}
                disabled={isSubmitting}
                required
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priceType">Price type</Label>
              <select
                id="priceType"
                name="priceType"
                value={formData.priceType}
                onChange={(e) => setFormData(prev => ({ ...prev, priceType: e.target.value as 'fixed' | 'hourly' | 'negotiable' }))}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                disabled={isSubmitting}
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
              <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="hero" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create service'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateServicePage;

