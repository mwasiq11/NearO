import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CategoryCombobox } from '@/components/common/CategoryCombobox';
import { CurrencySelector } from '@/components/common/CurrencySelector';
import { useListings } from '@/hooks/useListings';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { getCategoryImageAsync } from '@/utils/categoryImages';
import { MapPin, Navigation, Upload, X, Search, Map as MapIcon, Loader2 } from 'lucide-react';

import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon (webpack/vite strips the default assets)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

/* ------------------------------------------------------------------ */
/*  Reverse-geocode using Google Geocoding REST API                   */
/* ------------------------------------------------------------------ */
async function reverseGeocode(lat: number, lng: number) {
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`,
    );
    const json = await res.json();
    let neighborhood = '';
    let city = '';

    if (json.status === 'OK' && json.results?.[0]) {
      for (const c of json.results[0].address_components ?? []) {
        if (
          !neighborhood &&
          (c.types.includes('neighborhood') ||
            c.types.includes('sublocality') ||
            c.types.includes('sublocality_level_1'))
        )
          neighborhood = c.long_name;
        if (!city && c.types.includes('locality')) city = c.long_name;
      }
      if (!neighborhood) {
        for (const c of json.results[0].address_components ?? []) {
          if (c.types.includes('administrative_area_level_2')) {
            neighborhood = c.long_name;
            break;
          }
        }
      }
    }
    return { neighborhood, city };
  } catch {
    return { neighborhood: '', city: '' };
  }
}

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

/* ------------------------------------------------------------------ */
/*  MapClickHandler — react-leaflet component to handle click events  */
/* ------------------------------------------------------------------ */
function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/* Pan helper — pans the map when position changes */
function MapPanner({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);
  return null;
}

/* ================================================================== */
/*  LocationPicker — self-contained location section                  */
/* ================================================================== */
interface LocationPickerProps {
  lat: number;
  lng: number;
  neighborhood: string;
  city: string;
  onLocationChange: (data: {
    lat: number;
    lng: number;
    neighborhood: string;
    city: string;
  }) => void;
}

function LocationPicker({
  lat,
  lng,
  neighborhood,
  city,
  onLocationChange,
}: LocationPickerProps) {
  const [showMap, setShowMap] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeout = useRef<any>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced search
  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (value.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const results = await searchPlaces(value);
        setSearchResults(results);
        setShowResults(results.length > 0);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  };

  // Select a search result
  const selectResult = async (result: NominatimResult) => {
    const newLat = parseFloat(result.lat);
    const newLng = parseFloat(result.lon);
    setShowResults(false);
    setSearchQuery(result.display_name.split(',').slice(0, 2).join(','));

    // Try Google reverse geocode for better neighborhood names
    const geo = await reverseGeocode(newLat, newLng);

    // Fallback chain: Google > Nominatim address > first part of display_name
    const placeName = result.display_name.split(',')[0].trim();
    const nbh =
      geo.neighborhood ||
      result.address?.neighbourhood ||
      result.address?.suburb ||
      result.address?.county ||
      placeName;
    const cty =
      geo.city ||
      result.address?.city ||
      result.address?.town ||
      result.address?.village ||
      result.address?.state ||
      '';

    onLocationChange({
      lat: newLat,
      lng: newLng,
      neighborhood: nbh,
      city: cty,
    });

    toast.success(`📍 Location set: ${nbh}${cty ? ', ' + cty : ''}`);
  };

  // Map click handler
  const handleMapClick = useCallback(
    async (clickLat: number, clickLng: number) => {
      const geo = await reverseGeocode(clickLat, clickLng);
      onLocationChange({
        lat: clickLat,
        lng: clickLng,
        neighborhood: geo.neighborhood || neighborhood,
        city: geo.city || city,
      });
    },
    [onLocationChange, neighborhood, city],
  );

  // Fallback: IP-based approximate location (tries multiple services)
  const detectLocationViaIP = useCallback(async () => {
    const ipServices = [
      {
        url: 'https://ipwho.is/',
        extract: (d: any) => d.success !== false ? { lat: d.latitude, lng: d.longitude, city: d.city } : null,
      },
      {
        url: 'https://ipapi.co/json/',
        extract: (d: any) => d.latitude ? { lat: parseFloat(d.latitude), lng: parseFloat(d.longitude), city: d.city } : null,
      },
      {
        url: 'https://get.geojs.io/v1/ip/geo.json',
        extract: (d: any) => d.latitude ? { lat: parseFloat(d.latitude), lng: parseFloat(d.longitude), city: d.city } : null,
      },
    ];

    for (const svc of ipServices) {
      try {
        const res = await fetch(svc.url);
        const data = await res.json();
        const loc = svc.extract(data);
        if (loc && loc.lat && loc.lng) {
          const geo = await reverseGeocode(loc.lat, loc.lng);
          onLocationChange({
            lat: loc.lat,
            lng: loc.lng,
            neighborhood: geo.neighborhood || neighborhood,
            city: geo.city || loc.city || city,
          });
          setShowMap(true);
          toast.success(
            `📍 Approximate location: ${geo.neighborhood || geo.city || loc.city || 'Detected'}`,
          );
          setIsDetecting(false);
          return; // success — stop trying
        }
      } catch {
        // try next service
      }
    }

    // All IP services failed — use a sensible default and let user adjust on map
    toast.info('Could not auto-detect — opening map at default location. Please adjust the pin.');
    setShowMap(true);
    setIsDetecting(false);
  }, [onLocationChange, neighborhood, city]);

  // GPS live location (with IP fallback)
  const detectLocation = useCallback(() => {
    setIsDetecting(true);

    if (!navigator.geolocation) {
      toast.info('GPS not available, using approximate location…');
      detectLocationViaIP();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const geo = await reverseGeocode(latitude, longitude);
        onLocationChange({
          lat: latitude,
          lng: longitude,
          neighborhood: geo.neighborhood || neighborhood,
          city: geo.city || city,
        });
        setShowMap(true);
        toast.success(
          `📍 Live location: ${geo.neighborhood || geo.city || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`}`,
        );
        setIsDetecting(false);
      },
      () => {
        // GPS denied or failed → fall back to IP-based location
        toast.info('GPS denied — detecting approximate location via network…');
        detectLocationViaIP();
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [onLocationChange, neighborhood, city, detectLocationViaIP]);

  return (
    <div className="space-y-4 md:col-span-2 p-5 bg-muted/30 rounded-xl border">
      {/* Header + buttons */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Label className="text-lg font-semibold flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" /> Location Details
        </Label>
        <div className="flex gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={detectLocation}
            disabled={isDetecting}
            className="gap-2"
          >
            {isDetecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
            {isDetecting ? 'Detecting…' : '📍 Use Live Location'}
          </Button>
          <Button
            type="button"
            variant={showMap ? 'secondary' : 'default'}
            size="sm"
            onClick={() => setShowMap((v) => !v)}
            className="gap-2"
          >
            <MapIcon className="h-4 w-4" />
            {showMap ? 'Hide Map' : '🗺️ Pick from Map'}
          </Button>
        </div>
      </div>

      {/* Map + Search section */}
      {showMap && (
        <div className="space-y-3">
          {/* Search box */}
          <div className="relative" ref={resultsRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground z-10" />
              )}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
                placeholder="Search places (e.g. DHA Phase 5, Karachi)…"
                className="h-10 w-full rounded-md border bg-background pl-10 pr-10 text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>

            {/* Search results dropdown */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute z-[1000] w-full mt-1 bg-background border rounded-lg shadow-xl max-h-64 overflow-y-auto">
                {searchResults.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selectResult(r)}
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

          {/* Leaflet Map */}
          <div className="rounded-lg border overflow-hidden" style={{ height: 340 }}>
            <MapContainer
              center={[lat, lng]}
              zoom={14}
              style={{ height: '100%', width: '100%' }}
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker
                position={[lat, lng]}
                draggable
                eventHandlers={{
                  dragend: (e) => {
                    const marker = e.target;
                    const pos = marker.getLatLng();
                    handleMapClick(pos.lat, pos.lng);
                  },
                }}
              />
              <MapClickHandler onMapClick={handleMapClick} />
              <MapPanner lat={lat} lng={lng} />
            </MapContainer>
          </div>

          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            Click on the map, drag the marker, or search above to set your service location.
          </p>
        </div>
      )}

      {/* Neighborhood / City / Coords */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="loc-neighborhood">Neighborhood *</Label>
          <div className="relative">
            <Input
              id="loc-neighborhood"
              value={neighborhood}
              onChange={(e) =>
                onLocationChange({
                  lat,
                  lng,
                  neighborhood: e.target.value,
                  city,
                })
              }
              placeholder="e.g. DHA Phase 5 — auto-filled from map"
              required
              className={neighborhood ? 'border-green-400 bg-green-50/50 pr-9' : ''}
            />
            {neighborhood && (
              <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-600" />
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="loc-city">City *</Label>
          <div className="relative">
            <Input
              id="loc-city"
              value={city}
              onChange={(e) =>
                onLocationChange({
                  lat,
                  lng,
                  neighborhood,
                  city: e.target.value,
                })
              }
              placeholder="e.g. Karachi — auto-filled from map"
              required
              className={city ? 'border-green-400 bg-green-50/50 pr-9' : ''}
            />
            {city && (
              <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-600" />
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Latitude</Label>
          <Input value={lat ? lat.toString() : ''} readOnly className="bg-muted" />
        </div>
        <div className="space-y-2">
          <Label>Longitude</Label>
          <Input value={lng ? lng.toString() : ''} readOnly className="bg-muted" />
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-1">
        📍 Accurate location helps seekers find your service within 25 km. Use{' '}
        <strong>Pick from Map</strong> to search or pin your service area.
      </p>
    </div>
  );
}

/* ================================================================== */
/*  CreateServicePage                                                  */
/* ================================================================== */
const CreateServicePage = () => {
  const navigate = useNavigate();
  const { categories, createListing } = useListings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    quantity: '1',
    currency: 'PKR',
    priceType: 'fixed' as 'fixed' | 'hourly' | 'negotiable',
    tags: '',
    neighborhood: '',
    city: '',
    latitude: 0,
    longitude: 0,
    image_url: '',
  });
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleLocationChange = useCallback(
    (data: { lat: number; lng: number; neighborhood: string; city: string }) => {
      setFormData((p) => ({
        ...p,
        latitude: data.lat,
        longitude: data.lng,
        neighborhood: data.neighborhood || p.neighborhood,
        city: data.city || p.city,
      }));
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setIsUploadingImage(true);
    const fd = new FormData();
    fd.append('upload_context', 'service_image');
    fd.append('file', file);
    try {
      const res = await api.post<{ imageUrl: string }>('/services/upload-image', fd, { auth: true });
      if (res.imageUrl) {
        setFormData((p) => ({ ...p, image_url: res.imageUrl }));
        toast.success('Image uploaded successfully');
      }
    } catch {
      toast.error('Failed to upload image');
      setPreviewUrl(null);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const removeImage = () => {
    setFormData((p) => ({ ...p, image_url: '' }));
    setPreviewUrl(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.category || !formData.price) {
      toast.error('Please fill all required fields');
      return;
    }
    setIsSubmitting(true);
    try {
      const tags = formData.tags.split(',').map((t) => t.trim()).filter(Boolean);
      let finalImageUrl = formData.image_url;
      if (!finalImageUrl) {
        try { finalImageUrl = await getCategoryImageAsync(formData.category); } catch {}
      }
      const created = await createListing({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        price: Number(formData.price),
        quantity: Number(formData.quantity || 0),
        currency: formData.currency,
        priceType: formData.priceType,
        images: [],
        tags,
        radius: 10,
        neighborhood: formData.neighborhood || undefined,
        city: formData.city || undefined,
        latitude: formData.latitude || undefined,
        longitude: formData.longitude || undefined,
        image_url: finalImageUrl || undefined,
      });
      if (created) navigate('/dashboard/my-services');
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
        <CardHeader><CardTitle>Service details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            {/* Image */}
            <div className="space-y-4 md:col-span-2">
              <Label className="text-lg font-semibold">Service Image (Optional)</Label>
              <div className="mt-2">
                {previewUrl || formData.image_url ? (
                  <div className="relative group w-full max-w-3xl aspect-video sm:h-80 rounded-xl overflow-hidden border shadow-sm hover:shadow-md transition-all">
                    <img src={previewUrl || formData.image_url} alt="Preview" className={`h-full w-full object-cover transition-opacity ${isUploadingImage ? 'opacity-50 blur-[2px]' : ''}`} />
                    {isUploadingImage && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/30 backdrop-blur-sm">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <span className="mt-4 font-semibold text-lg">Uploading…</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button type="button" variant="destructive" size="lg" onClick={removeImage} className="gap-2">
                        <X className="h-5 w-5" /> Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <label htmlFor="image-upload" className="relative flex flex-col items-center justify-center w-full max-w-3xl aspect-video sm:h-80 rounded-xl border-2 border-dashed border-input bg-muted/30 hover:bg-muted/60 hover:border-primary/50 transition-all cursor-pointer group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                      <div className="p-5 bg-background rounded-full shadow-sm group-hover:scale-110 transition-all mb-5">
                        <Upload className="h-10 w-10 text-primary" />
                      </div>
                      <p className="mb-2 text-xl font-semibold">Click to upload an image</p>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">PNG, JPG, or GIF up to 10 MB.</p>
                    </div>
                    <input id="image-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageUpload} disabled={isUploadingImage || isSubmitting} />
                  </label>
                )}
              </div>
            </div>

            {/* Fields */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" name="title" value={formData.title} onChange={handleChange} disabled={isSubmitting} required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea id="description" name="description" value={formData.description} onChange={handleChange} disabled={isSubmitting} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <CategoryCombobox value={formData.category} onChange={(v) => setFormData((p) => ({ ...p, category: v }))} categories={categories} placeholder="Select or type custom category" disabled={isSubmitting} />
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="price">Price *</Label>
              <div className="flex gap-2">
                <CurrencySelector
                  value={formData.currency}
                  onChange={(val) => setFormData(p => ({ ...p, currency: val }))}
                  disabled={isSubmitting}
                />
                <Input 
                  id="price" 
                  name="price" 
                  type="number" 
                  placeholder="e.g. 500"
                  value={formData.price} 
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                  min="0"
                  step="0.01"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                placeholder="e.g. 10"
                value={formData.quantity}
                onChange={handleChange}
                disabled={isSubmitting}
                required
                min="0"
                step="1"
              />
              <p className="text-xs text-muted-foreground">Remaining stock is tracked in real time from bookings.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priceType">Price type</Label>
              <select id="priceType" name="priceType" value={formData.priceType} onChange={(e) => setFormData((p) => ({ ...p, priceType: e.target.value as any }))} className="h-10 w-full rounded-md border bg-background px-3 text-sm" disabled={isSubmitting}>
                <option value="fixed">Fixed</option>
                <option value="hourly">Hourly</option>
                <option value="negotiable">Negotiable</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input id="tags" name="tags" value={formData.tags} onChange={handleChange} />
            </div>

            {/* Location picker */}
            <LocationPicker
              lat={formData.latitude}
              lng={formData.longitude}
              neighborhood={formData.neighborhood}
              city={formData.city}
              onLocationChange={handleLocationChange}
            />

            {/* Submit */}
            <div className="md:col-span-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={isSubmitting || isUploadingImage}>Cancel</Button>
              <Button type="submit" variant="hero" disabled={isSubmitting || isUploadingImage}>
                {isSubmitting ? 'Creating…' : isUploadingImage ? 'Uploading…' : 'Create service'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateServicePage;
