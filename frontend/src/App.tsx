import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { useAppSelector } from '@/store/hooks';

// React Router v7 future flags - suppress warnings and opt-in to v7 behavior
const routerFutureConfig = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};

// Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import VerifyEmailPage from "./pages/auth/VerifyEmailPage";
import DashboardLayout from "./components/layout/DashboardLayout";
import DashboardHome from "./pages/dashboard/DashboardHome";
import BrowsePage from "./pages/dashboard/BrowsePage";
import MyServicesPage from "./pages/dashboard/MyServicesPage";
import CreateServicePage from "./pages/dashboard/CreateServicePage";
import BookingsPage from "./pages/dashboard/BookingsPage";
import MessagesPage from "./pages/dashboard/MessagesPage";
import ListingDetailPage from "./pages/dashboard/ListingDetailPage";
import EarningsPage from "./pages/dashboard/EarningsPage";
import NotFound from "./pages/NotFound";
import ProfilePage from "./pages/profile/ProfilePage";
import AdminModeratorLayout from "./components/layout/AdminModeratorLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ModeratorDashboard from "./pages/moderator/ModeratorDashboard";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminServicesPage from "./pages/admin/AdminServicesPage";
import AdminReportsPage from "./pages/admin/AdminReportsPage";
import AdminAnalyticsPage from "./pages/admin/AdminAnalyticsPage";
import AdminCategoriesPage from "./pages/admin/AdminCategoriesPage";
import AdminModeratorsPage from "./pages/admin/AdminModeratorsPage";
import AdminSystemSettingsPage from "./pages/admin/AdminSystemSettingsPage";
import SettingsPage from "./pages/dashboard/SettingsPage";

const queryClient = new QueryClient();

// Protected Route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAppSelector(state => state.auth);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const RoleRoute = ({
  children,
  allowed,
}: {
  children: React.ReactNode;
  allowed: Array<'admin' | 'moderator'>;
}) => {
  const { isAuthenticated, user } = useAppSelector(state => state.auth);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const role = (user?.role || 'user') as 'admin' | 'moderator' | 'user';
  if (!allowed.includes(role as 'admin' | 'moderator')) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      {/* Protected Dashboard Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<DashboardHome />} />
        <Route path="browse" element={<BrowsePage />} />
        <Route path="bookings" element={<BookingsPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="my-services" element={<MyServicesPage />} />
        <Route path="my-services/new" element={<CreateServicePage />} />
        <Route path="listing/:id" element={<ListingDetailPage />} />
        <Route path="earnings" element={<EarningsPage />} />
      </Route>

      {/* Admin & Moderator routes for testing UI */}
      <Route path="/admin" element={
        <RoleRoute allowed={['admin', 'moderator']}>
          <AdminModeratorLayout>
            <AdminDashboard />
          </AdminModeratorLayout>
        </RoleRoute>
      } />
      <Route path="/admin/services" element={
        <RoleRoute allowed={['admin', 'moderator']}>
          <AdminModeratorLayout>
            <AdminServicesPage />
          </AdminModeratorLayout>
        </RoleRoute>
      } />
      <Route path="/admin/reports" element={
        <RoleRoute allowed={['admin', 'moderator']}>
          <AdminModeratorLayout>
            <AdminReportsPage />
          </AdminModeratorLayout>
        </RoleRoute>
      } />
      <Route path="/admin/analytics" element={
        <RoleRoute allowed={['admin', 'moderator']}>
          <AdminModeratorLayout>
            <AdminAnalyticsPage />
          </AdminModeratorLayout>
        </RoleRoute>
      } />
      <Route path="/admin/users" element={
        <RoleRoute allowed={['admin']}>
          <AdminModeratorLayout>
            <AdminUsersPage />
          </AdminModeratorLayout>
        </RoleRoute>
      } />
      <Route path="/admin/categories" element={
        <RoleRoute allowed={['admin']}>
          <AdminModeratorLayout>
            <AdminCategoriesPage />
          </AdminModeratorLayout>
        </RoleRoute>
      } />
      <Route path="/admin/moderators" element={
        <RoleRoute allowed={['admin']}>
          <AdminModeratorLayout>
            <AdminModeratorsPage />
          </AdminModeratorLayout>
        </RoleRoute>
      } />
      <Route path="/admin/settings" element={
        <RoleRoute allowed={['admin']}>
          <AdminModeratorLayout>
            <AdminSystemSettingsPage />
          </AdminModeratorLayout>
        </RoleRoute>
      } />

      <Route path="/moderator" element={
        <RoleRoute allowed={['admin', 'moderator']}>
          <AdminModeratorLayout>
            <ModeratorDashboard />
          </AdminModeratorLayout>
        </RoleRoute>
      } />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={routerFutureConfig}>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </Provider>
);

export default App;
