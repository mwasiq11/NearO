import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const AdminSystemSettingsPage = () => {
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await api.get<{ settings: Array<{ setting_key: string; setting_value: string }> }>('/admin/system/config', { auth: true });
        const settings = data.settings || [];
        const mode = settings.find(s => s.setting_key === 'maintenance_mode')?.setting_value;
        const message = settings.find(s => s.setting_key === 'maintenance_message')?.setting_value;
        setMaintenanceEnabled(mode === 'true');
        setMaintenanceMessage(message || 'System is under maintenance. Please try again later.');
      } catch (err) {
        toast.error('Failed to load system settings');
      }
    };

    loadSettings();
  }, []);

  const saveMaintenance = async () => {
    setIsSaving(true);
    try {
      await api.put('/admin/system/maintenance', {
        enabled: maintenanceEnabled,
        message: maintenanceMessage,
      }, { auth: true });
      toast.success('Maintenance settings updated');
    } catch (err) {
      toast.error('Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System settings</h2>
          <p className="text-muted-foreground">Toggle maintenance and safety controls.</p>
        </div>
        <Button variant="outline" onClick={saveMaintenance} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save changes'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Platform availability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground font-medium">Maintenance mode</p>
                <p>Temporarily disable new actions for updates.</p>
              </div>
              <Switch checked={maintenanceEnabled} onCheckedChange={setMaintenanceEnabled} />
            </div>
            <div className="space-y-2">
              <p className="text-foreground font-medium">Maintenance message</p>
              <Input
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
                placeholder="System is under maintenance. Please try again later."
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground font-medium">Read-only mode</p>
                <p>Block writes while keeping browsing enabled.</p>
              </div>
              <Switch disabled />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground font-medium">Require 2FA</p>
                <p>Enforce two-factor authentication for staff.</p>
              </div>
              <Switch defaultChecked disabled />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground font-medium">Session timeout</p>
                <p>Sign out idle sessions after 30 minutes.</p>
              </div>
              <Switch defaultChecked disabled />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSystemSettingsPage;
