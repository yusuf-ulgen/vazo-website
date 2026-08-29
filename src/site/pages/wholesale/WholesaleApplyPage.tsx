import { useState, useEffect, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, UserCheck } from 'lucide-react';
import { Container } from '@/shared/ui/Container';
import { contentRepository, TradeApplicationPayload } from '@/entities/content/api/content-repository';
import { useCustomerAuth } from '@/shared/stores/customer-auth-store';
import { useSEO } from '@/shared/lib/seo';

export function WholesaleApplyPage() {
  useSEO({
    title: 'Toptan Satış Başvuru Formu | Vazo Studio',
    description:
      'İç mimarlar, tasarım ofisleri, oteller ve perakende mağazalar için kurumsal iş ortaklığı ve toptan teklif başvuru formu.',
  });

  const { user, profile, displayName, email, isWholesaleApproved } = useCustomerAuth();

  const [formData, setFormData] = useState<TradeApplicationPayload>({
    companyName: '',
    taxNumber: '',
    taxOffice: '',
    businessType: 'İç Mimarlık / Tasarım Ofisi',
    contactPerson: '',
    email: '',
    phone: '',
    website: '',
    estimatedMonthlyVolume: '6 - 20 Adet',
    customerMessage: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-fill applicant details if customer is logged in
  useEffect(() => {
    if (user?.email && !formData.email) {
      setFormData((prev) => ({
        ...prev,
        email: user.email || '',
        contactPerson: prev.contactPerson || (displayName !== 'Müşteri' ? displayName : ''),
        phone: prev.phone || profile?.phone || '',
      }));
    }
  }, [user, profile, displayName, formData.email]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await contentRepository.submitTradeApplication(formData);
      setIsSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Başvuru iletilirken beklenmeyen bir hata oluştu.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-canvas-default py-12 md:py-16">
      <Container size="md" className="space-y-12">
        {/* Page Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="text-xs uppercase font-semibold tracking-editorial text-text-secondary">
            Toptan & Kurumsal Ortaklık
          </span>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-light text-text-primary leading-[1.12]">
            Toptan Satış & Teklif Talebi
          </h1>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed font-sans">
            Mimari projeleriniz, otel/restoran tefrişatları ve konsept mağazalarınız için toptan fiyatlandırma ve özel üretim teklifi almak üzere aşağıdaki formu doldurunuz.
          </p>
        </div>

        {/* Already Approved Wholesale Account Notice */}
        {isWholesaleApproved && (
          <div className="p-5 bg-feedback-success-surface border border-feedback-success/30 rounded-none text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-feedback-success text-surface-primary flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary text-sm">
                  Toptan Hesabınız Zaten Aktif
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Giriş yaptığınız hesap ({email}) onaylı kurumsal toptan statüsündedir. Toptan kataloğumuz üzerinden doğrudan sipariş verebilirsiniz.
                </p>
              </div>
            </div>
            <Link
              to="/wholesale/products"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-action-primary text-action-primary-text text-xs uppercase font-semibold tracking-wider hover:bg-neutral-800 transition-colors shrink-0"
            >
              <span>Toptan Kataloğa Git</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Form Container */}
        {isSubmitted ? (
          /* Success Screen */
          <div className="p-8 sm:p-12 bg-surface-secondary border border-border-default text-center space-y-6 max-w-xl mx-auto shadow-sm">
            <div className="w-16 h-16 bg-feedback-success-surface rounded-full flex items-center justify-center mx-auto text-feedback-success">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-2xl sm:text-3xl text-text-primary font-normal">
                Başvurunuz Başarıyla Alındı
              </h2>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-sans max-w-md mx-auto">
                Talebiniz kurumsal satış ve proje ekibimize ulaştı. Vergi ve şirket bilgileriniz incelendikten sonra en geç 24 saat içinde toptan fiyat listesi ve koşullarla tarafınıza dönüş yapılacaktır.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
              <Link
                to="/wholesale/products"
                className="inline-flex items-center justify-center gap-2 bg-action-primary text-action-primary-text px-6 py-3.5 text-xs uppercase font-semibold tracking-wider hover:bg-neutral-800 transition-colors shadow-xs"
              >
                <span>Toptan Kataloğuna Dön</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 border border-border-strong text-text-primary px-6 py-3.5 text-xs uppercase font-semibold tracking-wider hover:bg-surface-primary transition-colors"
              >
                <span>Ana Sayfa</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Application Form */
          <form
            onSubmit={handleSubmit}
            className="p-6 sm:p-10 bg-surface-secondary border border-border-subtle space-y-6 text-left"
          >
            {/* Honeypot field for bot protection */}
            <input
              type="text"
              name="company_website_confirm"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              style={{ display: 'none' }}
              value={formData.company_website_confirm || ''}
              onChange={(e) => setFormData({ ...formData, company_website_confirm: e.target.value })}
            />

            {/* Authenticated Account Link Info */}
            {user && (
              <div className="p-3.5 bg-surface-primary border border-border-default flex items-center gap-2.5 text-xs text-text-secondary">
                <UserCheck className="w-4 h-4 text-feedback-success shrink-0" />
                <span>
                  Giriş Yapılan Hesap: <strong className="text-text-primary">{user.email}</strong> (Başvurunuz onaylandığında bu hesaba otomatik olarak toptan sipariş yetkisi tanımlanacaktır).
                </span>
              </div>
            )}

            {errorMessage && (
              <div className="p-4 bg-feedback-danger/10 border border-feedback-danger/30 text-feedback-danger text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Section 1: Company Info */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-editorial text-text-secondary border-b border-border-subtle pb-2">
                1. Kurumsal & Şirket Bilgileri
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label htmlFor="companyName" className="font-medium text-text-primary">Şirket / Firma Ünvanı *</label>
                  <input
                    id="companyName"
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="Örn: Arkhe Mimarlık Ltd. Şti."
                    className="w-full px-3.5 py-2.5 bg-surface-primary border border-border-default text-text-primary focus:outline-none focus:border-text-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="businessType" className="font-medium text-text-primary">Faaliyet Alanı / İş Türü *</label>
                  <select
                    id="businessType"
                    value={formData.businessType}
                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-surface-primary border border-border-default text-text-primary focus:outline-none focus:border-text-primary"
                  >
                    <option value="İç Mimarlık / Tasarım Ofisi">İç Mimarlık / Tasarım Ofisi</option>
                    <option value="Otel & Konaklama">Otel & Konaklama</option>
                    <option value="Restoran & Kafe">Restoran & Kafe</option>
                    <option value="Konsept Mağaza / Perakende">Konsept Mağaza / Perakende</option>
                    <option value="Kurumsal Hediye / Etkinlik">Kurumsal Hediye / Etkinlik</option>
                    <option value="İhracat / Yurt Dışı Proje">İhracat / Yurt Dışı Proje</option>
                    <option value="Diğer">Diğer</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="taxNumber" className="font-medium text-text-primary">Vergi Kimlik Numarası (VKN / TCKN) *</label>
                  <input
                    id="taxNumber"
                    type="text"
                    required
                    value={formData.taxNumber}
                    onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                    placeholder="10 Haneli Vergi No veya 11 Haneli TCKN"
                    className="w-full px-3.5 py-2.5 bg-surface-primary border border-border-default text-text-primary focus:outline-none focus:border-text-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="taxOffice" className="font-medium text-text-primary">Vergi Dairesi *</label>
                  <input
                    id="taxOffice"
                    type="text"
                    required
                    value={formData.taxOffice}
                    onChange={(e) => setFormData({ ...formData, taxOffice: e.target.value })}
                    placeholder="Vergi Dairesi Adı"
                    className="w-full px-3.5 py-2.5 bg-surface-primary border border-border-default text-text-primary focus:outline-none focus:border-text-primary"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Contact Info */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-editorial text-text-secondary border-b border-border-subtle pb-2">
                2. Yetkili İletişim Bilgileri
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label htmlFor="contactPerson" className="font-medium text-text-primary">Yetkili Adı & Soyadı *</label>
                  <input
                    id="contactPerson"
                    type="text"
                    required
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="Adınız Soyadınız"
                    className="w-full px-3.5 py-2.5 bg-surface-primary border border-border-default text-text-primary focus:outline-none focus:border-text-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="email" className="font-medium text-text-primary">Kurumsal E-Posta *</label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="isim@sirketiniz.com"
                    className="w-full px-3.5 py-2.5 bg-surface-primary border border-border-default text-text-primary focus:outline-none focus:border-text-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="phone" className="font-medium text-text-primary">Telefon Numarası *</label>
                  <input
                    id="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+90 5XX XXX XX XX"
                    className="w-full px-3.5 py-2.5 bg-surface-primary border border-border-default text-text-primary focus:outline-none focus:border-text-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="website" className="font-medium text-text-secondary">Web Sitesi / Portfolyo (İsteğe Bağlı)</label>
                  <input
                    id="website"
                    type="url"
                    value={formData.website || ''}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://sirketiniz.com"
                    className="w-full px-3.5 py-2.5 bg-surface-primary border border-border-default text-text-primary focus:outline-none focus:border-text-primary"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Project & Volume */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-editorial text-text-secondary border-b border-border-subtle pb-2">
                3. Proje & Sipariş Kapsamı
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label htmlFor="estimatedMonthlyVolume" className="font-medium text-text-primary">Tahmini Sipariş / Aylık Hacim</label>
                  <select
                    id="estimatedMonthlyVolume"
                    value={formData.estimatedMonthlyVolume || ''}
                    onChange={(e) => setFormData({ ...formData, estimatedMonthlyVolume: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-surface-primary border border-border-default text-text-primary focus:outline-none focus:border-text-primary"
                  >
                    <option value="6 - 20 Adet">6 – 20 Adet (Butik / Numune)</option>
                    <option value="20 - 50 Adet">20 – 50 Adet (Orta Ölçek)</option>
                    <option value="50 - 100 Adet">50 – 100 Adet (Otel / Proje)</option>
                    <option value="100+ Adet">100+ Adet (Büyük Ölçek / İhracat)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <label htmlFor="customerMessage" className="font-medium text-text-secondary">Proje Detayları / İlgilendiğiniz Modeller (İsteğe Bağlı)</label>
                <textarea
                  id="customerMessage"
                  rows={4}
                  value={formData.customerMessage || ''}
                  onChange={(e) => setFormData({ ...formData, customerMessage: e.target.value })}
                  placeholder="İlgilendiğiniz koleksiyonlar, talep edilen renkler ve termin beklentinizi belirtebilirsiniz..."
                  className="w-full px-3.5 py-2.5 bg-surface-primary border border-border-default text-text-primary focus:outline-none focus:border-text-primary resize-none"
                />
              </div>
            </div>

            {/* Legal Notice */}
            <div className="p-4 bg-surface-primary border border-border-subtle text-[11px] text-text-muted space-y-2">
              <div className="flex items-center gap-1.5 text-text-secondary font-medium">
                <Building2 className="w-3.5 h-3.5" />
                <span>Kurumsal İnceleme Prosedürü</span>
              </div>
              <p className="leading-relaxed">
                Toptan satış başvuruları yalnızca tüzel kişilikler, şahıs şirketleri ve serbest meslek erbabı (mimarlar, tasarımcılar) için geçerlidir. Başvurunuz onaylandığında kurumsal toptan fiyat listesi ve PayTR ödeme kanalları hesabınıza tanımlanacaktır.
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-4 flex items-center justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-action-primary text-action-primary-text px-8 py-3.5 text-xs uppercase font-semibold tracking-wider hover:bg-neutral-800 transition-colors disabled:opacity-50 shadow-xs"
              >
                <span>{isSubmitting ? 'İletiliyor...' : 'Başvuruyu Tamamla'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </Container>
    </div>
  );
}
