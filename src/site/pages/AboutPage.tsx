import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Hammer, ShieldCheck, Heart } from 'lucide-react';
import { Container } from '@/shared/ui/Container';
import { useSEO } from '@/shared/lib/seo';
import { contentRepository, ContentPage as ContentPageType } from '@/entities/content';

export function AboutPage() {
  const [pageData, setPageData] = useState<ContentPageType | null>(null);

  useEffect(() => {
    let isMounted = true;
    contentRepository.getContentPage('about').then((data) => {
      if (isMounted && data) {
        setPageData(data);
      }
    }).catch((err) => {
      console.error('[AboutPage] Failed to fetch content:', err);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useSEO({
    title: pageData?.seoTitle || pageData?.title || 'Hakkımızda & Zanaat Hikayemiz',
    description: pageData?.seoDescription || 'Vazo Studio; İskandinav sadeliği ile geleneksel el yapımı seramik zanaatını buluşturan heykelsi vazo stüdyosudur.',
  });

  const heroSection = pageData?.sections?.find((s) => s.sectionKey === 'hero_header');
  const craftSection = pageData?.sections?.find((s) => s.sectionKey === 'story_craft');
  const materialSection = pageData?.sections?.find((s) => s.sectionKey === 'story_material');

  return (
    <div className="w-full bg-canvas-default min-h-screen">
      {/* Editorial Hero Header */}
      <section className="relative w-full bg-canvas-warm border-b border-border-subtle py-16 md:py-24 overflow-hidden">
        <Container size="lg">
          <div className="max-w-3xl text-left space-y-4">
            <span className="text-xs uppercase font-semibold tracking-editorial text-text-secondary">
              {heroSection?.eyebrow || 'Felsefemiz & Atölyemiz'}
            </span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-light text-text-primary leading-[1.1]">
              {heroSection?.title || (
                <>
                  Sessizliğin, Toprağın ve{' '}
                  <span className="font-normal italic text-text-secondary">
                    Heykelsi Formların Dengesi.
                  </span>
                </>
              )}
            </h1>
            <p className="text-sm sm:text-base text-text-secondary leading-relaxed font-sans font-normal pt-2">
              {heroSection?.content ||
                'Vazo Studio, seri üretimin tekdüzeliğine karşı bir duruş olarak doğdu. Doğal mineralli killerin el tornasında usta ellerle şekillendiği, her bir parçanın kendine has yüzey dokusu ve fırın izleri taşıdığı zamansız objeler üretiyoruz.'}
            </p>
          </div>
        </Container>
      </section>

      {/* Story Rhythm Block 1: Image Left / Text Right */}
      <section className="w-full py-16 md:py-24 border-b border-border-subtle">
        <Container size="lg">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6">
              <div className="aspect-[4/3] sm:aspect-[16/11] w-full overflow-hidden bg-surface-secondary shadow-card">
                <img
                  src={craftSection?.imageUrl || "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1200&q=85"}
                  alt={craftSection?.title || "Vazo Studio seramik el tornası zanaat süreci"}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
            </div>

            <div className="lg:col-span-6 space-y-6 text-left">
              <span className="text-xs uppercase font-semibold tracking-editorial text-text-secondary">
                {craftSection?.eyebrow || '01 / Geleneksel Zanaat'}
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-light text-text-primary">
                {craftSection?.title || 'El Tornasında Şekillenen Karakter'}
              </h2>
              {craftSection?.content ? (
                <div className="text-xs sm:text-sm text-text-secondary leading-relaxed font-sans font-normal space-y-4 whitespace-pre-line">
                  {craftSection.content}
                </div>
              ) : (
                <>
                  <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-sans font-normal">
                    Koleksiyonlarımızdaki her form, kalıplarla dökülmek yerine el tornasında tek tek döndürülerek yükselir. Bu sayede her parça, usta ellerin parmak izlerini ve kilin doğal akışını üzerinde taşır.
                  </p>
                  <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-sans font-normal">
                    Kullandığımız mineral zengini stoneware kili, 1250°C yüksek sıcaklıkta fırınlanarak taş kıvamında monolitik bir sertliğe ve %100 su geçirimsizliğe ulaşır.
                  </p>
                </>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* Story Rhythm Block 2: Text Left / Image Right */}
      <section className="w-full bg-canvas-subtle py-16 md:py-24 border-b border-border-subtle">
        <Container size="lg">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6 text-left order-2 lg:order-1">
              <span className="text-xs uppercase font-semibold tracking-editorial text-text-secondary">
                {materialSection?.eyebrow || '02 / Malzeme ve Doku'}
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-light text-text-primary">
                {materialSection?.title || 'Ham Mineraller & Dingin Mat Yüzeyler'}
              </h2>
              <div className="text-xs sm:text-sm text-text-secondary leading-relaxed font-sans font-normal">
                <p>
                  {materialSection?.content ||
                    'Parlak ve yapay sentetik cilalardan bilinçli olarak kaçınıyoruz. Tebeşir beyazı, ham terakota, volkanik bazalt kili ve kum beji tonlarındaki özel mat mineral sırlarımız mekanlara sakinleştirici bir dokunsallık kazandırır.'}
                </p>
              </div>
              <div className="pt-2">
                <Link
                  to={materialSection?.ctaUrl || '/products'}
                  className="inline-flex items-center gap-2 bg-action-primary text-action-primary-text px-8 py-3.5 text-xs uppercase font-semibold tracking-wider hover:bg-neutral-800 transition-colors shadow-xs"
                >
                  <span>{materialSection?.ctaText || 'Koleksiyonu Keşfet'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6 order-1 lg:order-2">
              <div className="aspect-[4/3] sm:aspect-[16/11] w-full overflow-hidden bg-surface-secondary shadow-card">
                <img
                  src={materialSection?.imageUrl || "https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1200&q=85"}
                  alt={materialSection?.title || "Ham mineral mat dokulu heykelsi seramik vazo"}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 4 Core Pillars Strip */}
      <section className="w-full bg-canvas-warm py-16 md:py-24 border-b border-border-subtle">
        <Container size="lg">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
            <span className="text-xs uppercase font-semibold tracking-editorial text-text-secondary">
              Değerlerimiz
            </span>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-normal text-text-primary">
              Stüdyomuzu Şekillendiren İlkeler
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 bg-surface-primary/80 border border-border-subtle text-left space-y-2.5">
              <Sparkles className="w-5 h-5 text-text-primary" />
              <h3 className="font-display text-base text-text-primary font-medium">Heykelsi Sadelik</h3>
              <p className="text-xs text-text-secondary leading-relaxed font-sans">
                Gereksiz süslemelerden arındırılmış, mimari hatlara sahip saf formlar.
              </p>
            </div>

            <div className="p-6 bg-surface-primary/80 border border-border-subtle text-left space-y-2.5">
              <Hammer className="w-5 h-5 text-text-primary" />
              <h3 className="font-display text-base text-text-primary font-medium">Özgün El İşçiliği</h3>
              <p className="text-xs text-text-secondary leading-relaxed font-sans">
                Her parça benzersizdir; seri fabrikasyon kusursuzluğu yerine zanaatın sıcaklığı.
              </p>
            </div>

            <div className="p-6 bg-surface-primary/80 border border-border-subtle text-left space-y-2.5">
              <ShieldCheck className="w-5 h-5 text-text-primary" />
              <h3 className="font-display text-base text-text-primary font-medium">1250°C Dayanıklılık</h3>
              <p className="text-xs text-text-secondary leading-relaxed font-sans">
                Yüksek fırınlama ısısı ile su geçirimsiz, çatlamaya dirençli stoneware gövde.
              </p>
            </div>

            <div className="p-6 bg-surface-primary/80 border border-border-subtle text-left space-y-2.5">
              <Heart className="w-5 h-5 text-text-primary" />
              <h3 className="font-display text-base text-text-primary font-medium">Sürdürülebilir Doğallık</h3>
              <p className="text-xs text-text-secondary leading-relaxed font-sans">
                Doğal toprak mineralleri ve geri dönüştürülebilir ambalaj malzemeleri.
              </p>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
