import { useAuth } from '@/hooks/useAuth';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
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
  ClipboardList
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

interface NavItem {
  label: string;
  path: string;
  icon: JSX.Element;
  roles: Array<'admin' | 'moderator'>;
}

const AdminModeratorLayout = ({ children, dropTitle }: { children: React.ReactNode; dropTitle?: string }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { theme, resolvedTheme, setTheme } = useTheme();

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

  return (
    <div className="flex h-screen bg-background">
      <aside
        className={cn(
          'bg-card text-foreground transition-all duration-300 flex flex-col border-r',
          sidebarOpen ? 'w-64' : 'w-20'
        )}
      >
        <div className="p-6 border-b flex items-center justify-between h-[73px]">
          {sidebarOpen && (
            <div>
              <p className="text-xs text-muted-foreground">{isAdmin ? 'Administrator' : 'Moderator'}</p>
              <h1 className="text-xl font-bold">{dropTitle || 'Control Center'}</h1>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="text-foreground"
            onClick={() => setSidebarOpen((prev) => !prev)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-2">
          {availableItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive(item.path) ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
              )}
              title={!sidebarOpen ? item.label : undefined}
            >
              {item.icon}
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="border-t p-4 space-y-3">
          {sidebarOpen && (
            <div>
              <p className="text-xs text-muted-foreground">Signed in as</p>
              <p className="font-semibold truncate">{user?.name || 'Demo User'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              <Badge className="mt-2 bg-primary text-primary-foreground">{(user?.role || 'user').toUpperCase()}</Badge>
            </div>
          )}
          <Button variant="destructive" className="w-full" onClick={logout}>
            <LogOut className="h-4 w-4" />
            {sidebarOpen && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden bg-background">
        <div className="bg-card border-b px-6 py-4 flex items-center justify-between h-[73px]">
          <div>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full text-muted-foreground hover:bg-muted focus:outline-none transition-colors"
              aria-label="Toggle theme"
            >
              {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <div className="text-sm text-muted-foreground hidden sm:block">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-muted/20">
          <div className="p-8 max-w-6xl mx-auto space-y-6">{children}</div>
        </div>
      </main>
    </div>
  );
};

export default AdminModeratorLayout;
