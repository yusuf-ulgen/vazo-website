import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Container } from '@/shared/ui/Container';

export function ProductAccordions() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const sections = [
    {
      title: 'Teknik Detaylar & Bakım',
      content:
        'Yüksek derecede (1250°C) fırınlanmış stoneware seramik gövde. Dış yüzey doğal mineral mat sır ile kaplıdır. Su geçirimsiz iç sırlama sayesinde taze çiçeklerle ve su ile kullanıma uygundur. Temizlik için ılık su ve yumuşak mikrofiber bez kullanılması, aşındırıcı kimyasallardan kaçınılması önerilir.',
    },
    {
      title: 'Kargo, Paketleme & Sigortalı Teslimat',
      content:
        'Siparişleriniz, darbelere dayanıklı özel kesim süngerli koruyucu kutularda ambalajlanır. Tüm sevkiyatlar kırılmaya karşı %100 sigortalı olarak Yurtiçi Kargo güvencesiyle 1-3 iş günü içinde kargoya teslim edilir. 5.000 TL üzeri perakende alışverişlerde kargo ücretsizdir.',
    },
    {
      title: 'İade & Değişim Koşulları',
      content:
        'Teslimat tarihinden itibaren 14 gün içinde, orijinal ambalajında ve hasarsız olması koşuluyla koşulsuz iade ve değişim hakkınız bulunmaktadır. Kargo hasarı durumunda tutanak tutulması ve stüdyomuzla iletişime geçilmesi yeterlidir.',
    },
  ];

  return (
    <section className="w-full bg-canvas-default py-12 md:py-16 border-b border-border-subtle">
      <Container size="md">
        <div className="divide-y divide-border-default border-y border-border-default">
          {sections.map((sec, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={sec.title} className="py-4">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between text-left font-display text-lg sm:text-xl text-text-primary py-2 hover:opacity-75 transition-opacity"
                  aria-expanded={isOpen}
                >
                  <span>{sec.title}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-text-secondary transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="pt-2 pb-4 text-xs sm:text-sm text-text-secondary leading-relaxed font-sans font-normal animate-in fade-in duration-200">
                    <p>{sec.content}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
