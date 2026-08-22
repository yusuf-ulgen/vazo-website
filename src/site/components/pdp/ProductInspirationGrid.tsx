import { Link } from 'react-router-dom';
import { Container } from '@/shared/ui/Container';

export interface ProductInspirationGridProps {
  productName?: string;
}

export function ProductInspirationGrid({ productName = 'Bu model' }: ProductInspirationGridProps) {
  const photos = [
    {
      url: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=600&q=80',
      alt: 'Masa Üstü Kullanım İlhamı 1',
    },
    {
      url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80',
      alt: 'Konsol Üstü Kullanım İlhamı 2',
    },
    {
      url: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=600&q=80',
      alt: 'Kuru Çiçeklerle Kullanım İlhamı 3',
    },
    {
      url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
      alt: 'Pencere Önü Doğal Işık Kullanım İlhamı 4',
    },
  ];

  return (
    <section className="w-full bg-canvas-default py-10 md:py-14 border-b border-border-subtle">
      <Container size="lg">
        {/* 1:1 Layout with Reference 04: Left info box + Right 4-photo row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Text Card */}
          <div className="lg:col-span-4 p-6 sm:p-8 bg-surface-secondary/50 border border-border-subtle space-y-3 text-left">
            <span className="text-[11px] uppercase font-semibold tracking-editorial text-text-secondary block">
              Mekan ve Stil İlhamı
            </span>
            <h3 className="font-display text-2xl text-text-primary font-normal">
              Kullanım İlhamı
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed font-sans font-normal">
              {productName}, ister tek başına heykelsi bir obje olarak, ister kuru çiçeklerle birlikte kullanıldığında mekanınıza zarif bir odak noktası katar.
            </p>
            <div className="pt-2">
              <Link
                to="/about"
                className="inline-block border border-border-strong text-text-primary px-5 py-2.5 text-[11px] uppercase font-semibold tracking-wider hover:bg-surface-primary transition-colors"
              >
                <span>Daha Fazla İlham</span>
              </Link>
            </div>
          </div>

          {/* Right 4-Photo Row */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {photos.map((item, idx) => (
              <div key={idx} className="aspect-square w-full overflow-hidden bg-surface-secondary">
                <img
                  src={item.url}
                  alt={item.alt}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
