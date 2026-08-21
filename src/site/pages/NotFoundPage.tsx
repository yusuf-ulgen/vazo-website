import { Link } from 'react-router-dom';
import { ArrowLeft, Search, Sparkles } from 'lucide-react';
import { Container } from '@/shared/ui/Container';
import { useSEO } from '@/shared/lib/seo';

export function NotFoundPage() {
  useSEO({
    title: '404 — Sayfa Bulunamadı',
    description: 'Aradığınız sayfa kaldırılmış veya taşınmış olabilir.',
  });

  return (
    <div className="w-full bg-canvas-default min-h-[70vh] flex items-center justify-center py-24">
      <Container size="sm" className="text-center space-y-6">
        <div className="w-14 h-14 bg-surface-secondary mx-auto flex items-center justify-center text-text-muted">
          <Sparkles className="w-6 h-6" />
        </div>

        <span className="text-xs uppercase font-semibold tracking-editorial text-text-secondary">
          404 — Sayfa Bulunamadı
        </span>

        <h1 className="font-display text-3xl sm:text-5xl font-light text-text-primary">
          Aradığınız Form Mevcut Değil
        </h1>

        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-md mx-auto font-sans">
          Ulaşmak istediğiniz sayfa taşınmış, adı değişmiş veya geçici olarak kullanım dışı kalmış olabilir.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 bg-action-primary text-action-primary-text px-8 py-3.5 text-xs uppercase font-semibold tracking-wider hover:bg-neutral-800 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ana Sayfaya Dön</span>
          </Link>

          <Link
            to="/products"
            className="inline-flex items-center justify-center gap-2 border border-border-strong text-text-primary px-8 py-3.5 text-xs uppercase font-semibold tracking-wider hover:bg-surface-secondary transition-colors"
          >
            <Search className="w-4 h-4" />
            <span>Koleksiyonu İncele</span>
          </Link>
        </div>
      </Container>
    </div>
  );
}
