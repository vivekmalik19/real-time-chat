import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import RoomPage from './pages/RoomPage';
import ProfilePage from './pages/ProfilePage';
import SecurityPage from './pages/SecurityPage';
import NotFoundPage from './pages/NotFoundPage';
import VideoCatalogPage from './pages/VideoCatalogPage';
import VideoDetailPage from './pages/VideoDetailPage';
import DownloadsPage from './pages/DownloadsPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AuthModal from './components/auth/AuthModal';

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/room/:roomId" element={<RoomPage />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/security"
          element={
            <ProtectedRoute>
              <SecurityPage />
            </ProtectedRoute>
          }
        />
        <Route path="/videos" element={<VideoCatalogPage />} />
        <Route path="/videos/:id" element={<VideoDetailPage />} />
        <Route
          path="/downloads"
          element={
            <ProtectedRoute>
              <DownloadsPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {/* Global Authentication & Device Verification Modal */}
      <AuthModal />
    </>
  );
}
