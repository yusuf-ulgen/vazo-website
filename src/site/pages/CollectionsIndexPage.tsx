import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { collectionRepository } from '@/entities/collection/api/collection-repository';
import { Collection } from '@/entities/collection/types';
import { Container } from '@/shared/ui/Container';

export function CollectionsIndexPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    collectionRepository.getCollections().then((data) => {
      setCollections(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="w-full bg-canvas-default min-h-screen py-12 md:py-20">
      <Container size="lg">
        {/* Page Header */}
        <div className="text-left space-y-3 mb-12 md:mb-16 border-b border-border-subtle pb-6">
          <span className="text-xs uppercase font-semibold tracking-editorial text-text-secondary">
            Kürasyon & Seriler
          </span>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-light text-text-primary">
            Koleksiyonlar
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary max-w-xl leading-relaxed font-sans">
            İskandinav yalınlığı, Akdeniz amfora hatları ve brütalist taş dokularından ilham alan tematik seramik serilerimiz.
          </p>
        </div>

        {/* Collections Stack */}
        {loading ? (
          <div className="space-y-12">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="aspect-[21/9] bg-surface-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-16">
            {collections.map((col, index) => (
              <div
                key={col.id}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center border border-border-subtle p-6 sm:p-10 bg-surface-secondary"
              >
                {/* Image */}
                <div className={`lg:col-span-7 ${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                  <div className="aspect-[16/10] w-full overflow-hidden bg-surface-muted">
                    <img
                      src={col.heroImageUrl || 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1200&q=80'}
                      alt={col.name}
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                    />
                  </div>
                </div>

                {/* Details */}
                <div className={`lg:col-span-5 space-y-5 text-left ${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                  <span className="text-xs uppercase font-semibold tracking-editorial text-text-secondary">
                    Koleksiyon No: 0{index + 1}
                  </span>
                  <h2 className="font-display text-2xl sm:text-3xl font-light text-text-primary">
                    {col.name}
                  </h2>
                  {col.subtitle && (
                    <p className="font-display italic text-sm sm:text-base text-text-secondary">
                      {col.subtitle}
                    </p>
                  )}
                  <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-sans">
                    {col.storyMarkdown || 'Doğal mineralli kilden el tornasında şekillendirilmiş heykelsi vazo koleksiyonu.'}
                  </p>

                  <div className="pt-2">
                    <Link
                      to={`/collections/${col.slug}`}
                      className="inline-flex items-center gap-2 bg-action-primary text-action-primary-text px-6 py-3.5 text-xs uppercase font-semibold tracking-wider hover:bg-neutral-800 transition-colors shadow-xs"
                    >
                      <span>Koleksiyonu İncele</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
