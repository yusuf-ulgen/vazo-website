import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import { Container } from '@/shared/ui/Container';
import { useSEO } from '@/shared/lib/seo';
import { contentRepository, ContentPage as ContentPageType } from '@/entities/content';

export function PrivacyKvkkPolicyPage() {
  const [pageData, setPageData] = useState<ContentPageType | null>(null);

  useEffect(() => {
    let isMounted = true;
    contentRepository.getContentPage('privacy_kvkk').then((data) => {
      if (isMounted && data) {
        setPageData(data);
      }
    }).catch((err) => {
      console.error('[PrivacyKvkkPolicyPage] Error loading policy:', err);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useSEO({
    title: pageData?.seoTitle || pageData?.title || 'Gizlilik & KVKK Aydınlatma Metni',
    description: pageData?.seoDescription || 'Vazo Studio 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) uyarınca aydınlatma ve gizlilik politikası.',
  });

  return (
    <div className="w-full bg-canvas-default min-h-screen py-12 md:py-20">
      <Container size="md">
        {/* Header */}
        <div className="text-left space-y-3 mb-10 border-b border-border-subtle pb-6">
          <nav className="text-xs text-text-muted flex items-center gap-1.5 font-sans">
            <Link to="/" className="hover:text-text-primary transition-colors">Ana Sayfa</Link>
            <span>/</span>
            <span className="text-text-primary font-medium">Gizlilik & KVKK</span>
          </nav>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-light text-text-primary">
            {pageData?.title || 'Gizlilik Politikası & KVKK Aydınlatma Metni'}
          </h1>
        </div>

        {/* Disclaimer Notice */}
        <div className="p-4 bg-surface-secondary border border-border-default flex items-start gap-3 text-xs text-text-secondary mb-10 text-left">
          <AlertCircle className="w-4 h-4 text-feedback-info shrink-0 mt-0.5" />
          <p>
            <strong>Hukuki Not:</strong> Bu sayfa bilgilendirme amaçlıdır. 6698 sayılı KVKK uyarınca aydınlatma metni ve açık rıza süreçleri stüdyo politikamız kapsamındadır.
          </p>
        </div>

        {/* Dynamic / Structured Text Content */}
        <div className="space-y-8 text-left text-xs sm:text-sm font-sans text-text-secondary leading-relaxed">
          {pageData?.sections && pageData.sections.length > 0 ? (
            pageData.sections.map((sec, idx) => (
              <section key={sec.id || idx} className={`space-y-3 ${idx > 0 ? 'pt-6 border-t border-border-subtle' : ''}`}>
                <div className="flex items-center gap-2 text-text-primary font-display text-xl">
                  {idx === 0 && <ShieldCheck className="w-5 h-5" />}
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
                  <ShieldCheck className="w-5 h-5" />
                  <h2>1. Veri Sorumlusu</h2>
                </div>
                <p>
                  6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, Vazo Studio ("Şirket") olarak veri sorumlusu sıfatıyla kişisel verilerinizi kanuna uygun şekilde işlemekte ve korumaktayız.
                </p>
              </section>

              <section className="space-y-3 pt-6 border-t border-border-subtle">
                <h2 className="font-display text-xl text-text-primary">2. İşlenen Kişisel Veriler & Güvenlik</h2>
                <p>
                  Web sitemizi ziyaretiniz ve sipariş süreçleriniz kapsamında; ad-soyad, teslimat ve fatura adresi, e-posta adresi, telefon numarası ve IP adresi verileriniz işlenir.
                </p>
                <p>
                  Kredi kartı ve ödeme bilgileri doğrudan lisanslı ödeme kuruluşunun PCI-DSS standartlarındaki güvenli altyapısında işlenir; stüdyomuz sunucularında kart bilgisi tutulmaz.
                </p>
              </section>
            </>
          )}
        </div>
      </Container>
    </div>
  );
}
