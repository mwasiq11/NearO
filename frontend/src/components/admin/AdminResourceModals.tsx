import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Ban, 
  Clock, 
  FileText,
  MapPin,
  Tag,
  DollarSign
} from 'lucide-react';

interface UserDetailProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const UserDetailModal = ({ userId, isOpen, onClose }: UserDetailProps) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      loadUser();
    } else {
      setData(null);
    }
  }, [isOpen, userId]);

  const loadUser = async () => {
    setLoading(true);
    try {
      const resp = await api.get<any>(`/admin/users/${userId}`, { auth: true });
      setData(resp);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load user details');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Details
          </DialogTitle>
          <DialogDescription>
            Detailed profile and moderation history.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-20 text-center text-muted-foreground">Loading...</div>
        ) : data && (
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-6">
              {/* Profile Section */}
              <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                  {data.user.name.charAt(0)}
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold">{data.user.name}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {data.user.email}
                  </p>
                  <div className="flex gap-2 pt-1">
                    <Badge variant={data.user.is_active ? "emerald" : "destructive"}>
                      {data.user.is_active ? "Active" : "Suspended"}
                    </Badge>
                    <Badge variant="outline" className="capitalize">{data.user.role}</Badge>
                    {data.user.is_verified && <Badge variant="secondary" className="bg-blue-100 text-blue-700">Verified</Badge>}
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Joined</p>
                  <p className="text-sm flex items-center gap-2"><Calendar className="h-4 w-4" /> {new Date(data.user.created_at).toLocaleDateString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Last Login</p>
                  <p className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4" /> 
                    {data.user.last_login_at ? new Date(data.user.last_login_at).toLocaleString() : 'Never'}
                  </p>
                </div>
                {data.user.suspended_until && (
                  <div className="col-span-2 p-3 border border-red-200 bg-red-50 rounded-lg text-red-700 space-y-1">
                    <p className="text-xs font-bold uppercase flex items-center gap-1">
                      <Ban className="h-3 w-3" /> Suspension Details
                    </p>
                    <p className="text-sm">Until: {new Date(data.user.suspended_until).toLocaleString()}</p>
                    <p className="text-xs italic">"{data.user.suspension_reason}"</p>
                  </div>
                )}
              </div>

              {/* Warnings */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Warnings ({data.warnings?.length || 0})
                </h4>
                {data.warnings?.length > 0 ? (
                  <div className="space-y-2">
                    {data.warnings.map((w: any) => (
                      <div key={w.id} className="p-3 text-sm rounded-lg border bg-card">
                        <p className="font-medium">{w.reason}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Issued on {new Date(w.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No warnings issued to this user.</p>
                )}
              </div>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};

interface ServiceDetailProps {
  serviceId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ServiceDetailModal = ({ serviceId, isOpen, onClose }: ServiceDetailProps) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && serviceId) {
      loadService();
    } else {
      setData(null);
    }
  }, [isOpen, serviceId]);

  const loadService = async () => {
    setLoading(true);
    try {
      const resp = await api.get<any>(`/admin/services/${serviceId}`, { auth: true });
      setData(resp);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load service details');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Service Review
          </DialogTitle>
          <DialogDescription>
            Detailed look at the service listing and provider info.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-20 text-center text-muted-foreground">Loading...</div>
        ) : data && (
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-6">
              {/* Header Section */}
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <h3 className="text-2xl font-bold">{data.title}</h3>
                  <Badge variant={data.moderated_at ? "emerald" : "amber"}>
                    {data.moderated_at ? "Moderated" : "Pending Approval"}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Tag className="h-3 w-3" /> {data.category}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {data.city}, {data.neighborhood}</span>
                  <span className="flex items-center gap-1 font-bold text-primary">
                    {data.currency === 'USD' ? <DollarSign className="h-3 w-3" /> : <span className="text-[10px] font-black">{data.currency || 'PKR'}</span>} 
                    {Number(data.price || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Provider Info */}
              <div className="p-4 rounded-xl border bg-muted/30 space-y-2">
                <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Provider</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {data.provider_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="font-medium">{data.provider_name}</p>
                    <p className="text-xs text-muted-foreground">{data.provider_email}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="font-semibold px-1">Description</h4>
                <div className="p-4 rounded-xl border bg-card text-sm leading-relaxed whitespace-pre-wrap">
                  {data.description}
                </div>
              </div>

              {/* Availability Sample */}
              {data.availability && (
                <div className="space-y-2">
                  <h4 className="font-semibold px-1 text-sm">Availability</h4>
                  <p className="text-sm bg-muted/50 p-2 rounded-lg italic">
                    {typeof data.availability === 'string' ? data.availability : JSON.stringify(data.availability)}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};
