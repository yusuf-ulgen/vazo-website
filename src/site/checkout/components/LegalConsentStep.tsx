import { useState } from 'react';
import { FileText, ExternalLink, X } from 'lucide-react';
import { useDialogFocusTrap } from '@/shared/hooks/useDialogFocusTrap';

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

  const { containerRef } = useDialogFocusTrap<HTMLDivElement>({
    isOpen: Boolean(activeModalKey),
    onClose: () => setActiveModalKey(null),
  });

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
                className="p-1 text-text-muted hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-text-secondary leading-relaxed">
              {activeModalKey === 'preliminary' ? (
                <>
                  <p>
                    <strong>1. Satıcı:</strong> Vazo Studio Tasarım ve Sanat Ürünleri A.Ş.
                    <br />
                    <strong>Adres:</strong> Karaköy Tasarım Bölgesi, Kemankeş Cad. No: 42, Beyoğlu /
                    İstanbul
                  </p>
                  <p>
                    <strong>2. Cayma Hakkı:</strong> Alıcı, hiçbir gerekçe göstermeksizin ve cezai şart
                    ödemeksizin malı teslim aldığı tarihten itibaren 14 gün içerisinde cayma hakkına
                    sahiptir.
                  </p>
                  <p>
                    <strong>3. Şikayet ve İtiraz:</strong> Tüketici şikayetleri Ticaret Bakanlığınca
                    belirlenen parasal sınırlar dahilinde Tüketici Hakem Heyetlerine yapılabilir.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <strong>Madde 1 — Taraflar:</strong> İşbu sözleşme, alıcı ile satıcı arasında
                    elektronik sipariş sürecinde akdedilmiştir.
                  </p>
                  <p>
                    <strong>Madde 2 — Konu:</strong> Sözleşmenin konusu, alıcının satıcıya ait web
                    sitesinden elektronik ortamda siparişini verdiği ürünün satışı ve teslimidir.
                  </p>
                  <p>
                    <strong>Madde 3 — Teslimat:</strong> Ürün, anlaşmalı kargo firması aracılığıyla
                    alıcının belirlediği teslimat adresine sigortalı olarak sevk edilir.
                  </p>
                </>
              )}
            </div>

            <div className="p-4 border-t border-border-subtle flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModalKey(null)}
                className="px-4 py-2 bg-text-primary text-canvas-default text-xs font-semibold hover:opacity-90"
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
