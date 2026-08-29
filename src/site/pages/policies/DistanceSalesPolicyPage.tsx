import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ShieldCheck, Building2 } from 'lucide-react';
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

export function DistanceSalesPolicyPage() {
  const [pageData, setPageData] = useState<ContentPageType | null>(null);
  const [legal, setLegal] = useState<SellerLegalSettings>(DEFAULT_SELLER_LEGAL);
  const [siteSettings, setSiteSettings] = useState<PublicSiteSettings>(DEFAULT_PUBLIC_SITE_SETTINGS);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      contentRepository.getContentPage('distance_sales').catch(() => null),
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
                <div className="p-4 bg-surface-secondary border border-border-subtle rounded space-y-1.5 text-xs leading-relaxed">
                  <p>
                    <strong>SATICI:</strong>{' '}
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
                    <strong>Adres:</strong>{' '}
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
                  <p>
                    <strong>ALICI:</strong> Web sitesi üzerinden sipariş oluşturan ve fatura/teslimat
                    bilgileri sipariş özetinde yer alan tüketici.
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
