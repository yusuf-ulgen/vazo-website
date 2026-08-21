import { useState, type FormEvent } from 'react';
import { ArrowRight, CheckCircle2, AlertCircle, RefreshCcw } from 'lucide-react';
import { Container } from '@/shared/ui/Container';
import { contentRepository } from '@/entities/content/api/content-repository';

export function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await contentRepository.subscribeNewsletter({ email, source: 'homepage' });
      setIsSubscribed(true);
      setEmail('');
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || 'Bülten kaydı oluşturulamadı.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="w-full bg-canvas-warm py-16 md:py-24 border-b border-border-subtle">
      <Container size="sm" className="text-center space-y-6">
        <span className="text-xs uppercase font-semibold tracking-editorial text-text-secondary">
          Stüdyo Günlüğü
        </span>
        <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-normal text-text-primary">
          Yeni Koleksiyonlar & Özel Davetler
        </h2>
        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-sans font-normal max-w-md mx-auto">
          Yeni çıkan sınırlı üretim seriler, atölye etkinlikleri ve mimari ilham bültenimiz için e-posta listemize katılın.
        </p>

        {isSubscribed ? (
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-feedback-success bg-surface-primary px-6 py-3 border border-border-subtle shadow-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>Teşekkürler! Stüdyo bültenimize başarıyla kaydoldunuz.</span>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row items-center justify-center gap-2 max-w-md mx-auto pt-2"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-posta adresiniz..."
              aria-label="E-posta adresi"
              className="w-full sm:flex-1 px-4 py-3.5 bg-surface-primary text-text-primary text-xs border border-border-default focus:outline-none focus:border-text-primary font-sans"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-action-primary text-action-primary-text px-6 py-3.5 text-xs uppercase font-semibold tracking-wider hover:bg-neutral-800 transition-colors shrink-0 disabled:opacity-60"
            >
              {isSubmitting ? (
                <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <span>Kaydol</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        )}

        {errorMessage && (
          <p className="text-xs text-feedback-danger flex items-center justify-center gap-1.5 pt-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{errorMessage}</span>
          </p>
        )}
      </Container>
    </section>
  );
}
