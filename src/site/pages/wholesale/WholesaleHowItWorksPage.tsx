import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Container } from '@/shared/ui/Container';
import { useSEO } from '@/shared/lib/seo';
import { contentRepository, ContentPage as ContentPageType } from '@/entities/content';

export function WholesaleHowItWorksPage() {
  const [pageData, setPageData] = useState<ContentPageType | null>(null);

  useEffect(() => {
    let isMounted = true;
    contentRepository.getContentPage('wholesale_how_it_works').then((data) => {
      if (isMounted && data) {
        setPageData(data);
      }
    }).catch((err) => {
      console.error('[WholesaleHowItWorksPage] Error loading page:', err);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useSEO({
    title: pageData?.seoTitle || pageData?.title || 'Toptan Nasıl Çalışır? | Vazo Studio',
    description: pageData?.seoDescription || 'Toptan sipariş adımları, numune süreci, özel sır geliştirme ve lojistik teslimat aşamaları.',
  });

  const steps = [
    {
      step: '01',
      title: 'Başvuru & İhtiyaç Belirleme',
      description:
        'Online başvuru formumuz üzerinden veya doğrudan toptan temsilcimizle iletişime geçerek projenizin kapsamını, ilgilendiğiniz model ve yaklaşık adetleri paylaşırsınız.',
      subPoints: ['Mimari proje çizimleri ve yerleşim planı desteği', 'Toptan katalog ve miktar kademeleri incelemesi'],
    },
    {
      step: '02',
      title: 'Numune & Sır Onayı',
      description:
        'Karar verme sürecinizi kolaylaştırmak amacıyla, seçtiğiniz modellerin mini numunelerini veya özel sır renk kartelasını ofisinize kargoluyoruz.',
      subPoints: ['RAL / Pantone renk eşleme', 'Farklı yüzey dokuları (mat, ham mineral, pürüzlü) testi'],
    },
    {
      step: '03',
      title: 'Resmi Teklif & Termin Takvimi',
      description:
        'Onaylanan adet ve varyantlar doğrultusunda KDV hariç net toptan teklifiniz ve atölye üretim termin takvimi (genellikle 10-25 iş günü) hazırlanır.',
      subPoints: ['Şirketinize özel cari hesap / e-fatura açılışı', 'Esnek ödeme ve avans koşulları'],
    },
    {
      step: '04',
      title: 'El Yapımı Üretim & Kalite Kontrol',
      description:
        'Seramik ustalarımız el tornasında modelleri şekillendirir, sırlama işlemi tamamlanır ve 1250°C fırınlama sonrası her parça tek tek incelenir.',
      subPoints: ['%100 su geçirimsizlik ve mikrometrik ölçü kontrolü', 'Özel logo veya marka mühürleme opsiyonu'],
    },
    {
      step: '05',
      title: 'Sigortalı Paletli Sevkiyat',
      description:
        'Ürünler darbe sönümleyici özel kesim süngerlerle sandıklanır, paletlenir ve şantiye ya da mağaza adresinize tam kasko sigortalı teslim edilir.',
      subPoints: ['Anlaşmalı kargo ve özel ambar lojistik takibi', 'Yurt dışı projeler için ihracat ve gümrük belgeleri'],
    },
  ];

  return (
    <div className="w-full bg-canvas-default min-h-screen py-12 md:py-20">
      <Container size="lg">
        {/* Header */}
        <div className="text-left space-y-3 mb-12 md:mb-16 border-b border-border-subtle pb-6">
          <nav className="text-xs text-text-muted flex items-center gap-1.5 font-sans">
            <Link to="/" className="hover:text-text-primary transition-colors">Ana Sayfa</Link>
            <span>/</span>
            <Link to="/wholesale" className="hover:text-text-primary transition-colors">Toptan</Link>
            <span>/</span>
            <span className="text-text-primary font-medium">Süreç Nasıl İşler?</span>
          </nav>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-light text-text-primary">
            {pageData?.title || 'Toptan Sipariş & Üretim Süreci'}
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary max-w-xl leading-relaxed font-sans">
            {pageData?.seoDescription ||
              'İlk temastan şantiye teslimine kadar mimari ve ticari projelerinizde şeffaf, güvenilir ve esnek işleyiş.'}
          </p>
        </div>

        {/* Steps Timeline */}
        <div className="space-y-8 md:space-y-12">
          {steps.map((item) => (
            <div
              key={item.step}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 sm:p-8 bg-surface-primary border border-border-subtle rounded-lg shadow-card text-left transition-all hover:border-border-default"
            >
              {/* Step indicator */}
              <div className="lg:col-span-2 flex items-center lg:items-start">
                <span className="font-display text-3xl sm:text-4xl lg:text-5xl font-light text-text-muted">
                  {item.step}
                </span>
              </div>

              {/* Step Content */}
              <div className="lg:col-span-6 space-y-3">
                <h3 className="font-display text-xl sm:text-2xl text-text-primary font-medium">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-sans font-normal">
                  {item.description}
                </p>
              </div>

              {/* Sub points */}
              <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-border-subtle pt-4 lg:pt-0 lg:pl-6 space-y-2.5 flex flex-col justify-center">
                {item.subPoints.map((pt) => (
                  <div key={pt} className="flex items-start gap-2 text-xs text-text-secondary">
                    <CheckCircle2 className="w-4 h-4 text-feedback-success shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA Banner */}
        <div className="mt-16 p-8 sm:p-12 bg-canvas-warm border border-border-subtle rounded-lg text-center space-y-4">
          <h2 className="font-display text-2xl sm:text-3xl text-text-primary">
            Projenizi Birlikte Hayata Geçirelim
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary max-w-lg mx-auto">
            Hızlı teklif almak ve numune talebinde bulunmak için kurumsal başvuru formunu doldurun.
          </p>
          <div className="pt-2">
            <Link
              to="/wholesale/apply"
              className="inline-flex items-center gap-2 bg-action-primary text-action-primary-text px-8 py-4 text-xs uppercase font-semibold tracking-wider hover:bg-neutral-800 transition-colors shadow-xs"
            >
              <span>Hemen Başvurun</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
