import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, AlertCircle, Building2 } from 'lucide-react';
import { Container } from '@/shared/ui/Container';
import { useSEO } from '@/shared/lib/seo';
import { contentRepository, ContentPage as ContentPageType } from '@/entities/content';
import { settingsRepository } from '@/entities/settings/api/settings-repository';
import {
  SellerLegalSettings,
  DEFAULT_SELLER_LEGAL,
  PublicSiteSettings,
  DEFAULT_PUBLIC_SITE_SETTINGS,
} from '@/entities/settings/types';

export function PreliminaryInfoPolicyPage() {
  const [pageData, setPageData] = useState<ContentPageType | null>(null);
  const [legal, setLegal] = useState<SellerLegalSettings>(DEFAULT_SELLER_LEGAL);
  const [siteSettings, setSiteSettings] = useState<PublicSiteSettings>(DEFAULT_PUBLIC_SITE_SETTINGS);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      contentRepository.getContentPage('preliminary_info').catch(() => null),
      settingsRepository.getSellerLegal().catch(() => DEFAULT_SELLER_LEGAL),
      settingsRepository.getPublicSiteSettings().catch(() => DEFAULT_PUBLIC_SITE_SETTINGS),
    ]).then(([contentData, legalData, siteData]) => {
      if (isMounted) {
        if (contentData) setPageData(contentData);
        if (legalData) setLegal(legalData);
        if (siteData) setSiteSettings(siteData);
      }
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
                <div className="p-4 bg-surface-secondary border border-border-subtle rounded space-y-1.5 text-xs leading-relaxed">
                  <p>
                    <strong>Ticaret Unvanı:</strong>{' '}
                    {legal.legal_trade_title || siteSettings.general.brandName || 'Monocactus'}
                  </p>
                  <p>
                    <strong>İşletme Türü:</strong> {legal.business_type || 'Şahıs Şirketi'}
                  </p>
                  <p>
                    <strong>Vergi Dairesi & No:</strong>{' '}
                    {legal.tax_office && legal.tax_number
                      ? `${legal.tax_office} V.D. / ${legal.tax_number}`
                      : '—'}
                  </p>
                  <p>
                    <strong>Tebligat Adresi:</strong>{' '}
                    {legal.registered_address || siteSettings.contact.address || '—'}
                  </p>
                  <p>
                    <strong>KEP Adresi:</strong> {legal.kep_address || '—'}
                  </p>
                  <p>
                    <strong>İletişim:</strong>{' '}
                    {legal.business_phone || siteSettings.contact.phone || '—'} •{' '}
                    {legal.business_email || siteSettings.contact.email || '—'}
                  </p>
                  <div className="pt-2">
                    <Link
                      to="/seller-information"
                      className="text-text-primary font-semibold underline hover:text-accent-primary inline-flex items-center gap-1"
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      Tüm Satıcı & Yasal Bilgileri Görüntüle
                    </Link>
                  </div>
                </div>
              </section>

              <section className="space-y-3 pt-6 border-t border-border-subtle">
                <h2 className="font-display text-xl text-text-primary">
                  2. Sözleşme Konusu ve Fiyatlandırma
                </h2>
                <p>
                  Sipariş edilen ürünlerin temel özellikleri, adetleri, KDV dahil toplam satış
                  bedeli ve kargo masrafları ödeme adımındaki sipariş özetinde belirtilmiştir.
                  Fiyatlarımıza tüm yasal vergiler dahildir.
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
