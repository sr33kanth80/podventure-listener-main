import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { AudioProvider } from '@/contexts/AudioContext';
import { AnimatePresence } from 'framer-motion';
import AppLayout from '@/components/AppLayout';
import SignIn from '@/pages/SignIn';
import AuthCallback from '@/pages/AuthCallback';
import SetupUsername from '@/pages/SetupUsername';
import Index from '@/pages/Index';
import Saved from '@/pages/Saved';
import PodcastDetails from '@/pages/PodcastDetails';
import Feed from '@/pages/Feed';
import Profile from '@/pages/Profile';
import ProfileSettings from '@/pages/ProfileSettings';

function AppRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/setup-username" element={<SetupUsername />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<Index />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/podcast/:id" element={<PodcastDetails />} />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/settings/profile" element={<ProfileSettings />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <SidebarProvider>
          <AudioProvider>
            <AppRoutes />
          </AudioProvider>
        </SidebarProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;