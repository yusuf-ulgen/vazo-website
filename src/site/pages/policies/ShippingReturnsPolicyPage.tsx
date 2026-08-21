import { Link } from 'react-router-dom';
import { AlertCircle, Truck, RefreshCw, ShieldCheck } from 'lucide-react';
import { Container } from '@/shared/ui/Container';
import { useSEO } from '@/shared/lib/seo';

export function ShippingReturnsPolicyPage() {
  useSEO({
    title: 'Teslimat, Kargo & İade Koşulları',
    description: 'Vazo Studio kargo teslimat süreleri, kırılma sigortası ve 14 gün koşulsuz iade koşulları.',
  });

  return (
    <div className="w-full bg-canvas-default min-h-screen py-12 md:py-20">
      <Container size="md">
        {/* Header */}
        <div className="text-left space-y-3 mb-10 border-b border-border-subtle pb-6">
          <nav className="text-xs text-text-muted flex items-center gap-1.5 font-sans">
            <Link to="/" className="hover:text-text-primary transition-colors">Ana Sayfa</Link>
            <span>/</span>
            <span className="text-text-primary font-medium">Teslimat & İade</span>
          </nav>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-light text-text-primary">
            Kargo, Teslimat & İade Koşulları
          </h1>
        </div>

        {/* Legal Disclaimer Box */}
        <div className="p-4 bg-surface-secondary border border-border-default flex items-start gap-3 text-xs text-text-secondary mb-10 text-left">
          <AlertCircle className="w-4 h-4 text-feedback-info shrink-0 mt-0.5" />
          <p>
            <strong>Bilgilendirme:</strong> Bu sayfadaki şartlar stüdyo operasyonel kılavuzudur. Nihai mesafeli satış sözleşmesi ve kurumsal hukuki metinler hukuk danışmanlığı onay sürecindedir.
          </p>
        </div>

        {/* Policy Sections */}
        <div className="space-y-8 text-left text-xs sm:text-sm font-sans text-text-secondary leading-relaxed">
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-text-primary font-display text-xl">
              <Truck className="w-5 h-5" />
              <h2>1. Kargo & Teslimat Süreçleri</h2>
            </div>
            <p>
              Siparişleriniz, darbelere ve basınca karşı özel olarak tasarlanmış polietilen köpük takviyeli çift kat oluklu mukavva kutularda paketlenir.
            </p>
            <p>
              Stoklu perakende siparişleri 1-3 iş günü içerisinde Yurtiçi Kargo'ya teslim edilir. Kargo takip kodunuz e-posta ve SMS ile iletilmektedir. 5.000 TL üzeri perakende alışverişlerde kargo ücretsizdir.
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-border-subtle">
            <div className="flex items-center gap-2 text-text-primary font-display text-xl">
              <ShieldCheck className="w-5 h-5 text-feedback-success" />
              <h2>2. Kırılmaya Karşı %100 Sigorta Güvencesi</h2>
            </div>
            <p>
              El yapımı seramik ürünlerimizin taşınma sürecindeki güvenliği stüdyomuzun garantisi altındadır. Kargo teslimi sırasında tespit edilen hasarlarda, fotoğraflı bildiriminizle birlikte aynı gün ücretsiz yedek parça veya yeni ürün sevkiyatı başlatılır.
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-border-subtle">
            <div className="flex items-center gap-2 text-text-primary font-display text-xl">
              <RefreshCw className="w-5 h-5" />
              <h2>3. İade & Değişim Prosedürü</h2>
            </div>
            <p>
              Tüketici Hakları Kanunu gereğince, ürün teslim tarihinden itibaren 14 gün içerisinde herhangi bir gerekçe göstermeksizin cayma hakkınızı kullanabilirsiniz.
            </p>
            <p>
              İade edilecek ürünün orijinal ambalajında, hasarsız ve eksiksiz olması gerekmektedir. İade talebi oluşturmak için <Link to="/contact" className="text-text-primary underline">iletişim formumuzdan</Link> bize ulaşabilirsiniz.
            </p>
          </section>
        </div>
      </Container>
    </div>
  );
}
