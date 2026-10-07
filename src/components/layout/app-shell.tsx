import { useState } from 'react';
import { Outlet } from 'react-router-dom';

import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

export function AppShell() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar (visible on md and up) */}
      <Sidebar className="hidden w-64 shrink-0 md:flex" />

      {/* Mobile Drawer (visible when isMobileNavOpen is true) */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileNavOpen(false)}
            aria-hidden="true"
          />
          <Sidebar
            className="relative z-50 w-72 max-w-[85vw] shadow-2xl"
            onItemClick={() => setIsMobileNavOpen(false)}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          onToggleMobileNav={() => setIsMobileNavOpen((prev) => !prev)}
          isMobileNavOpen={isMobileNavOpen}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
