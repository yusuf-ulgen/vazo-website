import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, ArrowUpDown } from 'lucide-react';
import { collectionRepository } from '@/entities/collection/api/collection-repository';
import { productRepository } from '@/entities/product/api/product-repository';
import { Collection } from '@/entities/collection/types';
import { Product } from '@/entities/product/types';
import { Container } from '@/shared/ui/Container';
import { ProductCard } from '@/site/components/ProductCard';

export function CollectionDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [sortBy, setSortBy] = useState<'recommended' | 'price_asc' | 'price_desc' | 'newest'>('recommended');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!slug) return;

    setLoading(true);
    setError(null);

    collectionRepository
      .getCollectionBySlug(slug)
      .then(async (col) => {
        if (!isMounted) return;
        if (!col) {
          setError('Koleksiyon bulunamadı.');
          setLoading(false);
          return;
        }
        setCollection(col);

        const prods = await productRepository.getProducts({
          collectionId: col.id,
          sortBy,
        });
        if (!isMounted) return;
        setProducts(prods);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Koleksiyon yüklenirken bir hata oluştu.');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug, sortBy]);

  return (
    <div className="w-full bg-canvas-default min-h-screen">
      {/* Full-width Editorial Hero */}
      <div className="relative w-full bg-canvas-warm border-b border-border-subtle overflow-hidden">
        <Container size="lg" className="py-12 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-7 space-y-4 text-left">
              <Link
                to="/collections"
                className="inline-flex items-center gap-1.5 text-xs uppercase font-semibold tracking-wider text-text-secondary hover:text-text-primary transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Tüm Koleksiyonlara Dön</span>
              </Link>
              <span className="block text-xs uppercase font-semibold tracking-editorial text-text-secondary">
                Koleksiyon
              </span>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-light text-text-primary">
                {collection?.name || 'Koleksiyon'}
              </h1>
              {collection?.subtitle && (
                <p className="font-display italic text-base text-text-secondary">
                  {collection.subtitle}
                </p>
              )}
              <p className="text-xs sm:text-sm text-text-secondary max-w-xl leading-relaxed font-sans">
                {collection?.storyMarkdown || 'Doğal minerallerle şekillendirilmiş heykelsi seramik seçkisi.'}
              </p>
            </div>

            {collection?.heroImageUrl && (
              <div className="md:col-span-5">
                <div className="aspect-[16/10] w-full overflow-hidden bg-surface-secondary shadow-card">
                  <img
                    src={collection.heroImageUrl}
                    alt={collection.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        </Container>
      </div>

      {/* Main Grid Area */}
      <Container size="lg" className="py-12 md:py-16">
        {/* Sort Bar */}
        <div className="flex items-center justify-between gap-4 mb-8 border-b border-border-subtle pb-4 text-xs">
          <span className="text-text-secondary">
            {loading ? 'Yükleniyor...' : `${products.length} Model Bu Koleksiyona Ait`}
          </span>

          <div className="flex items-center gap-1.5 bg-surface-primary border border-border-default px-2.5 py-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-text-muted" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-transparent text-text-primary focus:outline-none text-xs"
              aria-label="Sıralama"
            >
              <option value="recommended">Önerilen Sıralama</option>
              <option value="newest">En Yeni Gelenler</option>
              <option value="price_asc">Fiyat: Düşükten Yükseğe</option>
              <option value="price_desc">Fiyat: Yüksekten Düşüğe</option>
            </select>
          </div>
        </div>

        {/* State Display */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3 animate-pulse">
                <div className="aspect-[3/4] bg-surface-muted" />
                <div className="h-4 bg-surface-muted w-3/4" />
                <div className="h-3 bg-surface-muted w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-16 text-center space-y-3 max-w-md mx-auto">
            <p className="font-display text-xl text-feedback-danger">{error}</p>
            <Link
              to="/collections"
              className="inline-flex items-center gap-2 bg-action-primary text-action-primary-text px-6 py-3 text-xs uppercase font-semibold"
            >
              <span>Koleksiyonlara Dön</span>
            </Link>
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center space-y-3 max-w-md mx-auto">
            <Sparkles className="w-8 h-8 text-text-muted mx-auto" />
            <p className="font-display text-xl text-text-primary">Bu koleksiyonda henüz ürün yer almıyor</p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-action-primary text-action-primary-text px-6 py-3 text-xs uppercase font-semibold"
            >
              <span>Tüm Kataloğu İncele</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                aspectRatio="portrait"
                showWholesaleBadge
              />
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
