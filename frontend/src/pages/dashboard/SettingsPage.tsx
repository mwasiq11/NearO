import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppSelector } from '@/store/hooks';
import { useTheme } from '@/hooks/useTheme';
import { Theme } from '@/store/slices/uiSlice';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { Bell, Globe, Shield, Moon, Sun, Monitor, Smartphone, User, Lock, Palette, Save, RotateCcw, Loader2 } from 'lucide-react';

const SettingsPage = () => {
  const { user } = useAppSelector(state => state.auth);
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
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
    language: 'en',
    timezone: 'UTC-5',

    // Security Settings
    twoFactorAuth: false,
    sessionTimeout: '30', // minutes
  });

  // Fetch settings from backend
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setFetching(true);
        const [notifPrefs, userPrefs] = await Promise.all([
          api.get<any>('/notifications/preferences', { auth: true }),
          api.get<any>('/users/me/preferences', { auth: true })
        ]);

        if (notifPrefs) {
          setSettings(prev => ({
            ...prev,
            emailNotifications: notifPrefs.email_notifications,
            pushNotifications: notifPrefs.push_notifications,
            messageNotifications: notifPrefs.messages_enabled,
            bookingNotifications: notifPrefs.bookings_enabled,
            reviewNotifications: notifPrefs.reviews_enabled,
            marketingEmails: notifPrefs.promotions_enabled,
          }));
        }

        if (userPrefs) {
          setSettings(prev => ({
            ...prev,
            language: userPrefs.language || 'en',
            timezone: userPrefs.timezone || 'UTC-5',
            profileVisibility: userPrefs.profile_visibility || 'public',
            showOnlineStatus: userPrefs.show_online_status !== false,
            showLastSeen: userPrefs.show_last_seen !== false,
          }));
          if (userPrefs.theme) {
            setTheme(userPrefs.theme as Theme);
          }
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        toast.error('Failed to load settings from server');
      } finally {
        setFetching(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSwitchChange = (key: string) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const handleSelectChange = (key: string, value: string) => {
    if (key === 'theme') {
      setTheme(value as Theme);
    } else {
      setSettings(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      const notificationData = {
        email_notifications: settings.emailNotifications,
        push_notifications: settings.pushNotifications,
        messages_enabled: settings.messageNotifications,
        bookings_enabled: settings.bookingNotifications,
        reviews_enabled: settings.reviewNotifications,
        promotions_enabled: settings.marketingEmails,
      };

      const preferenceData = {
        theme,
        language: settings.language,
        timezone: settings.timezone,
        profile_visibility: settings.profileVisibility,
        show_online_status: settings.showOnlineStatus,
        show_last_seen: settings.showLastSeen,
      };

      await Promise.all([
        api.put('/notifications/preferences', notificationData, { auth: true }),
        api.put('/users/me/preferences', preferenceData, { auth: true })
      ]);

      toast.success('Settings saved to database');
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSettings = () => {
    toast.success('Settings reset to defaults');
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Loading your preferences...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Settings</h2>
          <p className="text-muted-foreground text-sm font-medium mt-1">Manage your application preferences and account settings</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleResetSettings} className="font-semibold text-xs md:text-sm">
            <RotateCcw className="h-4 w-4 mr-2" /> Reset
          </Button>
          <Button variant="hero" size="sm" onClick={handleSave} disabled={loading} className="font-semibold text-xs md:text-sm shadow-lg shadow-primary/20">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="account" className="flex flex-col md:flex-row gap-8">
        <TabsList className="md:w-64 h-auto flex flex-row md:flex-col bg-muted/30 p-1.5 md:p-2 rounded-2xl md:min-h-[460px] gap-1.5 overflow-x-auto md:overflow-x-visible no-scrollbar">
          <TabsTrigger value="account" className="flex-1 md:flex-none justify-center md:justify-start items-center gap-3 px-4 py-3.5 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all group">
            <User className="h-4 w-4 shrink-0 text-muted-foreground group-data-[state=active]:text-primary transition-colors" /> 
            <span className="hidden md:inline font-semibold leading-none">Account</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex-1 md:flex-none justify-center md:justify-start items-center gap-3 px-4 py-3.5 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all group">
            <Bell className="h-4 w-4 shrink-0 text-muted-foreground group-data-[state=active]:text-primary transition-colors" /> 
            <span className="hidden md:inline font-semibold leading-none">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex-1 md:flex-none justify-center md:justify-start items-center gap-3 px-4 py-3.5 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all group">
            <Shield className="h-4 w-4 shrink-0 text-muted-foreground group-data-[state=active]:text-primary transition-colors" /> 
            <span className="hidden md:inline font-semibold leading-none">Privacy</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex-1 md:flex-none justify-center md:justify-start items-center gap-3 px-4 py-3.5 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all group">
            <Palette className="h-4 w-4 shrink-0 text-muted-foreground group-data-[state=active]:text-primary transition-colors" /> 
            <span className="hidden md:inline font-semibold leading-none">Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex-1 md:flex-none justify-center md:justify-start items-center gap-3 px-4 py-3.5 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all group">
            <Lock className="h-4 w-4 shrink-0 text-muted-foreground group-data-[state=active]:text-primary transition-colors" /> 
            <span className="hidden md:inline font-semibold leading-none">Security</span>
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          {/* Account Tab */}
          <TabsContent value="account" className="m-0 space-y-6">
            <Card className="border-none bg-muted/20 rounded-3xl shadow-none">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl font-semibold">Account Information</CardTitle>
                </div>
                <CardDescription className="font-medium text-xs md:text-sm">Public and private details about your identity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2.5">
                  <div className="space-y-0.5">
                    <span className="text-sm font-semibold">Account Type</span>
                    <p className="text-[12px] font-medium text-muted-foreground">Your current platform role</p>
                  </div>
                  <Badge variant="outline" className="font-semibold capitalize h-7 px-3">{user?.role}</Badge>
                </div>
                <Separator className="bg-border/40" />
                <div className="flex justify-between items-center py-2.5">
                  <div className="space-y-0.5">
                    <span className="text-sm font-semibold">Email Address</span>
                    <p className="text-[12px] font-medium text-muted-foreground">Used for login and notifications</p>
                  </div>
                  <span className="text-sm font-semibold">{user?.email}</span>
                </div>
                <Separator className="bg-border/40" />
                <div className="flex justify-between items-center py-2.5">
                  <div className="space-y-0.5">
                    <span className="text-sm font-semibold">Verification Status</span>
                    <p className="text-[12px] font-medium text-muted-foreground">Identity verification level</p>
                  </div>
                  <span className="text-sm font-semibold">
                    {user?.isVerified ? '✅ Verified Profile' : '⚠️ Unverified'}
                  </span>
                </div>
                <Separator className="bg-border/40" />
                <div className="flex justify-between items-center py-2.5">
                  <div className="space-y-0.5">
                    <span className="text-sm font-semibold">Member Since</span>
                    <p className="text-[12px] font-medium text-muted-foreground">When you joined NearO</p>
                  </div>
                  <span className="text-sm font-semibold">January 2024</span>
                </div>
              </CardContent>
            </Card>
            
            <div className="bg-destructive/10 border border-destructive/20 p-6 rounded-3xl">
              <h4 className="text-destructive font-semibold mb-2">Danger Zone</h4>
              <p className="text-sm font-medium text-muted-foreground mb-4">Once you delete your account, there is no going back. Please be certain.</p>
              <Button variant="destructive" size="sm" className="font-semibold rounded-xl">Delete Account</Button>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="m-0">
            <Card className="border-none bg-muted/20 rounded-3xl shadow-none">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-xl">
                    <Bell className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-semibold leading-none">Activity Notifications</CardTitle>
                    <CardDescription className="font-medium text-xs md:text-sm leading-none">Configure how and when you want to be notified</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {[
                  { id: 'emailNotifications', label: 'Email Notifications', desc: 'Receive important updates via email' },
                  { id: 'pushNotifications', label: 'Push Notifications', desc: 'Receive alerts on your mobile device' },
                  { id: 'messageNotifications', label: 'Message Notifications', desc: 'Alert when you receive a new chat' },
                  { id: 'bookingNotifications', label: 'Booking Updates', desc: 'Track your appointment status' },
                  { id: 'reviewNotifications', label: 'Service Reviews', desc: 'Notify when you receive feedback' },
                  { id: 'marketingEmails', label: 'Marketing Content', desc: 'News, offers and community updates' },
                ].map((item, idx, arr) => (
                  <div key={item.id}>
                    <div className="flex items-center justify-between group min-h-[48px]">
                      <div className="space-y-0.5">
                        <Label className="font-semibold text-sm md:text-base cursor-pointer" htmlFor={item.id}>{item.label}</Label>
                        <p className="text-[12px] md:text-sm text-muted-foreground font-medium">{item.desc}</p>
                      </div>
                      <Switch
                        id={item.id}
                        checked={settings[item.id as keyof typeof settings] as boolean}
                        onCheckedChange={() => handleSwitchChange(item.id)}
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>
                    {idx < arr.length - 1 && <Separator className="mt-4 bg-border/40" />}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="m-0">
            <Card className="border-none bg-muted/20 rounded-3xl shadow-none">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-xl">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-semibold leading-none">Privacy & Visibility</CardTitle>
                    <CardDescription className="font-medium text-xs md:text-sm leading-none">Control who can interact with your profile</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-background/50 p-4 rounded-2xl border">
                  <div className="space-y-1">
                    <Label className="font-semibold">Profile Visibility</Label>
                    <p className="text-xs text-muted-foreground font-medium">Control the audience of your listings</p>
                  </div>
                  <Select value={settings.profileVisibility} onValueChange={(value) => handleSelectChange('profileVisibility', value)}>
                    <SelectTrigger className="w-full md:w-[180px] rounded-xl font-semibold border-none bg-background shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-xl">
                      <SelectItem value="public" className="font-medium">🌍 Public</SelectItem>
                      <SelectItem value="friends" className="font-medium">👥 Friends Only</SelectItem>
                      <SelectItem value="private" className="font-medium">🔒 Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-5 px-1">
                  <div className="flex items-center justify-between min-h-[48px]">
                    <div className="space-y-0.5">
                      <Label className="font-semibold text-sm">Online Status</Label>
                      <p className="text-[12px] text-muted-foreground font-medium">Let others see when you're active</p>
                    </div>
                    <Switch
                      checked={settings.showOnlineStatus}
                      onCheckedChange={() => handleSwitchChange('showOnlineStatus')}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                  <Separator className="bg-border/40" />
                  <div className="flex items-center justify-between min-h-[48px]">
                    <div className="space-y-0.5">
                      <Label className="font-semibold text-sm">Last Seen Window</Label>
                      <p className="text-[12px] text-muted-foreground font-medium">Show your last activity timestamp</p>
                    </div>
                    <Switch
                      checked={settings.showLastSeen}
                      onCheckedChange={() => handleSwitchChange('showLastSeen')}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="m-0">
            <Card className="border-none bg-muted/20 rounded-3xl shadow-none">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-xl">
                    <Palette className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-semibold leading-none">App Appearance</CardTitle>
                    <CardDescription className="font-medium text-xs md:text-sm leading-none">Personalize your visual experience</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label className="font-semibold">Interface Theme</Label>
                    <p className="text-xs text-muted-foreground font-medium">Switch between light and dark modes</p>
                  </div>
                  <Select value={theme} onValueChange={(value) => handleSelectChange('theme', value)}>
                    <SelectTrigger className="w-full md:w-[180px] rounded-xl font-semibold border-none bg-background shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-xl">
                      <SelectItem value="light" className="font-medium"><span className="flex items-center gap-2"><Sun className="h-4 w-4" /> Light</span></SelectItem>
                      <SelectItem value="dark" className="font-medium"><span className="flex items-center gap-2"><Moon className="h-4 w-4" /> Dark</span></SelectItem>
                      <SelectItem value="system" className="font-medium"><span className="flex items-center gap-2"><Monitor className="h-4 w-4" /> System</span></SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator className="bg-border/40" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label className="font-semibold">App Language</Label>
                    <p className="text-xs text-muted-foreground font-medium">Select your primary communication language</p>
                  </div>
                  <Select value={settings.language} onValueChange={(value) => handleSelectChange('language', value)}>
                    <SelectTrigger className="w-full md:w-[180px] rounded-xl font-semibold border-none bg-background shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-xl">
                      <SelectItem value="en" className="font-medium">🇺🇸 English</SelectItem>
                      <SelectItem value="ur" className="font-medium">🇵🇰 Urdu</SelectItem>
                      <SelectItem value="es" className="font-medium">🇪🇸 Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator className="bg-border/40" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label className="font-semibold">Global Timezone</Label>
                    <p className="text-xs text-muted-foreground font-medium">Sync appointments with your local time</p>
                  </div>
                  <Select value={settings.timezone} onValueChange={(value) => handleSelectChange('timezone', value)}>
                    <SelectTrigger className="w-full md:w-[180px] rounded-xl font-semibold border-none bg-background shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-xl">
                      <SelectItem value="UTC-5" className="font-medium">🕐 EST (UTC-5)</SelectItem>
                      <SelectItem value="UTC+5" className="font-medium">🕐 PKT (UTC+5)</SelectItem>
                      <SelectItem value="UTC+0" className="font-medium">🕐 GMT (UTC+0)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="m-0">
            <Card className="border-none bg-muted/20 rounded-3xl shadow-none">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-xl">
                    <Lock className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-semibold leading-none">Security Settings</CardTitle>
                    <CardDescription className="font-medium text-xs md:text-sm leading-none">Manage your account protection</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center justify-between min-h-[48px]">
                  <div className="space-y-0.5">
                    <Label className="font-semibold text-sm">Two-Factor Authentication</Label>
                    <p className="text-[12px] text-muted-foreground font-medium">Use an app or phone to verify logins</p>
                  </div>
                  <Switch
                    checked={settings.twoFactorAuth}
                    onCheckedChange={() => handleSwitchChange('twoFactorAuth')}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
                <Separator className="bg-border/40" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label className="font-semibold">Auto-Logout Session</Label>
                    <p className="text-xs text-muted-foreground font-medium">Automatically sign out after inactivity</p>
                  </div>
                  <Select value={settings.sessionTimeout} onValueChange={(value) => handleSelectChange('sessionTimeout', value)}>
                    <SelectTrigger className="w-full md:w-[180px] rounded-xl font-semibold border-none bg-background shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-xl">
                      <SelectItem value="15" className="font-medium">15 minutes</SelectItem>
                      <SelectItem value="30" className="font-medium">30 minutes</SelectItem>
                      <SelectItem value="60" className="font-medium">1 hour</SelectItem>
                      <SelectItem value="never" className="font-medium">Never logout</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator className="bg-border/40" />
                <div className="pt-2">
                  <Button variant="outline" className="w-full md:w-auto font-semibold rounded-xl text-primary border-primary/20 hover:bg-primary/5">
                    Change Password
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

      {/* Mobile only action buttons at bottom if cards are long */}
      <div className="flex md:hidden gap-4 pt-4">
        <Button variant="hero" onClick={handleSave} className="flex-1 font-semibold h-12 rounded-2xl shadow-lg shadow-primary/20">
          <Save className="h-4 w-4 mr-2" /> Save All
        </Button>
      </div>
    </div>
  );
};

export default SettingsPage;
