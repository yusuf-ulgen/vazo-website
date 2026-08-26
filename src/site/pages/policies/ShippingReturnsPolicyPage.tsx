import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Truck, ShieldCheck } from 'lucide-react';
import { Container } from '@/shared/ui/Container';
import { useSEO } from '@/shared/lib/seo';
import { contentRepository, ContentPage as ContentPageType } from '@/entities/content';

export function ShippingReturnsPolicyPage() {
  const [pageData, setPageData] = useState<ContentPageType | null>(null);

  useEffect(() => {
    let isMounted = true;
    contentRepository.getContentPage('shipping_returns').then((data) => {
      if (isMounted && data) {
        setPageData(data);
      }
    }).catch((err) => {
      console.error('[ShippingReturnsPolicyPage] Error loading policy:', err);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useSEO({
    title: pageData?.seoTitle || pageData?.title || 'Teslimat, Kargo & İade Bilgilendirmesi',
    description: pageData?.seoDescription || 'Vazo Studio kargo teslimat süreçleri, ambalaj güvenliği ve 14 gün yasal iade bilgilendirmesi.',
  });

  return (
    <div className="w-full bg-canvas-default min-h-screen py-12 md:py-20">
      <Container size="md">
        {/* Header */}
        <div className="text-left space-y-3 mb-10 border-b border-border-subtle pb-6">
          <nav className="text-xs text-text-muted flex items-center gap-1.5 font-sans">
            <Link to="/" className="hover:text-text-primary transition-colors">Ana Sayfa</Link>
            <span>/</span>
            <span className="text-text-primary font-medium">Teslimat & İade</span>
          </nav>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-light text-text-primary">
            {pageData?.title || 'Kargo, Teslimat & İade Bilgilendirmesi'}
          </h1>
        </div>

        {/* Legal Disclaimer Box */}
        <div className="p-4 bg-surface-secondary border border-border-default flex items-start gap-3 text-xs text-text-secondary mb-10 text-left">
          <AlertCircle className="w-4 h-4 text-feedback-info shrink-0 mt-0.5" />
          <p>
            <strong>Bilgilendirme:</strong> Vazo Studio tüm gönderileri özel darbe sönümleyici ambalajlarla sevk eder ve taşıma risklerine karşı tam koruma sağlar.
          </p>
        </div>

        {/* Policy Sections */}
        <div className="space-y-8 text-left text-xs sm:text-sm font-sans text-text-secondary leading-relaxed">
          {pageData?.sections && pageData.sections.length > 0 ? (
            pageData.sections.map((sec, idx) => (
              <section key={sec.id || idx} className={`space-y-3 ${idx > 0 ? 'pt-6 border-t border-border-subtle' : ''}`}>
                <div className="flex items-center gap-2 text-text-primary font-display text-xl">
                  {idx === 0 ? <Truck className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5 text-feedback-success" />}
                  <h2>{sec.title}</h2>
                </div>
                {sec.content && (
                  <div className="space-y-3 whitespace-pre-line leading-relaxed">
                    {sec.content}
                  </div>
                )}
              </section>
            ))
          ) : (
            <>
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-text-primary font-display text-xl">
                  <Truck className="w-5 h-5" />
                  <h2>1. Kargo & Teslimat Süreçleri</h2>
                </div>
                <p>
                  Siparişleriniz, darbelere ve basınca karşı özel olarak tasarlanmış polietilen köpük takviyeli çift kat oluklu mukavva kutularda paketlenir.
                </p>
                <p>
                  Stoklu perakende siparişleri anlaşmalı kargo firmalarına teslim edilir. Kargo takip kodunuz e-posta ile iletilmektedir. Belirlenen sepet tutarı üzerindeki perakende alışverişlerde kargo ücretsizdir.
                </p>
              </section>

              <section className="space-y-3 pt-6 border-t border-border-subtle">
                <div className="flex items-center gap-2 text-text-primary font-display text-xl">
                  <ShieldCheck className="w-5 h-5 text-feedback-success" />
                  <h2>2. Hasarsız Teslimat ve Ambalaj Güvencesi</h2>
                </div>
                <p>
                  El yapımı seramik ürünlerimizin taşınma sürecindeki güvenliği için yüksek standartta koruyucu ambalajlama yapılmaktadır. Kargo teslimi sırasında tespit edilen hasarlarda, fotoğraflı bildiriminizle birlikte gerekli telafi ve destek süreci başlatılır.
                </p>
              </section>
            </>
          )}
        </div>
      </Container>
    </div>
  );
}
