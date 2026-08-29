import { useState, useEffect } from 'react';
import { FileText, ExternalLink, X, Scale } from 'lucide-react';
import { useDialogFocusTrap } from '@/shared/hooks/useDialogFocusTrap';
import { settingsRepository } from '@/entities/settings/api/settings-repository';
import {
  SellerLegalSettings,
  DEFAULT_SELLER_LEGAL,
  PublicSiteSettings,
  DEFAULT_PUBLIC_SITE_SETTINGS,
} from '@/entities/settings/types';

interface LegalConsentStepProps {
  acceptedPreliminaryInfo: boolean;
  acceptedDistanceSales: boolean;
  onTogglePreliminaryInfo: (val: boolean) => void;
  onToggleDistanceSales: (val: boolean) => void;
}

export function LegalConsentStep({
  acceptedPreliminaryInfo,
  acceptedDistanceSales,
  onTogglePreliminaryInfo,
  onToggleDistanceSales,
}: LegalConsentStepProps) {
  const [activeModalKey, setActiveModalKey] = useState<'preliminary' | 'distance' | null>(null);
  const [legal, setLegal] = useState<SellerLegalSettings>(DEFAULT_SELLER_LEGAL);
  const [siteSettings, setSiteSettings] = useState<PublicSiteSettings>(DEFAULT_PUBLIC_SITE_SETTINGS);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      settingsRepository.getSellerLegal().catch(() => DEFAULT_SELLER_LEGAL),
      settingsRepository.getPublicSiteSettings().catch(() => DEFAULT_PUBLIC_SITE_SETTINGS),
    ]).then(([legalData, siteData]) => {
      if (isMounted) {
        setLegal(legalData);
        setSiteSettings(siteData);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const { containerRef } = useDialogFocusTrap<HTMLDivElement>({
    isOpen: Boolean(activeModalKey),
    onClose: () => setActiveModalKey(null),
  });

  const sellerTitle = legal.legal_trade_title || siteSettings.general.brandName || 'Monocactus';
  const sellerAddress = legal.registered_address || siteSettings.contact.address || '—';
  const sellerPhone = legal.business_phone || siteSettings.contact.phone || '—';
  const sellerEmail = legal.business_email || siteSettings.contact.email || '—';
  const sellerTax = legal.tax_office && legal.tax_number ? `${legal.tax_office} V.D. / ${legal.tax_number}` : '—';
  const mersisText = legal.mersis_number ? `MERSİS No: ${legal.mersis_number}` : 'Şahıs firması (MERSİS muafiyeti)';

  return (
    <div className="space-y-6 text-left">
      <div className="border-b border-border-subtle pb-4">
        <h2 className="font-display text-2xl text-text-primary">Yasal Onaylar & Sözleşmeler</h2>
        <p className="text-xs text-text-secondary mt-1">
          6502 sayılı Tüketicinin Korunması Kanunu gereğince siparişinizi tamamlamadan önce aşağıdaki
          sözleşmeleri onaylamanız gerekmektedir.
        </p>
      </div>

      <div className="p-5 bg-surface-primary border border-border-default rounded-sm space-y-4">
        {/* Preliminary Info Checkbox */}
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={acceptedPreliminaryInfo}
            onChange={(e) => onTogglePreliminaryInfo(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded-xs border-border-default text-text-primary focus:ring-accent-primary focus:ring-offset-1"
          />
          <div className="text-xs text-text-secondary leading-relaxed">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setActiveModalKey('preliminary');
              }}
              className="text-text-primary font-semibold underline hover:text-accent-primary mr-1 inline-flex items-center gap-0.5"
            >
              Ön Bilgilendirme Koşulları'nı
              <ExternalLink className="w-3 h-3" />
            </button>
            okudum, onaylıyorum.
          </div>
        </label>

        {/* Distance Sales Agreement Checkbox */}
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={acceptedDistanceSales}
            onChange={(e) => onToggleDistanceSales(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded-xs border-border-default text-text-primary focus:ring-accent-primary focus:ring-offset-1"
          />
          <div className="text-xs text-text-secondary leading-relaxed">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setActiveModalKey('distance');
              }}
              className="text-text-primary font-semibold underline hover:text-accent-primary mr-1 inline-flex items-center gap-0.5"
            >
              Mesafeli Satış Sözleşmesi'ni
              <ExternalLink className="w-3 h-3" />
            </button>
            okudum, onaylıyorum.
          </div>
        </label>
      </div>

      {/* Contract Preview Modal */}
      {activeModalKey && (
        <div
          ref={containerRef}
          role="dialog"
          aria-modal="true"
          aria-label={
            activeModalKey === 'preliminary' ? 'Ön Bilgilendirme Formu' : 'Mesafeli Satış Sözleşmesi'
          }
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs"
        >
          <div className="bg-surface-primary border border-border-default rounded-sm shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col">
            <div className="p-4 border-b border-border-subtle flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-text-primary" />
                <h3 className="font-display text-lg text-text-primary">
                  {activeModalKey === 'preliminary'
                    ? 'Ön Bilgilendirme Formu'
                    : 'Mesafeli Satış Sözleşmesi'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalKey(null)}
                aria-label="Kapat"
                className="p-1 text-text-muted hover:text-text-primary cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-text-secondary leading-relaxed">
              <div className="p-3.5 bg-surface-secondary border border-border-subtle rounded text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-text-primary">
                  <Scale className="w-3.5 h-3.5" />
                  <span>Resmi Satıcı Bilgileri</span>
                </div>
                <p>
                  <strong>Unvan:</strong> {sellerTitle}
                  <br />
                  <strong>Adres:</strong> {sellerAddress}
                  <br />
                  <strong>Vergi:</strong> {sellerTax}
                  <br />
                  <strong>İletişim:</strong> {sellerPhone} • {sellerEmail}
                  <br />
                  <strong>Sicil / Kayıt:</strong> {mersisText}
                </p>
              </div>

              {activeModalKey === 'preliminary' ? (
                <>
                  <p>
                    <strong>1. Konu:</strong> İşbu Ön Bilgilendirme Formu'nun konusu, ALICI'nın SATICI'ya ait internet sitesinden elektronik ortamda siparişini verdiği ürünlerin satışı ve teslimi ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince bilgilendirilmesidir.
                  </p>
                  <p>
                    <strong>2. Cayma Hakkı:</strong> Alıcı, hiçbir gerekçe göstermeksizin ve cezai şart ödemeksizin malı teslim aldığı tarihten itibaren 14 (on dört) gün içerisinde cayma hakkına sahiptir. İade gönderimlerinde anlaşmalı kargo firması kullanılır.
                  </p>
                  <p>
                    <strong>3. Teslimat & Masraflar:</strong> Kargo ücreti sipariş özeti ekranında belirtildiği şekildedir ve sipariş toplamına eklenir. Ürün, sipariş onayından itibaren yasal 30 günlük süreyi aşmamak kaydıyla kargo firmasına teslim edilir.
                  </p>
                  <p>
                    <strong>4. Şikayet ve İtiraz:</strong> Tüketici şikayetleri ve itirazları, Ticaret Bakanlığınca her yıl ilan edilen parasal sınırlar dahilinde tüketicinin yerleşim yerindeki veya tüketici işleminin yapıldığı yerdeki Tüketici Hakem Heyetlerine veya Tüketici Mahkemelerine yapılabilir.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <strong>Madde 1 — Taraflar:</strong> İşbu Mesafeli Satış Sözleşmesi, alıcı (ALICI) ile yukarıda unvan ve iletişim bilgileri belirtilen satıcı (SATICI) arasında elektronik ortamda akdedilmiştir.
                  </p>
                  <p>
                    <strong>Madde 2 — Konu:</strong> Sözleşmenin konusu, ALICI'nın SATICI'ya ait web sitesinden siparişini verdiği ürünün satışı, ödemesi ve teslimi ile ilgili hak ve yükümlülüklerin belirlenmesidir.
                  </p>
                  <p>
                    <strong>Madde 3 — Ödeme & Güvenlik:</strong> Ödemeler PayTR lisanslı ödeme geçidi üzerinden 256-bit SSL şifreleme ve 3D Secure doğrulaması ile tahsil edilir. ALICI'ya ait kart bilgileri SATICI sistemlerinde saklanmaz.
                  </p>
                  <p>
                    <strong>Madde 4 — Teslimat:</strong> Ürün, anlaşmalı kargo firması aracılığıyla ALICI'nın belirlediği teslimat adresine sigortalı ve korumalı ambalaj ile sevk edilir.
                  </p>
                </>
              )}
            </div>

            <div className="p-4 border-t border-border-subtle flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModalKey(null)}
                className="px-4 py-2 bg-text-primary text-canvas-default text-xs font-semibold hover:opacity-90 cursor-pointer"
              >
                Kapat & Devam Et
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

