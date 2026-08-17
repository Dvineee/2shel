import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Footer } from './Footer';
import { VerticalAdBanner } from '../banners/VerticalAdBanners';
import { TopSponsorsTicker } from '../common/TopSponsorsTicker';
import { AnnouncementBanner } from '../common/AnnouncementBanner';
import { MobileBottomNav } from './MobileBottomNav';
import { useData } from '../../context/DataContext';

export const MainLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('sponsorhub_sidebar_collapsed') === 'true';
  });

  const { leftBanners, rightBanners } = useData();

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sponsorhub_sidebar_collapsed', String(next));
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#070510] text-slate-100 flex flex-col selection:bg-violet-600 selection:text-white">
      {/* Top Announcement Bar */}
      <AnnouncementBanner />

      {/* Top Full-width Sponsors Marquee Ticker */}
      <TopSponsorsTicker />

      {/* Desktop Fixed Sidebar & Mobile Off-canvas Drawer */}
      <Sidebar
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Main Content Area (Dynamically offset on desktop by sidebar width) */}
      <div
        className={`transition-all duration-300 flex flex-col min-h-screen flex-1 pb-16 lg:pb-0 ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Sticky Header */}
        <Header onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />

        {/* Responsive Content Container */}
        <div className="flex-1 flex justify-center items-start w-full px-2 sm:px-4 md:px-6 py-4">
          {/* Left Vertical Ad Banner (Only on ultra-wide screens 2XL to prevent clutter) */}
          <VerticalAdBanner position="left" banners={leftBanners} />

          {/* Center Main Stage */}
          <main className="w-full max-w-[1240px] flex-1 min-w-0">
            <Outlet />
          </main>

          {/* Right Vertical Ad Banner (Only on ultra-wide screens 2XL) */}
          <VerticalAdBanner position="right" banners={rightBanners} />
        </div>

        {/* Global Footer */}
        <Footer />
      </div>

      {/* Mobile Bottom Quick Navigation Bar (100% Mobile App UX) */}
      <MobileBottomNav onOpenMenu={() => setIsMobileMenuOpen(true)} />
    </div>
  );
};
