import { Link } from 'react-router-dom';
import { Building2, PackageCheck, Palette, Truck, ArrowRight } from 'lucide-react';

export function WholesaleBenefitsSection() {
  const benefits = [
    {
      icon: Building2,
      title: 'İç Mimarlar & Projelere Özel',
      description: 'Otel, restoran, lobi ve konut projeleri için özel hacim iskontoları ve numune desteği.',
    },
    {
      icon: PackageCheck,
      title: 'Düşük Minimum Sipariş (MOQ)',
      description: 'Model başına 3-6 adet arası düşük MOQ ile butik mağazalar için esnek stok yönetimi.',
    },
    {
      icon: Palette,
      title: 'Özel Sır & Renk Üretimi',
      description: 'Büyük ölçekli mimari projeler için RAL/Pantone uyumlu özel mineral sır geliştirme.',
    },
    {
      icon: Truck,
      title: 'Güvenli Sandıklı Lojistik',
      description: 'Kırılmaya karşı sigortalı, paletli ve özel köpük ambalajlı yurt içi & yurt dışı sevkiyat.',
    },
  ];

  return (
    <section className="py-20 bg-surface-primary border-b border-border-default">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs uppercase tracking-editorial font-semibold text-text-secondary">
            B2B & Kurumsal Ortaklık
          </span>
          <h2 className="font-display text-3xl sm:text-4xl text-text-primary">
            Toptan Satış ve Proje Çözümleri
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary">
            Ticari işletmeler, perakende satıcılar ve mimari ofisler için ayrıcalıklı koşullar sunuyoruz.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.title}
                className="p-6 bg-surface-secondary border border-border-subtle hover:border-border-strong transition-colors space-y-3"
              >
                <div className="w-10 h-10 bg-surface-inverse text-text-inverse flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-display text-lg text-text-primary">{b.title}</h3>
                <p className="text-xs text-text-secondary leading-relaxed">{b.description}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-12 p-8 bg-surface-muted border border-brand-stone/50 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h4 className="font-display text-xl text-text-primary">
              Projeniz İçin Toptan Fiyat Listesi Alın
            </h4>
            <p className="text-xs text-text-secondary">
              Trade hesabınızı açın veya 1 dakikada kurumsal başvuru formunu doldurun.
            </p>
          </div>
          <Link
            to="/wholesale/apply"
            className="inline-flex items-center gap-2 bg-action-primary text-action-primary-text px-6 py-3 text-xs uppercase font-semibold tracking-wide hover:bg-neutral-800 transition-colors shrink-0"
          >
            <span>Toptan Başvuru Yap</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
