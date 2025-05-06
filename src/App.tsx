import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/layout/Header';

// Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import PodcastDetail from './pages/PodcastDetail';
import EpisodePlayer from './pages/EpisodePlayer';
import Dashboard from './pages/dashboard/Dashboard';
import CreatePodcast from './pages/dashboard/CreatePodcast';
import PodcastEpisodes from './pages/dashboard/PodcastEpisodes';
import CreateEpisode from './pages/dashboard/CreateEpisode';
import Subscriptions from './pages/Subscriptions';
import Favorites from './pages/Favorites';

// Create a client
const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  return (
    <>
      <Header user={user} />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/podcasts/:id" element={<PodcastDetail />} />
          <Route path="/episodes/:id" element={<EpisodePlayer />} />
          
          {/* Protected routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/podcasts/new" element={
            <ProtectedRoute>
              <CreatePodcast />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/podcasts/:id/episodes" element={
            <ProtectedRoute>
              <PodcastEpisodes />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/podcasts/:id/episodes/new" element={
            <ProtectedRoute>
              <CreateEpisode />
            </ProtectedRoute>
          } />
          <Route path="/subscriptions" element={
            <ProtectedRoute>
              <Subscriptions />
            </ProtectedRoute>
          } />
          <Route path="/favorites" element={
            <ProtectedRoute>
              <Favorites />
            </ProtectedRoute>
          } />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
