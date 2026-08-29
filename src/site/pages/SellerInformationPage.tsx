import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  ShieldCheck,
  CreditCard,
  Mail,
  Phone,
  MapPin,
  FileText,
  Lock,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Container } from '@/shared/ui/Container';
import { useSEO } from '@/shared/lib/seo';
import { settingsRepository } from '@/entities/settings/api/settings-repository';
import {
  SellerLegalSettings,
  DEFAULT_SELLER_LEGAL,
  PublicSiteSettings,
  DEFAULT_PUBLIC_SITE_SETTINGS,
} from '@/entities/settings/types';

export function SellerInformationPage() {
  const [legal, setLegal] = useState<SellerLegalSettings>(DEFAULT_SELLER_LEGAL);
  const [siteSettings, setSiteSettings] = useState<PublicSiteSettings>(DEFAULT_PUBLIC_SITE_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      settingsRepository.getSellerLegal().catch(() => DEFAULT_SELLER_LEGAL),
      settingsRepository.getPublicSiteSettings().catch(() => DEFAULT_PUBLIC_SITE_SETTINGS),
    ]).then(([legalData, siteData]) => {
      if (isMounted) {
        setLegal(legalData);
        setSiteSettings(siteData);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const brandName = legal.brand_name || siteSettings.general.brandName || 'Monocactus';
  const tradeTitle = legal.legal_trade_title || brandName;

  useSEO({
    title: `Satıcı & Yasal Bilgiler | ${brandName}`,
    description: `${brandName} resmi satıcı bilgileri, vergi ve tebligat adresi, KEP bilgileri ve güvenli ödeme altyapısı bildirimi.`,
    canonicalUrl: '/seller-information',
  });

  return (
    <div className="w-full bg-canvas-default min-h-screen py-10 md:py-16 text-left">
      <Container size="md">
        {/* Breadcrumb Header */}
        <div className="space-y-3 mb-10 border-b border-border-subtle pb-6">
          <nav className="text-xs text-text-muted flex items-center gap-1.5 font-sans">
            <Link to="/" className="hover:text-text-primary transition-colors">
              Ana Sayfa
            </Link>
            <span>/</span>
            <span className="text-text-primary font-medium">Satıcı Bilgileri</span>
          </nav>

          <h1 className="font-display text-3xl sm:text-4xl text-text-primary font-normal">
            Satıcı & Yasal Bilgiler
          </h1>
          <p className="text-xs text-text-secondary leading-relaxed">
            6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Elektronik Ticarette Hizmet Sağlayıcılar
            ve Aracı Hizmet Sağlayıcılar Hakkında Yönetmelik uyarınca yasal bilgilendirme.
          </p>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-xs text-text-muted flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Yasal satıcı bilgileri yükleniyor...</span>
          </div>
        ) : (
          <div className="space-y-8">
            {/* 1. Seller Legal Entity Card */}
            <div className="bg-surface-primary border border-border-default rounded-sm p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center gap-3 border-b border-border-subtle pb-4">
                <div className="w-9 h-9 rounded bg-surface-secondary flex items-center justify-center text-text-primary shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-text-primary">
                    İşletme & Tacir Kimlik Bilgileri
                  </h2>
                  <p className="text-xs text-text-secondary">
                    Resmi vergi dairesi ve sicil kayıtlarına tabi ticari unvan.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-xs">
                <div>
                  <span className="text-text-muted block">Yasal Ticaret Unvanı</span>
                  <span className="font-semibold text-text-primary text-sm mt-0.5 block">
                    {tradeTitle || '—'}
                  </span>
                </div>

                <div>
                  <span className="text-text-muted block">Marka Adı</span>
                  <span className="font-semibold text-text-primary text-sm mt-0.5 block">
                    {brandName}
                  </span>
                </div>

                <div>
                  <span className="text-text-muted block">İşletme Türü</span>
                  <span className="text-text-primary font-medium mt-0.5 block">
                    {legal.business_type || 'Şahıs Şirketi / Gerçek Kişi Tacir'}
                  </span>
                </div>

                <div>
                  <span className="text-text-muted block">Yetkili / İşletme Sahibi</span>
                  <span className="text-text-primary font-medium mt-0.5 block">
                    {legal.owner_full_name || '—'}
                  </span>
                </div>

                <div>
                  <span className="text-text-muted block">Vergi Dairesi</span>
                  <span className="text-text-primary font-medium mt-0.5 block">
                    {legal.tax_office || '—'}
                  </span>
                </div>

                <div>
                  <span className="text-text-muted block">Vergi Kimlik / TCKN</span>
                  <span className="text-text-primary font-medium mt-0.5 block">
                    {legal.tax_number || '—'}
                  </span>
                </div>

                <div className="sm:col-span-2">
                  <span className="text-text-muted block">Kayıtlı Tebligat & İş Yeri Adresi</span>
                  <p className="text-text-primary font-medium mt-0.5 flex items-start gap-1.5 leading-relaxed">
                    <MapPin className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
                    <span>
                      {legal.registered_address || siteSettings.contact.address || '—'}
                    </span>
                  </p>
                </div>

                <div>
                  <span className="text-text-muted block">Kayıtlı Elektronik Posta (KEP)</span>
                  <span className="text-text-primary font-medium mt-0.5 block">
                    {legal.kep_address || '—'}
                  </span>
                </div>

                <div>
                  <span className="text-text-muted block">Resmi E-Posta</span>
                  <a
                    href={`mailto:${legal.business_email || siteSettings.contact.email}`}
                    className="text-text-primary hover:underline font-medium mt-0.5 flex items-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5 text-text-muted" />
                    <span>{legal.business_email || siteSettings.contact.email || '—'}</span>
                  </a>
                </div>

                <div>
                  <span className="text-text-muted block">İletişim & Müşteri Destek Telefonu</span>
                  <a
                    href={`tel:${legal.business_phone || siteSettings.contact.phone}`}
                    className="text-text-primary hover:underline font-medium mt-0.5 flex items-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5 text-text-muted" />
                    <span>{legal.business_phone || siteSettings.contact.phone || '—'}</span>
                  </a>
                </div>

                <div>
                  <span className="text-text-muted block">MERSİS Numarası</span>
                  <span className="text-text-secondary mt-0.5 block">
                    {legal.mersis_number
                      ? legal.mersis_number
                      : 'Şahıs firması (MERSİS muafiyeti)'}
                  </span>
                </div>

                {legal.chamber_name && (
                  <div>
                    <span className="text-text-muted block">Bağlı Olunan Meslek Odası</span>
                    <span className="text-text-primary font-medium mt-0.5 block">
                      {legal.chamber_name}
                      {legal.chamber_registration_number ? ` (Sicil: ${legal.chamber_registration_number})` : ''}
                    </span>
                  </div>
                )}

                {legal.trade_registry_number && (
                  <div>
                    <span className="text-text-muted block">Ticaret Sicil No</span>
                    <span className="text-text-primary font-medium mt-0.5 block">
                      {legal.trade_registry_number}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Payment Infrastructure & Disclosure Card */}
            <div className="bg-surface-primary border border-border-default rounded-sm p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3 border-b border-border-subtle pb-4">
                <div className="w-9 h-9 rounded bg-surface-secondary flex items-center justify-center text-text-primary shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-text-primary">
                    Güvenli Ödeme Altyapısı & Kart Güvenliği
                  </h2>
                  <p className="text-xs text-text-secondary">
                    Ödeme süreçlerinde veri güvenliği ve kart koruma standartları.
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-text-secondary leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-feedback-success shrink-0 mt-0.5" />
                  <p>
                    <strong>PayTR Ödeme Altyapısı:</strong> Web sitemizdeki tüm çevrimiçi ödemeler,
                    T.C. Merkez Bankası lisanslı PayTR Ödeme ve Elektronik Para Kuruluşu A.Ş. güvenli ödeme geçidi üzerinden 256-bit SSL şifreleme ve 3D Secure güvencesiyle işlenmektedir.
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-feedback-success shrink-0 mt-0.5" />
                  <p>
                    <strong>Kart Bilgisi Saklanmaz:</strong> Kredi ve banka kartı bilgileriniz Monocactus uygulaması ve sunucularında kesinlikle saklanmaz, kaydedilmez ve görüntülenemez. Ödeme doğrudan PCI-DSS Level 1 sertifikalı altyapı üzerinde gerçekleşir.
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-feedback-success shrink-0 mt-0.5" />
                  <p>
                    <strong>Desteklenen Kartlar:</strong> Visa, Mastercard ve TROY logolu yurt içi kredi ve banka kartları (ödeme kuruluşu ve üye işyeri hesabı kapsamındaki kartlar) desteklenmektedir. Yurt dışı kart işlemlerinde kartınızın uluslararası internet alışverişine ve 3D Secure onayına açık olması gerekmektedir.
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Legal Documents & Policy References */}
            <div className="bg-surface-secondary border border-border-default rounded-sm p-6 space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-text-primary" />
                <h3 className="text-sm font-semibold text-text-primary">
                  Yasal Metinler & Tüketici Hakları
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 text-xs">
                <Link
                  to="/policies/privacy-kvkk"
                  className="p-3 bg-surface-primary border border-border-subtle rounded hover:border-text-primary transition-colors flex items-center justify-between"
                >
                  <span className="font-medium text-text-primary">Gizlilik & KVKK Politikası</span>
                  <span className="text-text-muted">→</span>
                </Link>

                <Link
                  to="/policies/shipping-returns"
                  className="p-3 bg-surface-primary border border-border-subtle rounded hover:border-text-primary transition-colors flex items-center justify-between"
                >
                  <span className="font-medium text-text-primary">Teslimat & İade Koşulları</span>
                  <span className="text-text-muted">→</span>
                </Link>

                <Link
                  to="/policies/preliminary-info"
                  className="p-3 bg-surface-primary border border-border-subtle rounded hover:border-text-primary transition-colors flex items-center justify-between"
                >
                  <span className="font-medium text-text-primary">Ön Bilgilendirme Formu</span>
                  <span className="text-text-muted">→</span>
                </Link>

                <Link
                  to="/policies/distance-sales"
                  className="p-3 bg-surface-primary border border-border-subtle rounded hover:border-text-primary transition-colors flex items-center justify-between"
                >
                  <span className="font-medium text-text-primary">Mesafeli Satış Sözleşmesi</span>
                  <span className="text-text-muted">→</span>
                </Link>

                <Link
                  to="/policies/terms"
                  className="p-3 bg-surface-primary border border-border-subtle rounded hover:border-text-primary transition-colors flex items-center justify-between"
                >
                  <span className="font-medium text-text-primary">Kullanım Koşulları</span>
                  <span className="text-text-muted">→</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
