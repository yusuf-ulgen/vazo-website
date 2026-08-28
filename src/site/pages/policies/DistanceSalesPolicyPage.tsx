import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ShieldCheck } from 'lucide-react';
import { Container } from '@/shared/ui/Container';
import { useSEO } from '@/shared/lib/seo';
import { contentRepository, ContentPage as ContentPageType } from '@/entities/content';

export function DistanceSalesPolicyPage() {
  const [pageData, setPageData] = useState<ContentPageType | null>(null);

  useEffect(() => {
    let isMounted = true;
    contentRepository
      .getContentPage('distance_sales')
      .then((data) => {
        if (isMounted && data) {
          setPageData(data);
        }
      })
      .catch((err) => {
        console.error('[DistanceSalesPolicyPage] Error loading policy:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useSEO({
    title: pageData?.seoTitle || pageData?.title || 'Mesafeli Satış Sözleşmesi',
    description:
      pageData?.seoDescription ||
      'Vazo Studio e-ticaret platformu üzerinden akdedilen resmi mesafeli satış sözleşmesi ve yasal haklar bildirimi.',
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
            <span className="text-text-primary font-medium">Mesafeli Satış Sözleşmesi</span>
          </nav>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-light text-text-primary">
            {pageData?.title || 'Mesafeli Satış Sözleşmesi'}
          </h1>
        </div>

        {/* Disclaimer Notice */}
        <div className="p-4 bg-surface-secondary border border-border-default flex items-start gap-3 text-xs text-text-secondary mb-10 text-left">
          <ShieldCheck className="w-4 h-4 text-feedback-info shrink-0 mt-0.5" />
          <p>
            <strong>Resmi Hükümler:</strong> İşbu sözleşme, elektronik ortamda sipariş veren ALICI ile
            SATICI arasında sipariş onayı anında yürürlüğe girer ve tarafların hak ve
            yükümlülüklerini düzenler.
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
                  <h2>Madde 1 — Taraflar</h2>
                </div>
                <p>
                  <strong>SATICI:</strong> Vazo Studio Tasarım ve Sanat Ürünleri A.Ş.
                  <br />
                  <strong>ALICI:</strong> www.vazostudio.com üzerinden sipariş oluşturan ve kimlik
                  bilgileri sipariş özetinde yer alan tüketici.
                </p>
              </section>

              <section className="space-y-3 pt-6 border-t border-border-subtle">
                <h2 className="font-display text-xl text-text-primary">
                  Madde 2 — Sözleşmenin Konusu
                </h2>
                <p>
                  İşbu sözleşmenin konusu, ALICI'nın SATICI'ya ait internet sitesinden elektronik
                  ortamda siparişini yaptığı ürünün satışı ve teslimi ile ilgili olarak 6502 sayılı
                  Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince tarafların hak ve
                  yükümlülüklerinin saptanmasıdır.
                </p>
              </section>

              <section className="space-y-3 pt-6 border-t border-border-subtle">
                <h2 className="font-display text-xl text-text-primary">
                  Madde 3 — Yetkili Mahkeme
                </h2>
                <p>
                  İşbu sözleşmeden doğan uyuşmazlıklarda Ticaret Bakanlığınca ilan edilen parasal
                  sınırlar dahilinde ALICI'nın mal veya hizmeti satın aldığı veya ikametgahının
                  bulunduğu yerdeki Tüketici Hakem Heyetleri ile Tüketici Mahkemeleri yetkilidir.
                </p>
              </section>
            </>
          )}
        </div>
      </Container>
    </div>
  );
}
