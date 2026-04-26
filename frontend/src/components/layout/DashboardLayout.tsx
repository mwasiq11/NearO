import { Outlet, Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Search,
  Calendar,
  MessageSquare,
  User,
  LogOut,
  Settings,
  Menu,
  X,
  Package,
  TrendingUp,
  Moon,
  Sun,
  Shield,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/common/Avatar';
import DashboardModeToggle from '@/components/dashboard/DashboardModeToggle';
import NotificationDropdown from '@/components/common/NotificationDropdown';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { useBookings } from '@/hooks/useBookings';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isTabletSidebarCollapsed, setIsTabletSidebarCollapsed] = useState(true);

  const { user, logout, isAdmin, isModerator } = useAuth();
  const { totalUnread } = useChat();
  const { receivedBookings } = useBookings();
  const { theme, resolvedTheme, setTheme } = useTheme();

  const pendingReceivedCount = receivedBookings.filter((booking) => booking.status === 'pending').length;

  const isDashboardHome = location.pathname === '/dashboard';
  const dashboardView = searchParams.get('view') === 'provider' ? 'provider' : 'seeker';

  const handleDashboardViewChange = (view: 'seeker' | 'provider') => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('view', view);
    setSearchParams(nextParams, { replace: true });
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px) and (max-width: 1024px)');

    const update = () => setIsTablet(mediaQuery.matches);

    update();
    mediaQuery.addEventListener('change', update);

    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (isTablet) {
      setIsTabletSidebarCollapsed(true);
    }
  }, [isTablet]);

  useEffect(() => {
    if (!isMobile) {
      setIsMobileMenuOpen(false);
    }
  }, [isMobile]);

  const handleSidebarToggle = () => {
    if (isMobile) {
      setIsMobileMenuOpen(true);
      return;
    }

    if (isTablet) {
      setIsTabletSidebarCollapsed((value) => !value);
    }
  };

  type NavItem = { path: string; icon: React.ElementType; label: string; badge?: number };

  const baseNavItems: NavItem[] = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/dashboard/browse', icon: Search, label: 'Browse' },
    { path: '/dashboard/my-services', icon: Package, label: 'My Services' },
    { path: '/dashboard/bookings', icon: Calendar, label: 'Bookings', badge: pendingReceivedCount },
    { path: '/dashboard/messages', icon: MessageSquare, label: 'Messages', badge: totalUnread },
    { path: '/dashboard/earnings', icon: TrendingUp, label: 'Earnings' },
    { path: '/dashboard/profile', icon: User, label: 'Profile' },
  ];

  const adminNavItems: NavItem[] = isAdmin
    ? [{ path: '/admin', icon: Shield, label: 'Admin Panel' }]
    : [];

  const moderatorNavItems: NavItem[] = isModerator || isAdmin
    ? [{ path: '/moderator', icon: Shield, label: 'Moderator Desk' }]
    : [];

  const navItems = [...baseNavItems, ...moderatorNavItems, ...adminNavItems];
  const profileName = user?.name || 'muhammadwasiq';

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="h-[100dvh] overflow-hidden bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden h-screen w-64 flex-col overflow-y-auto bg-card lg:flex">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-border/60 px-4">
          <Link to="/dashboard" className="group flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border bg-background p-1.5 shadow-sm">
              <img src="https://companieslogo.com/img/orig/NBLY.TO-63e791bf.png?t=1720244493" alt="NearO" className="h-full w-full object-contain" />
            </div>
            <span style={{ fontFamily: 'Poppins, sans-serif' }} className="max-w-0 -translate-x-1 whitespace-nowrap bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-xl font-bold tracking-tight text-transparent opacity-0 transition-[max-width,opacity,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:max-w-28 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:max-w-28 group-focus-visible:translate-x-0 group-focus-visible:opacity-100">NearO</span>
          </Link>
        </div>

        <div className="flex min-h-0 flex-1 flex-col justify-between">
          <div className="min-h-0 flex-1 overflow-y-auto px-3 pt-4 pb-2">
            {/* Navigation */}
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                    isActive(item.path)
                      ? 'bg-primary/12 text-foreground shadow-[0_0_0_1px_hsl(var(--primary)/0.25)]'
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                  )}
                >
                  {isActive(item.path) ? <span className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-primary" /> : null}
                  <item.icon className={cn('h-5 w-5 transition-colors', isActive(item.path) ? 'text-primary' : 'group-hover:text-primary')} />
                  <span>{item.label}</span>
                  {item.badge ? (
                    <Badge variant="destructive" className="ml-auto flex h-5 w-5 items-center justify-center p-0 text-2xs">
                      {item.badge > 9 ? '9+' : item.badge}
                    </Badge>
                  ) : null}
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-2 border-t p-3">
            <Link
              to="/dashboard/settings"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors duration-200 ease-in-out hover:bg-muted/70 hover:text-foreground"
            >
              <Settings className="h-5 w-5" />
              Settings
            </Link>
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors duration-200 ease-in-out hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-5 w-5" />
              Log Out
            </button>
          </div>
        </div>
      </aside>

      {/* Tablet Sidebar */}
      <aside
        data-collapsed={isTabletSidebarCollapsed}
        className={cn(
          'hidden min-h-0 flex-col overflow-hidden border-r bg-card md:flex lg:hidden',
          isTabletSidebarCollapsed ? 'w-[70px]' : 'w-[220px]'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border/60 px-3">
          <Link to="/dashboard" className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border bg-background p-1.5 shadow-sm">
              <img src="https://companieslogo.com/img/orig/NBLY.TO-63e791bf.png?t=1720244493" alt="NearO" className="h-full w-full object-contain" />
            </div>
            {!isTabletSidebarCollapsed && (
              <span style={{ fontFamily: 'Poppins, sans-serif' }} className="dashboard-tablet-brand-text bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-lg font-bold tracking-tight text-transparent">
                NearO
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setIsTabletSidebarCollapsed((value) => !value)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 ease-in-out hover:bg-muted/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            aria-label={isTabletSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col justify-between">
          <div className="min-h-0 flex-1 overflow-y-auto px-2 pt-3 pb-2">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  title={isTabletSidebarCollapsed ? item.label : undefined}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                    isTabletSidebarCollapsed ? 'justify-center px-2' : 'px-3',
                    isActive(item.path)
                      ? 'bg-primary/12 text-foreground shadow-[0_0_0_1px_hsl(var(--primary)/0.25)]'
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                  )}
                >
                  {isActive(item.path) ? <span className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-primary" /> : null}
                  <item.icon className={cn('h-5 w-5 shrink-0 transition-colors', isActive(item.path) ? 'text-primary' : 'group-hover:text-primary')} />
                  {!isTabletSidebarCollapsed && <span className="dashboard-tablet-nav-label truncate">{item.label}</span>}
                  {item.badge ? (
                    <Badge variant="destructive" className={cn('ml-auto flex h-5 w-5 items-center justify-center p-0 text-2xs', isTabletSidebarCollapsed && 'hidden')}>
                      {item.badge > 9 ? '9+' : item.badge}
                    </Badge>
                  ) : null}
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-2 border-t p-2">
            <Link
              to="/dashboard/settings"
              title={isTabletSidebarCollapsed ? 'Settings' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium text-muted-foreground transition-colors duration-200 ease-in-out hover:bg-muted/70 hover:text-foreground',
                isTabletSidebarCollapsed ? 'justify-center px-2' : 'px-3'
              )}
            >
              <Settings className="h-5 w-5 shrink-0" />
              {!isTabletSidebarCollapsed && <span className="dashboard-tablet-nav-label truncate">Settings</span>}
            </Link>
            <button
              onClick={logout}
              title={isTabletSidebarCollapsed ? 'Log Out' : undefined}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl py-2.5 text-sm font-medium text-muted-foreground transition-colors duration-200 ease-in-out hover:bg-destructive/10 hover:text-destructive',
                isTabletSidebarCollapsed ? 'justify-center px-2' : 'px-3'
              )}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {!isTabletSidebarCollapsed && <span className="dashboard-tablet-nav-label truncate">Log Out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 border-b border-border/60 bg-card/95 backdrop-blur transition-all duration-200">
          <div className="relative flex h-[56px] items-center justify-between px-3 md:h-16 md:px-4 lg:h-[72px] lg:px-6">
            {/* Left Section */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleSidebarToggle}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-all duration-150 hover:bg-muted/70 hover:text-foreground active:scale-95 md:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </button>

            </div>

            {/* Center Section - Strictly Visually Centered */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
              {isDashboardHome && (
                <DashboardModeToggle
                  value={dashboardView}
                  onChange={handleDashboardViewChange}
                  className="scale-[0.85] sm:scale-90 md:scale-100 origin-center"
                />
              )}
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
              <button
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-all duration-150 hover:bg-muted/70 hover:text-foreground active:scale-95"
                aria-label="Toggle theme"
              >
                {resolvedTheme === 'dark' ? <Sun className="h-[20px] w-[20px]" /> : <Moon className="h-[20px] w-[20px]" />}
              </button>

              <div className="flex h-10 w-10 items-center justify-center shrink-0">
                <NotificationDropdown />
              </div>

              <button
                onClick={() => navigate('/dashboard/settings')}
                className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-all duration-150 hover:bg-muted/70 hover:text-foreground active:scale-95 md:inline-flex lg:hidden"
                aria-label="Open settings"
              >
                <Settings className="h-[20px] w-[20px]" />
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform duration-150 hover:scale-105 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none"
                    aria-label="Open profile menu"
                  >
                    <Avatar
                      src={user?.avatar}
                      alt={profileName}
                      fallback="M"
                      size="sm"
                      className="h-9 w-9 md:h-10 md:w-10 transition-all"
                    />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  sideOffset={10}
                  className="w-72 rounded-xl border border-border/60 bg-card/95 p-2 text-card-foreground shadow-2xl backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
                >
                  <DropdownMenuLabel className="p-0">
                    <div className="flex items-center gap-3 rounded-lg px-3 py-3">
                      <Avatar
                        src={user?.avatar}
                        alt={profileName}
                        fallback="M"
                        size="lg"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{profileName}</p>
                        <Badge variant="secondary" className="mt-1 text-2xs capitalize">
                          User
                        </Badge>
                      </div>
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator className="my-1 bg-border/60" />

                  <DropdownMenuItem
                    onSelect={() => navigate('/dashboard/profile')}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors focus:bg-muted/70"
                  >
                    <User className="h-4 w-4 text-muted-foreground" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => navigate('/dashboard/my-services')}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors focus:bg-muted/70"
                  >
                    <Package className="h-4 w-4 text-muted-foreground" />
                    My Services
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => navigate('/dashboard/bookings')}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors focus:bg-muted/70"
                  >
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Bookings
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => navigate('/dashboard/earnings')}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors focus:bg-muted/70"
                  >
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    Earnings
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="my-1 bg-border/60" />

                  <DropdownMenuItem
                    onSelect={() => navigate('/dashboard/settings')}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors focus:bg-muted/70"
                  >
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => logout()}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-destructive transition-colors focus:bg-destructive/10 focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

        </header>

        {/* Page Content */}
        <main className={cn(
          "flex-1 min-h-0 overflow-x-hidden overflow-y-auto flex flex-col",
          "pb-20 lg:pb-0" // Add padding for bottom nav on mobile
        )}>
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation - Enhanced for touch UX */}
        <nav className="dashboard-mobile-bottom-nav lg:hidden fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-lg border-t z-40 safe-bottom">
          <div className="flex items-center justify-around h-16 px-2">
            {navItems.slice(0, 5).map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex flex-col items-center justify-center flex-1 min-w-[50px] min-h-[50px] gap-0.5 rounded-xl transition-all relative active:scale-95",
                    active
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  <div className={cn(
                    "p-1.5 rounded-xl transition-colors",
                    active && "bg-primary/10"
                  )}>
                    <item.icon className={cn("h-6 w-6", active && "stroke-[2.5px]")} />
                  </div>
                  <span className={cn("text-[10px] font-medium transition-transform", active && "scale-105")}>
                    {item.label}
                  </span>
                  {item.badge ? (
                    <span className="absolute top-2 right-[calc(50%-18px)] h-4 w-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-card">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  ) : null}
                  {active && (
                    <motion.div
                      layoutId="bottom-nav-indicator"
                      className="absolute -top-[1px] w-8 h-1 bg-primary rounded-full"
                    />
                  )}
                </Link>
              );
            })}
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
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="lg:hidden fixed left-0 top-0 bottom-0 z-50 flex w-[82vw] max-w-sm flex-col bg-card border-r"
            >
              <div className="h-16 flex items-center justify-between px-4 border-b">
                <Link to="/dashboard" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                  <div className="h-9 w-9 rounded-lg overflow-hidden bg-background shadow-sm flex items-center justify-center p-1.5 border">
                    <img src="https://companieslogo.com/img/orig/NBLY.TO-63e791bf.png?t=1720244493" alt="NearO" className="h-full w-full object-contain" />
                  </div>
                  <span style={{ fontFamily: 'Poppins, sans-serif' }} className="font-bold text-lg tracking-tight">NearO</span>
                </Link>
                <button onClick={() => setIsMobileMenuOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 hover:bg-muted/70 hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-4">
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
