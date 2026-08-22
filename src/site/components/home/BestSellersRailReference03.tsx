import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { Container } from '@/shared/ui/Container';
import { formatCurrency } from '@/shared/lib/formatters';
import { useWishlist } from '@/shared/stores/wishlist-store';

export function BestSellersRailReference03() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { has, toggle } = useWishlist();

  const products = [
    {
      id: 'p-lunea-01',
      slug: 'lunea-shape-no-1',
      name: 'Lunea Shape No.1',
      price: 1250,
      imageUrl: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'p-lunea-04',
      slug: 'lunea-form-no-4',
      name: 'Lunea Form No.4',
      price: 1450,
      imageUrl: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'p-lunea-02',
      slug: 'lunea-soft-no-2',
      name: 'Lunea Soft No.2',
      price: 1150,
      imageUrl: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'p-lunea-03',
      slug: 'lunea-line-no-3',
      name: 'Lunea Line No.3',
      price: 1350,
      imageUrl: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'p-lunea-05',
      slug: 'lunea-matt-no-5',
      name: 'Lunea Matt No.5',
      price: 1550,
      imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'p-lunea-06',
      slug: 'lunea-curve-no-6',
      name: 'Lunea Curve No.6',
      price: 1650,
      imageUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80',
    },
  ];

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

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
        <div className="relative group">
          {/* Left Arrow Button */}
          <button
            type="button"
            onClick={() => handleScroll('left')}
            aria-label="Önceki Ürünler"
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-surface-primary border border-border-default shadow-card text-text-primary flex items-center justify-center hover:bg-surface-secondary transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Product Grid / Horizontal Scroll Rail */}
          <div
            ref={scrollRef}
            className="grid grid-flow-col auto-cols-[calc(50%-12px)] sm:auto-cols-[calc(33.333%-16px)] lg:grid-cols-6 gap-4 sm:gap-5 overflow-x-auto no-scrollbar scroll-smooth py-1"
          >
            {products.map((item) => {
              const isFav = has(item.id);
              return (
                <div key={item.id} className="group/card flex flex-col text-left space-y-2.5">
                  {/* Image Card Container */}
                  <div className="relative aspect-square w-full overflow-hidden bg-surface-secondary">
                    <Link to={`/products/${item.slug}`} className="block w-full h-full">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                      />
                    </Link>

                    {/* Heart Wishlist Trigger */}
                    <button
                      type="button"
                      onClick={() => toggle(item.id)}
                      aria-label={isFav ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
                      className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-surface-primary/80 hover:bg-surface-primary text-text-primary flex items-center justify-center transition-colors shadow-xs"
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${isFav ? 'fill-current text-text-primary' : ''}`}
                      />
                    </button>
                  </div>

                  {/* Info below image */}
                  <div className="space-y-0.5 pt-0.5">
                    <Link
                      to={`/products/${item.slug}`}
                      className="block font-sans text-xs font-medium text-text-primary hover:text-text-secondary transition-colors truncate"
                    >
                      {item.name}
                    </Link>
                    <p className="text-xs text-text-secondary font-sans">
                      {formatCurrency(item.price)}
                    </p>
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
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-surface-primary border border-border-default shadow-card text-text-primary flex items-center justify-center hover:bg-surface-secondary transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile View All Link */}
        <div className="mt-8 text-center sm:hidden">
          <Link
            to="/bestsellers"
            className="inline-flex items-center gap-1.5 text-xs uppercase font-semibold tracking-wider text-text-primary hover:opacity-75 transition-opacity"
          >
            <span>TÜM ÜRÜNLERİ GÖR</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </Container>
    </section>
  );
}
