import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { MainLayout } from './components/layout/MainLayout';
import { PageGuard } from './components/common/PageGuard';
import { Toaster } from 'sonner';

// Public Pages
import { Home } from './pages/Home';
import { SponsorsPage } from './pages/Sponsors';
import { SponsorDetailPage } from './pages/SponsorDetail';
import { WheelPage, RewardWheelPage } from './pages/Wheel';
import { GiveawaysPage } from './pages/Giveaways';
import { LeaderboardPage } from './pages/Leaderboard';
import { StorePage } from './pages/Store';
import { GamesPage } from './pages/Games';
import { LiveTvPage } from './pages/LiveTv';
import { AboutPage } from './pages/About';
import { ContactPage } from './pages/Contact';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { ProfilePage } from './pages/Profile';

// Admin Pages
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/Dashboard';
import { PagesManager } from './pages/admin/PagesManager';
import { SponsorsManager } from './pages/admin/SponsorsManager';
import { BannersManager } from './pages/admin/BannersManager';
import { WheelManager } from './pages/admin/WheelManager';
import { GiveawaysManager } from './pages/admin/GiveawaysManager';
import { StoreManager } from './pages/admin/StoreManager';
import { SettingsManager } from './pages/admin/SettingsManager';
import { LogsManager } from './pages/admin/LogsManager';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <Toaster
            position="top-right"
            richColors
            theme="dark"
            toastOptions={{
              style: {
                background: '#120b24',
                borderColor: 'rgba(124, 58, 237, 0.4)',
                color: '#fff',
              },
            }}
          />

          <Routes>
            {/* Public Layout */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
              <Route
                path="/sponsors"
                element={
                  <PageGuard pageKey="sponsors" pageName="Sponsorlar">
                    <SponsorsPage />
                  </PageGuard>
                }
              />
              <Route path="/site/:slug" element={<SponsorDetailPage />} />
              <Route
                path="/wheel"
                element={
                  <PageGuard pageKey="wheel" pageName="Günlük Çark">
                    <WheelPage />
                  </PageGuard>
                }
              />
              <Route path="/reward-wheel" element={<Navigate to="/wheel" replace />} />
              <Route
                path="/giveaways"
                element={
                  <PageGuard pageKey="giveaways" pageName="Çekilişler">
                    <GiveawaysPage />
                  </PageGuard>
                }
              />
              <Route
                path="/leaderboard"
                element={
                  <PageGuard pageKey="leaderboard" pageName="Liderlik Tablosu">
                    <LeaderboardPage />
                  </PageGuard>
                }
              />
              <Route
                path="/store"
                element={
                  <PageGuard pageKey="store" pageName="Ödül Mağazası">
                    <StorePage />
                  </PageGuard>
                }
              />
              <Route
                path="/games"
                element={
                  <PageGuard pageKey="games" pageName="Oyunlar">
                    <GamesPage />
                  </PageGuard>
                }
              />
              <Route
                path="/live"
                element={
                  <PageGuard pageKey="live" pageName="Canlı TV">
                    <LiveTvPage />
                  </PageGuard>
                }
              />
              <Route
                path="/about"
                element={
                  <PageGuard pageKey="about" pageName="Hakkımızda">
                    <AboutPage />
                  </PageGuard>
                }
              />
              <Route
                path="/contact"
                element={
                  <PageGuard pageKey="contact" pageName="İletişim & Reklam">
                    <ContactPage />
                  </PageGuard>
                }
              />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            {/* Admin Layout */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="pages" element={<PagesManager />} />
              <Route path="sponsors" element={<SponsorsManager />} />
              <Route path="banners" element={<BannersManager />} />
              <Route path="wheel" element={<WheelManager />} />
              <Route path="giveaways" element={<GiveawaysManager />} />
              <Route path="store" element={<StoreManager />} />
              <Route path="settings" element={<SettingsManager />} />
              <Route path="logs" element={<LogsManager />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
