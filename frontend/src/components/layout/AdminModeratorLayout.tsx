import { useAuth } from '@/hooks/useAuth';
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Package,
  Flag,
  BarChart3,
  Shield,
  Settings,
  Menu,
  X,
  LogOut,
  Sun,
  Moon,
  ClipboardList,
  ChevronLeft
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface NavItem {
  label: string;
  path: string;
  icon: JSX.Element;
  roles: Array<'admin' | 'moderator'>;
}

const AdminModeratorLayout = ({ children, dropTitle }: { children: React.ReactNode; dropTitle?: string }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isTablet, setIsTablet] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { theme, resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    const tabletQuery = window.matchMedia('(min-width: 768px) and (max-width: 1024px)');

    const updateTablet = () => setIsTablet(tabletQuery.matches);

    updateTablet();
    tabletQuery.addEventListener('change', updateTablet);

    return () => tabletQuery.removeEventListener('change', updateTablet);
  }, []);

  useEffect(() => {
    if (isTablet) {
      setSidebarOpen(false);
      return;
    }

    setSidebarOpen(!isMobile);
  }, [isMobile]);

  const role = user?.role || 'user';
  const isAdmin = role === 'admin';
  const isModerator = role === 'moderator' || isAdmin;

  const navItems: NavItem[] = [
    { label: 'Dashboard', path: isAdmin ? '/admin' : '/moderator', icon: <LayoutDashboard className="h-5 w-5" />, roles: ['admin', 'moderator'] },
    { label: 'Users', path: '/admin/users', icon: <Users className="h-5 w-5" />, roles: ['admin'] },
    { label: 'Services', path: '/admin/services', icon: <Package className="h-5 w-5" />, roles: ['admin', 'moderator'] },
    { label: 'Reports', path: '/admin/reports', icon: <Flag className="h-5 w-5" />, roles: ['admin', 'moderator'] },
    { label: 'Analytics', path: '/admin/analytics', icon: <BarChart3 className="h-5 w-5" />, roles: ['admin', 'moderator'] },
    { label: 'Audit Logs', path: '/admin/audit', icon: <ClipboardList className="h-5 w-5" />, roles: ['admin'] },
    { label: 'Categories', path: '/admin/categories', icon: <Shield className="h-5 w-5" />, roles: ['admin'] },
    { label: 'Moderators', path: '/admin/moderators', icon: <Shield className="h-5 w-5" />, roles: ['admin'] },
    { label: 'Settings', path: '/admin/settings', icon: <Settings className="h-5 w-5" />, roles: ['admin'] },
  ];

  const availableItems = navItems.filter((item) => item.roles.includes(isAdmin ? 'admin' : 'moderator'));
  const isActive = (path: string) => location.pathname === path;

  const SidebarContent = ({ isMobileView = false }: { isMobileView?: boolean }) => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b flex items-center justify-between h-[73px]">
        {(sidebarOpen || isMobileView) && (
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{isAdmin ? 'Administrator' : 'Moderator'}</p>
            <h1 className="text-lg font-bold truncate">{dropTitle || 'Control Center'}</h1>
          </div>
        )}
        {!isMobileView && (
          <Button
            variant="ghost"
            size="icon"
            className="text-foreground -mr-2"
            onClick={() => setSidebarOpen((prev) => !prev)}
          >
            {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        )}
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        {availableItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => isMobileView && setIsSheetOpen(false)}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl transition-all active:scale-[0.98]',
              isActive(item.path) 
                ? 'bg-primary text-primary-foreground shadow-md' 
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
            title={!sidebarOpen && !isMobileView ? item.label : undefined}
          >
            {item.icon}
            {(sidebarOpen || isMobileView) && <span className="font-medium">{item.label}</span>}
          </Link>
        ))}
      </nav>

      <div className="border-t p-4 space-y-4">
        {(sidebarOpen || isMobileView) && (
          <div className="px-2">
            <p className="text-2xs text-muted-foreground font-semibold uppercase tracking-tight">Signed in as</p>
            <p className="text-sm font-bold truncate">{user?.name || 'Demo User'}</p>
            <Badge className="mt-2 bg-primary/10 text-primary border-none shadow-none font-bold">{(user?.role || 'user').toUpperCase()}</Badge>
          </div>
        )}
        <Button variant="destructive" className={cn("w-full h-11 rounded-xl", !sidebarOpen && !isMobileView && "px-0")} onClick={logout}>
          <LogOut className="h-4 w-4" />
          {(sidebarOpen || isMobileView) && <span className="ml-2 font-bold">Logout</span>}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-[100dvh] bg-background overflow-hidden relative">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside
          className={cn(
            'bg-card text-foreground transition-all duration-300 ease-in-out flex flex-col border-r h-full z-20',
            isTablet ? (sidebarOpen ? 'w-[220px]' : 'w-[70px]') : sidebarOpen ? 'w-64' : 'w-20'
          )}
        >
          <SidebarContent />
        </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-background">
        {/* Header */}
        <header className="bg-card border-b px-4 md:px-5 lg:px-6 py-4 flex items-center justify-between h-[73px] sticky top-0 z-30 gap-3">
          <div className="flex items-center gap-4">
            {isMobile && (
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="-ml-2">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-80 border-r">
                  <SidebarContent isMobileView />
                </SheetContent>
              </Sheet>
            )}
            <div className="flex items-center gap-2">
              <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">
                <LayoutDashboard className="h-5 w-5" />
              </Link>
              <span className="text-muted-foreground">/</span>
              <span className="font-bold text-sm md:text-base line-clamp-1">
                {availableItems.find(i => isActive(i.path))?.label || 'Admin'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-6">
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="p-2.5 rounded-full text-muted-foreground hover:bg-muted focus:outline-none transition-colors active:scale-95"
              aria-label="Toggle theme"
            >
              {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <div className="text-xs font-bold text-muted-foreground hidden lg:block uppercase tracking-widest">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto bg-muted/5 relative">
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto min-h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminModeratorLayout;
