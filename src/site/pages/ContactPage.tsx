import { useState, type FormEvent } from 'react';
import { MapPin, Mail, Phone, Clock, ArrowRight, CheckCircle2, AlertCircle, RefreshCcw } from 'lucide-react';
import { siteConfig } from '@/shared/config/site-config';
import { Container } from '@/shared/ui/Container';
import { useSEO } from '@/shared/lib/seo';
import { contentRepository } from '@/entities/content/api/content-repository';

export function ContactPage() {
  useSEO({
    title: 'İletişim & Showroom',
    description: 'Vazo Studio showroom adresi, müşteri destek hattı, toptan randevu ve iletişim formu.',
  });

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Genel Bilgi & Sipariş');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await contentRepository.submitContactMessage({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });
      setIsSent(true);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || 'Mesajınız iletilirken bir hata oluştu. Lütfen tekrar deneyiniz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-canvas-default min-h-screen py-12 md:py-20">
      <Container size="lg">
        {/* Header */}
        <div className="text-left space-y-3 mb-12 md:mb-16 border-b border-border-subtle pb-6">
          <span className="text-xs uppercase font-semibold tracking-editorial text-text-secondary">
            Bize Ulaşın
          </span>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-light text-text-primary">
            İletişim & Showroom
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary max-w-xl leading-relaxed font-sans">
            Siparişleriniz, özel üretim talepleriniz, mimari projeleriniz veya showroom randevusu için stüdyomuzla iletişime geçebilirsiniz.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 text-left">
          {/* Left Column: Contact Form (7 cols) */}
          <div className="lg:col-span-7">
            {isSent ? (
              <div className="p-8 sm:p-12 bg-surface-secondary border border-border-default space-y-4 text-center">
                <div className="w-12 h-12 bg-feedback-success/10 text-feedback-success rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-display text-2xl text-text-primary">Mesajınız Alındı</h3>
                <p className="text-xs text-text-secondary max-w-md mx-auto">
                  Talebiniz stüdyo ekibimize iletilmiştir. En kısa sürede e-posta adresiniz üzerinden geri dönüş sağlanacaktır.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsSent(false);
                    setMessage('');
                  }}
                  className="mt-4 inline-flex items-center gap-2 bg-action-primary text-action-primary-text px-6 py-3 text-xs uppercase font-semibold tracking-wider hover:bg-neutral-800"
                >
                  Yeni Mesaj Gönder
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="p-6 sm:p-10 bg-surface-secondary border border-border-subtle space-y-5"
              >
                {errorMessage && (
                  <div className="p-3.5 bg-feedback-danger/10 border border-feedback-danger text-feedback-danger text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label htmlFor="contactName" className="font-medium text-text-primary">Adınız Soyadınız *</label>
                    <input
                      id="contactName"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Adınız Soyadınız"
                      className="w-full px-3.5 py-2.5 bg-surface-primary border border-border-default text-text-primary focus:outline-none focus:border-text-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="contactEmail" className="font-medium text-text-primary">E-Posta Adresiniz *</label>
                    <input
                      id="contactEmail"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="eposta@ornek.com"
                      className="w-full px-3.5 py-2.5 bg-surface-primary border border-border-default text-text-primary focus:outline-none focus:border-text-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <label htmlFor="contactSubject" className="font-medium text-text-primary">Konu / Departman</label>
                  <select
                    id="contactSubject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface-primary border border-border-default text-text-primary focus:outline-none focus:border-text-primary"
                  >
                    <option value="Genel Bilgi & Sipariş">Genel Bilgi & Sipariş</option>
                    <option value="Toptan & Mimari Proje">Toptan & Mimari Proje</option>
                    <option value="Showroom Randevu">Showroom Randevu</option>
                    <option value="Kargo & Teslimat">Kargo & Teslimat</option>
                    <option value="Basın & Marka İşbirlikleri">Basın & Marka İşbirlikleri</option>
                  </select>
                </div>

                <div className="space-y-1.5 text-xs">
                  <label htmlFor="contactMessage" className="font-medium text-text-primary">Mesajınız *</label>
                  <textarea
                    id="contactMessage"
                    rows={5}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Mesajınızı buraya yazınız..."
                    className="w-full px-3.5 py-2.5 bg-surface-primary border border-border-default text-text-primary focus:outline-none focus:border-text-primary"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-action-primary text-action-primary-text px-8 py-4 text-xs uppercase font-semibold tracking-wider hover:bg-neutral-800 transition-colors shadow-xs disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCcw className="w-4 h-4 animate-spin" />
                      <span>Gönderiliyor...</span>
                    </>
                  ) : (
                    <>
                      <span>Mesajı Gönder</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Right Column: Studio Info (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 sm:p-8 bg-canvas-warm border border-border-default space-y-6 text-xs font-sans">
              <h2 className="font-display text-2xl text-text-primary border-b border-border-subtle pb-3">
                Atölye & Showroom
              </h2>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-text-primary shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-text-primary">Showroom Adresi:</strong>
                    <span className="text-text-secondary">{siteConfig.contact.address}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-text-primary shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-text-primary">E-Posta:</strong>
                    <a href={`mailto:${siteConfig.contact.email}`} className="text-text-secondary hover:underline">
                      {siteConfig.contact.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-text-primary shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-text-primary">Telefon & WhatsApp:</strong>
                    <span className="text-text-secondary">{siteConfig.contact.phone}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-text-primary shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-text-primary">Çalışma Saatleri:</strong>
                    <span className="text-text-secondary">Pazartesi – Cumartesi: 10:00 – 19:00 (Pazar Kapalı)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
