import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Container } from '@/shared/ui/Container';

export interface ProductInspirationGridProps {
  productName: string;
}

export function ProductInspirationGrid({ productName }: ProductInspirationGridProps) {
  const photos = [
    {
      url: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=800&q=80',
      caption: 'Konsol ve Kitaplık Detayı',
    },
    {
      url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
      caption: 'Doğal Işık ve Minimal Denge',
    },
    {
      url: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=800&q=80',
      caption: 'Ahşap Yüzeyler ile Sıcak Zıtlık',
    },
    {
      url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      caption: 'Mimari Yaşam Alanı',
    },
  ];

  return (
    <section className="w-full bg-canvas-default py-16 md:py-24 border-b border-border-subtle">
      <Container size="lg">
        {/* Section Heading with Left Info & Right CTA (Reference 04) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-border-subtle text-left">
          <div className="space-y-2 max-w-xl">
            <span className="text-xs uppercase font-semibold tracking-editorial text-text-secondary">
              Mekan ve Stil İlhamı
            </span>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-light text-text-primary">
              Kullanım İlhamı
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-sans font-normal">
              {productName}, ister tek başına heykelsi bir obje olarak, ister kuru pampas ve okaliptüs dallarıyla birlikte kullanıldığında yaşam alanınıza zarif bir odak noktası katar.
            </p>
          </div>

          <Link
            to="/about"
            className="inline-flex items-center gap-2 border border-border-strong text-text-primary px-6 py-3 text-xs uppercase font-semibold tracking-wider hover:bg-surface-secondary transition-colors shrink-0"
          >
            <span>Daha Fazla İlham</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 4-Column Photo Grid (Reference 04) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {photos.map((item, idx) => (
            <div key={idx} className="group flex flex-col space-y-2">
              <div className="aspect-[4/5] w-full overflow-hidden bg-surface-secondary shadow-card">
                <img
                  src={item.url}
                  alt={`${productName} - ${item.caption}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <p className="text-[11px] text-text-secondary text-left font-sans font-normal">
                {item.caption}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
