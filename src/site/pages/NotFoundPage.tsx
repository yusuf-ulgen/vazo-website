import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="py-32 px-6 text-center max-w-xl mx-auto space-y-6">
      <p className="text-xs uppercase tracking-editorial text-text-secondary font-semibold">
        404 — Sayfa Bulunamadı
      </p>
      <h1 className="font-display text-4xl sm:text-5xl text-text-primary">
        Aradığınız Sayfa Mevcut Değil
      </h1>
      <p className="text-sm text-text-secondary leading-relaxed">
        İstediğiniz sayfa taşınmış veya kaldırılmış olabilir. Ana sayfaya dönebilir veya koleksiyonumuzu inceleyebilirsiniz.
      </p>
      <div className="pt-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-action-primary text-action-primary-text px-6 py-3 text-xs uppercase font-semibold tracking-wide hover:bg-neutral-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Ana Sayfaya Dön</span>
        </Link>
      </div>
    </div>
  );
}
