import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { AnnouncementBar } from '@/site/components/AnnouncementBar';
import { SiteNavbar } from '@/site/components/SiteNavbar';
import { SiteFooter } from '@/site/components/SiteFooter';
import { PolicyBottomSheet } from '@/site/components/PolicyBottomSheet';
import { siteSettingsStore } from '@/shared/stores/settings-store';

export function SiteLayout() {
  useEffect(() => {
    siteSettingsStore.fetchSettings().catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-canvas-default text-text-primary">
      <AnnouncementBar />
      <SiteNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
      <PolicyBottomSheet />
    </div>
  );
}

