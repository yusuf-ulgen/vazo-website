import { Outlet } from 'react-router-dom';
import { AnnouncementBar } from '@/site/components/AnnouncementBar';
import { SiteNavbar } from '@/site/components/SiteNavbar';
import { SiteFooter } from '@/site/components/SiteFooter';

export function SiteLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-canvas-default text-text-primary">
      <AnnouncementBar />
      <SiteNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
