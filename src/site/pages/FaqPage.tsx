import { useState } from 'react';
import { ChevronDown, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Container } from '@/shared/ui/Container';
import { useSEO } from '@/shared/lib/seo';

export function FaqPage() {
  useSEO({
    title: 'Sıkça Sorulan Sorular',
    description: 'Vazo Studio seramik siparişleri, kargo, toptan alım ve ürün bakımı hakkında sıkça sorulan sorular.',
  });

  const [openSection, setOpenSection] = useState<string | null>('0-0');

  const faqGroups = [
    {
      group: 'Sipariş & Teslimat',
      items: [
        {
          q: 'Siparişler ne kadar sürede kargoya teslim edilir?',
          a: 'Stokta bulunan ürünlerimiz özenle paketlenerek anlaşmalı kargo firmaları aracılığıyla en kısa sürede sevkiyata hazırlanır.',
        },
        {
          q: 'Seramik ürünler kargoda hasar görürse ne yapmalıyım?',
          a: 'Tüm gönderilerimiz kırılmaya karşı koruyucu ambalajlarla sevk edilir. Kargo teslimi anında hasar fark edilmesi durumunda kargo görevlisine tutanak tutturulması veya hasarlı ambalajın fotoğraflanarak bize iletilmesi halinde gerekli destek sağlanır.',
        },
        {
          q: 'Kargo ücreti ne kadar?',
          a: 'Belirlenen sepet tutarının üzerindeki perakende siparişlerde kargo ücretsizdir. Güncel kargo tutarı ve eşikleri sepet ve ödeme adımında görüntülenir.',
        },
      ],
    },
    {
      group: 'Ürün Bakımı & Özellikler',
      items: [
        {
          q: 'Vazoların içine canlı çiçek ve su konulabilir mi?',
          a: 'Evet. Tüm vazolarımız 1250°C fırınlanmış stoneware kilinden üretilir ve iç kısımları su geçirimsiz sırla kaplıdır. Canlı çiçeklerle su doldurarak güvenle kullanabilirsiniz.',
        },
        {
          q: 'Seramik vazolar nasıl temizlenmelidir?',
          a: 'Ilık su ve yumuşak mikrofiber bez yardımıyla temizlenmesi önerilir. Mat mineral sır dokusunu korumak amacıyla aşındırıcı kimyasallar ve sert süngerler kullanılmamalıdır.',
        },
      ],
    },
    {
      group: 'Toptan & Kurumsal Satış',
      items: [
        {
          q: 'Toptan alımlarda minimum sipariş adedi (MOQ) nedir?',
          a: 'Model başına Minimum Sipariş Adedimiz (MOQ) 6 adettir. Belirli adetlerin üzerindeki siparişlerde kademeli toptan iskonto oranları uygulanır.',
        },
        {
          q: 'Mimari projeler için özel renk veya sır geliştiriyor musunuz?',
          a: 'Evet. Belirli adetlerin üzerindeki otel, restoran ve konut projelerinde mimari ekibinizin renk kartelasına uygun özel mineral sırlar geliştirilebilmektedir.',
        },
      ],
    },
  ];

  return (
    <div className="w-full bg-canvas-default min-h-screen py-12 md:py-20">
      <Container size="md">
        {/* Header */}
        <div className="text-left space-y-3 mb-12 border-b border-border-subtle pb-6">
          <nav className="text-xs text-text-muted flex items-center gap-1.5 font-sans">
            <Link to="/" className="hover:text-text-primary transition-colors">Ana Sayfa</Link>
            <span>/</span>
            <span className="text-text-primary font-medium">Sıkça Sorulan Sorular</span>
          </nav>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-light text-text-primary">
            Sıkça Sorulan Sorular
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary max-w-xl leading-relaxed font-sans">
            Sipariş süreçleri, kargo güvenliği, seramik bakımı ve toptan alım hakkında merak edilenler.
          </p>
        </div>

        {/* FAQ Categories Stack */}
        <div className="space-y-12 text-left">
          {faqGroups.map((grp, grpIdx) => (
            <div key={grp.group} className="space-y-4">
              <h2 className="text-xs uppercase font-semibold tracking-editorial text-text-secondary border-b border-border-subtle pb-2">
                {grp.group}
              </h2>

              <div className="divide-y divide-border-default border-y border-border-default">
                {grp.items.map((item, itemIdx) => {
                  const itemId = `${grpIdx}-${itemIdx}`;
                  const isOpen = openSection === itemId;

                  return (
                    <div key={item.q} className="py-4">
                      <button
                        type="button"
                        onClick={() => setOpenSection(isOpen ? null : itemId)}
                        className="w-full flex items-center justify-between text-left font-display text-lg text-text-primary py-1 hover:opacity-75 transition-opacity"
                        aria-expanded={isOpen}
                      >
                        <span>{item.q}</span>
                        <ChevronDown
                          className={`w-4 h-4 text-text-secondary transition-transform duration-200 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {isOpen && (
                        <div className="pt-2 text-xs sm:text-sm text-text-secondary leading-relaxed font-sans font-normal transition-opacity duration-200">
                          <p>{item.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Contact prompt */}
        <div className="mt-16 p-8 bg-surface-secondary border border-border-subtle text-center space-y-3">
          <h3 className="font-display text-xl text-text-primary">Sorunuza Yanıt Bulamadınız mı?</h3>
          <p className="text-xs text-text-secondary">
            Stüdyo müşteri destek ekibimiz size yardımcı olmaktan memnuniyet duyacaktır.
          </p>
          <div className="pt-2">
            <Link
              to="/contact"
              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-primary underline underline-offset-4 hover:opacity-75"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>İletişime Geçin</span>
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
