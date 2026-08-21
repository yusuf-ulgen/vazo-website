import { Link } from 'react-router-dom';
import {
  Building2,
  Palette,
  Truck,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Hotel,
  Store,
  Layers,
  FileCheck,
} from 'lucide-react';
import { Container } from '@/shared/ui/Container';

export function WholesaleLandingPage() {
  const targetAudiences = [
    {
      icon: Layers,
      title: 'İç Mimarlar & Tasarım Ofisleri',
      description:
        'Konut, villa ve ticari projeler için heykelsi seramik objeler, RAL/Pantone uyumlu özel sır geliştirme ve mimari numune kiti.',
    },
    {
      icon: Hotel,
      title: 'Otel, Restoran & HoReCa',
      description:
        'Lobi, suit oda ve restoran masaları için yüksek adetli, dayanıklı 1250°C fırınlanmış stoneware seramik formlar.',
    },
    {
      icon: Store,
      title: 'Seçkin Butik & Konsept Mağazalar',
      description:
        'Düşük Minimum Sipariş Adedi (MOQ 6 adet), hızlı termin ve mağaza vitrininize özel kürasyon desteği.',
    },
    {
      icon: Building2,
      title: 'Kurumsal Hediye & İşbirlikleri',
      description:
        'Markanıza özel ambalaj, logo mühürleme ve prestijli kurumsal hediye çözümleri.',
    },
  ];

  const keyAdvantages = [
    {
      icon: Palette,
      title: 'Özel Sır & Renk Üretimi',
      description: 'Projenizin renk paletine özel mat mineral sırlar ve yüzey dokuları geliştiriyoruz.',
    },
    {
      icon: FileCheck,
      title: 'Kademeli Hacim İskontosu',
      description: '6 adetten başlayan ve 50+ adette %50\'ye varan net toptan fiyatlandırma matrisi.',
    },
    {
      icon: Truck,
      title: 'Sigortalı & Sandıklı Sevkiyat',
      description: 'Kırılmaya karşı tam güvenceli özel ambalaj, paletli teslimat ve yurt dışı ihracat desteği.',
    },
    {
      icon: ShieldCheck,
      title: 'Özel B2B Müşteri Temsilcisi',
      description: 'Numune sürecinden şantiye teslimine kadar mimari ekibinize atanmış birebir destek.',
    },
  ];

  return (
    <div className="w-full bg-canvas-default min-h-screen">
      {/* B2B Editorial Hero */}
      <section className="relative w-full bg-canvas-warm border-b border-border-subtle overflow-hidden">
        <Container size="lg" className="py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <span className="text-xs uppercase font-semibold tracking-editorial text-text-secondary">
                Kurumsal & B2B Çözümleri
              </span>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-light text-text-primary leading-[1.08] tracking-tight">
                Mimari Mekanlara Heykelsi Dokunuş.{' '}
                <span className="block font-normal italic text-text-secondary">
                  Özel Toptan Üretim.
                </span>
              </h1>
              <p className="text-sm sm:text-base text-text-secondary leading-relaxed font-sans font-normal max-w-xl">
                Vazo Studio, iç mimarlar, otel projeleri ve seçkin tasarım mağazaları için yüksek kalite el yapımı seramik ve stoneware vazolar üretir. Esnek hacim kademeleri ve hızlı üretim kapasitesiyle projelerinize değer katın.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link
                  to="/wholesale/apply"
                  className="inline-flex items-center justify-center gap-2 bg-action-primary text-action-primary-text px-8 py-4 text-xs uppercase font-semibold tracking-wider hover:bg-neutral-800 transition-colors shadow-xs"
                >
                  <span>Toptan Satışa Başvur</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/wholesale/products"
                  className="inline-flex items-center justify-center gap-2 border border-border-strong text-text-primary bg-surface-primary/80 hover:bg-surface-primary px-8 py-4 text-xs uppercase font-semibold tracking-wider transition-colors"
                >
                  <span>B2B Kataloğu İncele</span>
                </Link>
              </div>
            </div>

            {/* Right Photography */}
            <div className="lg:col-span-5">
              <div className="aspect-[4/3] sm:aspect-[16/11] lg:aspect-[4/5] w-full overflow-hidden bg-surface-secondary shadow-card">
                <img
                  src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85"
                  alt="Toptan ve Mimari Proje Seramik Üretimi"
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Target Audiences Grid */}
      <section className="w-full bg-canvas-default py-16 md:py-24 border-b border-border-subtle">
        <Container size="lg">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-12 md:mb-16">
            <span className="text-xs uppercase font-semibold tracking-editorial text-text-secondary">
              Kime Hitap Ediyoruz?
            </span>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-normal text-text-primary">
              Ticari İş Ortaklarımız
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-sans font-normal">
              Farklı ölçekteki mimari ve ticari ihtiyaçlar için optimize edilmiş üretim modelleri.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {targetAudiences.map((aud) => (
              <div
                key={aud.title}
                className="flex flex-col text-left space-y-3 p-6 bg-surface-secondary border border-border-subtle"
              >
                <div className="w-10 h-10 bg-surface-primary border border-border-default flex items-center justify-center text-text-primary mb-2">
                  <aud.icon className="w-5 h-5" />
                </div>
                <h3 className="font-display text-lg text-text-primary font-medium">
                  {aud.title}
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed font-sans font-normal">
                  {aud.description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* B2B Advantages Section */}
      <section className="w-full bg-canvas-warm py-16 md:py-24 border-b border-border-subtle">
        <Container size="lg">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-12 md:mb-16">
            <span className="text-xs uppercase font-semibold tracking-editorial text-text-secondary">
              Neden Vazo Studio?
            </span>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-normal text-text-primary">
              Toptan Üretim Avantajları
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {keyAdvantages.map((adv) => (
              <div
                key={adv.title}
                className="flex flex-col text-left space-y-3 p-6 bg-surface-primary/80 border border-border-subtle"
              >
                <div className="w-10 h-10 rounded-full bg-surface-secondary border border-border-default flex items-center justify-center text-text-primary mb-2">
                  <adv.icon className="w-5 h-5" />
                </div>
                <h3 className="font-display text-base text-text-primary font-medium">
                  {adv.title}
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed font-sans font-normal">
                  {adv.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/wholesale/how-it-works"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-primary underline underline-offset-8 hover:text-text-secondary transition-colors"
            >
              <span>Süreç Nasıl İşler? Adım Adım İnceleyin</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </Container>
      </section>

      {/* Sample Request & Application Banner */}
      <section className="w-full bg-surface-inverse text-text-inverse py-16 md:py-20">
        <Container size="md" className="text-center space-y-6">
          <div className="w-12 h-12 bg-white/10 mx-auto flex items-center justify-center text-white">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-light text-white leading-tight">
            Projeniz İçin Numune & Teklif Alın
          </h2>
          <p className="text-xs sm:text-sm text-neutral-300 max-w-lg mx-auto leading-relaxed font-sans">
            Mimari ekibiniz için malzeme ve sır numune kutumuzu talep edebilir, projenize özel hacimli fiyat teklifinizi 24 saat içinde alabilirsiniz.
          </p>
          <div className="pt-2">
            <Link
              to="/wholesale/apply"
              className="inline-flex items-center gap-2 bg-white text-neutral-900 px-8 py-4 text-xs uppercase font-semibold tracking-wider hover:bg-neutral-100 transition-colors shadow-xs"
            >
              <span>Ticari Hesap & Fiyat Talebi Formu</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}
