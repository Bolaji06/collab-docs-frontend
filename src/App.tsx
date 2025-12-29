import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import { useUserStore } from './store/useUserStore';
import { useEffect, lazy, Suspense } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Loader } from 'lucide-react';

// Lazy load pages
const AuthPage = lazy(() => import('./components/AuthPage'));
const ForgotPasswordPage = lazy(() => import('./components/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./components/ResetPasswordPage'));
const RecentsPage = lazy(() => import('./components/dashboard/RecentsPage'));
const DashboardPage = lazy(() => import('./components/dashboard/DashboardPage'));
const SharedPage = lazy(() => import('./components/dashboard/SharedPage'));
const TrashPage = lazy(() => import('./components/dashboard/TrashPage'));
const SettingsPage = lazy(() => import('./components/dashboard/SettingsPage'));
const WorkspaceSettingsPage = lazy(() => import('./components/dashboard/WorkspaceSettingsPage'));
const DocumentWorkspacePage = lazy(() => import('./components/editor/DocumentWorkspace'));

const LoadingFallback = () => (
  <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-[#121212]">
    <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
  </div>
);

function App() {
  const fetchUser = useUserStore((state) => state.fetchUser);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID"}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/folder/:folderId" element={<DashboardPage />} />
              <Route path="/tag/:tagId" element={<DashboardPage />} />
              <Route path="/recents" element={<RecentsPage />} />
              <Route path="/shared" element={<SharedPage />} />
              <Route path="/trash" element={<TrashPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/workspace/:workspaceId/settings" element={<WorkspaceSettingsPage />} />
              <Route path="/doc/:id" element={<DocumentWorkspacePage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ThemeProvider>
    </GoogleOAuthProvider>
  )
}

export default App
