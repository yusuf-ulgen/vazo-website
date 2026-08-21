import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, X } from 'lucide-react';
import { contentRepository } from '@/entities/content/api/content-repository';
import { AnnouncementBarConfig } from '@/entities/content/types';

export function AnnouncementBar() {
  const [announcement, setAnnouncement] = useState<AnnouncementBarConfig | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    contentRepository.getAnnouncement().then((data) => {
      setAnnouncement(data);
    });
  }, []);

  if (!announcement || !announcement.isEnabled || isDismissed) {
    return null;
  }

  return (
    <aside
      aria-label="Duyuru ve Bilgilendirme"
      className="bg-canvas-warm text-text-primary border-b border-border-subtle px-4 py-2 text-xs font-sans tracking-wide transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex-1 flex items-center justify-center gap-2 text-center">
          <span className="font-normal text-text-secondary">
            {announcement.message}
          </span>
          {announcement.linkText && (
            <Link
              to={announcement.linkUrl || '/wholesale'}
              className="inline-flex items-center gap-1 font-semibold text-text-primary underline underline-offset-4 hover:opacity-75 transition-opacity ml-1.5"
            >
              <span>{announcement.linkText}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        <button
          onClick={() => setIsDismissed(true)}
          aria-label="Duyuruyu Kapat"
          className="text-text-muted hover:text-text-primary transition-colors p-1"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
}
