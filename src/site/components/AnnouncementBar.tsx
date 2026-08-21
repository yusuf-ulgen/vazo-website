import { Link } from 'react-router-dom';
import { ArrowRight, X } from 'lucide-react';
import { siteConfig } from '@/shared/config/site-config';
import { useDisclosure } from '@/shared/hooks/useDisclosure';

export function AnnouncementBar() {
  const { isOpen: isVisible, close: dismiss } = useDisclosure(true);

  if (!siteConfig.announcement.enabled || !isVisible) {
    return null;
  }

  return (
    <aside
      aria-label="Duyuru ve Bilgilendirme"
      className="bg-surface-inverse text-text-inverse px-4 py-2 text-xs md:text-sm font-sans tracking-wide transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex-1 flex items-center justify-center gap-2 text-center">
          <span className="font-light opacity-95">
            {siteConfig.announcement.text}
          </span>
          {siteConfig.announcement.actionText && (
            <Link
              to={siteConfig.announcement.actionUrl || '/wholesale'}
              className="inline-flex items-center gap-1 font-medium underline underline-offset-4 hover:opacity-80 transition-opacity ml-1"
            >
              <span>{siteConfig.announcement.actionText}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        <button
          onClick={dismiss}
          aria-label="Duyuruyu Kapat"
          className="text-text-inverse/70 hover:text-text-inverse transition-colors p-1"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
}
