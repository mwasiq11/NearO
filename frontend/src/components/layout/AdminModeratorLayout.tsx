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
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: JSX.Element;
  roles: Array<'admin' | 'moderator'>;
}

const AdminModeratorLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const role = user?.role || 'user';
  const isAdmin = role === 'admin';
  const isModerator = role === 'moderator' || isAdmin;

  const navItems: NavItem[] = [
    { label: 'Dashboard', path: isAdmin ? '/admin' : '/moderator', icon: <LayoutDashboard className="h-5 w-5" />, roles: ['admin', 'moderator'] },
    { label: 'Users', path: '/admin/users', icon: <Users className="h-5 w-5" />, roles: ['admin'] },
    { label: 'Services', path: '/admin/services', icon: <Package className="h-5 w-5" />, roles: ['admin', 'moderator'] },
    { label: 'Reports', path: '/admin/reports', icon: <Flag className="h-5 w-5" />, roles: ['admin', 'moderator'] },
    { label: 'Analytics', path: '/admin/analytics', icon: <BarChart3 className="h-5 w-5" />, roles: ['admin', 'moderator'] },
    { label: 'Categories', path: '/admin/categories', icon: <Shield className="h-5 w-5" />, roles: ['admin'] },
    { label: 'Moderators', path: '/admin/moderators', icon: <Shield className="h-5 w-5" />, roles: ['admin'] },
    { label: 'Settings', path: '/admin/settings', icon: <Settings className="h-5 w-5" />, roles: ['admin'] },
  ];

  const availableItems = navItems.filter((item) => item.roles.includes(isAdmin ? 'admin' : 'moderator'));
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-100">
      <aside
        className={cn(
          'bg-gray-900 text-white transition-all duration-300 flex flex-col',
          sidebarOpen ? 'w-64' : 'w-20'
        )}
      >
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          {sidebarOpen && (
            <div>
              <p className="text-xs text-gray-400">{isAdmin ? 'Administrator' : 'Moderator'}</p>
              <h1 className="text-xl font-bold">Control Center</h1>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="text-white"
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
                isActive(item.path) ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
              )}
              title={!sidebarOpen ? item.label : undefined}
            >
              {item.icon}
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="border-t border-gray-800 p-4 space-y-3">
          {sidebarOpen && (
            <div>
              <p className="text-xs text-gray-400">Signed in as</p>
              <p className="font-semibold truncate">{user?.name || 'Demo User'}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              <Badge className="mt-2 bg-blue-600 text-white">{(user?.role || 'user').toUpperCase()}</Badge>
            </div>
          )}
          <Button variant="destructive" className="w-full" onClick={logout}>
            <LogOut className="h-4 w-4" />
            {sidebarOpen && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">{isAdmin ? 'Administrator' : 'Moderator'} workspace</p>
            <h2 className="text-lg font-semibold">
              {availableItems.find((item) => isActive(item.path))?.label || 'Dashboard'}
            </h2>
          </div>
          <div className="text-sm text-gray-600">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-gray-50">
          <div className="p-8 max-w-6xl mx-auto space-y-6">{children}</div>
        </div>
      </main>
    </div>
  );
};

export default AdminModeratorLayout;
