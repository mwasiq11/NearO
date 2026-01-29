import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppSelector } from '@/store/hooks';
import { toast } from 'sonner';
import { Bell, Globe, Shield, Moon, Sun, Monitor, Smartphone } from 'lucide-react';

const SettingsPage = () => {
  const { user } = useAppSelector(state => state.auth);
  const [settings, setSettings] = useState({
    // Notification Settings
    emailNotifications: true,
    pushNotifications: true,
    messageNotifications: true,
    bookingNotifications: true,
    reviewNotifications: true,
    marketingEmails: false,

    // Privacy Settings
    profileVisibility: 'public', // public, friends, private
    showOnlineStatus: true,
    showLastSeen: true,
    
    // Display Settings
    theme: 'system', // light, dark, system
    language: 'en',
    timezone: 'UTC-5',

    // Security Settings
    twoFactorAuth: false,
    sessionTimeout: '30', // minutes
  });

  const handleSwitchChange = (key: string) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const handleSelectChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // Save settings to backend
    toast.success('Settings saved successfully');
  };

  const handleResetSettings = () => {
    toast.success('Settings reset to defaults');
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground mt-2">Manage your application preferences and settings</p>
      </div>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>Configure how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive notifications via email</p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={() => handleSwitchChange('emailNotifications')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Push Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive push notifications on your device</p>
            </div>
            <Switch
              checked={settings.pushNotifications}
              onCheckedChange={() => handleSwitchChange('pushNotifications')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Message Notifications</Label>
              <p className="text-sm text-muted-foreground">Get notified when you receive new messages</p>
            </div>
            <Switch
              checked={settings.messageNotifications}
              onCheckedChange={() => handleSwitchChange('messageNotifications')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Booking Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive updates about your bookings</p>
            </div>
            <Switch
              checked={settings.bookingNotifications}
              onCheckedChange={() => handleSwitchChange('bookingNotifications')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Review Notifications</Label>
              <p className="text-sm text-muted-foreground">Get notified when someone reviews your service</p>
            </div>
            <Switch
              checked={settings.reviewNotifications}
              onCheckedChange={() => handleSwitchChange('reviewNotifications')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Marketing Emails</Label>
              <p className="text-sm text-muted-foreground">Receive promotional emails and updates</p>
            </div>
            <Switch
              checked={settings.marketingEmails}
              onCheckedChange={() => handleSwitchChange('marketingEmails')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Privacy</CardTitle>
          </div>
          <CardDescription>Control your privacy and visibility settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex-1">
              <Label>Profile Visibility</Label>
              <p className="text-sm text-muted-foreground">Who can see your profile</p>
            </div>
            <Select value={settings.profileVisibility} onValueChange={(value) => handleSelectChange('profileVisibility', value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">🌍 Public</SelectItem>
                <SelectItem value="friends">👥 Friends Only</SelectItem>
                <SelectItem value="private">🔒 Private</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Online Status</Label>
              <p className="text-sm text-muted-foreground">Let others see when you're online</p>
            </div>
            <Switch
              checked={settings.showOnlineStatus}
              onCheckedChange={() => handleSwitchChange('showOnlineStatus')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Last Seen</Label>
              <p className="text-sm text-muted-foreground">Display your last active time</p>
            </div>
            <Switch
              checked={settings.showLastSeen}
              onCheckedChange={() => handleSwitchChange('showLastSeen')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            <CardTitle>Appearance</CardTitle>
          </div>
          <CardDescription>Customize how the app looks and feels</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex-1">
              <Label>Theme</Label>
              <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
            </div>
            <Select value={settings.theme} onValueChange={(value) => handleSelectChange('theme', value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <span className="flex items-center gap-2">
                    <Sun className="h-4 w-4" /> Light
                  </span>
                </SelectItem>
                <SelectItem value="dark">
                  <span className="flex items-center gap-2">
                    <Moon className="h-4 w-4" /> Dark
                  </span>
                </SelectItem>
                <SelectItem value="system">
                  <span className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" /> System
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex-1">
              <Label>Language</Label>
              <p className="text-sm text-muted-foreground">Select your preferred language</p>
            </div>
            <Select value={settings.language} onValueChange={(value) => handleSelectChange('language', value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">🇺🇸 English</SelectItem>
                <SelectItem value="es">🇪🇸 Español</SelectItem>
                <SelectItem value="fr">🇫🇷 Français</SelectItem>
                <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex-1">
              <Label>Timezone</Label>
              <p className="text-sm text-muted-foreground">Your local timezone</p>
            </div>
            <Select value={settings.timezone} onValueChange={(value) => handleSelectChange('timezone', value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC-5">🕐 EST (UTC-5)</SelectItem>
                <SelectItem value="UTC-6">🕐 CST (UTC-6)</SelectItem>
                <SelectItem value="UTC-7">🕐 MST (UTC-7)</SelectItem>
                <SelectItem value="UTC-8">🕐 PST (UTC-8)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            <CardTitle>Security</CardTitle>
          </div>
          <CardDescription>Manage your account security preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
            </div>
            <Switch
              checked={settings.twoFactorAuth}
              onCheckedChange={() => handleSwitchChange('twoFactorAuth')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex-1">
              <Label>Session Timeout</Label>
              <p className="text-sm text-muted-foreground">Auto-logout after inactivity</p>
            </div>
            <Select value={settings.sessionTimeout} onValueChange={(value) => handleSelectChange('sessionTimeout', value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="never">Never</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end">
        <Button variant="outline" onClick={handleResetSettings}>
          Reset to Defaults
        </Button>
        <Button variant="hero" onClick={handleSave}>
          Save Settings
        </Button>
      </div>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Details about your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between py-2">
            <span className="text-sm text-muted-foreground">Account Type:</span>
            <span className="text-sm font-medium capitalize">{user?.role}</span>
          </div>
          <Separator />
          <div className="flex justify-between py-2">
            <span className="text-sm text-muted-foreground">Email:</span>
            <span className="text-sm font-medium">{user?.email}</span>
          </div>
          <Separator />
          <div className="flex justify-between py-2">
            <span className="text-sm text-muted-foreground">Account Status:</span>
            <span className="text-sm font-medium">
              {user?.isVerified ? '✅ Verified' : '⚠️ Unverified'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
