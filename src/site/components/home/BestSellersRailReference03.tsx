import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Heart, AlertCircle, RefreshCw } from 'lucide-react';
import { Container } from '@/shared/ui/Container';
import { formatCurrency } from '@/shared/lib/formatters';
import { useWishlist } from '@/shared/stores/wishlist-store';
import { productRepository } from '@/entities/product/api/product-repository';
import type { Product } from '@/entities/product/types';

export function BestSellersRailReference03() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { has, toggle } = useWishlist();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadBestsellers = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await productRepository.getBestsellers(6);
      setProducts(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Çok satan ürünler yüklenemedi.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBestsellers();
  }, []);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      if (typeof scrollRef.current.scrollBy === 'function') {
        scrollRef.current.scrollBy({
          left: direction === 'left' ? -scrollAmount : scrollAmount,
          behavior: 'smooth',
        });
      }
    }
  };

  if (errorMessage) {
    return (
      <section className="w-full bg-canvas-default py-12 md:py-16 border-b border-border-subtle">
        <Container size="lg">
          <div className="max-w-md mx-auto p-6 bg-feedback-error/10 border border-feedback-error/20 rounded-lg text-feedback-error text-center space-y-3">
            <AlertCircle className="w-6 h-6 mx-auto" />
            <p className="text-xs">{errorMessage}</p>
            <button
              type="button"
              onClick={loadBestsellers}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded bg-feedback-error text-white hover:bg-feedback-error/90 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Tekrar Dene</span>
            </button>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className="w-full bg-canvas-default py-12 md:py-20 border-b border-border-subtle">
      <Container size="lg">
        {/* Section Header (Reference 03) */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="text-center sm:text-left mx-auto sm:mx-0">
            <span className="text-xs uppercase font-semibold tracking-editorial text-text-secondary block">
              EN ÇOK TERCİH EDİLENLER
            </span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-normal text-text-primary mt-1">
              Çok Satan Vazo Modelleri
            </h2>
          </div>

          <Link
            to="/bestsellers"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs uppercase font-semibold tracking-wider text-text-primary hover:opacity-75 transition-opacity"
          >
            <span>TÜM ÜRÜNLERİ GÖR</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Carousel Container with Left/Right Buttons */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-3/4 bg-surface-secondary/40 animate-pulse rounded-sm" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-xs text-text-muted border border-dashed border-border-subtle rounded-md">
            Şu anda öne çıkan çok satan ürün bulunmamaktadır.
          </div>
        ) : (
          <div className="relative group">
            {/* Left Arrow Button */}
            <button
              type="button"
              onClick={() => handleScroll('left')}
              aria-label="Önceki Ürünler"
              className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-surface-primary border border-border-default shadow-card text-text-primary flex items-center justify-center hover:bg-surface-secondary hover:scale-105 active:scale-95 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Scrollable Rail */}
            <div
              ref={scrollRef}
              className="flex gap-7 md:gap-9 overflow-x-auto scroll-smooth pb-4 pt-1 px-1 scrollbar-none snap-x snap-mandatory"
            >
              {products.map((p) => {
                const primaryImage = p.images.find((img) => img.isPrimary)?.url || p.images[0]?.url || '/placeholder-vase.jpg';
                const isSaved = has(p.id);

                return (
                  <div
                    key={p.id}
                    className="w-[240px] sm:w-[260px] md:w-[280px] shrink-0 snap-start flex flex-col group/card bg-surface-primary border border-border-subtle overflow-hidden transition-all duration-300 hover:shadow-card"
                  >
                    {/* Image Area */}
                    <div className="relative aspect-3/4 overflow-hidden bg-surface-secondary">
                      <Link to={`/products/${p.slug}`} className="block w-full h-full">
                        <img
                          src={primaryImage}
                          alt={p.name}
                          className="w-full h-full object-cover object-center group-hover/card:scale-105 transition-transform duration-500"
                        />
                      </Link>

                      {/* Wishlist Button */}
                      <button
                        type="button"
                        onClick={() => toggle(p.id)}
                        aria-label={isSaved ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                        className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-surface-primary/80 backdrop-blur-xs flex items-center justify-center text-text-primary hover:bg-surface-primary transition-colors shadow-xs"
                      >
                        <Heart className={`w-4 h-4 ${isSaved ? 'fill-accent-primary text-accent-primary' : ''}`} />
                      </button>
                    </div>

                    {/* Meta Area */}
                    <div className="p-4 flex flex-col justify-between flex-1 space-y-3">
                      <div>
                        <Link to={`/products/${p.slug}`}>
                          <h3 className="font-serif text-sm font-medium text-text-primary group-hover/card:text-accent-primary transition-colors line-clamp-1">
                            {p.name}
                          </h3>
                        </Link>
                        {p.material && (
                          <span className="text-[11px] text-text-muted mt-0.5 block">{p.material}</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
                        <span className="font-mono text-xs font-semibold text-text-primary">
                          {formatCurrency(p.retailPrice)}
                        </span>
                        <Link
                          to={`/products/${p.slug}`}
                          className="text-[11px] font-semibold text-accent-primary uppercase tracking-wider hover:underline"
                        >
                          İncele
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Arrow Button */}
            <button
              type="button"
              onClick={() => handleScroll('right')}
              aria-label="Sonraki Ürünler"
              className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-surface-primary border border-border-default shadow-card text-text-primary flex items-center justify-center hover:bg-surface-secondary hover:scale-105 active:scale-95 transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </Container>
    </section>
  );
}
