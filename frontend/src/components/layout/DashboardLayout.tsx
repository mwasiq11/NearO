import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Search,
  Calendar,
  MessageSquare,
  User,
  Plus,
  LogOut,
  Settings,
  Menu,
  X,
  Package,
  TrendingUp,
  Moon,
  Sun
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/common/Avatar';
import NotificationDropdown from '@/components/common/NotificationDropdown';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { useNotifications } from '@/hooks/useNotifications';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const { user, logout } = useAuth();
  const { totalUnread } = useChat();
  const { unreadCount } = useNotifications();
  const { theme, resolvedTheme, setTheme } = useTheme();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/dashboard/earnings')) return 'Earnings & Spending';
    if (path.includes('/dashboard/bookings')) return 'Bookings';
    if (path.includes('/dashboard/messages')) return 'Messages';
    if (path.includes('/dashboard/my-services')) return 'My Services';
    if (path.includes('/dashboard/settings')) return 'Settings';
    if (path.includes('/dashboard/profile')) return 'Profile';
    if (path.includes('/dashboard/browse')) return 'Browse Services';
    if (path.includes('/dashboard/listing')) return 'Service Details';
    return 'Dashboard';
  };

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/dashboard/browse', icon: Search, label: 'Browse' },
    { path: '/dashboard/my-services', icon: Package, label: 'My Services' },
    { path: '/dashboard/bookings', icon: Calendar, label: 'Bookings' },
    { path: '/dashboard/messages', icon: MessageSquare, label: 'Messages', badge: totalUnread },
    { path: '/dashboard/earnings', icon: TrendingUp, label: 'Earnings' },
    { path: '/dashboard/profile', icon: User, label: 'Profile' },
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="h-[100dvh] overflow-hidden bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r bg-card">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg overflow-hidden bg-background shadow-sm flex items-center justify-center p-1.5 border">
              <img src="https://companieslogo.com/img/orig/NBLY.TO-63e791bf.png?t=1720244493" alt="NearO" className="h-full w-full object-contain" />
            </div>
            <span style={{fontFamily: 'Poppins, sans-serif'}} className="font-bold text-xl bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent tracking-tight">NearO</span>
          </Link>
        </div>

        {/* User Info */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar
              src={user?.avatar}
              alt={user?.name}
              size="md"
              badge={user?.reputation.badge !== 'new' ? user?.reputation.badge : undefined}
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user?.name}</p>
              <Badge variant="secondary" className="text-2xs">
                Member
              </Badge>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive(item.path)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
              {item.badge ? (
                <Badge variant="destructive" className="ml-auto text-2xs h-5 w-5 p-0 flex items-center justify-center">
                  {item.badge > 9 ? '9+' : item.badge}
                </Badge>
              ) : null}
            </Link>
          ))}
        </nav>

        {/* Quick Action */}
        <div className="p-4 border-t">
          <Button className="w-full" variant="hero" onClick={() => navigate('/dashboard/my-services/new')}>
            <Plus className="h-4 w-4" />
            Add Service
          </Button>
        </div>

        {/* Settings & Logout */}
        <div className="p-4 border-t space-y-1">
          <Link
            to="/dashboard/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Settings className="h-5 w-5" />
            Settings
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b bg-card flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            {/* Page Title - Dynamic (Removed per user request) */}
            <div className="hidden sm:block">
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="p-2 mr-1 rounded-full text-muted-foreground hover:bg-muted focus:outline-none transition-colors"
              aria-label="Toggle theme"
            >
              {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            <NotificationDropdown />
            
            <div className="hidden sm:block lg:hidden">
              <Avatar
                src={user?.avatar}
                alt={user?.name}
                size="sm"
                badge={user?.reputation.badge !== 'new' ? user?.reputation.badge : undefined}
              />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 min-h-0 overflow-x-hidden overflow-y-auto flex flex-col">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t safe-bottom">
          <div className="flex items-center justify-around h-16">
            {navItems.slice(0, 5).map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors relative",
                  isActive(item.path)
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-2xs">{item.label}</span>
                {item.badge ? (
                  <span className="absolute top-1 right-1 h-4 w-4 bg-destructive text-destructive-foreground text-2xs rounded-full flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
        </nav>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-80 bg-card border-r z-50 flex flex-col"
            >
              <div className="h-16 flex items-center justify-between px-4 border-b">
                <Link to="/dashboard" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                  <div className="h-9 w-9 rounded-lg overflow-hidden bg-background shadow-sm flex items-center justify-center p-1.5 border">
                    <img src="https://companieslogo.com/img/orig/NBLY.TO-63e791bf.png?t=1720244493" alt="NearO" className="h-full w-full object-contain" />
                  </div>
                  <span style={{fontFamily: 'Poppins, sans-serif'}} className="font-bold text-lg tracking-tight">NearO</span>
                </Link>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-muted-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-4 border-b">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={user?.avatar}
                    alt={user?.name}
                    size="lg"
                    badge={user?.reputation.badge !== 'new' ? user?.reputation.badge : undefined}
                  />
                  <div>
                    <p className="font-medium">{user?.name}</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
              </div>

              <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                      isActive(item.path)
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                    {item.badge ? (
                      <Badge variant="destructive" className="ml-auto">
                        {item.badge}
                      </Badge>
                    ) : null}
                  </Link>
                ))}
              </nav>

              <div className="p-4 border-t">
                <button
                  onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  Log Out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardLayout;
