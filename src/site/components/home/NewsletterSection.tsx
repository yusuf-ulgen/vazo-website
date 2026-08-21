import { useState, type FormEvent } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Container } from '@/shared/ui/Container';

export function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setIsSubscribed(true);
    setEmail('');
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
              className="w-full sm:flex-1 px-4 py-3.5 bg-surface-primary text-text-primary text-xs border border-border-default focus:outline-none focus:border-text-primary"
            />
            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-action-primary text-action-primary-text px-6 py-3.5 text-xs uppercase font-semibold tracking-wider hover:bg-neutral-800 transition-colors shrink-0"
            >
              <span>Kaydol</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </Container>
    </section>
  );
}
