import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, ArrowRight, Truck } from 'lucide-react';
import { contentRepository } from '@/entities/content/api/content-repository';
import { AnnouncementBarConfig } from '@/entities/content/types';
import { useSiteSettings } from '@/shared/stores/settings-store';

export function AnnouncementBar() {
  const { settings } = useSiteSettings();
  const [announcement, setAnnouncement] = useState<AnnouncementBarConfig | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    contentRepository.getAnnouncement().then((data) => {
      setAnnouncement(data);
    }).catch(() => {});
  }, []);

  if (isDismissed) {
    return null;
  }

  // Dynamic free shipping threshold configured from Admin Panel
  const threshold = settings?.commerce?.freeShippingThreshold || 3000;
  const formattedThreshold = `${threshold.toLocaleString('tr-TR')} TL`;

  // Determine display message: custom CMS announcement or dynamic free shipping notice
  let message = `${formattedThreshold} ve Üzeri Siparişlerde Kargo Ücretsiz`;
  let linkText = 'Alışverişe Başla';
  let linkUrl = '/products';

  if (announcement && announcement.isEnabled && announcement.message?.trim()) {
    message = announcement.message.replace(/{limit}|{threshold}/gi, formattedThreshold);
    if (announcement.linkText) linkText = announcement.linkText;
    if (announcement.linkUrl) linkUrl = announcement.linkUrl;
  }

  return (
    <aside
      aria-label="Duyuru ve Bilgilendirme"
      className="bg-canvas-default text-text-primary border-b border-border-subtle px-4 py-2 text-xs font-sans tracking-wide transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center relative">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-surface-secondary border border-border-subtle text-text-secondary text-[11px] sm:text-xs">
          <Truck className="w-3.5 h-3.5 text-text-primary shrink-0" />
          <span>{message}</span>
          <Link
            to={linkUrl}
            className="inline-flex items-center gap-1 font-semibold text-text-primary underline underline-offset-4 hover:opacity-75 transition-opacity ml-1"
          >
            <span>{linkText}</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <button
          onClick={() => setIsDismissed(true)}
          aria-label="Duyuruyu Kapat"
          className="absolute right-0 text-text-muted hover:text-text-primary transition-colors p-1"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
}
