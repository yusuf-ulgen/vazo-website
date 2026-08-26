import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, AlertCircle } from 'lucide-react';
import { Container } from '@/shared/ui/Container';
import { useSEO } from '@/shared/lib/seo';
import { contentRepository, ContentPage as ContentPageType } from '@/entities/content';

export function TermsOfServicePage() {
  const [pageData, setPageData] = useState<ContentPageType | null>(null);

  useEffect(() => {
    let isMounted = true;
    contentRepository.getContentPage('terms').then((data) => {
      if (isMounted && data) {
        setPageData(data);
      }
    }).catch((err) => {
      console.error('[TermsOfServicePage] Error loading policy:', err);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useSEO({
    title: pageData?.seoTitle || pageData?.title || 'Kullanım Koşulları',
    description: pageData?.seoDescription || 'Vazo Studio web sitesi kullanım koşulları, fikri mülkiyet ve sipariş sözleşmesi genel şartları.',
  });

  return (
    <div className="w-full bg-canvas-default min-h-screen py-12 md:py-20">
      <Container size="md">
        {/* Header */}
        <div className="text-left space-y-3 mb-10 border-b border-border-subtle pb-6">
          <nav className="text-xs text-text-muted flex items-center gap-1.5 font-sans">
            <Link to="/" className="hover:text-text-primary transition-colors">Ana Sayfa</Link>
            <span>/</span>
            <span className="text-text-primary font-medium">Kullanım Koşulları</span>
          </nav>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-light text-text-primary">
            {pageData?.title || 'Kullanım Şartları & Mesafeli Sözleşme Genel İlkeleri'}
          </h1>
        </div>

        {/* Disclaimer Notice */}
        <div className="p-4 bg-surface-secondary border border-border-default flex items-start gap-3 text-xs text-text-secondary mb-10 text-left">
          <AlertCircle className="w-4 h-4 text-feedback-info shrink-0 mt-0.5" />
          <p>
            <strong>Hukuki Not:</strong> Vazo Studio üzerinden gerçekleştirilen tüm siparişler 6502 sayılı Tüketicinin Korunması Kanunu ve Mesafeli Sözleşmeler Yönetmeliğine tabidir.
          </p>
        </div>

        {/* Text Content */}
        <div className="space-y-8 text-left text-xs sm:text-sm font-sans text-text-secondary leading-relaxed">
          {pageData?.sections && pageData.sections.length > 0 ? (
            pageData.sections.map((sec, idx) => (
              <section key={sec.id || idx} className={`space-y-3 ${idx > 0 ? 'pt-6 border-t border-border-subtle' : ''}`}>
                <div className="flex items-center gap-2 text-text-primary font-display text-xl">
                  {idx === 0 && <FileText className="w-5 h-5" />}
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
                  <FileText className="w-5 h-5" />
                  <h2>1. Fikri Mülkiyet & Telif Hakları</h2>
                </div>
                <p>
                  Vazo Studio web sitesinde yer alan tüm vazo modelleri, görsel fotoğraflar, grafik tasarımlar, editoryal metinler ve marka logoları Vazo Studio mülkiyetindedir ve telif hakları ile korunmaktadır. İzinsiz kopyalanamaz ve ticari amaçla çoğaltılamaz.
                </p>
              </section>

              <section className="space-y-3 pt-6 border-t border-border-subtle">
                <h2 className="font-display text-xl text-text-primary">2. Mesafeli Satış & Sipariş Koşulları</h2>
                <p>
                  Modellerimiz el tornasında tek tek üretildiği ve doğal mineralli sırlarla fırınlandığı için ürün boyutlarında ve yüzey tonlarında hafif varyasyonlar görülebilir. Bu durum bir hata değil, el işçiliğinin ve seramik zanaatının özgün bir karakteridir.
                </p>
              </section>
            </>
          )}
        </div>
      </Container>
    </div>
  );
}
