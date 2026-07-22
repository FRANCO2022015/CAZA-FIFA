import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PlayersPage from './pages/PlayersPage';
import PlayerDetailPage from './pages/PlayerDetailPage';
import CartPage from './pages/CartPage';
import PurchasesPage from './pages/PurchasesPage';
import ForumPage from './pages/ForumPage';
import ForumThreadPage from './pages/ForumThreadPage';
import MeetingsPage from './pages/MeetingsPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminPage from './pages/AdminPage';
import JugadorDetailPage from './pages/JugadorDetailPage';
import TeamBuilderPage from './pages/TeamBuilderPage';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: '#12122A',
                color: '#fff',
                border: '1px solid rgba(108, 99, 255, 0.3)',
                borderRadius: '12px',
                fontSize: '14px',
              },
              success: {
                iconTheme: { primary: '#43E97B', secondary: '#12122A' },
              },
              error: {
                iconTheme: { primary: '#FF6584', secondary: '#12122A' },
              },
            }}
          />

          <Routes>
            {/* Public routes */}
            <Route path="/login"       element={<LoginPage />} />
            <Route path="/register"    element={<RegisterPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard"    element={<DashboardPage />} />
              <Route path="/players"      element={<PlayersPage />} />
              <Route path="/players/:id"  element={<PlayerDetailPage />} />
              <Route path="/cart"         element={<CartPage />} />
              <Route path="/purchases"    element={<PurchasesPage />} />
              <Route path="/forum"        element={<ForumPage />} />
              <Route path="/forum/:id"    element={<ForumThreadPage />} />
              <Route path="/meetings"     element={<MeetingsPage />} />
              <Route path="/admin"        element={<AdminPage />} />
              <Route path="/efootball/:id" element={<JugadorDetailPage />} />
              <Route path="/team-builder" element={<TeamBuilderPage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
