import { useSearchParams, Link } from 'react-router-dom';
import { AlertCircle, RefreshCw, ShoppingCart, HelpCircle } from 'lucide-react';
import { Container } from '@/shared/ui/Container';
import { Section } from '@/shared/ui/Section';
import { useSEO } from '@/shared/lib/seo';

export function PaymentFailurePage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id') || searchParams.get('merchant_oid') || '';

  useSEO({
    title: 'Ödeme Başarısız | Vazo Studio',
    description: 'Ödeme işlemi tamamlanamadı.',
  });

  return (
    <Section className="py-16 md:py-24 bg-canvas-default min-h-[60vh]">
      <Container size="sm">
        <div className="bg-surface-primary border border-border-default rounded-sm p-6 sm:p-10 text-center space-y-6 shadow-sm">
          <div className="w-16 h-16 bg-feedback-danger-surface border border-feedback-danger/30 rounded-full flex items-center justify-center mx-auto text-feedback-danger">
            <AlertCircle className="w-10 h-10" />
          </div>

          <div>
            <h1 className="font-display text-3xl font-light text-text-primary">
              Ödeme Tamamlanamadı
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary mt-2 max-w-md mx-auto leading-relaxed">
              Ödeme işleminiz bankanız veya PayTR 3D Secure altyapısı tarafından onaylanmadı.
              Kartınızdan herhangi bir çekim yapılmamıştır.
            </p>
          </div>

          {/* Tips Card */}
          <div className="p-4 bg-surface-secondary border border-border-subtle rounded-xs text-left text-xs space-y-2 text-text-secondary">
            <p className="font-medium text-text-primary">Olası Nedenler &amp; Çözümler:</p>
            <ul className="list-disc list-inside space-y-1 text-text-muted">
              <li>Kart limitinizin veya internet alışverişi yetkinizin yeterli olduğundan emin olun.</li>
              <li>3D Secure SMS doğrulama kodunu doğru girdiğinizi kontrol edin.</li>
              <li>Farklı bir kredi/banka kartı ile tekrar deneyebilirsiniz.</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              to={orderId ? `/checkout` : '/checkout'}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-text-primary text-canvas-default text-xs font-semibold rounded-xs hover:opacity-90 transition-opacity"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Ödemeyi Tekrar Dene</span>
            </Link>

            <Link
              to="/cart"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-surface-muted text-text-primary text-xs font-medium rounded-xs hover:bg-surface-secondary transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Sepete Dön</span>
            </Link>
          </div>

          <div className="pt-4 border-t border-border-subtle flex items-center justify-center gap-1.5 text-xs text-text-muted">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Sorun devam ederse </span>
            <Link to="/contact" className="text-text-primary underline hover:text-accent-primary">
              Müşteri Hizmetleri
            </Link>
            <span> ile iletişime geçebilirsiniz.</span>
          </div>
        </div>
      </Container>
    </Section>
  );
}
