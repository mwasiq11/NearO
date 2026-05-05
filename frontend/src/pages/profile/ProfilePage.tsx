import { useEffect, useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateUser } from '@/store/slices/authSlice';
import { api, authStorage } from '@/lib/api';
import { toast } from 'sonner';
import { Camera, Loader2, MapPin, Mail, Phone, User, Search, Navigation } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Nominatim (OpenStreetMap) search — free, no API key needed        */
/* ------------------------------------------------------------------ */
interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
  };
}

async function searchPlaces(query: string): Promise<NominatimResult[]> {
  if (!query || query.length < 2) return [];
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&addressdetails=1`,
    { headers: { 'Accept-Language': 'en' } },
  );
  return res.json();
}

const ProfilePage = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    neighborhood: user?.neighborhood || '',
    city: user?.city || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Neighborhood autocomplete state
  const [neighborhoodQuery, setNeighborhoodQuery] = useState('');
  const [neighborhoodResults, setNeighborhoodResults] = useState<NominatimResult[]>([]);
  const [isSearchingNeighborhood, setIsSearchingNeighborhood] = useState(false);
  const [showNeighborhoodResults, setShowNeighborhoodResults] = useState(false);
  const neighborhoodSearchTimeout = useRef<any>(null);
  const neighborhoodResultsRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (neighborhoodResultsRef.current && !neighborhoodResultsRef.current.contains(e.target as Node)) {
        setShowNeighborhoodResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      try {
        const data = await api.get<any>('/users/me', { auth: true });
        const updated = {
          name: data.name ?? user.name,
          email: data.email ?? user.email,
          phone: data.phone ?? user.phone ?? '',
          neighborhood: data.neighborhood ?? user.neighborhood ?? '',
          city: data.city ?? user.city ?? '',
          avatar: data.profile_picture ?? user.avatar,
          isVerified: Boolean(data.is_verified ?? user.isVerified),
        };
        dispatch(updateUser(updated));
        authStorage.setUser({ ...user, ...updated });
        setFormData({
          name: updated.name,
          email: updated.email,
          phone: updated.phone,
          neighborhood: updated.neighborhood,
          city: updated.city,
        });
      } catch {
        // Keep existing profile if API fails
      }
    };

    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  // Debounced neighborhood search (400ms debounce)
  const handleNeighborhoodSearch = useCallback((value: string) => {
    setNeighborhoodQuery(value);
    setFormData(prev => ({ ...prev, neighborhood: value }));

    if (neighborhoodSearchTimeout.current) clearTimeout(neighborhoodSearchTimeout.current);

    if (value.length < 2) {
      setNeighborhoodResults([]);
      setShowNeighborhoodResults(false);
      return;
    }

    setIsSearchingNeighborhood(true);
    neighborhoodSearchTimeout.current = setTimeout(async () => {
      try {
        const results = await searchPlaces(value);
        setNeighborhoodResults(results);
        setShowNeighborhoodResults(results.length > 0);
      } catch {
        setNeighborhoodResults([]);
      } finally {
        setIsSearchingNeighborhood(false);
      }
    }, 400);
  }, []);

  // Select a neighborhood from the dropdown
  const selectNeighborhood = (result: NominatimResult) => {
    const placeName = result.display_name.split(',')[0].trim();
    const nbh =
      result.address?.neighbourhood ||
      result.address?.suburb ||
      placeName;
    const cty =
      result.address?.city ||
      result.address?.town ||
      result.address?.village ||
      result.address?.state ||
      '';

    setFormData(prev => ({
      ...prev,
      neighborhood: nbh,
      city: cty || prev.city,
    }));
    setNeighborhoodQuery(nbh);
    setShowNeighborhoodResults(false);
    toast.success(`📍 Location set: ${nbh}${cty ? ', ' + cty : ''}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.put('/users/me', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        neighborhood: formData.neighborhood || null,
        city: formData.city || null,
      }, { auth: true });

      const updated = { ...user, ...formData };
      dispatch(updateUser(updated));
      authStorage.setUser(updated);
      toast.success('Profile updated successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    try {
      await api.put('/users/me', {
        password: passwordData.newPassword,
      }, { auth: true });

      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password updated successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update password';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_context', 'profile_picture');

      const response = await api.post<{ profile_picture: string }>('/users/me/profile-picture', formData, { auth: true });

      console.log('📸 Upload response:', response);
      
      // Force update with new profile picture URL
      const updated = { ...user!, avatar: response.profile_picture };
      console.log('📸 Updated user object:', updated);
      
      dispatch(updateUser({ avatar: response.profile_picture }));
      authStorage.setUser(updated);
      
      toast.success('Profile picture updated');
      
      // Reload the page to ensure the image displays
      window.location.reload();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload image';
      toast.error(message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 pb-20">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Account Settings</h2>
        <p className="text-muted-foreground mt-2">Manage your profile information and security preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Overview Profile Card */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="overflow-hidden border-zinc-200/60 dark:border-zinc-800/80 shadow-md transition-all">
            <div className="h-32 bg-gradient-to-tr from-primary/30 via-primary/10 to-primary/5 dark:from-primary/20 dark:to-zinc-900 w-full" />
            <CardContent className="px-6 pb-6 pt-0 flex flex-col items-center text-center relative">
              <div className="relative -mt-16 mb-4 group rounded-full ring-4 ring-background shadow-lg">
                <Avatar key={user?.avatar || 'default'} className="h-32 w-32 object-cover">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-4xl font-semibold">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                {isUploadingImage && (
                  <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm transition-all z-10">
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                  </div>
                )}
                <button
                  onClick={handleImageClick}
                  disabled={isUploadingImage}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-full flex items-center justify-center transition-all z-10 cursor-pointer"
                >
                  <Camera className="h-8 w-8 text-white" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
              
              <h3 className="text-2xl font-bold mb-1 tracking-tight">{user?.name}</h3>
              <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-2">
                {user?.role || 'User'}
              </p>
              <p className="text-sm text-muted-foreground mb-6 flex items-center justify-center gap-2">
                <Mail className="h-4 w-4" />
                {user?.email}
              </p>

              <Separator className="mb-6 w-full" />
              
              <Button 
                onClick={handleImageClick} 
                variant="outline" 
                className="w-full h-11 w-full rounded-xl transition-all shadow-sm group font-medium" 
                disabled={isUploadingImage}
              >
                {isUploadingImage ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...</>
                ) : (
                  <><Camera className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" /> Change Avatar</>
                )}
              </Button>
              <p className="text-[11px] text-muted-foreground mt-3 font-medium">JPEG, PNG or GIF. Max 5MB.</p>
            </CardContent>
          </Card>

          {/* Location Priority Info Card */}
          <Card className="border-zinc-200/60 dark:border-zinc-800/80 shadow-sm">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Navigation className="h-4 w-4" />
                Service Discovery Priority
              </div>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span className="shrink-0 font-bold text-primary bg-primary/10 rounded-full w-5 h-5 flex items-center justify-center text-[10px]">1</span>
                  <span><strong className="text-foreground">GPS / Live Location</strong> — Shows services within 25km of your real-time position. Updates dynamically as you move.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="shrink-0 font-bold text-primary bg-primary/10 rounded-full w-5 h-5 flex items-center justify-center text-[10px]">2</span>
                  <span><strong className="text-foreground">Neighborhood</strong> — If GPS is off, shows services matching your saved neighborhood + city.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="shrink-0 font-bold text-primary bg-primary/10 rounded-full w-5 h-5 flex items-center justify-center text-[10px]">3</span>
                  <span><strong className="text-foreground">City</strong> — If no neighborhood is set, shows all services in your saved city.</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Information & Security */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Personal Information */}
          <Card className="border-zinc-200/60 dark:border-zinc-800/80 shadow-md">
            <CardHeader className="pb-6 border-b border-zinc-100 dark:border-zinc-800/40 bg-zinc-50/50 dark:bg-zinc-900/50 px-6 py-5">
              <CardTitle className="text-xl flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Personal Information
              </CardTitle>
              <CardDescription className="text-[13px]">Update your public-facing details and contact coordinates.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2.5">
                    <Label htmlFor="name" className="text-[13px] font-semibold text-zinc-600 dark:text-zinc-300">
                      Full Name
                    </Label>
                    <Input 
                      id="name" 
                      name="name" 
                      value={formData.name} 
                      onChange={handleChange}
                      placeholder="e.g. John Doe"
                      className="h-11 rounded-lg bg-zinc-50 dark:bg-[#1a2328] focus-visible:ring-primary shadow-inner-sm transition-all"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="email" className="text-[13px] font-semibold text-zinc-600 dark:text-zinc-300">
                      Email Address
                    </Label>
                    <Input 
                      id="email" 
                      name="email" 
                      type="email" 
                      value={formData.email} 
                      onChange={handleChange}
                      placeholder="john@example.com"
                      className="h-11 rounded-lg bg-zinc-50 dark:bg-[#1a2328] focus-visible:ring-primary shadow-inner-sm transition-all"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="phone" className="text-[13px] font-semibold text-zinc-600 dark:text-zinc-300">
                      Phone Number
                    </Label>
                    <Input 
                      id="phone" 
                      name="phone" 
                      value={formData.phone} 
                      onChange={handleChange}
                      placeholder="+1 (555) 000-0000"
                      className="h-11 rounded-lg bg-zinc-50 dark:bg-[#1a2328] focus-visible:ring-primary shadow-inner-sm transition-all"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="city" className="text-[13px] font-semibold text-zinc-600 dark:text-zinc-300">
                      City
                    </Label>
                    <Input 
                      id="city" 
                      name="city" 
                      value={formData.city} 
                      onChange={handleChange}
                      placeholder="Enter city"
                      className="h-11 rounded-lg bg-zinc-50 dark:bg-[#1a2328] focus-visible:ring-primary shadow-inner-sm transition-all"
                    />
                  </div>

                  {/* Neighborhood with Autocomplete */}
                  <div className="space-y-2.5 md:col-span-2" ref={neighborhoodResultsRef}>
                    <Label htmlFor="neighborhood" className="text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      Local Neighborhood
                      <span className="text-[10px] font-normal text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded-full ml-1">Higher Priority</span>
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                      {isSearchingNeighborhood && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground z-10" />
                      )}
                      <input
                        id="neighborhood"
                        type="text"
                        value={formData.neighborhood}
                        onChange={(e) => handleNeighborhoodSearch(e.target.value)}
                        onFocus={() => neighborhoodResults.length > 0 && setShowNeighborhoodResults(true)}
                        placeholder="Search neighborhood (e.g. DHA Phase 5, Gulshan-e-Iqbal)…"
                        className="h-11 w-full rounded-lg border bg-zinc-50 dark:bg-[#1a2328] pl-10 pr-10 text-sm
                                   focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                      />

                      {/* Autocomplete dropdown */}
                      {showNeighborhoodResults && neighborhoodResults.length > 0 && (
                        <div className="absolute z-[1000] w-full mt-1 bg-background border rounded-lg shadow-xl max-h-64 overflow-y-auto">
                          {neighborhoodResults.map((r, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => selectNeighborhood(r)}
                              className="w-full text-left px-4 py-3 hover:bg-muted/60 transition-colors flex items-start gap-3 border-b last:border-b-0"
                            >
                              <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {r.display_name.split(',')[0]}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {r.display_name.split(',').slice(1, 4).join(',')}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-primary/60" />
                      Setting your neighborhood helps us show nearby services when GPS is unavailable.
                    </p>
                  </div>
                </div>
                <Separator className="my-6" />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Changes applied to your profile will be synchronized worldwide instantly.</p>
                  <Button type="submit" className="h-11 px-8 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-md font-medium tracking-wide transition-all active:scale-95" disabled={isLoading}>
                    {isLoading ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Security & Password */}
          <Card className="border-zinc-200/60 dark:border-zinc-800/80 shadow-md">
            <CardHeader className="pb-6 border-b border-zinc-100 dark:border-zinc-800/40 bg-zinc-50/50 dark:bg-zinc-900/50 px-6 py-5">
              <CardTitle className="text-xl text-red-600 dark:text-red-500">Security Parameters</CardTitle>
              <CardDescription className="text-[13px]">Manage sensitive authentication rules and update your credentials securely.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2.5 md:col-span-2">
                    <Label htmlFor="currentPassword" className="text-[13px] font-semibold">Current Password</Label>
                    <Input 
                      id="currentPassword" 
                      name="currentPassword" 
                      type="password"
                      value={passwordData.currentPassword} 
                      onChange={handlePasswordChange}
                      placeholder="Enter verification password"
                      className="h-11 rounded-lg focus-visible:ring-red-500 shadow-inner-sm"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="newPassword" className="text-[13px] font-semibold">New Password</Label>
                    <Input 
                      id="newPassword" 
                      name="newPassword" 
                      type="password"
                      value={passwordData.newPassword} 
                      onChange={handlePasswordChange}
                      placeholder="Strong password required"
                      className="h-11 rounded-lg focus-visible:ring-red-500 shadow-inner-sm"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="confirmPassword" className="text-[13px] font-semibold">Confirm Password</Label>
                    <Input 
                      id="confirmPassword" 
                      name="confirmPassword" 
                      type="password"
                      value={passwordData.confirmPassword} 
                      onChange={handlePasswordChange}
                      placeholder="Must match new password"
                      className="h-11 rounded-lg focus-visible:ring-red-500 shadow-inner-sm"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="submit" variant="destructive" className="h-11 px-6 rounded-xl font-medium shadow-sm active:scale-95 transition-all" disabled={isLoading}>
                    {isLoading ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Authorizing...</>
                    ) : (
                      'Update Identity'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
