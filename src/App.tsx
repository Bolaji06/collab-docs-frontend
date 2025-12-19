import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthPage from './components/AuthPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import { ThemeProvider } from './components/ThemeProvider';
import RecentsPage from './components/dashboard/RecentsPage';
import SettingsPage from './components/dashboard/SettingsPage';
import DashboardPage from './components/dashboard/DashboardPage';
import SharedPage from './components/dashboard/SharedPage';
import TrashPage from './components/dashboard/TrashPage';
import DocumentWorkspacePage from './components/editor/DocumentWorkspace';
import { useUserStore } from './store/useUserStore';
import { useEffect } from 'react';

import { GoogleOAuthProvider } from '@react-oauth/google';

function App() {
  const fetchUser = useUserStore((state) => state.fetchUser);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID"}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/recents" element={<RecentsPage />} />
            <Route path="/shared" element={<SharedPage />} />
            <Route path="/trash" element={<TrashPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/doc/:id" element={<DocumentWorkspacePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </GoogleOAuthProvider>
  )
}

export default App
