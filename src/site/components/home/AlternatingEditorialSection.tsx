import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Container } from '@/shared/ui/Container';
import { contentRepository } from '@/entities/content/api/content-repository';
import { EditorialSectionConfig } from '@/entities/content/types';

const defaultEditorialSections: EditorialSectionConfig[] = [
  {
    id: 'e1',
    eyebrow: 'Yeni Koleksiyon',
    title: 'Formun sadeliği, mekâna anlam katar.',
    description:
      'Zamana meydan okuyan tasarımları ve doğal mineral malzemeleri buluşturarak yaşam alanlarınıza sade ve güçlü bir estetik kazandırıyoruz.',
    imageUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1000&q=85',
    imagePosition: 'left',
    ctaText: 'Keşfet',
    ctaUrl: '/collections/nordik-sessizlik',
  },
  {
    id: 'e2',
    eyebrow: 'El Yapımı Seramik',
    title: 'Doğadan ilham alan özgün tasarımlar.',
    description:
      'Her bir parça, usta ellerde el tornasında şekillenir ve 1250°C fırınlama ile kendine has yüzey dokusu ve ton farklılıklarına kavuşur.',
    imageUrl: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1000&q=85',
    imagePosition: 'right',
    ctaText: 'Koleksiyonu İncele',
    ctaUrl: '/products',
  },
];

export function AlternatingEditorialSection() {
  const [sections, setSections] = useState<EditorialSectionConfig[]>(defaultEditorialSections);

  useEffect(() => {
    contentRepository
      .getEditorialSections()
      .then((data) => {
        if (data && data.length > 0) {
          setSections(data);
        }
      })
      .catch(() => {
        // Keep defaults on fetch error
      });
  }, []);

  return (
    <section className="w-full bg-canvas-subtle overflow-hidden border-b border-border-subtle">
      {sections.map((section, idx) => {
        const isImageLeft = section.imagePosition === 'left';
        const isFirst = idx === 0;

        return (
          <div
            key={section.id || idx}
            className={isFirst ? 'border-b border-border-subtle' : ''}
          >
            <Container size="lg" className="py-16 md:py-24">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
                {/* Image Block */}
                <div
                  className={`lg:col-span-6 ${
                    isImageLeft ? 'order-1' : 'order-1 lg:order-2'
                  }`}
                >
                  <div className="aspect-[4/3] sm:aspect-[16/11] w-full overflow-hidden bg-surface-secondary shadow-card">
                    <img
                      src={section.imageUrl}
                      alt={section.title}
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                    />
                  </div>
                </div>

                {/* Text Block */}
                <div
                  className={`lg:col-span-6 space-y-6 text-left ${
                    isImageLeft ? 'order-2' : 'order-2 lg:order-1'
                  }`}
                >
                  <span className="text-xs uppercase font-semibold tracking-editorial text-text-secondary">
                    {section.eyebrow}
                  </span>
                  <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-light text-text-primary leading-[1.15]">
                    {section.title}
                  </h2>
                  <p className="text-sm sm:text-base text-text-secondary leading-relaxed font-sans font-normal max-w-lg">
                    {section.description}
                  </p>
                  <div className="pt-2">
                    <Link
                      to={section.ctaUrl || '/products'}
                      className={`inline-flex items-center gap-2 px-8 py-3.5 text-xs uppercase font-semibold tracking-wider transition-colors ${
                        isFirst
                          ? 'bg-brand-taupe/40 hover:bg-brand-taupe/60 text-text-primary'
                          : 'border border-text-primary text-text-primary hover:bg-action-primary hover:text-action-primary-text'
                      }`}
                    >
                      <span>{section.ctaText || 'Keşfet'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </Container>
          </div>
        );
      })}
    </section>
  );
}
