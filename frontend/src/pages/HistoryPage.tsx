import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { apiCall } from '@/lib/api';
import { ChevronLeft, Clock, User, FileText } from 'lucide-react';

interface AuditLog {
  id: string;
  actor_id: string;
  actor_name: string;
  actor_email: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  old_value: any;
  new_value: any;
  metadata: any;
  ip_address: string;
  created_at: string;
}

const ACTION_LABELS: { [key: string]: string } = {
  'user_login': 'User Login',
  'moderator_login': 'Moderator Login',
  'admin_login': 'Admin Login',
  'service_created': 'Service Created',
  'service_updated': 'Service Updated',
  'service_approved': 'Service Approved',
  'service_rejected': 'Service Rejected',
  'booking_created': 'Booking Created',
  'booking_status_changed': 'Booking Status Changed',
  'review_created': 'Review Created',
  'user_suspended': 'User Suspended',
  'user_warned': 'User Warned',
  'user_banned': 'User Banned',
  'role_changed': 'Role Changed'
};

export default function HistoryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [history, setHistory] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    loadHistory();
  }, [user, page]);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const response = await apiCall(`/history?page=${page}&limit=20`, {
        method: 'GET',
        auth: true
      });

      if (response.ok) {
        setHistory(response.data.history);
        setTotalPages(response.data.pagination.totalPages);
      } else {
        setError(response.data?.error || 'Failed to load history');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionBadgeColor = (actionType: string) => {
    if (actionType.includes('login')) return 'bg-blue-100 text-blue-800';
    if (actionType.includes('created')) return 'bg-green-100 text-green-800';
    if (actionType.includes('updated')) return 'bg-yellow-100 text-yellow-800';
    if (actionType.includes('approved')) return 'bg-emerald-100 text-emerald-800';
    if (actionType.includes('rejected')) return 'bg-red-100 text-red-800';
    if (actionType.includes('suspended') || actionType.includes('banned')) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-muted rounded text-muted-foreground"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold">Activity History</h1>
            <p className="text-muted-foreground mt-1">View your account activity and changes</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Role-based Info */}
        {user.role === 'user' && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-blue-900">
              You can view your personal activity history including logins, service creation, and bookings.
            </AlertDescription>
          </Alert>
        )}

        {user.role === 'moderator' && (
          <Alert className="bg-purple-50 border-purple-200">
            <AlertDescription className="text-purple-900">
              As a moderator, you can view service moderation history and user actions, but not admin-specific actions.
            </AlertDescription>
          </Alert>
        )}

        {user.role === 'admin' && (
          <Alert className="bg-red-50 border-red-200">
            <AlertDescription className="text-red-900">
              As an admin, you have full access to the complete activity history of the entire platform.
            </AlertDescription>
          </Alert>
        )}

        {/* History List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : history.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No history found</h3>
              <p className="text-muted-foreground mt-1">Your activities will appear here</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {history.map((log) => (
              <Card key={log.id} className="overflow-hidden">
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getActionBadgeColor(log.action_type)}`}>
                              {ACTION_LABELS[log.action_type] || log.action_type}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              on <span className="font-medium">{log.entity_type}</span>
                            </span>
                          </div>

                          {log.actor_name && (
                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {log.actor_name} ({log.actor_email})
                            </p>
                          )}

                          {log.metadata && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {JSON.stringify(log.metadata).substring(0, 100)}...
                            </p>
                          )}
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString()}
                          </p>
                          {log.ip_address && (
                            <p className="text-xs text-muted-foreground/50 mt-1">IP: {log.ip_address}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={page === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
