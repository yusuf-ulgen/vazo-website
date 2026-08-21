import { useState, type FormEvent } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Building2, CheckCircle2, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';
import { contentRepository, TradeApplicationPayload } from '@/entities/content/api/content-repository';
import { Container } from '@/shared/ui/Container';

export function WholesaleApplyPage() {
  const [searchParams] = useSearchParams();
  const preselectedProduct = searchParams.get('product');

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
    notes: preselectedProduct ? `İlgilenilen Model: ${preselectedProduct}` : '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await contentRepository.submitTradeApplication(formData);
      if (res.success) {
        setIsSuccess(true);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Başvuru gönderilirken bir sorun oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-canvas-default min-h-screen py-12 md:py-20">
      <Container size="md">
        {/* Header */}
        <div className="text-left space-y-3 mb-10 border-b border-border-subtle pb-6">
          <nav className="text-xs text-text-muted flex items-center gap-1.5 font-sans">
            <Link to="/" className="hover:text-text-primary transition-colors">Ana Sayfa</Link>
            <span>/</span>
            <Link to="/wholesale" className="hover:text-text-primary transition-colors">Toptan & B2B</Link>
            <span>/</span>
            <span className="text-text-primary font-medium">Ticari Hesap Başvurusu</span>
          </nav>

          <div className="flex items-center gap-2 text-xs uppercase font-semibold tracking-editorial text-text-secondary">
            <Building2 className="w-4 h-4" />
            <span>B2B & Mimari İş Ortaklığı</span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-light text-text-primary">
            Toptan Satış & Teklif Talebi
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary max-w-lg leading-relaxed font-sans">
            Toptan fiyat listesi, numune seti veya projelerinize özel fiyat teklifi almak için formu doldurabilirsiniz.
          </p>
        </div>

        {/* Success Confirmation Card */}
        {isSuccess ? (
          <div className="p-8 sm:p-12 bg-surface-secondary border border-border-default space-y-6 text-center animate-in fade-in duration-300">
            <div className="w-14 h-14 bg-feedback-success/10 text-feedback-success rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-2xl sm:text-3xl text-text-primary">
                Başvurunuz Başarıyla Alındı
              </h2>
              <p className="text-xs sm:text-sm text-text-secondary max-w-md mx-auto leading-relaxed">
                Talebiniz B2B satış ekibimize iletilmiştir. Kurumsal müşteri temsilcimiz en geç <strong>24 saat içinde</strong> kayıtlı e-posta veya telefonunuz üzerinden sizinle irtibata geçecektir.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
              <Link
                to="/wholesale/products"
                className="inline-flex items-center justify-center gap-2 bg-action-primary text-action-primary-text px-6 py-3.5 text-xs uppercase font-semibold tracking-wider hover:bg-neutral-800 transition-colors"
              >
                <span>B2B Kataloğuna Dön</span>
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
                  <label className="font-medium text-text-primary">Şirket / Firma Ünvanı *</label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="Örn: Arkhe Mimarlık Ltd. Şti."
                    className="w-full px-3.5 py-2.5 bg-surface-primary border border-border-default text-text-primary focus:outline-none focus:border-text-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-text-primary">Faaliyet Alanı / İş Türü *</label>
                  <select
                    value={formData.businessType}
                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-surface-primary border border-border-default text-text-primary focus:outline-none focus:border-text-primary"
                  >
                    <option value="İç Mimarlık / Tasarım Ofisi">İç Mimarlık / Tasarım Ofisi</option>
                    <option value="Otel / Restoran / HoReCa">Otel / Restoran / HoReCa</option>
                    <option value="Perakende / Konsept Mağaza">Perakende / Konsept Mağaza</option>
                    <option value="Peyzaj & Dış Mekan">Peyzaj & Dış Mekan</option>
                    <option value="Kurumsal Hediye">Kurumsal Hediye</option>
                    <option value="Diğer">Diğer</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-text-primary">Vergi Numarası *</label>
                  <input
                    type="text"
                    required
                    value={formData.taxNumber}
                    onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                    placeholder="Vergi No / T.C."
                    className="w-full px-3.5 py-2.5 bg-surface-primary border border-border-default text-text-primary focus:outline-none focus:border-text-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-text-primary">Vergi Dairesi *</label>
                  <input
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
            <div className="space-y-4 pt-4 border-t border-border-subtle">
              <h3 className="text-xs font-semibold uppercase tracking-editorial text-text-secondary border-b border-border-subtle pb-2">
                2. Yetkili İletişim Bilgileri
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-medium text-text-primary">Yetkili Adı & Soyadı *</label>
                  <input
                    type="text"
                    required
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="Adınız Soyadınız"
                    className="w-full px-3.5 py-2.5 bg-surface-primary border border-border-default text-text-primary focus:outline-none focus:border-text-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-text-primary">Kurumsal E-Posta *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="isim@sirketiniz.com"
                    className="w-full px-3.5 py-2.5 bg-surface-primary border border-border-default text-text-primary focus:outline-none focus:border-text-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-text-primary">Telefon Numarası *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+90 5XX XXX XX XX"
                    className="w-full px-3.5 py-2.5 bg-surface-primary border border-border-default text-text-primary focus:outline-none focus:border-text-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-text-primary">Web Sitesi / Instagram (Opsiyonel)</label>
                  <input
                    type="text"
                    value={formData.website || ''}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="www.sirketiniz.com"
                    className="w-full px-3.5 py-2.5 bg-surface-primary border border-border-default text-text-primary focus:outline-none focus:border-text-primary"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Project & Order Context */}
            <div className="space-y-4 pt-4 border-t border-border-subtle">
              <h3 className="text-xs font-semibold uppercase tracking-editorial text-text-secondary border-b border-border-subtle pb-2">
                3. Proje & Sipariş Kapsamı
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-medium text-text-primary">Tahmini Sipariş / Aylık Hacim</label>
                  <select
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
                <label className="font-medium text-text-primary">Proje Detayları & Talep Notları</label>
                <textarea
                  rows={4}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="İlgilendiğiniz modeller, özel sır/renk talepleri, şantiye teslim tarihi veya numune talebiniz hakkında bilgi veriniz..."
                  className="w-full px-3.5 py-2.5 bg-surface-primary border border-border-default text-text-primary focus:outline-none focus:border-text-primary"
                />
              </div>
            </div>

            {/* Submit Bar */}
            <div className="pt-4 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
                <ShieldCheck className="w-4 h-4 text-feedback-success" />
                <span>Bilgileriniz KVKK kapsamında gizli tutulmaktadır.</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-action-primary text-action-primary-text px-8 py-4 text-xs uppercase font-semibold tracking-wider hover:bg-neutral-800 disabled:opacity-50 transition-colors shadow-xs"
              >
                <span>{isSubmitting ? 'Gönderiliyor...' : 'Başvuruyu Tamamla'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </Container>
    </div>
  );
}
