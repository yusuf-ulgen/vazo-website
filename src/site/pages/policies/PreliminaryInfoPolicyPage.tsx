import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, AlertCircle } from 'lucide-react';
import { Container } from '@/shared/ui/Container';
import { useSEO } from '@/shared/lib/seo';
import { contentRepository, ContentPage as ContentPageType } from '@/entities/content';

export function PreliminaryInfoPolicyPage() {
  const [pageData, setPageData] = useState<ContentPageType | null>(null);

  useEffect(() => {
    let isMounted = true;
    contentRepository
      .getContentPage('preliminary_info')
      .then((data) => {
        if (isMounted && data) {
          setPageData(data);
        }
      })
      .catch((err) => {
        console.error('[PreliminaryInfoPolicyPage] Error loading policy:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useSEO({
    title: pageData?.seoTitle || pageData?.title || 'Ön Bilgilendirme Koşulları',
    description:
      pageData?.seoDescription ||
      '6502 sayılı Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca alıcıya sipariş öncesi sunulan yasal ön bilgilendirme metni.',
  });

  return (
    <div className="w-full bg-canvas-default min-h-screen py-12 md:py-20">
      <Container size="md">
        {/* Header */}
        <div className="text-left space-y-3 mb-10 border-b border-border-subtle pb-6">
          <nav className="text-xs text-text-muted flex items-center gap-1.5 font-sans">
            <Link to="/" className="hover:text-text-primary transition-colors">
              Ana Sayfa
            </Link>
            <span>/</span>
            <span className="text-text-primary font-medium">Ön Bilgilendirme Koşulları</span>
          </nav>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-light text-text-primary">
            {pageData?.title || 'Ön Bilgilendirme Koşulları'}
          </h1>
        </div>

        {/* Disclaimer Notice */}
        <div className="p-4 bg-surface-secondary border border-border-default flex items-start gap-3 text-xs text-text-secondary mb-10 text-left">
          <AlertCircle className="w-4 h-4 text-feedback-info shrink-0 mt-0.5" />
          <p>
            <strong>Yasal Bilgilendirme:</strong> İşbu ön bilgilendirme metni, 6502 sayılı Tüketicinin
            Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince sipariş
            tamamlanmadan önce tüketicinin onayına sunulmaktadır.
          </p>
        </div>

        {/* Text Content */}
        <div className="space-y-8 text-left text-xs sm:text-sm font-sans text-text-secondary leading-relaxed">
          {pageData?.sections && pageData.sections.length > 0 ? (
            pageData.sections.map((sec, idx) => (
              <section
                key={sec.id || idx}
                className={`space-y-3 ${idx > 0 ? 'pt-6 border-t border-border-subtle' : ''}`}
              >
                <div className="flex items-center gap-2 text-text-primary font-display text-xl">
                  {idx === 0 && <FileText className="w-5 h-5" />}
                  <h2>{sec.title}</h2>
                </div>
                {sec.content && (
                  <div className="space-y-3 whitespace-pre-line leading-relaxed">{sec.content}</div>
                )}
              </section>
            ))
          ) : (
            <>
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-text-primary font-display text-xl">
                  <FileText className="w-5 h-5" />
                  <h2>1. Satıcı Bilgileri</h2>
                </div>
                <p>
                  <strong>Unvan:</strong> Vazo Studio Tasarım ve Sanat Ürünleri A.Ş. (Yetkili Firma
                  Ünvanı Konfigüre Edilecek)
                  <br />
                  <strong>Adres:</strong> Karaköy Tasarım Bölgesi, Kemankeş Cad. No: 42, Beyoğlu /
                  İstanbul
                  <br />
                  <strong>Telefon:</strong> +90 (212) 555 0192
                  <br />
                  <strong>E-posta:</strong> info@vazostudio.com
                </p>
              </section>

              <section className="space-y-3 pt-6 border-t border-border-subtle">
                <h2 className="font-display text-xl text-text-primary">
                  2. Sözleşme Konusu ve Fiyatlandırma
                </h2>
                <p>
                  Sipariş edilen ürünlerin temel özellikleri, adetleri, KDV dahil toplam satış
                  bedeli ve kargo masrafları ödeme adımındaki sipariş özetinde belirtilmiştir.
                  Fiyatlarımıza tüm vergiler dahildir.
                </p>
              </section>

              <section className="space-y-3 pt-6 border-t border-border-subtle">
                <h2 className="font-display text-xl text-text-primary">
                  3. Cayma Hakkı & İade Prosedürü
                </h2>
                <p>
                  Tüketici, mal tesliminden itibaren 14 gün içerisinde herhangi bir gerekçe
                  göstermeksizin ve cezai şart ödemeksizin sözleşmeden cayma hakkına sahiptir.
                </p>
              </section>
            </>
          )}
        </div>
      </Container>
    </div>
  );
}
